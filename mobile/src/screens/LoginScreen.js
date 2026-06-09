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
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";
import { requestRegisterOTP, verifyRegisterOTP } from "../services/authService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { checkNetworkConnection } from "../utils/networkUtils";
import styles from "../styles/LoginStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = COLORS.primaryColorAuth || "#1b5e20";

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

const blurProps = {
  intensity: Platform.OS === "ios" ? 62 : 38,
  tint: "light",
  blurReductionFactor: Platform.OS === "android" ? 3 : undefined,
};

const GlassInput = ({
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
  <View
    style={[
      glassStyles.inputShadow,
      multiline && glassStyles.inputShadowMultiline,
    ]}
  >
    <BlurView
      {...blurProps}
      intensity={Platform.OS === "ios" ? 58 : 34}
      style={[
        glassStyles.inputWrapper,
        multiline && glassStyles.inputWrapperMultiline,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.88)",
          "rgba(255,255,255,0.46)",
          "rgba(255,255,255,0.24)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={glassStyles.inputTopLine} />
      <View pointerEvents="none" style={glassStyles.inputBottomGlow} />

      <Ionicons
        name={icon}
        size={20}
        color={PRIMARY}
        style={[glassStyles.icon, multiline && glassStyles.iconMultiline]}
      />

      <TextInput
        style={[glassStyles.input, multiline && glassStyles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="rgba(36,76,42,0.46)"
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
          style={glassStyles.eyeIcon}
          activeOpacity={0.72}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={PRIMARY}
          />
        </TouchableOpacity>
      )}
    </BlurView>
  </View>
);

const LiquidButton = ({ title, onPress, disabled, loading }) => (
  <TouchableOpacity
    style={[styles.loginBtn, glassStyles.primaryButtonWrap]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.88}
  >
    <LinearGradient
      colors={[
        "rgba(27,94,32,0.98)",
        "rgba(67,160,71,0.95)",
        "rgba(129,199,132,0.9)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={glassStyles.primaryButton}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.5)",
          "rgba(255,255,255,0.12)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={glassStyles.buttonGloss}
      />

      <View pointerEvents="none" style={glassStyles.buttonInnerLine} />

      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={glassStyles.primaryButtonText}>{title}</Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const LiquidToggle = ({ userType, onChangeUserType }) => (
  <View style={glassStyles.toggleShadowWrap}>
    <BlurView
      {...blurProps}
      intensity={Platform.OS === "ios" ? 68 : 42}
      style={glassStyles.toggleContainer}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.82)",
          "rgba(255,255,255,0.42)",
          "rgba(255,255,255,0.2)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={glassStyles.toggleTopLine} />
      <View pointerEvents="none" style={glassStyles.toggleBottomGlow} />

      {USER_TYPES.map((item) => {
        const active = userType === item.key;

        return (
          <TouchableOpacity
            key={item.key}
            style={[
              glassStyles.toggleButton,
              active && glassStyles.toggleButtonActive,
            ]}
            onPress={() => onChangeUserType(item.key)}
            activeOpacity={0.86}
          >
            <View style={[StyleSheet.absoluteFill, { opacity: active ? 1 : 0 }]} pointerEvents="none">
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.98)",
                  "rgba(236,255,239,0.8)",
                  "rgba(180,238,187,0.58)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.96)",
                  "rgba(255,255,255,0.2)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0.08, y: 0 }}
                end={{ x: 0.88, y: 1 }}
                style={glassStyles.toggleActiveGloss}
              />
            </View>

            <Text
              style={[
                glassStyles.toggleText,
                active && glassStyles.toggleTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
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

      <GlassInput
        icon="person-outline"
        placeholder="Tài khoản"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        returnKeyType="next"
      />

      <GlassInput
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
          <Text style={{ color: COLORS.primaryColorAuth, fontWeight: "600" }}>
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>
      )}

      <LiquidButton
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

      <GlassInput
        icon="person-outline"
        placeholder="Tên đăng nhập"
        value={regUsername}
        onChangeText={setRegUsername}
        autoCapitalize="none"
        returnKeyType="next"
      />

      <GlassInput
        icon="lock-closed-outline"
        placeholder="Mật khẩu (ít nhất 6 ký tự)"
        value={regPassword}
        onChangeText={setRegPassword}
        secureTextEntry={!showPassword}
        showEye
        showPassword={showPassword}
        onToggleEye={() => setShowPassword(!showPassword)}
      />

      <GlassInput
        icon="lock-closed-outline"
        placeholder="Nhập lại mật khẩu"
        value={regConfirmPassword}
        onChangeText={setRegConfirmPassword}
        secureTextEntry={!showPassword}
        showEye
        showPassword={showPassword}
        onToggleEye={() => setShowPassword(!showPassword)}
      />

      <GlassInput
        icon="person-circle-outline"
        placeholder="Họ và tên"
        value={regFullName}
        onChangeText={setRegFullName}
        returnKeyType="next"
      />

      <GlassInput
        icon="mail-outline"
        placeholder="Email"
        value={regEmail}
        onChangeText={setRegEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />

      <GlassInput
        icon="call-outline"
        placeholder="Số điện thoại"
        value={regPhone}
        onChangeText={setRegPhone}
        keyboardType="phone-pad"
      />

      <LiquidButton
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
    <ImageBackground
      source={require("../../assets/DongSon2.png")}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.08, resizeMode: "cover" }}
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={glassStyles.keyboardAvoidingRoot}
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

          <LiquidToggle userType={userType} onChangeUserType={handleChangeUserType} />

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
          style={glassStyles.keyboardAvoidingRoot}
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

                <View style={glassStyles.otpInputShadow}>
                  <BlurView
                    {...blurProps}
                    intensity={Platform.OS === "ios" ? 56 : 34}
                    style={glassStyles.otpBlur}
                  >
                    <LinearGradient
                      pointerEvents="none"
                      colors={[
                        "rgba(255,255,255,0.88)",
                        "rgba(255,255,255,0.42)",
                        "rgba(255,255,255,0.22)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />

                    <TextInput
                      style={glassStyles.otpInput}
                      placeholder="--- ---"
                      placeholderTextColor="rgba(38,78,45,0.35)"
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
                  </BlurView>
                </View>

                <View style={styles.modalBtnContainer}>
                  <TouchableOpacity
                    style={[styles.modalBtn, glassStyles.modalCancelBtn]}
                    onPress={() => setShowOtpModal(false)}
                    disabled={loading}
                    activeOpacity={0.82}
                  >
                    <Text style={glassStyles.modalCancelText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, glassStyles.modalSubmitBtn]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(27,94,32,0.98)",
                        "rgba(67,160,71,0.95)",
                        "rgba(129,199,132,0.88)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={glassStyles.modalSubmitGradient}
                    >
                      <LinearGradient
                        pointerEvents="none"
                        colors={[
                          "rgba(255,255,255,0.46)",
                          "rgba(255,255,255,0.1)",
                          "rgba(255,255,255,0)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={glassStyles.modalSubmitGloss}
                      />

                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={glassStyles.modalSubmitText}>
                          Xác thực
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ImageBackground>
  );
}

const glassStyles = StyleSheet.create({
  keyboardAvoidingRoot: {
    flex: 1,
  },

  toggleShadowWrap: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",

    ...Platform.select({
      ios: {
        shadowColor: "#123816",
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      },
      android: {
        elevation: 8,
      },
    }),
  },

  toggleContainer: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.76)"
        : "rgba(255,255,255,0.28)",
  },

  toggleTopLine: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 1,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  toggleBottomGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 2,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(27,94,32,0.1)",
  },

  toggleButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },

  toggleButtonActive: {
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(255,255,255,0.68)",

    ...Platform.select({
      ios: {
        shadowColor: "#1B5E20",
        shadowOpacity: 0.22,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
      },
      android: {
        elevation: 4,
      },
    }),
  },

  toggleActiveGloss: {
    position: "absolute",
    top: 2,
    left: 8,
    right: 8,
    height: 18,
    borderRadius: 999,
  },

  toggleText: {
    color: "rgba(20,55,24,0.62)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.15,
  },

  toggleTextActive: {
    color: PRIMARY,
    fontWeight: "900",
  },

  inputShadow: {
    width: "100%",
    marginBottom: 14,
    borderRadius: 22,

    ...Platform.select({
      ios: {
        shadowColor: "#1B5E20",
        shadowOpacity: 0.12,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 3,
      },
    }),
  },

  inputShadowMultiline: {
    borderRadius: 24,
  },

  inputWrapper: {
    minHeight: 56,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.78)"
        : "rgba(255,255,255,0.3)",
  },

  inputWrapperMultiline: {
    minHeight: 96,
    alignItems: "flex-start",
    borderRadius: 24,
  },

  inputTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },

  inputBottomGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 1,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(27,94,32,0.08)",
  },

  icon: {
    marginLeft: 18,
    marginRight: 10,
  },

  iconMultiline: {
    marginTop: 18,
  },

  input: {
    flex: 1,
    height: 56,
    color: "#123816",
    fontSize: 15,
    fontWeight: "700",
    paddingRight: 12,
    paddingVertical: 0,
  },

  inputMultiline: {
    height: 96,
    paddingTop: 16,
    paddingBottom: 14,
    lineHeight: 21,
  },

  eyeIcon: {
    width: 46,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonWrap: {
    borderRadius: 24,
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: "#1B5E20",
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 7,
      },
    }),
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
  },

  buttonGloss: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 2,
    height: 24,
    borderRadius: 999,
  },

  buttonInnerLine: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 1,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.52)",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },

  otpInputShadow: {
    marginTop: 16,
    borderRadius: 22,
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: "#1B5E20",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 7 },
      },
      android: {
        elevation: 3,
      },
    }),
  },

  otpBlur: {
    height: 58,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.82)"
        : "rgba(255,255,255,0.62)",
  },

  otpInput: {
    height: 58,
    borderRadius: 22,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 8,
    color: "#123816",
    paddingVertical: 0,
  },

  modalCancelBtn: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",

    ...Platform.select({
      ios: {
        shadowColor: "#1B5E20",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
      android: {
        elevation: 2,
      },
    }),
  },

  modalCancelText: {
    color: "rgba(18,56,22,0.72)",
    fontWeight: "900",
  },

  modalSubmitBtn: {
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: "#1B5E20",
        shadowOpacity: 0.26,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 5,
      },
    }),
  },

  modalSubmitGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
  },

  modalSubmitGloss: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 2,
    height: 18,
    borderRadius: 999,
  },

  modalSubmitText: {
    color: "#ffffff",
    fontWeight: "900",
  },
});
