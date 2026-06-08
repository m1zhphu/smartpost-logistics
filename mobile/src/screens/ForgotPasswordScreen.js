import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { requestForgotPasswordOtp, resetPasswordWithOtp } from '../services/authService';

export default function ForgotPasswordScreen({ route, navigation }) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    
    // Form fields
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleRequestOtp = async () => {
        if (!email.trim()) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập địa chỉ email của bạn' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Toast.show({ type: 'error', text1: 'Email không hợp lệ', text2: 'Vui lòng nhập đúng định dạng email (vd: abc@gmail.com)' });
            return;
        }

        setLoading(true);
        try {
            const response = await requestForgotPasswordOtp(email.trim());
            if (response.success) {
                Toast.show({ type: 'success', text1: 'Thành công', text2: 'Mã OTP đã được gửi đến email của bạn' });
                setStep(2);
            }
        } catch (error) {
            // Nếu backend trả về lỗi 429 (Vui lòng đợi 3 phút...), 
            // có nghĩa là user đã có OTP. Ta vẫn cho phép sang bước 2 để nhập mã cũ.
            if (error.message && error.message.includes('Vui lòng đợi 3 phút')) {
                Toast.show({ type: 'info', text1: 'Lưu ý', text2: 'Bạn đã yêu cầu OTP gần đây. Vui lòng nhập mã đã nhận được.' });
                setStep(2);
            } else {
                Toast.show({ type: 'error', text1: 'Lỗi', text2: error.message });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp.trim() || !newPassword || !confirmPassword) {
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
            const response = await resetPasswordWithOtp({
                email: email.trim(),
                otp: otp.trim(),
                new_password: newPassword
            });
            
            if (response.success) {
                Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đặt lại mật khẩu thành công!' });
                navigation.goBack();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: error.message });
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
                <Text style={styles.headerTitle}>Quên mật khẩu</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.formCard}>
                    {step === 1 ? (
                        <>
                            <Text style={styles.instruction}>
                                Vui lòng nhập địa chỉ email đã đăng ký tài khoản. Chúng tôi sẽ gửi mã OTP gồm 6 chữ số để đặt lại mật khẩu.
                            </Text>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Nhập email của bạn"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleRequestOtp} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Gửi mã OTP</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.instruction}>
                                Mã OTP đã được gửi đến email <Text style={{fontWeight: 'bold'}}>{email}</Text>. Vui lòng kiểm tra hộp thư (hoặc thư rác) và nhập thông tin dưới đây.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mã OTP</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="keypad-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={otp}
                                        onChangeText={setOtp}
                                        placeholder="Nhập mã OTP 6 chữ số"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mật khẩu mới</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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

                            <TouchableOpacity style={styles.saveBtn} onPress={handleResetPassword} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Đặt lại mật khẩu</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={{alignItems: 'center', marginTop: 16}} onPress={handleRequestOtp} disabled={loading}>
                                <Text style={{color: COLORS.primary, fontWeight: '500'}}>Gửi lại mã OTP</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
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
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    content: { flex: 1, padding: 16 },
    formCard: {
        backgroundColor: '#FFF',
        padding: 20, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 2,
    },
    instruction: { fontSize: 14, color: '#4B5563', marginBottom: 20, lineHeight: 20, textAlign: 'center' },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: '#4B5563', marginBottom: 8, fontWeight: '500' },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1, borderColor: '#D1D5DB',
        borderRadius: 8,
    },
    inputIcon: { paddingLeft: 12 },
    input: {
        flex: 1, padding: 12, fontSize: 14, color: '#1F2937',
    },
    eyeIcon: { padding: 12 },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 10,
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
