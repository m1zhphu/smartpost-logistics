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
const SECONDARY = COLORS.secondary || "#0F766E";

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
      activeOpacity={0.78}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
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
        activeOpacity={0.84}
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
            Người nhận: {item.receiver_name || "---"}
          </InfoLine>

          <InfoLine icon="location" numberOfLines={2}>
            Địa chỉ: {item.receiver_address || "---"}
          </InfoLine>

          <InfoLine icon="time-outline">
            Hẹn giao:{" "}
            {formatDateTime(item.requested_pickup_time || item.created_at)}
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

      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <View style={styles.headerTitleGroup}>
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
            <Ionicons name="car-outline" size={34} color="#94A3B8" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

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

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitleGroup: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  emptyText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  listContent: {
    padding: 15,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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

  codeBlock: {
    flex: 1,
    paddingRight: 10,
  },

  code: {
    fontWeight: "900",
    fontSize: 16,
    color: SECONDARY,
  },

  sub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(27,94,32,0.18)",
    backgroundColor: "#F0FDF4",
  },

  status: {
    fontWeight: "900",
    fontSize: 12,
    color: PRIMARY,
    textAlign: "right",
    maxWidth: 130,
  },

  cardBody: {},

  infoLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },

  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  line: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
    fontWeight: "600",
    lineHeight: 21,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },

  metaPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  metaLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },

  metaValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },

  metaValueDanger: {
    color: "#EF4444",
  },
});
