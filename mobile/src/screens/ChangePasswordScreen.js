import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiClient } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { CUSTOMER_ENDPOINTS } from "../constants/customerEndpoints";
import { WAREHOUSE_ENDPOINTS } from "../constants/warehouseEndpoints";
import styles from "../styles/ChangePasswordScreenStyles";

export default function ChangePasswordScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [userType, setUserType] = useState("customer");

  useEffect(() => {
    const fetchUserType = async () => {
      const storedUserType = await AsyncStorage.getItem("user_type");

      if (storedUserType) {
        setUserType(storedUserType);
      }
    };

    fetchUserType();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
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
      const url =
        userType === "customer"
          ? CUSTOMER_ENDPOINTS.CHANGE_PASSWORD
          : WAREHOUSE_ENDPOINTS.CHANGE_PASSWORD;

      const response = await apiClient.post(url, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đổi mật khẩu thành công!",
        });

        navigation.goBack();
      }
    } catch (error) {
      console.error("Change password error:", error);

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error?.response?.data?.detail || "Không thể đổi mật khẩu",
      });
    } finally {
      setLoading(false);
    }
  };

  const HeaderButton = ({ icon, onPress, disabled }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerBtn}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Ionicons name={icon} size={20} color={COLORS.white} />
    </TouchableOpacity>
  );

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    visible,
    onToggleVisible,
  }) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={!visible}
          keyboardAppearance="light"
          underlineColorAndroid="transparent"
        />

        <TouchableOpacity
          onPress={onToggleVisible}
          style={styles.eyeIcon}
          activeOpacity={0.7}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <HeaderButton
          icon="arrow-back-outline"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
          <Text style={styles.headerSubTitle}>
            Cập nhật mật khẩu bảo mật tài khoản
          </Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardIconBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color="#1B5E20"
            />
          </View>

          <Text style={styles.cardTitle}>Bảo mật tài khoản</Text>
          <Text style={styles.cardDesc}>
            Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để tiếp tục.
          </Text>

          <PasswordInput
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            visible={showCurrent}
            onToggleVisible={() => setShowCurrent(!showCurrent)}
          />

          <PasswordInput
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nhập mật khẩu mới"
            visible={showNew}
            onToggleVisible={() => setShowNew(!showNew)}
          />

          <PasswordInput
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Xác nhận mật khẩu mới"
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm(!showConfirm)}
          />

          <View style={styles.noteBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#64748B"
            />
            <Text style={styles.noteText}>
              Mật khẩu mới nên có ít nhất 6 ký tự để đảm bảo an toàn.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
