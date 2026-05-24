import React, { useEffect, useState } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import { loginUser } from "../services/authService";
import { useUser } from "../context/UserContext";
import { useQueue } from "../context/QueueContext";
import { COLORS } from "../constants/colors";
import { checkNetworkConnection } from "../utils/networkUtils";
import { getRoleKey } from "../utils/roleUtils";
import styles from "../styles/LoginStyles";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, login } = useUser();
  const { clearQueue } = useQueue();

  useEffect(() => {
    if (user?.isAuthenticated) {
      const roleKey = getRoleKey(user);
      let targetRoute = "Home";

      if (roleKey === "shipper") targetRoute = "TaskList";
      else if (roleKey === "accountant") targetRoute = "AccountantMenu";
      else if (roleKey === "warehouse" || roleKey === "hub_manager") {
        targetRoute = "WarehouseMenu";
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetRoute }],
        }),
      );
    }
  }, [user?.isAuthenticated, navigation]);

  const handleLogin = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối mạng",
        text2: "Vui lòng kiểm tra lại kết nối mạng và thử lại!",
      });
      return;
    }

    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập đầy đủ tài khoản và mật khẩu!",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(username, password);
      console.log("Login result:", result);
      if (result.success) {
        clearQueue();
        login(result.data);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi đăng nhập",
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ImageBackground
        source={require("../../assets/DongSon2.png")}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageOverlay}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topSpacer} />

            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/CompanyLogo4.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.loginTitle}>Đăng nhập hệ thống</Text>

              <CustomInput
                label="Tài khoản"
                value={username}
                onChangeText={setUsername}
                placeholder="Tên đăng nhập"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={({ color }) => (
                  <Ionicons
                    name="person"
                    size={styles.iconSize.fontSize}
                    color={color || COLORS.primary}
                  />
                )}
              />

              <View style={styles.inputGap} />

              <CustomInput
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                placeholder="Mật khẩu"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                leftIcon={({ color }) => (
                  <Ionicons
                    name="lock-closed"
                    size={styles.iconSize.fontSize}
                    color={color || COLORS.primary}
                  />
                )}
                rightIcon={({ color }) => (
                  <Pressable
                    hitSlop={styles.eyeHitSlop.hitSlop}
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={styles.eyeIconSize.fontSize}
                      color={color || COLORS.textMuted}
                    />
                  </Pressable>
                )}
              />

              <View style={styles.buttonGap} />

              <CustomButton
                title="ĐĂNG NHẬP"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
              />
            </View>

            <View style={styles.flexGrow} />

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
      </ImageBackground>
    </SafeAreaView>
  );
}
