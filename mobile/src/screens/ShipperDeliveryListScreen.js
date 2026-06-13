import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { getDeliveryTasks } from "../services/deliveryService";
import {
  formatCurrency,
  formatDateTime,
  getWaybillStatusLabel,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperDeliveryListScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchTasks);
    return unsubscribe;
  }, [navigation]);

  const fetchTasks = async () => {
    setLoading(true);
    const result = await getDeliveryTasks();
    if (result.success) {
      setTasks(result.data || []);
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

  const InfoLine = ({ icon, children, numberOfLines }) => (
    <View style={styles.infoLine}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={15} color={PRIMARY} />
      </View>
      <Text style={styles.line} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  );

  const MetaPill = ({ label, value, danger }) => (
    <View style={styles.metaPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, danger && styles.metaValueDanger]}>
        {value}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const statusLabel = getWaybillStatusLabel(
      item.status || item.waybill_status,
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ShipperDeliveryDetail", {
            waybillCode: item.waybill_code,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{item.waybill_code}</Text>
            <Text style={styles.sub}>Giao cho khách hàng</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.status}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoLine icon="person">
            Người nhận:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.receiver_name || "---"}
            </Text>
          </InfoLine>

          <InfoLine icon="location" numberOfLines={2}>
            Địa chỉ:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.receiver_address || "---"}
            </Text>
          </InfoLine>

          <InfoLine icon="time-outline">
            Hẹn giao:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {formatDateTime(item.requested_pickup_time || item.created_at)}
            </Text>
          </InfoLine>
        </View>

        <View style={styles.metaRow}>
          <MetaPill
            label="COD"
            value={formatCurrency(item.cod_amount)}
            danger
          />
          <MetaPill
            label="Cước phí"
            value={formatCurrency(
              item.total_amount_to_collect ||
                item.final_total_amount ||
                item.estimated_total_amount,
            )}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn giao hàng</Text>
          <Text style={styles.headerSub}>Giao tận tay khách hàng</Text>
        </View>
        <HeaderButton icon="reload" onPress={fetchTasks} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="car-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>Hiện chưa có đơn giao nào.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.waybill_code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
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

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Empty State Chuẩn
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  listContent: { padding: 16, paddingBottom: 30 },

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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  codeBlock: { flex: 1, paddingRight: 10 },
  code: { fontWeight: "900", fontSize: 16, color: PRIMARY },
  sub: { marginTop: 4, fontSize: 12, color: "#64748B", fontWeight: "600" },

  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(27,94,32,0.15)",
    backgroundColor: "#F0FDF4",
  },
  status: {
    fontWeight: "900",
    fontSize: 11,
    color: PRIMARY,
    textAlign: "right",
  },

  cardBody: {},
  infoLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  line: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
    fontWeight: "600",
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  metaPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },
  metaValue: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  metaValueDanger: { color: "#EF4444" },
});
