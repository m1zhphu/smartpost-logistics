import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { getCustomerPickupDetail } from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
  getOfficeStatusLabel,
  getPickupStatusColor,
  getPickupStatusLabel,
  getPriceStatusLabel,
  getWaybillStatusLabel,
  hasFinalPrice,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerPickupDetailScreen({ route, navigation }) {
  const { waybillCode } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

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
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
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
          activeOpacity={0.8}
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

      {/* HEADER CHUẨN FORM MỚI */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chi tiết {waybillCode}
          </Text>
        </View>
        {/* View ẩn để cân bằng header */}
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHUNG</Text>
          <Row label="Mã yêu cầu:" value={detail.request_code} />
          <Row
            label="Mã vận đơn:"
            value={detail.waybill_code}
            bold
            color={PRIMARY}
          />
          <Row label="Ngày tạo:" value={formatDateTime(detail.created_at)} />
        </View>

        <View style={styles.card}>
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
            value={getOfficeStatusLabel(detail.office_status)}
          />
          <Row
            label="Bưu tá:"
            value={detail.assigned_shipper_name || "Chưa phân công"}
          />
        </View>

        <View style={styles.card}>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },

  scrollContent: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Empty/Error State chuẩn
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#FEE2E2", // Đỏ nhạt cho lỗi
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  errorText: {
    color: "#0F172A",
    fontSize: 15,
    marginBottom: 20,
    fontWeight: "700",
  },
  backBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { color: "white", fontWeight: "900", fontSize: 14 },

  // Card Phẳng Chuẩn DNA
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { color: "#64748B", fontSize: 14, flex: 1, fontWeight: "600" },
  value: {
    color: "#0F172A",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
    fontWeight: "700",
  },
  valueBold: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  hintText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    fontWeight: "600",
  },
});
