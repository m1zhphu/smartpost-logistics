import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Platform, Image, ImageBackground, Modal
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';

import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { requestRegisterOTP, verifyRegisterOTP } from '../services/authService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { checkNetworkConnection } from '../utils/networkUtils';
import styles from '../styles/RegisterScreenStyles';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // OTP Modal states
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');

    const { loginUserAndFetchProfile } = useUser();

    const handleRegisterRequest = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        if (!email || !username || !password || !confirmPassword || !fullName || !phone) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đủ các trường!' });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Lỗi mật khẩu', text2: 'Mật khẩu nhập lại không khớp!' });
            return;
        }

        setLoading(true);
        try {
            await requestRegisterOTP(email);

            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Đã gửi mã OTP tới email của bạn'
            });

            setShowOtpModal(true);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: error.message || 'Không thể gửi OTP'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        if (!otpCode) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập mã OTP!' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                username,
                password,
                full_name: fullName,
                email,
                otp: otpCode,
                phone_number: phone || undefined,
            };

            await verifyRegisterOTP(payload);

            Toast.show({
                type: 'success',
                text1: 'Đăng ký thành công',
                text2: 'Hệ thống sẽ tự động đăng nhập'
            });

            setShowOtpModal(false);

            // Auto login as customer after successful registration
            await loginUserAndFetchProfile(username, password, "customer");

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'CustomerHome' }],
                })
            );
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi xác thực',
                text2: error.message || 'Mã OTP không đúng'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/DongSon2.png')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.08, resizeMode: 'cover' }}
        >
            <StatusBar style="dark" />

            <KeyboardAwareScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === 'ios' ? 40 : 0}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                style={styles.container}
            >

                <View style={styles.topSpacer} />

                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/CompanyLogo4.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.registerTitle}>Đăng ký Khách hàng</Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tên đăng nhập"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-circle-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Họ và tên"
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email nhận mã OTP"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Số điện thoại"
                                placeholderTextColor="#999"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.primaryColorAuth} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Xác nhận mật khẩu"
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.primaryColorAuth} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.registerBtn} onPress={handleRegisterRequest} disabled={loading}>
                            <LinearGradient
                                colors={['#1b5e20', '#43a047']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.registerText}>ĐĂNG KÝ NGAY</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginTextNormal}>Đã có tài khoản? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Text style={styles.loginTextBold}>Đăng nhập</Text>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.primaryColorAuth} style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ flex: 1 }} />

                    <View style={styles.footerLogosContainer}>
                        <Image
                            source={require('../../assets/CompanyLogo2.png')}
                            style={styles.footerImage}
                            resizeMode="contain"
                        />
                        <View style={styles.footerDivider} />
                        <Image
                            source={require('../../assets/CompanyLogo3.png')}
                            style={styles.footerImage}
                            resizeMode="contain"
                        />
                    </View>

            </KeyboardAwareScrollView>

            {/* OTP Modal */}
            <Modal visible={showOtpModal} transparent animationType="fade">
                <View style={styles.otpModalOverlay}>
                    <View style={styles.otpModalContent}>
                        <Text style={styles.otpModalTitle}>Xác nhận OTP</Text>
                        <Text style={styles.otpModalSubtitle}>
                            Mã xác thực đã được gửi tới email {email}
                        </Text>

                        <TextInput
                            style={styles.otpInput}
                            placeholder="------"
                            placeholderTextColor="#CBD5E1"
                            value={otpCode}
                            onChangeText={setOtpCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <View style={styles.otpBtnContainer}>
                            <TouchableOpacity
                                style={styles.otpCancelBtn}
                                onPress={() => setShowOtpModal(false)}
                                disabled={loading}
                            >
                                <Text style={styles.otpCancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.otpSubmitBtn}
                                onPress={handleVerifyOTP}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#1b5e20', '#43a047']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.otpGradientBtn}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={styles.otpSubmitText}>Xác nhận</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Toast />
        </ImageBackground>
    );
}