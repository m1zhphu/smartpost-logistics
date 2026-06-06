import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';

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

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={loading}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <View style={{ width: 24 }} />
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
                                secureTextEntry={!showCurrent}
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                                <Ionicons name={showCurrent ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
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
                                secureTextEntry={!showNew}
                            />
                            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
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
                                secureTextEntry={!showConfirm}
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>Đổi mật khẩu</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 15,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        zIndex: 10,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    content: { flex: 1, padding: 16 },
    formCard: {
        backgroundColor: '#FFF',
        padding: 16, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 2,
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: '#4B5563', marginBottom: 8, fontWeight: '500' },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1, borderColor: '#D1D5DB',
        borderRadius: 8,
    },
    input: {
        flex: 1, padding: 12, fontSize: 14, color: '#1F2937',
    },
    eyeIcon: { padding: 12 },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 10,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
