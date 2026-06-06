import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image, ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { registerUser } from '../services/authService';
import styles from '../styles/RegisterStyles';
import { COLORS } from '../constants/colors';
import { checkNetworkConnection } from '../utils/networkUtils';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        if (!username || !password || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng nhập đủ thông tin' });
            return;
        }
        
        if (password !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Mật khẩu nhập lại không khớp!' });
            return;
        }
        setLoading(true);
        try {
            await registerUser(username, password);
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Đăng ký thất bại', text2: error.message });
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
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                        <Text style={styles.registerTitle}>Đăng ký tài khoản</Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tên tài khoản mới"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
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
                                placeholder="Nhập lại mật khẩu"
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.primaryColorAuth} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
                            <LinearGradient
                                colors={['#1b5e20', '#43a047']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.background} />
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

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.toastContainer}>
                <Toast position='top' topOffset={Platform.OS === 'android' ? 40 : 60} />
            </View>
        </ImageBackground>
    );
}