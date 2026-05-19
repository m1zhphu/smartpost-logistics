import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator, StatusBar,
    Platform, StyleSheet, Alert, Dimensions, Modal, ScrollView, Animated, Easing
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { CommonActions } from '@react-navigation/native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Constants from 'expo-constants';

import { ENDPOINTS } from '../constants/data';
import { useQueue } from '../context/QueueContext';
import { getHomeMenuItems } from '../utils/roleUtils';
import ProcessedListScreen from './ProcessedListScreen';
import { useUser } from '../context/UserContext';
import { createAuthHeaders } from '../services/apiClient';
import styles, { FRAME_W, FRAME_H } from '../styles/HomeStyles';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

// ─── Animated Corner Component ───────────────────────────────────────────────
function ScanCorner({ position }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            ])
        ).start();
    }, []);

    const cornerStyles = {
        topLeft: { top: -2, left: -2 },
        topRight: { top: -2, right: -2 },
        bottomLeft: { bottom: -2, left: -2 },
        bottomRight: { bottom: -2, right: -2 },
    };

    const rotations = { topLeft: '0deg', topRight: '90deg', bottomLeft: '270deg', bottomRight: '180deg' };

    return (
        <Animated.View style={[styles.corner, cornerStyles[position], { opacity: pulseAnim, transform: [{ rotate: rotations[position] }] }]}>
            <View style={styles.cornerHorizontal} />
            <View style={styles.cornerVertical} />
        </Animated.View>
    );
}

