import React, { useState, useEffect } from "react";
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
import styles from "../styles/CustomerPickupListScreenStyles";
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

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("CustomerPickupDetail", {
            waybillCode: item.waybill_code,
          })
        }
        activeOpacity={0.84}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.waybillCode}>{item.waybill_code}</Text>
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <Text style={styles.headerTitle}>Đơn lấy hàng của tôi</Text>

        <HeaderButton icon="reload" onPress={fetchPickups} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="file-tray-outline" size={34} color="#94A3B8" />
          </View>

          <Text style={styles.emptyText}>
            Bạn chưa có yêu cầu lấy hàng nào.
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

/*
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

  waybillCode: {
    fontWeight: "900",
    fontSize: 16,
    color: SECONDARY,
  },

  requestCode: {
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

  infoText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
    marginBottom: 2,
    fontWeight: "600",
    lineHeight: 21,
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
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  pricePillLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },

  pricePillValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },

  priceSuccess: {
    color: "#16A34A",
  },

  priceDanger: {
    color: "#EF4444",
  },

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
    fontWeight: "600",
    textAlign: "center",
  },
});
*/
