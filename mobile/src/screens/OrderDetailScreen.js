import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getShipment } from "../services/shipmentService";
import { useQueue } from "../context/QueueContext";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import { StatusBar } from "expo-status-bar";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function OrderDetailScreen({ route, navigation }) {
  const { trackingNumber, queueId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const { removeQueueItem } = useQueue();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      setLoading(false);
      setError("Không có kết nối Internet");
      return;
    }
    try {
      const result = await getShipment(trackingNumber);
      if (result.success) {
        setOrder(result.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "---"}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <StatusBar style="light" />
        <View style={styles.emptyIconBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chi tiết vận đơn</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>MÃ VẬN ĐƠN</Text>
          <Text style={styles.trackingNumber}>{order?.tracking_number}</Text>
          <Text style={styles.date}>
            {new Date(order?.created_at).toLocaleString("vi-VN")}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Đã tạo thành công</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="arrow-up-circle" size={20} color="#0284C7" />
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: "#0284C7",
                  marginBottom: 0,
                  marginLeft: 6,
                  borderBottomWidth: 0,
                },
              ]}
            >
              NGƯỜI GỬI
            </Text>
          </View>
          <View style={styles.divider} />
          <Row label="Tên:" value={order?.sender_name} />
          <Row label="SĐT:" value={order?.sender_phone} />
          <Row label="Địa chỉ:" value={order?.sender_address} />
        </View>

        <View style={{ alignItems: "center", marginVertical: -12, zIndex: 10 }}>
          <View style={styles.arrowDownBox}>
            <Ionicons name="arrow-down" size={20} color="#94A3B8" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="arrow-down-circle" size={20} color="#D97706" />
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: "#D97706",
                  marginBottom: 0,
                  marginLeft: 6,
                  borderBottomWidth: 0,
                },
              ]}
            >
              NGƯỜI NHẬN
            </Text>
          </View>
          <View style={styles.divider} />
          <Row label="Tên:" value={order?.receiver_name} />
          <Row label="SĐT:" value={order?.receiver_phone} />
          <Row label="Địa chỉ:" value={order?.receiver_address} />
        </View>
      </ScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// STYLES CHUẨN DNA
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },

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

  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
  },
  loadingText: { color: "#64748B", marginTop: 12, fontWeight: "700" },

  // Empty/Error State
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
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

  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },

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
    fontSize: 13,
    fontWeight: "900",
    color: "#64748B",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 6,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },

  trackingNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: PRIMARY,
    marginBottom: 4,
  },
  date: { fontSize: 13, color: "#64748B", fontWeight: "600", marginBottom: 12 },

  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  statusText: { color: "#16A34A", fontWeight: "800", fontSize: 12 },

  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  label: { color: "#64748B", fontSize: 14, width: 60, fontWeight: "700" },
  value: {
    color: "#0F172A",
    fontSize: 14,
    flex: 1,
    fontWeight: "700",
    lineHeight: 20,
  },

  arrowDownBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  // Bottom Bar Chuẩn Form
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  homeBtn: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  homeBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
});
