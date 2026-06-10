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
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { COLORS } from "../constants/colors";
import { getCustomerPickups } from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
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

  const blurProps = {
    intensity: Platform.OS === "ios" ? 66 : 40,
    tint: "light",
  };

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
      style={styles.headerButtonShadow}
      activeOpacity={0.78}
    >
      <BlurView {...blurProps} intensity={52} style={styles.headerButton}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.36)",
            "rgba(255,255,255,0.14)",
            "rgba(255,255,255,0.06)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerButtonTopLine} />

        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </BlurView>
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
    <BlurView {...blurProps} intensity={40} style={styles.pricePill}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.9)",
          "rgba(255,255,255,0.48)",
          "rgba(255,255,255,0.24)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

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
    </BlurView>
  );

  const renderItem = ({ item }) => {
    const showFinal = hasFinalPrice(item.price_status, item.final_total_amount);

    const statusColor = getPickupStatusColor(item.pickup_status);

    return (
      <TouchableOpacity
        style={styles.cardShadow}
        onPress={() =>
          navigation.navigate("CustomerPickupDetail", {
            waybillCode: item.waybill_code,
          })
        }
        activeOpacity={0.84}
      >
        <BlurView {...blurProps} intensity={56} style={styles.card}>
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.95)",
              "rgba(255,255,255,0.64)",
              "rgba(255,255,255,0.34)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View pointerEvents="none" style={styles.cardTopLine} />
          <View pointerEvents="none" style={styles.cardGlow} />

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
              Văn phòng: {item.office_status || "Đang xử lý"}
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
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <LinearGradient
          pointerEvents="none"
          colors={[PRIMARY, "#15803D", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerOrbOne} />
        <View pointerEvents="none" style={styles.headerOrbTwo} />
        <View pointerEvents="none" style={styles.headerGlassLine} />

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
          keyExtractor={(item) => item.waybill_code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CustomerCreatePickup")}
        activeOpacity={0.86}
      >
        <LinearGradient
          colors={[PRIMARY, "#16A34A", "#4ADE80"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.5)",
              "rgba(255,255,255,0.12)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGloss}
          />

          <Ionicons name="add" size={30} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const glassShadow = {
  ...Platform.select({
    ios: {
      shadowColor: "#123816",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.13,
      shadowRadius: 22,
    },
    android: {
      elevation: 5,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    height: 96,
    paddingTop: Platform.OS === "ios" ? 46 : 36,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  headerOrbOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -70,
    right: -45,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  headerOrbTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    bottom: -70,
    left: -38,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  headerGlassLine: {
    position: "absolute",
    top: Platform.OS === "ios" ? 42 : 30,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.34)",
  },

  headerButtonShadow: {
    width: 42,
    height: 42,
    borderRadius: 21,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  headerButton: {
    flex: 1,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  headerButtonTopLine: {
    position: "absolute",
    top: 1,
    left: 9,
    right: 9,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
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
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",

    ...Platform.select({
      ios: {
        shadowColor: "#123816",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
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
    paddingBottom: 100,
  },

  cardShadow: {
    borderRadius: 24,
    marginBottom: 15,
    ...glassShadow,
  },

  card: {
    borderRadius: 24,
    padding: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.84)"
        : "rgba(255,255,255,0.36)",
  },

  cardTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  cardGlow: {
    position: "absolute",
    top: 12,
    left: 14,
    width: 62,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
    transform: [{ rotate: "-18deg" }],
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.18)",
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
    maxWidth: 120,
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
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "rgba(27,94,32,0.08)",
  },

  infoText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
    fontWeight: "600",
    lineHeight: 21,
  },

  priceSection: {
    flexDirection: "row",
    marginTop: 10,
  },

  pricePill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(248,250,252,0.72)",
    marginRight: 8,
  },

  pricePillLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },

  pricePillValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
  },

  priceSuccess: {
    color: "#059669",
  },

  priceDanger: {
    color: "#EF4444",
  },

  priceHintBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(241,245,249,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    justifyContent: "center",
  },

  priceHint: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.34,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  fabGradient: {
    flex: 1,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    overflow: "hidden",
  },

  fabGloss: {
    position: "absolute",
    top: 4,
    left: 10,
    right: 10,
    height: 24,
    borderRadius: 999,
  },
});
