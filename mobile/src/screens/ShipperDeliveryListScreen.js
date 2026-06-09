import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { getShipperAssignedPickups } from "../services/pickupService";
import { useUser } from "../context/UserContext";
import {
  formatCurrency,
  formatDateTime,
  formatWeight,
  getPickupStatusColor,
  getPickupStatusLabel,
} from "../utils/pickupHelpers";

export default function ShipperPickupListScreen({ navigation }) {
  const { logout } = useUser();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPickups();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPickups = async () => {
    setLoading(true);
    const result = await getShipperAssignedPickups();
    if (result.success) {
      setPickups(result.data || []);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigation.replace("Login");
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ShipperPickupDetail", {
          requestCode: item.request_code,
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.codeBlock}>
          <Text style={styles.requestCode}>{item.request_code}</Text>
          <Text style={styles.waybillCode}>
            {item.waybill_code || "Chưa có mã vận đơn"}
          </Text>
        </View>
        <Text
          style={[
            styles.statusText,
            { color: getPickupStatusColor(item.pickup_status) },
          ]}
        >
          {getPickupStatusLabel(item.pickup_status)}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#666" style={styles.icon} />
          <Text style={styles.infoText}>{item.sender_name || "---"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={16} color="#666" style={styles.icon} />
          <Text style={styles.infoText}>{item.sender_phone || "---"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="location"
            size={16}
            color="#666"
            style={styles.icon}
          />
          <Text style={styles.infoText} numberOfLines={2}>
            {item.pickup_address || "---"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color="#666"
            style={styles.icon}
          />
          <Text style={styles.infoText}>
            Hẹn lấy: {formatDateTime(item.requested_pickup_time)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>Số kiện</Text>
          <Text style={styles.metaValue}>{item.est_quantity || 0}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>KL ước tính</Text>
          <Text style={styles.metaValue}>{formatWeight(item.est_weight)}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>COD</Text>
          <Text style={styles.metaValue}>
            {formatCurrency(item.cod_amount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.replace("Home")}
            style={styles.iconButton}
          >
            <Ionicons name="home-outline" size={26} color="white" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Đơn lấy hàng</Text>
        <TouchableOpacity onPress={fetchPickups} style={styles.iconButton}>
          <Ionicons name="reload" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Hiện không có đơn nào cần đi lấy.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.request_code}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    height: 90,
    paddingTop: 40,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: { padding: 5 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
    marginBottom: 10,
  },
  codeBlock: { flex: 1 },
  requestCode: { fontWeight: "bold", fontSize: 16, color: COLORS.secondary },
  waybillCode: { marginTop: 4, fontSize: 12, color: "#64748b" },
  statusText: {
    fontWeight: "bold",
    fontSize: 13,
    maxWidth: 110,
    textAlign: "right",
  },
  cardBody: {},
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  icon: { marginRight: 8, marginTop: 2 },
  infoText: { fontSize: 15, color: "#444", flex: 1, marginBottom: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  metaPill: {
    flex: 1,
    backgroundColor: "rgba(248,250,252,0.78)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metaLabel: { fontSize: 11, color: "#64748b", marginBottom: 4 },
  metaValue: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
});
