import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { registerUser } from "../services/authService";
import styles from "../styles/RegisterStyles";
import { COLORS } from "../constants/colors";
import { SPACING, TYPOGRAPHY } from "../constants/theme";
import { checkNetworkConnection } from "../utils/networkUtils";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      return;
    }

    if (!username || !password) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng nhập đủ thông tin" });
      return;
    }

    setLoading(true);
    try {
      await registerUser(username, password);
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: "error", text1: "Đăng ký thất bại", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/DongSon2.png")}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageInner}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topSpacer} />

          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/CompanyLogo4.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.registerTitle}>Đăng ký tài khoản</Text>

            <CustomInput
              label="Tên tài khoản"
              placeholder="Tên tài khoản mới"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon={({ color }) => (
                <Ionicons name="person-outline" size={TYPOGRAPHY.fontSize.body} color={color} />
              )}
            />

            <CustomInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={({ color }) => (
                <Ionicons name="lock-closed-outline" size={TYPOGRAPHY.fontSize.body} color={color} />
              )}
              rightIcon={({ color }) => (
                <Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: SPACING.md_sm, bottom: SPACING.md_sm, left: SPACING.md_sm, right: SPACING.md_sm }}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={TYPOGRAPHY.fontSize.body}
                    color={color}
                  />
                </Pressable>
              )}
            />

            <CustomButton
              title="ĐĂNG KÝ NGAY"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              variant="secondary"
              style={styles.registerButton}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginTextNormal}>Đã có tài khoản? </Text>
              <Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => navigation.goBack()}
                style={styles.loginLink}
                hitSlop={{ top: SPACING.md_sm, bottom: SPACING.md_sm, left: SPACING.md_sm, right: SPACING.md_sm }}
              >
                <Text style={styles.loginTextBold}>Đăng nhập</Text>
                <Ionicons
                  name="chevron-forward"
                  size={TYPOGRAPHY.fontSize.bodySm}
                  color={COLORS.primaryColorAuth}
                  style={styles.loginArrow}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.flexFill} />

          <View style={styles.footerLogosContainer}>
            <Image
              source={require("../../assets/CompanyLogo2.png")}
              style={styles.footerImage}
              resizeMode="contain"
            />
            <View style={styles.footerDivider} />
            <Image
              source={require("../../assets/CompanyLogo3.png")}
              style={styles.footerImage}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.toastContainer}>
        <Toast position="top" topOffset={Platform.OS === "android" ? SPACING.lg : SPACING.xl} />
      </View>
    </ImageBackground>
  );
}
