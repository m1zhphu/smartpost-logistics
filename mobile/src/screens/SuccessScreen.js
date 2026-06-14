import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { useQueue } from "../context/QueueContext";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import styles from "../styles/SuccessScreenStyles";

const PRIMARY = COLORS.primary || "#1B5E20";
const { width } = Dimensions.get("window");

export default function SuccessScreen({ navigation, route }) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  const { removeQueueItem } = useQueue();

  const {
    trackingNumber,
    returnScreen = "Home", // Mặc định quay về Home
    hideDetailButton = false, // Mặc định nút Xem chi tiết vẫn hiện
  } = route.params || {};

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

    navigation.setOptions({
      gestureEnabled: false,
    });

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK") {
        e.preventDefault();
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: returnScreen }],
          }),
        );
      }
    });

    return unsubscribe;
  }, [navigation, returnScreen]);

  const handleViewDetails = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      return;
    }
    navigation.navigate("OrderDetail", { trackingNumber });
  };

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: returnScreen }],
      }),
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.card,
          { opacity: opacityValue, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <Animated.View
            style={[styles.circleBg, { transform: [{ scale: scaleValue }] }]}
          >
            <Ionicons name="checkmark" size={48} color="white" />
          </Animated.View>
        </View>

        <Text style={styles.title}>Thành công!</Text>
        <Text style={styles.subtitle}>
          Đơn hàng đã được khởi tạo trên hệ thống.
        </Text>

        <View style={styles.ticketContainer}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketLabel}>MÃ VẬN ĐƠN</Text>
          </View>
          <View style={styles.ticketBody}>
            <Text style={styles.trackingCode}>{trackingNumber || "---"}</Text>
          </View>
          <View style={styles.dashedLine} />
          <View style={styles.ticketFooter}>
            <Ionicons name="cube-outline" size={16} color="#64748B" />
            <Text style={styles.ticketFooterText}>Sẵn sàng giao/nhận hàng</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          {!hideDetailButton && (
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={handleViewDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.btnOutlineText}>Xem chi tiết</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={goHome}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>VỀ TRANG CHỦ</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#ffffff"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// styles moved to ../styles/SuccessScreenStyles
