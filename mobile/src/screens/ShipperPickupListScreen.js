import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
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
  getPickupStatusLabel,
  getPickupStatusColor,
} from "../utils/pickupHelpers";

// Import file style tách biệt
import styles from "../styles/ShipperPickupListScreenStyles";

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
      <Ionicons name={icon} size={18} color="#FFF" />
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
        activeOpacity={0.7}
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
                { backgroundColor: isBulkMail ? "#FFF7ED" : "#F0FDF4" },
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
                {isBulkMail ? "Túi thư" : "Đơn lẻ"}
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
            Người gửi:{" "}
            <Text style={styles.infoValueBold}>
              {item.sender_name || "---"}
            </Text>
          </InfoRow>

          <InfoRow icon="call">
            SĐT:{" "}
            <Text style={styles.infoValueBold}>
              {item.sender_phone || "---"}
            </Text>
          </InfoRow>

          <InfoRow icon="location" numberOfLines={2}>
            Địa chỉ:{" "}
            <Text style={styles.infoValueBold}>
              {item.pickup_address || "---"}
            </Text>
          </InfoRow>

          <InfoRow icon="time-outline">
            Hẹn lấy:{" "}
            <Text style={styles.infoValueBold}>
              {formatDateTime(item.requested_pickup_time)}
            </Text>
          </InfoRow>
        </View>

        <View style={styles.metaRow}>
          <MetaPill
            label={isBulkMail ? "Dự kiến" : "Số kiện"}
            value={expectedQuantity}
          />
          <MetaPill
            label={isBulkMail ? "Vận đơn con" : "KL ước tính"}
            value={
              isBulkMail
                ? item.waybill_count || 0
                : formatWeight(item.est_weight)
            }
          />
          <MetaPill
            label={isBulkMail ? "Thực tế" : "COD"}
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

      {/* Header */}
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
          <Text style={styles.headerTitle}>Đơn lấy hàng</Text>
        </View>
        <HeaderButton icon="reload" onPress={fetchPickups} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="cube-outline" size={40} color="#94A3B8" />
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
