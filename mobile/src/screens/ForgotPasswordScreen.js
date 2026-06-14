import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import styles from "../styles/ForgotPasswordScreenStyles";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import {
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
} from "../services/authService";

const PRIMARY = COLORS.primary || "#1B5E20";

const HeaderButton = ({ icon, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={styles.headerButton}
    activeOpacity={0.7}
  >
    <View style={styles.headerButtonInner}>
      <Ionicons name={icon} size={20} color={COLORS.white} />
    </View>
  </TouchableOpacity>
);

const Input = ({
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
    <View style={styles.inputWrapper}>
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
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCapitalize="none"
        underlineColorAndroid="transparent"
      />

      {showEye && (
        <TouchableOpacity
          onPress={onEyePress}
          style={styles.eyeIcon}
          activeOpacity={0.7}
        >
          <Ionicons
            name={eyeActive ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={PRIMARY}
          />
        </TouchableOpacity>
      )}
    </View>
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

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton
          icon="arrow-back"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quên mật khẩu</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.formCard}>
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
                  Vui lòng nhập địa chỉ email đã đăng ký tài khoản. Chúng tôi sẽ
                  gửi mã OTP gồm 6 chữ số để đặt lại mật khẩu.
                </Text>

                <Text style={styles.label}>Email</Text>

                <Input
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Nhập email của bạn"
                  keyboardType="email-address"
                />

                <TouchableOpacity
                  style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRequestOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Gửi mã OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.instruction}>
                  Mã OTP đã được gửi đến email{" "}
                  <Text style={styles.instructionBold}>{email}</Text>. Vui lòng
                  kiểm tra hộp thư hoặc thư rác.
                </Text>

                <Text style={styles.label}>Mã OTP</Text>

                <Input
                  icon="keypad-outline"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Nhập mã OTP 6 chữ số"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <Text style={styles.label}>Mật khẩu mới</Text>

                <Input
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

                <Input
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
                  style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>Đặt lại mật khẩu</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleRequestOtp}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>Gửi lại mã OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// STYLES CHUẨN DNA
// styles moved to ../styles/ForgotPasswordScreenStyles
