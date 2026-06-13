import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { getShipperAssignedPickups } from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
  formatWeight,
  getPickupStatusColor,
  getPickupStatusLabel,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperPickupListScreen({ navigation }) {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPickups();
    });

    const realtimeListener = DeviceEventEmitter.addListener(
      "realtime_event",
      (data) => {
        if (data.event === "pickup.assigned_shipper") {
          Toast.show({
            type: "info",
            text1: "Co don lay hang moi!",
            text2: `Ma don: ${data.payload?.request_code || "N/A"}`,
          });

          fetchPickups();
        }
      },
    );

    return () => {
      unsubscribe();
      realtimeListener.remove();
    };
  }, [navigation]);

  const fetchPickups = async () => {
    setLoading(true);
    const result = await getShipperAssignedPickups();
    if (result.success) {
      setPickups(result.data || []);
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
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
    </TouchableOpacity>
  );

  const MetaPill = ({ label, value }) => (
    <View style={styles.metaPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );

  const InfoRow = ({ icon, children, numberOfLines }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={15} color={PRIMARY} />
      </View>

      <Text style={styles.infoText} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const statusColor = getPickupStatusColor(item.pickup_status);
    const isBulkMail = item.pickup_mode === "BULK_MAIL";
    const expectedQuantity = item.expected_quantity ?? item.est_quantity ?? 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ShipperPickupDetail", {
            requestCode: item.request_code,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.requestCode}>{item.request_code}</Text>

            <Text style={styles.waybillCode}>
              {isBulkMail
                ? item.bag_code || "Chưa có mã túi thư"
                : item.waybill_code || "Chưa có mã vận đơn"}
            </Text>
          </View>

          <View style={styles.headerPills}>
            <View
              style={[
                styles.modePill,
                isBulkMail ? styles.bulkPill : styles.singlePill,
              ]}
            >
              <Ionicons
                name={
                  isBulkMail ? "mail-open-outline" : "document-text-outline"
                }
                size={12}
                color={isBulkMail ? "#C2410C" : PRIMARY}
              />
              <Text
                style={[
                  styles.modePillText,
                  { color: isBulkMail ? "#C2410C" : PRIMARY },
                ]}
              >
                {isBulkMail ? "Tui thu" : "Don le"}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  borderColor: `${statusColor}33`,
                  backgroundColor: `${statusColor}10`,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getPickupStatusLabel(item.pickup_status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="person">
            Nguoi gui:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.sender_name || "---"}
            </Text>
          </InfoRow>

          <InfoRow icon="call">
            SDT:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.sender_phone || "---"}
            </Text>
          </InfoRow>

          <InfoRow icon="location" numberOfLines={2}>
            Dia chi:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {item.pickup_address || "---"}
            </Text>
          </InfoRow>

          <InfoRow icon="time-outline">
            Hen lay:{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>
              {formatDateTime(item.requested_pickup_time)}
            </Text>
          </InfoRow>
        </View>

        <View style={styles.metaRow}>
          <MetaPill
            label={isBulkMail ? "Du kien" : "So kien"}
            value={expectedQuantity}
          />
          <MetaPill
            label={isBulkMail ? "Van don con" : "KL uoc tinh"}
            value={
              isBulkMail
                ? item.waybill_count || 0
                : formatWeight(item.est_weight)
            }
          />
          <MetaPill
            label={isBulkMail ? "Thuc te" : "COD"}
            value={
              isBulkMail
                ? item.actual_quantity || 0
                : formatCurrency(item.cod_amount)
            }
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        ) : (
          <HeaderButton
            icon="home-outline"
            onPress={() => navigation.replace("Home")}
          />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Don lay hang</Text>
        </View>
        <HeaderButton icon="reload" onPress={fetchPickups} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="cube-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>
            Hiện không có đơn nào cần đi lấy.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.request_code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

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

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

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
  requestCode: { fontWeight: "900", fontSize: 16, color: PRIMARY },
  waybillCode: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  headerPills: {
    alignItems: "flex-end",
    gap: 8,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  bulkPill: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  singlePill: {
    backgroundColor: "#ECFDF5",
    borderColor: "#BBF7D0",
  },
  modePillText: {
    fontWeight: "900",
    fontSize: 11,
  },

  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusText: { fontWeight: "900", fontSize: 11, textAlign: "right" },

  cardBody: {},
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
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
  infoText: {
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
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
    textAlign: "center",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
});
