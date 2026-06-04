import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import styles from "../styles/SuccessStyles";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import CustomButton from "../components/CustomButton";

export default function SuccessScreen({ navigation, route }) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  const { trackingNumber } = route.params || {};

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.setOptions({ gestureEnabled: false });

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK") {
        e.preventDefault();
        navigation.navigate("Home");
      }
    });

    return unsubscribe;
  }, [navigation, opacityValue, scaleValue, translateY]);

  const handleViewDetails = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;
    navigation.navigate("OrderDetail", { trackingNumber });
  };

  const goHome = () => {
    navigation.navigate("Home");
  };

  const createNew = () => {
    navigation.navigate("CreateWaybill");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.backgroundSoft}
      />

      <View style={styles.iconContainer}>
        <Animated.View
          style={[styles.circleBg, { transform: [{ scale: scaleValue }] }]}
        >
          <Ionicons name="checkmark" size={72} color={COLORS.successAccent} />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.contentBox,
          { opacity: opacityValue, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.title}>Thành công</Text>
        <Text style={styles.subtitle}>
          Đơn hàng đã được khởi tạo trên hệ thống và sẵn sàng xử lý tiếp theo.
        </Text>

        <View style={styles.ticketContainer}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketLabel}>Mã vận đơn</Text>
          </View>
          <View style={styles.ticketBody}>
            <Text style={styles.trackingCode}>{trackingNumber || "---"}</Text>
          </View>
          <View style={styles.ticketFooter}>
            <Ionicons name="cube-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.ticketFooterText}>Sẵn sàng giao hàng</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <CustomButton
            title="Về trang chủ"
            variant="primary"
            onPress={goHome}
            style={styles.btnPrimary}
          />
          <CustomButton
            title="Tạo đơn mới"
            variant="outline"
            onPress={createNew}
            style={styles.btnOutline}
          />
          <CustomButton
            title="Xem chi tiết"
            variant="outline"
            onPress={handleViewDetails}
            style={styles.btnOutline}
          />
        </View>
      </Animated.View>
      <Toast />
    </View>
  );
}
