import React, { useState, useEffect } from 'react';
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
import { useUser } from '../context/UserContext';
import { useQueue } from '../context/QueueContext';
import { COLORS } from '../constants/colors';
import { checkNetworkConnection } from '../utils/networkUtils';
import styles from '../styles/LoginScreenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_TYPES = [
    { key: "employee", label: "Kho" },
    { key: "admin", label: "Nội bộ" },
    { key: "customer", label: "Khách hàng" },
];

export default function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Logic for role
    const [userType, setUserType] = useState("customer");
    const [showRoleModal, setShowRoleModal] = useState(false);

    const { loginUserAndFetchProfile, isWarehouseStaff } = useUser();
    const { clearQueue } = useQueue();


    const handleLogin = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername || !trimmedPassword) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập đủ!' });
            return;
        }

        setLoading(true);
        try {
            // Lấy dữ liệu profile nóng hổi từ API
            const result = await loginUserAndFetchProfile(trimmedUsername, trimmedPassword, userType);

            const tutorialDone = await AsyncStorage.getItem("tutorial_done");
            const isTutorialCompleted = tutorialDone === "true";

            let nextScreen = 'Tutorial';

            if (isTutorialCompleted) {
                const userRoles = result.profileData.roles || [];
                const latestPermissions = [];
                userRoles.forEach(role => {
                    (role.permissions || []).forEach(p => {
                        if (!latestPermissions.includes(p.code)) latestPermissions.push(p.code);
                    });
                });

                const hasWarehousePerms = isWarehouseStaff(latestPermissions);

                if (userType === "customer") {
                    nextScreen = "CustomerHome";
                } else if (userType === "admin") {
                    nextScreen = "Home";
                } else if (hasWarehousePerms) {
                    nextScreen = "WarehouseHome";
                } else {
                    nextScreen = "Home";
                }
            }

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: nextScreen }],
                })
            );
        } catch (error) {
            console.error("Login error:", error);
            let errorMsg = error.message || "Sai tài khoản hoặc mật khẩu";
            if (error.response) {
                const detail = error.response.data?.detail;
                if (detail && typeof detail === 'string') {
                    errorMsg = detail;
                } else if (error.response.status === 401) {
                    errorMsg = "Sai tài khoản hoặc mật khẩu (401)";
                } else if (error.response.status === 502) {
                    errorMsg = "Hệ thống đang bảo trì hoặc lỗi kết nối (502). Vui lòng thử lại sau.";
                } else {
                    errorMsg = `Lỗi kết nối (${error.response.status})`;
                }
            }
            Toast.show({ type: 'error', text1: 'Lỗi đăng nhập', text2: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const getRoleName = () => {
        const role = USER_TYPES.find(r => r.key === userType);
        return role ? role.label : "Vai trò";
    };

    return (
        <ImageBackground
            source={require('../../assets/DongSon2.png')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.08, resizeMode: 'cover' }}
        >
            <StatusBar style="dark" />

            <TouchableOpacity
                style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, padding: 10 }}
                onPress={() => setShowRoleModal(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="options-outline" size={28} color={COLORS.primaryColorAuth || "#1b5e20"} />
            </TouchableOpacity>

            <KeyboardAwareScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === 'ios' ? 40 : 0}
                keyboardShouldPersistTaps="handled"
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
                        <Text style={styles.loginTitle}>Đăng nhập {getRoleName()}</Text>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color={COLORS.primaryColorAuth} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tài khoản"
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
                        
                        {userType === "customer" && (
                            <TouchableOpacity
                                style={{ alignSelf: "flex-end", marginTop: 5, marginBottom: 15 }}
                                onPress={() => navigation.navigate("ForgotPassword")}
                                activeOpacity={0.75}
                            >
                                <Text style={{ color: COLORS.primaryColorAuth, fontWeight: "700" }}>
                                    Quên mật khẩu?
                                </Text>
                            </TouchableOpacity>
                        )}


                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                            <LinearGradient
                                colors={['#1b5e20', '#43a047']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.loginText}>ĐĂNG NHẬP</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {userType === "customer" && (
                            <View style={styles.registerRow}>
                                <Text style={styles.registerTextNormal}>Chưa có tài khoản? </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Register')}
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <Text style={styles.registerTextBold}>Đăng ký ngay</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.primaryColorAuth} style={{ marginLeft: 2 }} />
                                </TouchableOpacity>
                            </View>
                        )}
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

            <Modal visible={showRoleModal} transparent animationType="slide">
                <TouchableOpacity 
                    style={styles.roleModalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowRoleModal(false)}
                >
                    <TouchableOpacity 
                        activeOpacity={1} 
                        style={styles.roleModalContent}
                    >
                        <View style={styles.dragHandle} />
                        <Text style={styles.roleModalTitle}>Chọn vai trò đăng nhập</Text>
                        {USER_TYPES.map(role => (
                            <TouchableOpacity
                                key={role.key}
                                style={styles.roleButton}
                                onPress={() => {
                                    setUserType(role.key);
                                    setShowRoleModal(false);
                                }}
                            >
                                <Text style={[styles.roleButtonText, userType === role.key && styles.roleButtonTextActive]}>
                                    {role.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.roleCloseBtn} onPress={() => setShowRoleModal(false)}>
                            <Text style={styles.roleCloseText}>Đóng</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

        </ImageBackground>
    );
}
