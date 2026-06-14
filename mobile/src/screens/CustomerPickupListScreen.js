import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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

  const openPickupDetail = (waybillCode) => {
    if (!waybillCode) {
      Alert.alert(
        "Chưa có vận đơn chi tiết",
        "Yêu cầu này đang chờ hệ thống khởi tạo vận đơn chi tiết. Bạn vui lòng thử lại sau.",
      );
      return;
    }
    navigation.navigate("CustomerPickupDetail", { waybillCode });
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
        onPress={() => openPickupDetail(primaryWaybill?.waybill_code || item.waybill_code)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeBlock}>
            <Text style={styles.waybillCode}>
              {item.bag_code || item.waybill_code || "Yêu cầu đang xử lý"}
            </Text>
            <Text style={styles.requestCode}>YC: {item.request_code || "---"}</Text>
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
            {item.waybills.map((w, index) => (
              <TouchableOpacity
                key={w.waybill_code || `${item.request_code || item.bag_code}-wb-${index}`}
                style={styles.chip}
                onPress={() => openPickupDetail(w.waybill_code)}
              >
                <Text style={styles.chipText}>{w.waybill_code || `Mã con ${index + 1}`}</Text>
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
          keyExtractor={(item) =>
            String(item.request_code || item.bag_code || item.waybill_code)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// STYLES CHUẨN DNA
// styles moved to ../styles/CustomerPickupListScreenStyles
