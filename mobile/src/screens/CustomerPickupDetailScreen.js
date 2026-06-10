import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { COLORS } from "../constants/colors";
import { getCustomerPickupDetail } from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
  getPickupStatusColor,
  getPickupStatusLabel,
  getPriceStatusLabel,
  getWaybillStatusLabel,
  hasFinalPrice,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default function CustomerPickupDetailScreen({ route, navigation }) {
  const { waybillCode } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const blurProps = {
    intensity: Platform.OS === "ios" ? 66 : 40,
    tint: "light",
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    setLoading(true);

    const result = await getCustomerPickupDetail(waybillCode);

    if (result.success) {
      setDetail(result.data);
    }

    setLoading(false);
  };

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
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

        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </BlurView>
    </TouchableOpacity>
  );

  const GlassCard = ({ children }) => (
    <View style={styles.cardShadow}>
      <BlurView {...blurProps} intensity={56} style={styles.card}>
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

        {children}
      </BlurView>
    </View>
  );

  const Row = ({ label, value, bold, color }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>

      <Text
        style={[bold ? styles.valueBold : styles.value, color && { color }]}
      >
        {value}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />

        <View style={styles.emptyIconBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>

        <Text style={styles.errorText}>Không thể tải chi tiết đơn hàng.</Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showFinal = hasFinalPrice(
    detail.price_status,
    detail.final_total_amount,
  );

  const priceDiff =
    (detail.final_total_amount || 0) - (detail.estimated_total_amount || 0);

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

        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết {waybillCode}
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard>
          <Text style={styles.sectionTitle}>THÔNG TIN CHUNG</Text>

          <Row label="Mã yêu cầu:" value={detail.request_code} />
          <Row label="Mã vận đơn:" value={detail.waybill_code} bold />
          <Row label="Ngày tạo:" value={formatDateTime(detail.created_at)} />
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>TRẠNG THÁI</Text>

          <Row
            label="Trạng thái lấy hàng:"
            value={getPickupStatusLabel(detail.pickup_status)}
            bold
            color={getPickupStatusColor(detail.pickup_status)}
          />

          <Row
            label="Trạng thái vận đơn:"
            value={getWaybillStatusLabel(detail.waybill_status)}
          />

          <Row
            label="Văn phòng nhận:"
            value={detail.office_status || "Đang xử lý"}
          />

          <Row
            label="Bưu tá:"
            value={detail.assigned_shipper_name || "Chưa phân công"}
          />
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>CƯỚC PHÍ</Text>

          <Row
            label="Trạng thái giá:"
            value={getPriceStatusLabel(detail.price_status)}
          />

          <Row
            label="Cước dự kiến:"
            value={formatCurrency(detail.estimated_total_amount)}
          />

          {showFinal ? (
            <>
              <Row
                label="Cước thật:"
                value={formatCurrency(detail.final_total_amount)}
                bold
                color="#059669"
              />

              <Row
                label="Chênh lệch:"
                value={`${priceDiff > 0 ? "+" : ""}${formatCurrency(priceDiff)}`}
                bold
                color={
                  priceDiff > 0
                    ? "#D97706"
                    : priceDiff < 0
                      ? "#059669"
                      : PRIMARY
                }
              />
            </>
          ) : (
            <View style={styles.hintBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#64748B"
                style={{ marginRight: 8 }}
              />

              <Text style={styles.hintText}>
                Đơn hàng chưa có cước thật. Hệ thống sẽ cập nhật sau khi nhập
                kho và cân lại.
              </Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>
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

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    height: 96,
    paddingTop: Platform.OS === "ios" ? 46 : 36,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
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
    top: Platform.OS === "ios" ? 42 : 30,
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

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
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
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
  },

  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },

  errorText: {
    color: "#EF4444",
    fontSize: 16,
    marginBottom: 20,
    fontWeight: "800",
  },

  backBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 18,
  },

  backBtnText: {
    color: "white",
    fontWeight: "900",
  },

  cardShadow: {
    borderRadius: 24,
    marginBottom: 15,
    ...glassShadow,
  },

  card: {
    borderRadius: 24,
    padding: 15,
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

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: SECONDARY,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.18)",
    paddingBottom: 7,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  label: {
    color: "#64748B",
    fontSize: 15,
    flex: 1,
    fontWeight: "700",
  },

  value: {
    color: "#1E293B",
    fontSize: 15,
    flex: 1,
    textAlign: "right",
    fontWeight: "700",
  },

  valueBold: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(241,245,249,0.72)",
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
  },

  hintText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    fontWeight: "700",
  },
});
