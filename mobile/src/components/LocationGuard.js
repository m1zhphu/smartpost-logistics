import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from 'jwt-decode';
import { locationService } from '../services/locationService';
import { COLORS } from '../constants/colors';

/**
 * LocationGuard — Áp dụng cho TẤT CẢ người dùng, mọi vai trò.
 * - Xin quyền foreground + background ngay khi app khởi động
 * - Chặn giao diện bằng modal nếu GPS tắt hoặc chưa cấp quyền
 * - Khởi động tracking nền khi điều kiện đạt
 * - Lắng nghe AppState để tự kiểm tra lại khi app active trở lại
 */
export default function LocationGuard({ children }) {
    const [status, setStatus] = useState('checking'); // 'checking' | 'no_permission' | 'disabled' | 'ok'
    const [requesting, setRequesting] = useState(false);
    const appStateRef = useRef(AppState.currentState);

    // ── Hàm kiểm tra tổng hợp ──────────────────────────────────────────────
    const evaluateLocationState = async () => {
        try {
            // 1. Dịch vụ GPS của thiết bị có bật không?
            const serviceEnabled = await Location.hasServicesEnabledAsync();
            if (!serviceEnabled) {
                await locationService.stopTracking();
                setStatus('disabled');
                return;
            }

            // 2. Kiểm tra quyền foreground
            const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
            if (fgStatus !== 'granted') {
                await locationService.stopTracking();
                setStatus('no_permission');
                return;
            }

            // 3. Kiểm tra quyền background
            const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
            if (bgStatus !== 'granted') {
                await locationService.stopTracking();
                setStatus('no_permission');
                return;
            }

            // 4. Tất cả OK — bật tracking nền
            setStatus('ok');
            await locationService.startTracking();
        } catch (e) {
            console.warn('[LocationGuard] evaluateLocationState error:', e);
            setStatus('ok'); // không chặn user nếu lỗi không mong muốn
        }
    };

    // ── Xin quyền rồi đánh giá lại ────────────────────────────────────────
    const handleRequestPermission = async () => {
        setRequesting(true);
        try {
            const granted = await locationService.requestPermissions();
            if (!granted) {
                // Hướng dẫn mở Cài đặt nếu người dùng từ chối
                Alert.alert(
                    'Cần cấp quyền vị trí',
                    'Ứng dụng cần quyền "Luôn luôn" để theo dõi vị trí trong nền. Vui lòng mở Cài đặt và cấp quyền.',
                    [
                        { text: 'Huỷ', style: 'cancel' },
                        {
                            text: 'Mở Cài đặt',
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
            }
        } finally {
            setRequesting(false);
            await evaluateLocationState();
        }
    };

    const postLocation = async () => {
        try {
            // Lấy toạ độ hiện tại
            const hasFg = await Location.getForegroundPermissionsAsync();
            if (hasFg.status !== 'granted') return;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            if (!location || !location.coords) return;

            const { latitude, longitude, altitude, accuracy, heading, speed } = location.coords;
            const timestamp = location.timestamp;

            // Đọc dữ liệu user từ AsyncStorage
            const stored = await AsyncStorage.getItem('@SpeedlightAppFn:user');
            if (!stored) return;

            const user = JSON.parse(stored);
            if (!user || !user.token) return;

            // Luôn decode lại JWT để lấy thông tin mới nhất (bỏ qua dữ liệu cũ cached)
            let decoded = {};
            try {
                decoded = jwtDecode(user.token);
            } catch (e) {
                console.warn('[ForegroundPost] Không decode được token:', e.message);
            }

            // Ưu tiên decoded JWT > stored user object
            const userId = decoded.user_id || user.user_id || null;
            const username = decoded.sub || user.username || '';
            const roleId = decoded.role_id || user.role_id || null;
            const hubId = decoded.primary_hub_id || user.primary_hub_id || user.hub_id || null;
            const fullName = user.full_name || decoded.full_name || '';

            const payload = {
                user_id: userId,
                username: username,
                full_name: fullName,
                role_id: roleId,
                hub_id: hubId,
                latitude,
                longitude,
                altitude: altitude ?? null,
                accuracy: accuracy ?? null,
                heading: heading ?? null,
                speed: speed ?? null,
                timestamp,
                reported_at: new Date().toISOString()
            };

            const LOCATION_URL = process.env.EXPO_PUBLIC_LOCATION_URL || 'https://maps.xien.io.vn/update_location.php';

            const headers = { 'Content-Type': 'application/json' };
            if (user.token) headers['Authorization'] = `Bearer ${user.token}`;

            const response = await fetch(LOCATION_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

        } catch (error) {
            console.warn('[ForegroundPost] Lỗi định vị foreground:', error);
        }
    };

    // ── Khởi tạo và theo dõi ──────────────────────────────────────────────
    useEffect(() => {
        evaluateLocationState();

        // Chạy Polling toạ độ liên tục (mỗi 15s) bất cứ khi nào app mở
        postLocation();
        const trackingPoll = setInterval(postLocation, 15000);

        // Theo dõi AppState — kiểm tra lại khi app active
        const subscription = AppState.addEventListener('change', async (nextState) => {
            if (appStateRef.current !== 'active' && nextState === 'active') {
                await evaluateLocationState();
                postLocation();
            }
            appStateRef.current = nextState;
        });

        // Poll định kỳ 20s để phát hiện người dùng tắt GPS giữa chừng
        const poll = setInterval(evaluateLocationState, 20000);

        return () => {
            subscription.remove();
            clearInterval(poll);
            clearInterval(trackingPoll);
        };
    }, []);

    // ── Render: Đang kiểm tra ──────────────────────────────────────────────
    if (status === 'checking') {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.checkingText}>Đang kiểm tra dịch vụ vị trí...</Text>
            </View>
        );
    }

    // ── Render: GPS tắt ────────────────────────────────────────────────────
    if (status === 'disabled') {
        return (
            <>
                {children}
                <Modal visible transparent animationType="slide">
                    <View style={styles.overlay}>
                        <View style={styles.card}>
                            <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                                <Ionicons name="navigate-circle-outline" size={44} color="#f59e0b" />
                            </View>
                            <Text style={styles.title}>GPS chưa được bật</Text>
                            <Text style={styles.description}>
                                Thiết bị của bạn chưa bật dịch vụ định vị (GPS). Vui lòng bật GPS trong Cài đặt để ứng dụng hoạt động bình thường.
                            </Text>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={async () => {
                                    if (Platform.OS === 'android') {
                                        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                                    } else {
                                        await Linking.openURL('App-Prefs:Privacy&path=LOCATION');
                                    }
                                    await evaluateLocationState();
                                }}
                            >
                                <Ionicons name="settings-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Mở Cài đặt GPS</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.retryBtn} onPress={evaluateLocationState}>
                                <Text style={styles.retryText}>Đã bật — Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </>
        );
    }

    // ── Render: Chưa cấp quyền ────────────────────────────────────────────
    if (status === 'no_permission') {
        return (
            <>
                {children}
                <Modal visible transparent animationType="slide">
                    <View style={styles.overlay}>
                        <View style={styles.card}>
                            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                                <Ionicons name="location-outline" size={44} color={COLORS.error} />
                            </View>
                            <Text style={styles.title}>Yêu cầu quyền vị trí</Text>
                            <Text style={styles.description}>
                                Ứng dụng cần quyền truy cập vị trí <Text style={{ fontWeight: '700' }}>"Luôn luôn (Always)"</Text> để ghi nhận hành trình trong suốt ca làm việc, kể cả khi bạn chuyển sang ứng dụng khác.
                            </Text>
                            <View style={styles.infoBox}>
                                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
                                <Text style={styles.infoText}>Dữ liệu vị trí chỉ được dùng trong nội bộ hệ thống quản lý</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.button, requesting && { opacity: 0.7 }]}
                                onPress={handleRequestPermission}
                                disabled={requesting}
                            >
                                {requesting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="location" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>Cấp quyền vị trí</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </>
        );
    }

    // ── Render: OK — app chạy bình thường ────────────────────────────────
    return children;
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    checkingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748b',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
        padding: 0,
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 32,
        alignItems: 'center',
        paddingBottom: 48,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 21,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        padding: 10,
        marginBottom: 24,
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#15803d',
        flex: 1,
        lineHeight: 18,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 24,
        borderRadius: 14,
        width: '100%',
        marginBottom: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    retryBtn: {
        paddingVertical: 10,
    },
    retryText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
