import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ImageBackground,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { requestRegisterOTP, verifyRegisterOTP } from "../services/authService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { checkNetworkConnection } from "../utils/networkUtils";
import styles from "../styles/LoginScreenStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = COLORS.primaryColorAuth || "#1B5E20";

const USER_TYPES = [
  {
    key: "employee",
    label: "Kho",
  },
  {
    key: "admin",
    label: "Nội bộ",
  },
  {
    key: "customer",
    label: "Khách hàng",
  },
];

const Input = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  maxLength,
  showEye,
  multiline = false,
  numberOfLines = 1,
  returnKeyType = "done",
  showPassword,
  onToggleEye,
}) => (
  <View style={styles.inputWrapper}>
    <Ionicons
      name={icon}
      size={20}
      color={PRIMARY}
      style={styles.icon}
    />

    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? "top" : "center"}
      returnKeyType={returnKeyType}
      blurOnSubmit={!multiline}
      keyboardAppearance="light"
      underlineColorAndroid="transparent"
    />

    {showEye && (
      <TouchableOpacity
        onPress={onToggleEye}
        style={styles.eyeIcon}
        activeOpacity={0.72}
      >
        <Ionicons
          name={showPassword ? "eye-outline" : "eye-off-outline"}
          size={20}
          color={PRIMARY}
        />
      </TouchableOpacity>
    )}
  </View>
);

const SolidButton = ({ title, onPress, disabled, loading }) => (
  <TouchableOpacity
    style={[styles.loginBtn, styles.primaryButton]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.88}
  >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
  </TouchableOpacity>
);

