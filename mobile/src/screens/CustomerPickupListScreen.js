import React, { useState, useEffect, useMemo } from "react";
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
import { getCustomerPickups } from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
  getOfficeStatusLabel,
  getPickupStatusColor,
  getPickupStatusLabel,
  getWaybillStatusLabel,
  hasFinalPrice,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default function CustomerPickupListScreen({ navigation }) {
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
    const result = await getCustomerPickups();
    if (result.success) {
      setPickups(result.data || []);
    }
    setLoading(false);
  };

  const groupedPickups = useMemo(() => {
    const map = new Map();
    pickups.forEach((item) => {
      const key = item.request_code || item.bag_code || item.waybill_code;
      if (!key) return;
      const current = map.get(key) || {
        ...item,
        waybills: [],
      };
      const nested =
        Array.isArray(item.waybills) && item.waybills.length
          ? item.waybills
          : [
              {
                waybill_code: item.waybill_code,
                receiver_name: item.receiver_name,
                receiver_phone: item.receiver_phone,
                receiver_address: item.receiver_address,
              },
            ];
      current.waybills = [...current.waybills, ...nested].filter(
        (w, index, arr) =>
          index === arr.findIndex((x) => x.waybill_code === w.waybill_code),
      );
      map.set(key, current);
    });
    return Array.from(map.values());
  }, [pickups]);

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

  const InfoLine = ({ icon, children }) => (
    <View style={styles.infoLine}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={15} color={PRIMARY} />
      </View>
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );

  const PricePill = ({ label, value, success, danger }) => (
    <View style={styles.pricePill}>
      <Text style={styles.pricePillLabel}>{label}</Text>
      <Text
        style={[
          styles.pricePillValue,
          success && styles.priceSuccess,
          danger && styles.priceDanger,
        ]}
      >
        {value}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const showFinal = hasFinalPrice(item.price_status, item.final_total_amount);
    const statusColor = getPickupStatusColor(item.pickup_status);
    const primaryWaybill = item.waybills?.[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("CustomerPickupDetail", {
            waybillCode: primaryWaybill?.waybill_code || item.waybill_code,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.waybillCode}>{item.bag_code || item.waybill_code}</Text>
            <Text style={styles.requestCode}>YC: {item.request_code}</Text>
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
          <InfoLine icon="albums-outline">
            {item.bag_code ? `Túi thư: ${item.bag_code}` : "Đơn lẻ"}
          </InfoLine>
          <InfoLine icon="list-outline">
            Số mã con: {item.waybill_count || item.waybills?.length || 1}
          </InfoLine>
          <InfoLine icon="cube-outline">
            Trạng thái vận đơn: {getWaybillStatusLabel(item.waybill_status)}
          </InfoLine>
          <InfoLine icon="business-outline">
            Văn phòng: {getOfficeStatusLabel(item.office_status)}
          </InfoLine>
          <InfoLine icon="bicycle-outline">
            Bưu tá: {item.assigned_shipper_name || "Chưa phân công"}
          </InfoLine>
          <InfoLine icon="time-outline">
            Ngày tạo: {formatDateTime(item.created_at)}
          </InfoLine>
        </View>

        <View style={styles.priceSection}>
          <PricePill
            label="Cước dự kiến"
            value={formatCurrency(item.estimated_total_amount)}
          />

          {showFinal ? (
            <PricePill
              label="Cước thật"
              value={formatCurrency(item.final_total_amount)}
              success
            />
          ) : (
            <View style={styles.priceHintBox}>
              <Text style={styles.priceHint}>Đang dùng cước dự kiến</Text>
            </View>
          )}
        </View>
        {item.waybills?.length > 1 ? (
          <View style={styles.chipsWrap}>
            {item.waybills.map((w) => (
              <TouchableOpacity
                key={w.waybill_code}
                style={styles.chip}
                onPress={() =>
                  navigation.navigate("CustomerPickupDetail", {
                    waybillCode: w.waybill_code,
                  })
                }
              >
                <Text style={styles.chipText}>{w.waybill_code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM MỚI */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn lấy hàng của tôi</Text>
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
            <Ionicons name="file-tray-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
          <Text style={styles.emptyText}>
            Bạn chưa có yêu cầu lấy hàng nào trên hệ thống.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedPickups}
          keyExtractor={(item) => item.request_code}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  // Empty State Chuẩn
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
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
  waybillCode: { fontWeight: "900", fontSize: 16, color: SECONDARY },
  requestCode: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusText: { fontWeight: "800", fontSize: 11, textAlign: "right" },

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
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#334155",
    flex: 1,
    fontWeight: "600",
    lineHeight: 22,
  },

  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  pricePill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pricePillLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },
  pricePillValue: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  priceSuccess: { color: "#16A34A" },
  priceDanger: { color: "#EF4444" },

  priceHintBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FEF9C3",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEF08A",
  },
  priceHint: {
    fontSize: 11,
    color: "#854D0E",
    fontWeight: "700",
    textAlign: "center",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "800",
  },
});
