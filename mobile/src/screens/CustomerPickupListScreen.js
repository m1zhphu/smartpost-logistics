import React, { useState, useEffect, useMemo } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
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

// Format ngày dd/MM/yyyy từ ISO string để làm key cho bộ lọc
const toDateKey = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Label hiển thị cho chip ngày: "Hôm nay", "DD/MM", hoặc "DD/MM/YYYY"
const formatDateLabel = (key) => {
  if (!key) return key;
  const today = new Date();
  const todayKey = toDateKey(today.toISOString());
  if (key === todayKey) return 'Hôm nay';
  // Nếu cùng năm hiện tại thì bỏ năm cho gọn
  const parts = key.split('/');
  if (parts[2] === String(today.getFullYear())) return `${parts[0]}/${parts[1]}`;
  return key;
};

export default function CustomerPickupListScreen({ navigation }) {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // null = "Tất cả"

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

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await getCustomerPickups();
    if (result.success) {
      setPickups(result.data || []);
    }
    setRefreshing(false);
  };

  const openPickupDetail = (waybillCode) => {
    if (!waybillCode) {
      CustomAlert.alert(
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

  // Lấy danh sách ngày duy nhất từ dữ liệu, sắp xếp mới nhất trước
  const availableDates = useMemo(() => {
    const dateSet = new Set();
    groupedPickups.forEach((item) => {
      const key = toDateKey(item.created_at);
      if (key) dateSet.add(key);
    });
    // Sort mới nhất trước: so sánh năm, tháng, ngày đầy đủ
    return Array.from(dateSet).sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      if (yb !== ya) return yb - ya; // năm trước
      if (mb !== ma) return mb - ma; // rồi tháng
      return db - da;               // cuối cùng ngày
    });
  }, [groupedPickups]);

  // Lọc pickup theo ngày được chọn
  const filteredPickups = useMemo(() => {
    if (!selectedDate) return groupedPickups;
    return groupedPickups.filter((item) => toDateKey(item.created_at) === selectedDate);
  }, [groupedPickups, selectedDate]);

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
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

      {/* HEADER */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đơn lấy hàng của tôi</Text>
        </View>
        <HeaderButton icon="reload" onPress={fetchPickups} />
      </View>

      {/* BỘ LỌC NGÀY — hiển thị khi có dữ liệu */}
      {!loading && availableDates.length > 0 && (
        <View style={{ backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: "row" }}
          >
            {/* Chip "Tất cả" */}
            <TouchableOpacity
              onPress={() => setSelectedDate(null)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selectedDate === null ? PRIMARY : "#F1F5F9",
                borderWidth: 1,
                borderColor: selectedDate === null ? PRIMARY : "#E2E8F0",
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: selectedDate === null ? "#FFF" : "#475569" }}>
                Tất cả ({groupedPickups.length})
              </Text>
            </TouchableOpacity>

            {/* Chip ngày */}
            {availableDates.map((date) => {
              const count = groupedPickups.filter((p) => toDateKey(p.created_at) === date).length;
              const isActive = selectedDate === date;
              return (
                <TouchableOpacity
                  key={date}
                  onPress={() => setSelectedDate(isActive ? null : date)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: isActive ? PRIMARY : "#F1F5F9",
                    borderWidth: 1,
                    borderColor: isActive ? PRIMARY : "#E2E8F0",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={12} color={isActive ? "#FFF" : "#64748B"} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFF" : "#475569" }}>
                    {formatDateLabel(date)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : filteredPickups.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="file-tray-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>
            {selectedDate ? `Không có đơn ngày ${selectedDate}` : "Chưa có yêu cầu nào"}
          </Text>
          <Text style={styles.emptyText}>
            {selectedDate
              ? "Thử chọn ngày khác hoặc bấm Tất cả để xem toàn bộ."
              : "Bạn chưa có yêu cầu lấy hàng nào trên hệ thống."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPickups}
          keyExtractor={(item) =>
            String(item.request_code || item.bag_code || item.waybill_code)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}

// STYLES CHUẨN DNA
// styles moved to ../styles/CustomerPickupListScreenStyles
