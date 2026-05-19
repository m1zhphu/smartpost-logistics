import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image, ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { loginUser } from '../services/authService';
import { useUser } from '../context/UserContext';
import { useQueue } from '../context/QueueContext';
import { COLORS } from '../constants/colors';
import { checkNetworkConnection } from '../utils/networkUtils';
import { getRoleKey } from '../utils/roleUtils';
import styles from '../styles/LoginStyles';

export default function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { user, login } = useUser();
    const { clearQueue } = useQueue();

    useEffect(() => {
        if (user?.isAuthenticated) {
            // Điều hướng người dùng tới đúng màn hình theo vai trò
            const roleKey = getRoleKey(user);
            let targetRoute = 'Home';

            if (roleKey === 'shipper') targetRoute = 'TaskList';
            else if (roleKey === 'accountant') targetRoute = 'AccountantMenu';
            else if (roleKey === 'warehouse' || roleKey === 'hub_manager') targetRoute = 'WarehouseMenu';

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: targetRoute }],
                })
            );
        }
    }, [user?.isAuthenticated, navigation]);

    const handleLogin = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        if (!username || !password) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập đủ tài khoản và mật khẩu!' });
            return;
        }

        setLoading(true);
        try {
            const result = await loginUser(username, password);
            if (result.success) {
                clearQueue();
                login(result.data);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi đăng nhập', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/DongSon2.png')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.05, resizeMode: 'cover' }}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
                keyboardVerticalOffset={0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.topSpacer} />

                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/CompanyLogo4.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.loginTitle}>Đăng nhập hệ thống</Text>

                        {/* Tài khoản */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person" size={20} color={COLORS.primary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tên đăng nhập"
                                placeholderTextColor={COLORS.textMuted}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Mật khẩu */}
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed" size={20} color={COLORS.primary} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mật khẩu"
                                placeholderTextColor={COLORS.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.7}>
                                <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Nút Đăng nhập */}
                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1.5, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.loginText}>ĐĂNG NHẬP</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Tuỳ chọn đăng ký (Mở comment ra nếu cần) */}
                        {/* <View style={styles.registerRow}>
                            <Text style={styles.registerTextNormal}>Bạn chưa có tài khoản? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.registerTextBold}>Đăng ký ngay</Text>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} style={{ marginLeft: 2, marginTop: 1 }} />
                            </TouchableOpacity>
                        </View> */}
                    </View>

                    <View style={{ flex: 1 }} />

                    {/* Logo Đối tác / Footer */}
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

                </ScrollView>
            </KeyboardAvoidingView>
            <Toast />
        </ImageBackground>
    );
}