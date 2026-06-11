import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';
import styles from '../styles/ChangePasswordScreenStyles';

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ChangePasswordScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [userType, setUserType] = useState('customer');

    useEffect(() => {
        const fetchUserType = async () => {
            const uType = await AsyncStorage.getItem('user_type');
            if (uType) {
                setUserType(uType);
            }
        };
        fetchUserType();
    }, []);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đủ các trường' });
            return;
        }

        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Mật khẩu yếu', text2: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Mật khẩu nhập lại không khớp' });
            return;
        }

        setLoading(true);
        try {
            const url = userType === 'customer' ? CUSTOMER_ENDPOINTS.CHANGE_PASSWORD : WAREHOUSE_ENDPOINTS.CHANGE_PASSWORD;
            
            const response = await apiClient.post(url, {
                current_password: currentPassword,
                new_password: newPassword
            });

            if (response.status === 200 || response.status === 201) {
                Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đổi mật khẩu thành công!' });
                navigation.goBack();
            }
        } catch (error) {
            console.error("Change password error:", error);
            Toast.show({ type: 'error', text1: 'Lỗi', text2: error?.response?.data?.detail || 'Không thể đổi mật khẩu' });
        } finally {
            setLoading(false);
        }
    };

    const HeaderButton = ({ icon, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            style={styles.headerButton}
            activeOpacity={0.78}
        >
            <View style={styles.headerButtonInner}>
                <Ionicons name={icon} size={24} color={COLORS.white} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} disabled={loading} />
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <View style={{ width: 42 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu hiện tại</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Nhập mật khẩu hiện tại"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showCurrent}
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                                <Ionicons name={showCurrent ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu mới</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Nhập mật khẩu mới"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showNew}
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nhập lại mật khẩu mới</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Xác nhận mật khẩu mới"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showConfirm}
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading} activeOpacity={0.88}>
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveBtnText}>Đổi mật khẩu</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

/* const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 22,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: PRIMARY,
        borderBottomLeftRadius: 42,
        borderBottomRightRadius: 42,
        ...Platform.select({
            ios: {
                shadowColor: PRIMARY,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.22,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    
    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },

    headerButtonInner: {
        justifyContent: "center",
        alignItems: "center",
    },
    
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
    
    content: { flex: 1, padding: 16 },
    
    formCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#64748B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: '#475569', marginBottom: 8, fontWeight: '700' },
    
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        minHeight: 52,
    },
    
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 0,
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '700',
    },
    
    eyeIcon: { padding: 14 },
    
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#64748B',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    
    saveBtn: {
        backgroundColor: PRIMARY,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
}); */