const Toggle = ({ userType, onChangeUserType }) => (
  <View style={styles.toggleContainer}>
    {USER_TYPES.map((item) => {
      const active = userType === item.key;

      return (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.toggleButton,
            active && styles.toggleButtonActive,
          ]}
          onPress={() => onChangeUserType(item.key)}
          activeOpacity={0.86}
        >
          <Text
            style={[
              styles.toggleText,
              active && styles.toggleTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState("employee");
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

  const { loginUserAndFetchProfile, isWarehouseStaff, autoLogin } = useUser();

  useEffect(() => {
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
                if (!latestPermissions.includes(p.code)) {
                  latestPermissions.push(p.code);
                }
              });
            });

            const hasWarehousePerms = isWarehouseStaff(latestPermissions);

            if (result.userType === "customer") {
              nextScreen = "CustomerHome";
            } else if (result.userType === "admin") {
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
            if (!latestPermissions.includes(p.code)) {
              latestPermissions.push(p.code);
            }
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
        }),
      );
    } catch (error) {
      console.error("Login error:", error);

      let errorMsg = "Sai tài khoản hoặc mật khẩu";

      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = "Sai tài khoản hoặc mật khẩu (401)";
        } else if (error.response.status === 502) {
          errorMsg =
            "Hệ thống đang bảo trì hoặc lỗi kết nối (502). Vui lòng thử lại sau.";
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
        address: undefined,
      };

      await verifyRegisterOTP(payload);

      Toast.show({
        type: "success",
        text1: "Đăng ký thành công",
        text2: "Hệ thống sẽ tự động đăng nhập",
      });

      setShowOtpModal(false);

      await loginUserAndFetchProfile(regUsername, regPassword, "customer");

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

  const handleChangeUserType = (type) => {
    setUserType(type);

    if (type !== "customer") {
      setIsRegistering(false);
    }
  };

  const renderLoginForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.loginTitle}>
        {userType === "employee"
          ? "Đăng nhập Kho"
          : userType === "admin"
            ? "Đăng nhập Nội bộ"
            : "Đăng nhập Khách hàng"}
      </Text>

      <Input
        icon="person-outline"
        placeholder="Tài khoản"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        returnKeyType="next"
      />

      <Input
        icon="lock-closed-outline"
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        showEye
        showPassword={showPassword}
        onToggleEye={() => setShowPassword(!showPassword)}
      />

      {userType === "customer" && (
        <TouchableOpacity
          style={{ alignSelf: "flex-end", marginTop: 10, marginBottom: 20 }}
          onPress={() => navigation.navigate("ForgotPassword")}
          activeOpacity={0.75}
        >
          <Text style={{ color: COLORS.primaryColorAuth, fontWeight: "700" }}>
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>
      )}

      <SolidButton
        title="ĐĂNG NHẬP"
        onPress={handleLogin}
        disabled={loading}
        loading={loading}
      />

      {userType === "customer" && (
        <View style={styles.registerRow}>
          <Text style={styles.registerTextNormal}>Chưa có tài khoản? </Text>
          <TouchableOpacity
            onPress={() => setIsRegistering(true)}
            style={{ flexDirection: "row", alignItems: "center" }}
            activeOpacity={0.75}
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

      <Input
        icon="person-outline"
        placeholder="Tên đăng nhập"
        value={regUsername}
        onChangeText={setRegUsername}
        autoCapitalize="none"
        returnKeyType="next"
      />

      <Input
        icon="lock-closed-outline"
        placeholder="Mật khẩu (ít nhất 6 ký tự)"
        value={regPassword}
        onChangeText={setRegPassword}
        secureTextEntry={!showPassword}
        showEye
        showPassword={showPassword}
        onToggleEye={() => setShowPassword(!showPassword)}
      />

      <Input
        icon="lock-closed-outline"
        placeholder="Nhập lại mật khẩu"
        value={regConfirmPassword}
        onChangeText={setRegConfirmPassword}
        secureTextEntry={!showPassword}
        showEye
        showPassword={showPassword}
        onToggleEye={() => setShowPassword(!showPassword)}
      />

      <Input
        icon="person-circle-outline"
        placeholder="Họ và tên"
        value={regFullName}
        onChangeText={setRegFullName}
        returnKeyType="next"
      />

      <Input
        icon="mail-outline"
        placeholder="Email"
        value={regEmail}
        onChangeText={setRegEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />

      <Input
        icon="call-outline"
        placeholder="Số điện thoại"
        value={regPhone}
        onChangeText={setRegPhone}
        keyboardType="phone-pad"
      />

      <SolidButton
        title="TIẾP TỤC"
        onPress={handleRegisterRequest}
        disabled={loading}
        loading={loading}
      />

      <View style={styles.registerRow}>
        <Text style={styles.registerTextNormal}>Đã có tài khoản? </Text>
        <TouchableOpacity
          onPress={() => setIsRegistering(false)}
          style={{ flexDirection: "row", alignItems: "center" }}
          activeOpacity={0.75}
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
    <View style={styles.backgroundImage}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          enableResetScrollToCoords={false}
          extraHeight={Platform.OS === "ios" ? 150 : 80}
          extraScrollHeight={Platform.OS === "ios" ? 150 : 80}
          keyboardOpeningTime={0}
          style={styles.container}
        >
          <View style={styles.topSpacer} />

          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/CompanyLogo4.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Toggle userType={userType} onChangeUserType={handleChangeUserType} />

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
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAwareScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid={true}
              enableAutomaticScroll={true}
              extraHeight={Platform.OS === "ios" ? 120 : 40}
              extraScrollHeight={Platform.OS === "ios" ? 120 : 40}
              keyboardOpeningTime={0}
              style={styles.modalKeyboardWrap}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Xác thực OTP</Text>
                <Text style={styles.modalSubtitle}>
                  Mã OTP đã được gửi đến email {regEmail}
                </Text>

                  <TextInput
                    style={styles.otpInput}
                    placeholder="--- ---"
                    placeholderTextColor="#CBD5E1"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    multiline={false}
                    numberOfLines={1}
                    textAlignVertical="center"
                    keyboardAppearance="light"
                    underlineColorAndroid="transparent"
                />

                <View style={styles.modalBtnContainer}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => setShowOtpModal(false)}
                    disabled={loading}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.modalCancelText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalSubmitBtn]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalSubmitText}>
                          Xác thực
                        </Text>
                      )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


