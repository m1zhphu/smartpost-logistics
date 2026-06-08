import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import {
  loginUser,
  requestRegisterOTP,
  verifyRegisterOTP,
} from "../services/authService";
import { useUser } from "../context/UserContext";
import { useQueue } from "../context/QueueContext";
import { COLORS } from "../constants/colors";
import { checkNetworkConnection } from "../utils/networkUtils";
import styles from "../styles/LoginStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState("employee"); // 'employee' or 'customer'
  const [isRegistering, setIsRegistering] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // States for registration
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { login } = useUser();
  const { clearQueue } = useQueue();

  const { loginUserAndFetchProfile, isWarehouseStaff, autoLogin } = useUser();

  React.useEffect(() => {
    const attemptAutoLogin = async () => {
      setLoading(true);
      try {
        const result = await autoLogin();
        if (result && result.success) {
          const tutorialDone = await AsyncStorage.getItem("tutorial_done");
          const isTutorialCompleted = tutorialDone === "true";

          let nextScreen = "Tutorial";

          if (isTutorialCompleted) {
            const userRoles = result.profileData.roles || [];
            const latestPermissions = [];
            userRoles.forEach((role) => {
              (role.permissions || []).forEach((p) => {
                if (!latestPermissions.includes(p.code))
                  latestPermissions.push(p.code);
              });
            });

            const hasWarehousePerms = isWarehouseStaff(latestPermissions);

            if (result.userType === "customer") {
              nextScreen = "CustomerHome";
            } else if (result.userType === "admin") {
              nextScreen = "ShipperPickupList";
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
            }),
          );
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    attemptAutoLogin();
  }, []);

  const handleLogin = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập đủ!",
      });
      return;
    }

    setLoading(true);
    try {
      // Lấy dữ liệu profile nóng hổi từ API
      const result = await loginUserAndFetchProfile(
        username,
        password,
        userType,
      );

      const tutorialDone = await AsyncStorage.getItem("tutorial_done");
      const isTutorialCompleted = tutorialDone === "true";

      let nextScreen = "Tutorial";

      if (isTutorialCompleted) {
        const userRoles = result.profileData.roles || [];
        const latestPermissions = [];
        userRoles.forEach((role) => {
          (role.permissions || []).forEach((p) => {
            if (!latestPermissions.includes(p.code))
              latestPermissions.push(p.code);
          });
        });

        const hasWarehousePerms = isWarehouseStaff(latestPermissions);

        // Ưu tiên: Customer -> Vào CustomerHome. Có quyền Kho -> Vào Kho trước. Chỉ là Shipper -> Vào Shipper.
        if (userType === "customer") {
          nextScreen = "CustomerHome";
        } else if (userType === "admin") {
          nextScreen = "ShipperPickupList";
        } else if (hasWarehousePerms) {
          nextScreen = "WarehouseHome";
        } else {
          nextScreen = "Home"; // Home là màn hình quét Camera của Shipper
        }
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: nextScreen }],
        }),
      );
    } catch (error) {
      console.error("Login error:", error);
      let errorMsg = "Sai tài khoản hoặc mật khẩu";
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = "Sai tài khoản hoặc mật khẩu (401)";
        } else if (error.response.status === 502) {
          errorMsg = "Hệ thống đang bảo trì hoặc lỗi kết nối (502). Vui lòng thử lại sau.";
        } else {
          errorMsg = `Lỗi kết nối (${error.response.status})`;
        }
      }
      Toast.show({
        type: "error",
        text1: "Lỗi đăng nhập",
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRequest = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    if (
      !regEmail ||
      !regUsername ||
      !regPassword ||
      !regConfirmPassword ||
      !regFullName ||
      !regPhone
    ) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đủ các trường!",
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Toast.show({
        type: "error",
        text1: "Lỗi mật khẩu",
        text2: "Mật khẩu nhập lại không khớp!",
      });
      return;
    }

    setLoading(true);
    try {
      await requestRegisterOTP(regEmail);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã gửi mã OTP tới email của bạn",
      });
      setShowOtpModal(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể gửi OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    if (!otpCode) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập mã OTP!",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: regUsername,
        password: regPassword,
        full_name: regFullName,
        email: regEmail,
        otp: otpCode,
        phone_number: regPhone || undefined,
        address: undefined
      };
      await verifyRegisterOTP(payload);
      Toast.show({
        type: "success",
        text1: "Đăng ký thành công",
        text2: "Hệ thống sẽ tự động đăng nhập",
      });
      setShowOtpModal(false);

      // Login with new account
      const result = await loginUserAndFetchProfile(
        regUsername,
        regPassword,
        "customer",
      );

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "CustomerHome" }],
        }),
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi xác thực",
        text2: error.message || "Mã OTP không đúng",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.loginTitle}>Đăng nhập</Text>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="person-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
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
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={COLORS.primaryColorAuth}
          />
        </TouchableOpacity>
      </View>

      {userType === 'customer' && (
        <TouchableOpacity 
          style={{ alignSelf: 'flex-end', marginTop: 10, marginBottom: 20 }}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={{ color: COLORS.primaryColorAuth, fontWeight: '600' }}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        <LinearGradient
          colors={["#1b5e20", "#43a047"]}
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
            onPress={() => setIsRegistering(true)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={styles.registerTextBold}>Đăng ký ngay</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.primaryColorAuth}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.loginTitle}>Đăng ký Khách hàng</Text>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="person-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Tên đăng nhập"
          placeholderTextColor="#999"
          value={regUsername}
          onChangeText={setRegUsername}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#999"
          value={regPassword}
          onChangeText={setRegPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={COLORS.primaryColorAuth}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Nhập lại mật khẩu"
          placeholderTextColor="#999"
          value={regConfirmPassword}
          onChangeText={setRegConfirmPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={COLORS.primaryColorAuth}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="person-circle-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Họ và tên"
          placeholderTextColor="#999"
          value={regFullName}
          onChangeText={setRegFullName}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="mail-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={regEmail}
          onChangeText={setRegEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputWrapper}>
        <Ionicons
          name="call-outline"
          size={20}
          color={COLORS.primaryColorAuth}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          placeholderTextColor="#999"
          value={regPhone}
          onChangeText={setRegPhone}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleRegisterRequest}
        disabled={loading}
      >
        <LinearGradient
          colors={["#1b5e20", "#43a047"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginText}>ĐĂNG KÝ</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={styles.registerTextNormal}>Đã có tài khoản? </Text>
        <TouchableOpacity
          onPress={() => setIsRegistering(false)}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text style={styles.registerTextBold}>Đăng nhập</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.primaryColorAuth}
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../assets/DongSon2.png")}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.08, resizeMode: "cover" }}
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/CompanyLogo4.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                userType === "employee" && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setUserType("employee");
                setIsRegistering(false);
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  userType === "employee" && styles.toggleTextActive,
                ]}
              >
                Nhân viên
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                userType === "admin" && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setUserType("admin");
                setIsRegistering(false);
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  userType === "admin" && styles.toggleTextActive,
                ]}
              >
                Nội bộ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                userType === "customer" && styles.toggleButtonActive,
              ]}
              onPress={() => setUserType("customer")}
            >
              <Text
                style={[
                  styles.toggleText,
                  userType === "customer" && styles.toggleTextActive,
                ]}
              >
                Khách hàng
              </Text>
            </TouchableOpacity>
          </View>

          {isRegistering && userType === "customer"
            ? renderRegisterForm()
            : renderLoginForm()}

          <View style={{ flex: 1 }} />

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

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác thực OTP</Text>
            <Text style={styles.modalSubtitle}>
              Mã OTP đã được gửi đến email {regEmail}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="--- ---"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.modalBtnContainer}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowOtpModal(false)}
                disabled={loading}
              >
                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Xác thực</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
}
