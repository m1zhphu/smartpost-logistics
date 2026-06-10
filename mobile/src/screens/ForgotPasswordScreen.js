import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
} from "../services/authService";

const PRIMARY = COLORS.primary || "#1B5E20";

const blurProps = {
    intensity: Platform.OS === "ios" ? 66 : 40,
    tint: "light",
  };

const HeaderButton = ({ icon, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={styles.headerButtonShadow}
    activeOpacity={0.78}
  >
    <BlurView {...blurProps} intensity={52} style={styles.headerButton}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.36)",
          "rgba(255,255,255,0.14)",
          "rgba(255,255,255,0.06)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.headerButtonTopLine} />
      <Ionicons name={icon} size={24} color="#FFF" />
    </BlurView>
  </TouchableOpacity>
);

const GlassInput = ({
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  maxLength,
  showEye,
  onEyePress,
  eyeActive,
}) => (
  <View style={styles.inputGroup}>
    <BlurView
      {...blurProps}
      intensity={Platform.OS === "ios" ? 56 : 34}
      style={styles.inputWrapper}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.9)",
          "rgba(255,255,255,0.48)",
          "rgba(255,255,255,0.24)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Ionicons
        name={icon}
        size={20}
        color={PRIMARY}
        style={styles.inputIcon}
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(71,85,105,0.52)"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCapitalize="none"
        underlineColorAndroid="transparent"
      />

      {showEye && (
        <TouchableOpacity onPress={onEyePress} style={styles.eyeIcon}>
          <Ionicons
            name={eyeActive ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={PRIMARY}
          />
        </TouchableOpacity>
      )}
    </BlurView>
  </View>
);

export default function ForgotPasswordScreen({ route, navigation }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập địa chỉ email của bạn",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Toast.show({
        type: "error",
        text1: "Email không hợp lệ",
        text2: "Vui lòng nhập đúng định dạng email (vd: abc@gmail.com)",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await requestForgotPasswordOtp(email.trim());

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Mã OTP đã được gửi đến email của bạn",
        });

        setStep(2);
      }
    } catch (error) {
      if (error.message && error.message.includes("Vui lòng đợi 3 phút")) {
        Toast.show({
          type: "info",
          text1: "Lưu ý",
          text2: "Bạn đã yêu cầu OTP gần đây. Vui lòng nhập mã đã nhận được.",
        });

        setStep(2);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đủ các trường",
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Mật khẩu yếu",
        text2: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Mật khẩu nhập lại không khớp",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đặt lại mật khẩu thành công!",
        });

        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <LinearGradient
          pointerEvents="none"
          colors={[PRIMARY, "#15803D", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerOrbOne} />
        <View pointerEvents="none" style={styles.headerOrbTwo} />
        <View pointerEvents="none" style={styles.headerGlassLine} />

        <HeaderButton
          icon="arrow-back"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />

        <Text style={styles.headerTitle}>Quên mật khẩu</Text>

        <View style={{ width: 42 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.formCardShadow}>
            <BlurView {...blurProps} intensity={58} style={styles.formCard}>
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.95)",
                  "rgba(255,255,255,0.64)",
                  "rgba(255,255,255,0.34)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View pointerEvents="none" style={styles.cardTopLine} />
              <View pointerEvents="none" style={styles.cardGlow} />

              <View style={styles.stepIconBox}>
                <Ionicons
                  name={step === 1 ? "mail-outline" : "keypad-outline"}
                  size={32}
                  color={PRIMARY}
                />
              </View>

              {step === 1 ? (
                <>
                  <Text style={styles.instruction}>
                    Vui lòng nhập địa chỉ email đã đăng ký tài khoản. Chúng tôi
                    sẽ gửi mã OTP gồm 6 chữ số để đặt lại mật khẩu.
                  </Text>

                  <Text style={styles.label}>Email</Text>

                  <GlassInput
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Nhập email của bạn"
                    keyboardType="email-address"
                  />

                  <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.72 }]}
                    onPress={handleRequestOtp}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[PRIMARY, "#16A34A", "#4ADE80"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>Gửi mã OTP</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.instruction}>
                    Mã OTP đã được gửi đến email{" "}
                    <Text style={styles.instructionBold}>{email}</Text>. Vui
                    lòng kiểm tra hộp thư hoặc thư rác.
                  </Text>

                  <Text style={styles.label}>Mã OTP</Text>

                  <GlassInput
                    icon="keypad-outline"
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Nhập mã OTP 6 chữ số"
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <Text style={styles.label}>Mật khẩu mới</Text>

                  <GlassInput
                    icon="lock-closed-outline"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nhập mật khẩu mới"
                    secureTextEntry={!showNew}
                    showEye
                    eyeActive={showNew}
                    onEyePress={() => setShowNew(!showNew)}
                  />

                  <Text style={styles.label}>Nhập lại mật khẩu mới</Text>

                  <GlassInput
                    icon="lock-closed-outline"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Xác nhận mật khẩu mới"
                    secureTextEntry={!showConfirm}
                    showEye
                    eyeActive={showConfirm}
                    onEyePress={() => setShowConfirm(!showConfirm)}
                  />

                  <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.72 }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[PRIMARY, "#16A34A", "#4ADE80"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>Đặt lại mật khẩu</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleRequestOtp}
                    disabled={loading}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.resendText}>Gửi lại mã OTP</Text>
                  </TouchableOpacity>
                </>
              )}
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const glassShadow = {
  ...Platform.select({
    ios: {
      shadowColor: "#123816",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.13,
      shadowRadius: 22,
    },
    android: {
      elevation: 5,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  keyboardRoot: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === "ios" ? 55 : 36,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerOrbOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -70,
    right: -45,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  headerOrbTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    bottom: -70,
    left: -38,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  headerGlassLine: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 30,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.34)",
  },

  headerButtonShadow: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  headerButton: {
    flex: 1,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  headerButtonTopLine: {
    position: "absolute",
    top: 1,
    left: 9,
    right: 9,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
  },

  content: {
    flex: 1,
    padding: 16,
  },

  formCardShadow: {
    borderRadius: 28,
    ...glassShadow,
  },

  formCard: {
    padding: 20,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.84)"
        : "rgba(255,255,255,0.36)",
  },

  cardTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  cardGlow: {
    position: "absolute",
    top: 12,
    left: 14,
    width: 62,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
    transform: [{ rotate: "-18deg" }],
  },

  stepIconBox: {
    width: 70,
    height: 70,
    borderRadius: 26,
    backgroundColor: "rgba(27,94,32,0.08)",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
  },

  instruction: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 20,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
  },

  instructionBold: {
    fontWeight: "900",
    color: "#1F2937",
  },

  label: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
    fontWeight: "800",
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputWrapper: {
    minHeight: 54,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.84)"
        : "rgba(255,255,255,0.34)",
  },

  inputIcon: {
    marginLeft: 14,
    marginRight: 8,
  },

  input: {
    flex: 1,
    minHeight: 54,
    paddingVertical: 0,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "700",
  },

  eyeIcon: {
    width: 46,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },

  saveBtn: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
  },

  saveGradient: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },

  resendBtn: {
    alignItems: "center",
    marginTop: 16,
  },

  resendText: {
    color: PRIMARY,
    fontWeight: "800",
  },
});