// ─── Shutter Button Component ────────────────────────────────────────────────
function ShutterButton({ onPress, disabled }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 20 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
        onPress?.();
    };

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
            <View style={[styles.shutterOuter, disabled && { borderColor: 'rgba(255,255,255,0.4)' }]}>
                <Animated.View style={[styles.shutterInner, { transform: [{ scale: scaleAnim }] }, disabled && { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                    {disabled && <ActivityIndicator color={COLORS.primary} size="small" />}
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Main HomeScreen ─────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [flashMode, setFlashMode] = useState('auto');
    const { user, logout } = useUser();

    const {
        queue = [], addToQueue = () => { }, updateQueueItem = () => { },
        removeQueueItem = () => { }, clearQueue = () => { },
    } = useQueue() || {};

    const [isCapturing, setIsCapturing] = useState(false);
    const [showList, setShowList] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const menuItems = getHomeMenuItems(user);
    const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
    const safeQueue = Array.isArray(queue) ? queue : [];
    const isProcessing = useRef(false);
    const isUploadingRef = useRef(false);

    const menuSlide = useRef(new Animated.Value(height)).current;
    const menuOpacity = useRef(new Animated.Value(0)).current;
    const appVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

    const pendingCount = safeQueue.filter(i => i.status === 'loading').length;
    const successCount = safeQueue.filter(i => i.status === 'success').length;
    const errorCount = safeQueue.filter(i => i.status === 'error').length;

    useEffect(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, []);

    useEffect(() => {
        const processNextItem = async () => {
            if (isUploadingRef.current) return;
            const nextItem = [...queue].reverse().find(item => item.status === 'loading');
            if (nextItem) {
                isUploadingRef.current = true;
                await processQueueItem(nextItem);
                isUploadingRef.current = false;
            }
        };
        processNextItem();
    }, [queue]);

    // Menu Animations
    const openMenu = () => {
        setShowMenu(true);
        Animated.parallel([
            Animated.timing(menuSlide, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(menuOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const closeMenu = (cb) => {
        Animated.parallel([
            Animated.timing(menuSlide, { toValue: height, duration: 250, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
            Animated.timing(menuOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setShowMenu(false);
            cb?.();
        });
    };

    const handleLogout = () => {
        closeMenu(() => {
            Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất không?', [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Đăng xuất', onPress: () => { clearQueue(); logout(); navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })); }, style: 'destructive' },
            ]);
        });
    };

    const toggleFlash = () => {
        const modes = ['auto', 'on', 'off'];
        const nextIndex = (modes.indexOf(flashMode) + 1) % modes.length;
        setFlashMode(modes[nextIndex]);
    };

    const getFlashIcon = () => {
        if (flashMode === 'auto') return 'flash-outline';
        if (flashMode === 'on') return 'flash';
        return 'flash-off-outline';
    };

    const takePicture = async () => {
        if (!cameraRef.current || isProcessing.current || !isCameraReady) return;
        try {
            isProcessing.current = true;
            setIsCapturing(true);

            const photo = await cameraRef.current.takePictureAsync({ quality: 1, exif: true });
            let currentUri = photo.uri;
            let currentW = photo.width;
            let currentH = photo.height;

            if (currentW < currentH) {
                const rotated = await manipulateAsync(currentUri, [{ rotate: 270 }], { format: SaveFormat.JPEG });
                currentUri = rotated.uri; currentW = rotated.width; currentH = rotated.height;
            }

            const scale = currentW / height;
            const cropTargetW = FRAME_H * scale;
            const cropTargetH = FRAME_W * scale;

            const visibleImgH = width * scale;
            const visibleOriginY = (currentH - visibleImgH) / 2;
            const cropY_in_Visible = (visibleImgH - cropTargetH) / 2;

            let finalX = (currentW - cropTargetW) / 2;
            let finalY = visibleOriginY + cropY_in_Visible;

            const manipResult = await manipulateAsync(
                currentUri,
                [{ crop: { originX: Math.floor(finalX), originY: Math.floor(finalY), width: Math.floor(cropTargetW), height: Math.floor(cropTargetH) } }, { resize: { width: 1800 } }],
                { compress: 0.7, format: SaveFormat.JPEG }
            );

            addToQueue(manipResult.uri);
            Toast.show({ type: 'success', text1: 'Đã thêm vào hàng chờ', visibilityTime: 1200 });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi chụp ảnh', text2: 'Vui lòng thử lại' });
        } finally {
            isProcessing.current = false;
            setIsCapturing(false);
        }
    };

    const processQueueItem = async (item) => {
        try {
            const formData = new FormData();
            const cleanUri = Platform.OS === 'android' ? item.uri : item.uri.replace('file://', '');
            const filename = cleanUri.split('/').pop();
            const type = /\.(\w+)$/.exec(filename) ? `image/${/\.(\w+)$/.exec(filename)[1]}` : 'image/jpeg';
            formData.append('file', { uri: cleanUri, name: filename, type });

            const response = await fetch(ENDPOINTS.EXTRACT, {
                method: 'POST',
                body: formData,
                headers: createAuthHeaders(user.token, { Accept: 'application/json' }),
            });
            const textResponse = await response.text();
            if (!response.ok) throw new Error(`SERVER_${response.status}`);

            const data = JSON.parse(textResponse);
            if (data.sender || data.receiver || data.tracking_number) {
                updateQueueItem(item.id, { status: 'success', data });
            } else {
                updateQueueItem(item.id, { status: 'error', errorType: 'FORMAT' });
            }
        } catch {
            updateQueueItem(item.id, { status: 'error', errorType: 'SERVER' });
        }
    };

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.formSectionBg} />
                <View style={styles.permissionIconWrap}>
                    <Ionicons name="camera" size={40} color={COLORS.secondary} />
                </View>
                <Text style={styles.permissionTitle}>Cho phép truy cập Camera</Text>
                <Text style={styles.permissionDesc}>Ứng dụng cần quyền sử dụng máy ảnh của bạn để thực hiện tính năng quét vận đơn.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.btnPermission}>
                    <Ionicons name="scan-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.btnPermissionText}>Cấp quyền ngay</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Layer 1: Camera View */}
            <View style={StyleSheet.absoluteFill}>
                <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef} onCameraReady={() => setIsCameraReady(true)} autofocus="on" flash={flashMode} />
            </View>

            {/* Layer 2: Mask */}
            <View style={styles.maskContainer} pointerEvents="none">
                <View style={styles.maskTop} />
                <View style={styles.maskCenter}>
                    <View style={styles.maskSide} />
                    <View style={styles.scanFrame}>
                        <ScanCorner position="topLeft" />
                        <ScanCorner position="topRight" />
                        <ScanCorner position="bottomLeft" />
                        <ScanCorner position="bottomRight" />
                        <Text style={styles.scanHint}>Đưa mã vận đơn vào khung</Text>
                    </View>
                    <View style={styles.maskSide} />
                </View>
                <View style={styles.maskBottom} />
            </View>

            {/* Layer 3: UI Controls */}
            <View style={styles.overlay} pointerEvents="box-none">
                {/* --- Header --- */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={openMenu} style={styles.headerBtn}>
                        <Ionicons name="options-outline" size={22} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Máy Quét AI</Text>
                        <Text style={styles.headerSubtitle}>Sẵn sàng quét</Text>
                    </View>

                    <TouchableOpacity onPress={toggleFlash} style={styles.headerBtn}>
                        <Ionicons name={getFlashIcon()} size={22} color={flashMode === 'on' ? COLORS.warning : COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* --- Bottom Controls --- */}
                <View style={styles.bottomBar}>
                    {/* Hàng đợi (Queue Stats) */}
                    {safeQueue.length > 0 && (
                        <View style={styles.statsRow}>
                            {pendingCount > 0 && (
                                <View style={[styles.statChip, { backgroundColor: COLORS.warningBg, borderColor: '#FDE68A' }]}>
                                    <ActivityIndicator size={12} color={COLORS.warningText} style={{ marginRight: 6 }} />
                                    <Text style={[styles.statText, { color: COLORS.warningText }]}>{pendingCount} đang xử lý</Text>
                                </View>
                            )}
                            {successCount > 0 && (
                                <View style={[styles.statChip, { backgroundColor: COLORS.secondaryLight, borderColor: COLORS.secondary }]}>
                                    <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} style={{ marginRight: 4 }} />
                                    <Text style={[styles.statText, { color: COLORS.secondary }]}>{successCount} hoàn tất</Text>
                                </View>
                            )}
                            {errorCount > 0 && (
                                <View style={[styles.statChip, { backgroundColor: COLORS.errorBg, borderColor: COLORS.error }]}>
                                    <Ionicons name="alert-circle" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
                                    <Text style={[styles.statText, { color: COLORS.error }]}>{errorCount} lỗi</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Dàn nút bấm chính */}
                    <View style={styles.shutterRow}>
                        {/* Nút xem danh sách */}
                        <TouchableOpacity onPress={() => setShowList(true)} style={styles.sideBtn}>
                            <View>
                                <Ionicons name="images-outline" size={28} color={COLORS.white} />
                                {safeQueue.length > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{safeQueue.length > 99 ? '99+' : safeQueue.length}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.sideBtnLabel}>Hàng chờ</Text>
                        </TouchableOpacity>

                        {/* Nút chụp (Shutter) */}
                        <ShutterButton onPress={takePicture} disabled={isCapturing || !isCameraReady} />

                        {/* Nút Xoá */}
                        <TouchableOpacity onPress={() => safeQueue.length > 0 && Alert.alert('Xoá hàng chờ', 'Xác nhận xoá toàn bộ danh sách?', [{ text: 'Huỷ', style: 'cancel' }, { text: 'Xoá', onPress: clearQueue, style: 'destructive' }])} style={[styles.sideBtn, { opacity: safeQueue.length === 0 ? 0.4 : 1 }]} disabled={safeQueue.length === 0}>
                            <Ionicons name="trash-outline" size={26} color={COLORS.logOut} />
                            <Text style={[styles.sideBtnLabel, { color: COLORS.logOut }]}>Xoá hết</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.versionText}>Phiên bản {appVersion}</Text>
                </View>
            </View>

            {/* ── Menu Bottom Sheet ── */}
            <Modal visible={showMenu} transparent animationType="none" onRequestClose={() => closeMenu()}>
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: menuOpacity }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeMenu()} />
                </Animated.View>

                <Animated.View style={[styles.menuSheet, { transform: [{ translateY: menuSlide }] }]}>
                    <View style={styles.sheetHandle} />

                    <View style={styles.menuUserRow}>
                        <View style={styles.menuAvatar}>
                            <Text style={styles.menuAvatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.menuUserName} numberOfLines={1}>{user?.name || 'Người dùng'}</Text>
                            <Text style={styles.menuUserRole} numberOfLines={1}>{user?.role || 'Nhân viên'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => closeMenu()} style={styles.closeSheetBtn}>
                            <Ionicons name="close" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
                        <TouchableOpacity style={styles.sheetItem} onPress={() => closeMenu(() => navigation.navigate('Profile'))}>
                            <View style={[styles.sheetIconBox, { backgroundColor: 'rgba(76,175,80,0.15)' }]}>
                                <Ionicons name="person" size={20} color={COLORS.secondary} />
                            </View>
                            <Text style={styles.sheetItemText}>Thông tin tài khoản</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textGray} />
                        </TouchableOpacity>

                        {safeMenuItems.length > 0 && (
                            <>
                                <Text style={styles.sheetSectionLabel}>Chức năng</Text>
                                {safeMenuItems.map(item => (
                                    <TouchableOpacity key={item.route} style={styles.sheetItem} onPress={() => closeMenu(() => { if (item.route && typeof navigation.navigate === 'function') navigation.navigate(item.route); })}>
                                        <View style={[styles.sheetIconBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                                            <Ionicons name={item.icon} size={20} color={COLORS.white} />
                                        </View>
                                        <Text style={styles.sheetItemText}>{item.label}</Text>
                                        <Ionicons name="chevron-forward" size={20} color={COLORS.textGray} />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        <View style={styles.sheetDivider} />

                        <TouchableOpacity style={styles.sheetItem} onPress={handleLogout}>
                            <View style={[styles.sheetIconBox, { backgroundColor: 'rgba(244,67,54,0.15)' }]}>
                                <Ionicons name="log-out" size={20} color={COLORS.logOut} />
                            </View>
                            <Text style={[styles.sheetItemText, { color: COLORS.logOut }]}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </Modal>

            {/* ── Queue Modal ── */}
            <Modal visible={showList} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowList(false)}>
                <ProcessedListScreen queue={queue} navigation={navigation} onClose={() => setShowList(false)} onClear={clearQueue} onDelete={id => removeQueueItem(id)} onRetry={item => updateQueueItem(item.id, { status: 'loading' })} />
            </Modal>

            {/* Toast layer */}
            <View style={styles.toastLayer} pointerEvents="none">
                <Toast position="top" topOffset={Platform.OS === 'android' ? 50 : 70} />
            </View>
        </View>
    );
}