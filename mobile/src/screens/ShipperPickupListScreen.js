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
const SECONDARY = COLORS.secondary || "#0F766E";

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
            text1: "Có đơn lấy hàng mới!",
            text2: `Mã đơn: ${data.payload?.request_code || "N/A"}`,
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
      activeOpacity={0.78}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={24} color="#FFF" />
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

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ShipperPickupDetail", {
            requestCode: item.request_code,
          })
        }
        activeOpacity={0.84}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.requestCode}>{item.request_code}</Text>

            <Text style={styles.waybillCode}>
              {item.waybill_code || "Chưa có mã vận đơn"}
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

        <View style={styles.cardBody}>
          <InfoRow icon="person">{item.sender_name || "---"}</InfoRow>

          <InfoRow icon="call">{item.sender_phone || "---"}</InfoRow>

          <InfoRow icon="location" numberOfLines={2}>
            {item.pickup_address || "---"}
          </InfoRow>

          <InfoRow icon="time-outline">
            Hẹn lấy: {formatDateTime(item.requested_pickup_time)}
          </InfoRow>
        </View>

        <View style={styles.metaRow}>
          <MetaPill label="Số kiện" value={item.est_quantity || 0} />

          <MetaPill
            label="KL ước tính"
            value={formatWeight(item.est_weight)}
          />

          <MetaPill label="COD" value={formatCurrency(item.cod_amount)} />
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

        <Text style={styles.headerTitle}>Đơn lấy hàng</Text>

        <HeaderButton icon="reload" onPress={fetchPickups} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="cube-outline" size={34} color="#94A3B8" />
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

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
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

  emptyText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  listContent: {
    padding: 15,
    paddingBottom: 26,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
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

  requestCode: {
    fontWeight: "900",
    fontSize: 16,
    color: SECONDARY,
  },

  waybillCode: {
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
  },

  statusText: {
    fontWeight: "900",
    fontSize: 12,
    maxWidth: 110,
    textAlign: "right",
  },

  cardBody: {},

  infoRow: {
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

  infoText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
    marginBottom: 2,
    fontWeight: "600",
    lineHeight: 21,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
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
  },

  metaValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
});
