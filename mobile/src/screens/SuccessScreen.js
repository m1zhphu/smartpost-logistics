import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { useQueue } from "../context/QueueContext";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";

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

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Card Phẳng Chuẩn DNA
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  iconContainer: { marginBottom: 20, marginTop: -60 },
  circleBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#10B981", // Xanh lá báo thành công
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#FFFFFF",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  title: { fontSize: 24, fontWeight: "900", color: "#0F172A", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "600",
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  ticketContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  ticketHeader: { marginBottom: 8 },
  ticketLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ticketBody: { marginBottom: 16 },
  trackingCode: {
    fontSize: 22,
    fontWeight: "900",
    color: PRIMARY,
    letterSpacing: 1,
  },
  dashedLine: {
    width: "100%",
    height: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  ticketFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketFooterText: { fontSize: 13, color: "#64748B", fontWeight: "700" },

  buttonGroup: { width: "100%", gap: 12 },
  btnPrimary: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "white", fontWeight: "900", fontSize: 15 },
  btnOutline: {
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btnOutlineText: { color: "#475569", fontWeight: "800", fontSize: 15 },
});
