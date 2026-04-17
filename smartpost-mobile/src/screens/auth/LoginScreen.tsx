import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/services/authService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#254BE0', // Chuẩn màu Deep Blue toàn hệ thống
  primaryLight: '#4361EE',
  background: '#F8F9FA',
  card: '#FFFFFF',
  textMain: '#1E293B',
  textSub: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  inputBg: '#F1F5F9',
};

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state: any) => state.setAuth);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Tài khoản và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(username, password);
      const decoded: any = jwtDecode(data.access_token);

      const userInfo = {
        userId: decoded.user_id,
        username: decoded.sub,
        fullName: data.full_name,
        roleId: decoded.role_id,
        hubId: decoded.primary_hub_id
      };

      await setAuth(data.access_token, userInfo);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      Alert.alert('Lỗi đăng nhập', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* KHỐI HEADER TRANG TRÍ (MÀU XANH) */}
        <View style={styles.headerDecoration}>
          <View style={styles.circleLarge} />
          <View style={styles.circleSmall} />

          <View style={styles.logoWrapper}>
            <View style={styles.logoIconBg}>
              <Ionicons name="cube" size={50} color={COLORS.primary} />
            </View>
            <Text style={styles.logoText}>SMARTPOST</Text>
            <Text style={styles.subtitle}>Hệ thống Giao nhận Thông minh</Text>
          </View>
        </View>

        {/* KHỐI FORM ĐĂNG NHẬP */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Đăng nhập hệ thống</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSub} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập tài khoản của bạn..."
                placeholderTextColor={COLORS.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSub} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={COLORS.textSub} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassBtn}>
            <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { backgroundColor: COLORS.primaryLight }]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bản quyền © 2026 SmartPost Inc.</Text>
          <Text style={styles.footerVersion}>Phiên bản 2.0.1</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: COLORS.background, paddingBottom: 30 },

  // HEADER
  headerDecoration: {
    backgroundColor: COLORS.primary,
    height: 320,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  circleLarge: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
  circleSmall: { position: 'absolute', bottom: -30, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' },

  logoWrapper: { alignItems: 'center', marginTop: 20 },
  logoIconBg: { width: 90, height: 90, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  logoText: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, letterSpacing: 0.5 },

  // FORM CHÍNH
  formContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: 25,
    marginTop: -40, // Kéo form trồi lên trên phần Header xanh
    borderRadius: 24,
    padding: 25,
    paddingTop: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 25, textAlign: 'center' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 15,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.textMain, height: '100%' },
  eyeIcon: { padding: 10, marginRight: -10 },

  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotPassText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },

  loginBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // FOOTER
  footer: { marginTop: 'auto', alignItems: 'center', paddingTop: 30 },
  footerText: { color: COLORS.textSub, fontSize: 13, fontWeight: '500' },
  footerVersion: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
});