import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { getShipperPickedPickups } from "../services/pickupService";
import {
  formatDateTime,
  getPickupStatusLabel,
  getPickupStatusColor,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

/**
 * ShipperPickedOrdersScreen
 * Danh sách các đơn bưu tá đã lấy thành công và đang chờ OCR.
 * Bưu tá nhấn vào từng đơn → navigate đến OcrWaybillDetail hoặc OcrBagDetail.
 */
export default function ShipperPickedOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await getShipperPickedPickups();
    if (result.success) {
      // Lọc đơn đã lấy thành công — dùng includes để bắt mọi variant có chứa 'PICKED'
      const picked = (result.data || []).filter(
        (item) => {
          const s = item.pickup_status || '';
          return s === 'PICKED' || s.startsWith('PICKED_') || s.includes('PICKED');
        }
      );
      setOrders(picked);
    } else {
      Toast.show({
        type: "error",
        text1: "Không tải được danh sách",
        text2: result.message,
      });
    }
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await getShipperPickedPickups();
    if (result.success) {
      const picked = (result.data || []).filter(
        (item) => {
          const s = item.pickup_status || '';
          return s === 'PICKED' || s.startsWith('PICKED_') || s.includes('PICKED');
        }
      );
      setOrders(picked);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchOrders);
    return unsubscribe;
  }, [navigation, fetchOrders]);

  const handlePressOrder = (item) => {
    const isBulkMail = item.pickup_mode === "BULK_MAIL" && !!item.bag_code;

    if (isBulkMail) {
      // Túi thư → OCR từng bill trong túi
      navigation.navigate("OcrBagDetail", {
        bagCode: item.bag_code || item.waybill_code,
        bagData: {
          bag_code: item.bag_code || item.waybill_code,
          expected_quantity: item.expected_quantity || item.est_quantity,
          actual_quantity: item.actual_quantity,
          waybills: item.waybills || [],
          materialization_status: item.materialization_status,
        },
      });
    } else if (item.waybill_code) {
      // Đơn lẻ đã có mã VĐ → Mở màn hình OCR detail để fill/sửa thông tin
      // Tự động fill thông tin người gửi từ dữ liệu yêu cầu lấy hàng
      navigation.navigate("OcrWaybillDetail", {
        waybillCode: item.waybill_code,
        waybillData: {
          waybill_code: item.waybill_code,
          // Pre-fill thông tin đã biết từ yêu cầu lấy hàng
          sender_name: item.sender_name || "",
          sender_phone: item.sender_phone || "",
          sender_address: item.pickup_address || "",
          // Các trường OCR để bưu tá điền thêm
          receiver_name: item.receiver_name || "",
          receiver_phone: item.receiver_phone || "",
          receiver_address: item.receiver_address || "",
          receiver_province_name: item.receiver_province_name || "",
          receiver_ward_name: item.receiver_ward_name || "",
          actual_weight: item.actual_weight != null ? String(item.actual_weight) : "",
          cod_amount: item.cod_amount != null ? String(item.cod_amount) : "0",
          product_name: item.product_name || "",
          service_type: item.service_type || "STANDARD",
          product_group: item.product_group || "DOCUMENT",
          ocr_status: item.ocr_status || "PENDING",
          verify_status: item.verify_status || "",
          status: item.pickup_status || "",
          bill_image_url: item.bill_image_url || "",
          note: item.note || "",
        },
      });
    } else {
      // Đơn chưa có mã VĐ → Mở Camera để tạo đơn mới
      navigation.navigate("ShipperCamera", {
        waybillCode: item.waybill_code,
        customer: {
          customer_name: item.sender_name || "",
          customer_id: item.customer_id || null,
        },
        senderData: {
          name: item.sender_name || "",
          phone: item.sender_phone || "",
          address: item.pickup_address || "",
        }
      });
    }
  };

  const getOcrStatusConfig = (item) => {
    const status = item.ocr_status || "PENDING";
    const map = {
      PENDING: { label: "Chờ OCR", color: "#64748B", bg: "#F1F5F9" },
      INCOMPLETE: { label: "Thiếu thông tin", color: "#D97706", bg: "#FEF3C7" },
      REVIEW: { label: "Đã OCR", color: "#059669", bg: "#D1FAE5" },
      VERIFIED: { label: "Đã duyệt", color: "#059669", bg: "#DCFCE7" },
    };
    return map[status] || map.PENDING;
  };

  const renderItem = ({ item }) => {
    const isBulkMail = item.pickup_mode === "BULK_MAIL" && !!item.bag_code;
    const ocrCfg = getOcrStatusConfig(item);
    const statusColor = getPickupStatusColor(item.pickup_status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePressOrder(item)}
        activeOpacity={0.75}
      >
        {/* Header: mã + loại */}
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.requestCode}>{item.request_code}</Text>
            <Text style={styles.waybillCode} numberOfLines={1}>
              {isBulkMail
                ? item.bag_code || "Chưa có mã túi"
                : item.waybill_code || "Chưa có mã VĐ"}
            </Text>
          </View>
          <View style={styles.pillGroup}>
            {/* Loại: Túi thư / Đơn lẻ */}
            <View
              style={[
                styles.typePill,
                { backgroundColor: isBulkMail ? "#FFF7ED" : "#F0FDF4" },
              ]}
            >
              <Ionicons
                name={isBulkMail ? "mail-open-outline" : "document-text-outline"}
                size={11}
                color={isBulkMail ? "#C2410C" : PRIMARY}
              />
              <Text
                style={[
                  styles.typePillText,
                  { color: isBulkMail ? "#C2410C" : PRIMARY },
                ]}
              >
                {isBulkMail ? "Túi thư" : "Đơn lẻ"}
              </Text>
            </View>
            {/* Trạng thái OCR */}
            <View
              style={[
                styles.ocrPill,
                { backgroundColor: ocrCfg.bg, borderColor: `${ocrCfg.color}40` },
              ]}
            >
              <Text style={[styles.ocrPillText, { color: ocrCfg.color }]}>
                {ocrCfg.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Thông tin */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={14} color={PRIMARY} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.sender_name || "---"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={14} color={PRIMARY} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={2}>
              {item.pickup_address || "---"}
            </Text>
          </View>
          {isBulkMail && (
            <View style={styles.infoRow}>
              <Ionicons name="layers-outline" size={14} color={PRIMARY} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Dự kiến:{" "}
                <Text style={styles.infoBold}>
                  {item.expected_quantity ?? item.est_quantity ?? 0} thư
                </Text>
                {"  "}Thực tế:{" "}
                <Text style={styles.infoBold}>{item.actual_quantity ?? 0} thư</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Footer CTA */}
        <View style={styles.cardFooter}>
          <Text style={[styles.pickupStatus, { color: statusColor }]}>
            {getPickupStatusLabel(item.pickup_status)}
          </Text>
          <View style={styles.ocrBtn}>
            <Ionicons name="scan-outline" size={14} color="#FFF" />
            <Text style={styles.ocrBtnText}>
              {isBulkMail ? "Mở túi & OCR" : item.waybill_code ? "Xem & OCR" : "Tạo & OCR"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn chờ OCR</Text>
          <Text style={styles.headerSub}>
            {orders.length > 0 ? `${orders.length} đơn — nhấn để bắt đầu OCR` : 'Nhấn vào đơn để bắt đầu OCR'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchOrders}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="reload" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Không có đơn nào chờ OCR</Text>
          <Text style={styles.emptyDesc}>
            Các đơn đã lấy thành công và hoàn thành OCR sẽ không hiển thị ở đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.request_code}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20 },
  list: { padding: 12, paddingBottom: 30 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  codeBlock: { flex: 1, marginRight: 8 },
  requestCode: { fontSize: 13, fontWeight: "700", color: PRIMARY },
  waybillCode: { fontSize: 12, color: "#64748B", marginTop: 2 },
  pillGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  typePillText: { fontSize: 11, fontWeight: "600" },
  ocrPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ocrPillText: { fontSize: 11, fontWeight: "600" },
  cardBody: { gap: 5, marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { marginRight: 6, marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, color: "#334155", lineHeight: 18 },
  infoBold: { fontWeight: "700", color: "#0F172A" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 4,
  },
  pickupStatus: { fontSize: 12, fontWeight: "600" },
  ocrBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  ocrBtnText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
});
