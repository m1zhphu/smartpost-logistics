import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerPickupDetailScreenStyles";
import { getCustomerPickupDetail } from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
  getOfficeStatusLabel,
  getPickupStatusColor,
  getPickupStatusLabel,
  getPriceStatusLabel,
  getWaybillStatusLabel,
  hasFinalPrice,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerPickupDetailScreen({ route, navigation }) {
  const { waybillCode } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    const result = await getCustomerPickupDetail(waybillCode);
    if (result.success) {
      setDetail(result.data);
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
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const Row = ({ label, value, bold, color }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[bold ? styles.valueBold : styles.value, color && { color }]}
      >
        {value}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        <View style={styles.emptyIconBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>Không thể tải chi tiết đơn hàng.</Text>
        <TouchableOpacity
          onPress={fetchDetail}
          style={[styles.backBtn, { backgroundColor: PRIMARY, marginBottom: 10 }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.backBtnText, { color: '#fff' }]}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showFinal = hasFinalPrice(
    detail.price_status,
    detail.final_total_amount,
  );

  const priceDiff =
    (detail.final_total_amount || 0) - (detail.estimated_total_amount || 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM MỚI */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chi tiết {waybillCode}
          </Text>
        </View>
        {/* View ẩn để cân bằng header */}
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHUNG</Text>
          <Row label="Mã yêu cầu:" value={detail.request_code} />
          <Row
            label="Mã vận đơn:"
            value={detail.waybill_code}
            bold
            color={PRIMARY}
          />
          <Row label="Ngày tạo:" value={formatDateTime(detail.created_at)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>TRẠNG THÁI</Text>
          <Row
            label="Trạng thái lấy hàng:"
            value={getPickupStatusLabel(detail.pickup_status)}
            bold
            color={getPickupStatusColor(detail.pickup_status)}
          />
          <Row
            label="Trạng thái vận đơn:"
            value={getWaybillStatusLabel(detail.waybill_status)}
          />
          <Row
            label="Văn phòng nhận:"
            value={getOfficeStatusLabel(detail.office_status)}
          />
          <Row
            label="Bưu tá:"
            value={detail.assigned_shipper_name || "Chưa phân công"}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CƯỚC PHÍ</Text>
          <Row
            label="Trạng thái giá:"
            value={getPriceStatusLabel(detail.price_status)}
          />
          <Row
            label="Cước dự kiến:"
            value={formatCurrency(detail.estimated_total_amount)}
          />

          {showFinal ? (
            <>
              <Row
                label="Cước thật:"
                value={formatCurrency(detail.final_total_amount)}
                bold
                color="#059669"
              />
              <Row
                label="Chênh lệch:"
                value={`${priceDiff > 0 ? "+" : ""}${formatCurrency(priceDiff)}`}
                bold
                color={
                  priceDiff > 0
                    ? "#D97706"
                    : priceDiff < 0
                      ? "#059669"
                      : PRIMARY
                }
              />
            </>
          ) : (
            <View style={styles.hintBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#64748B"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.hintText}>
                Đơn hàng chưa có cước thật. Hệ thống sẽ cập nhật sau khi nhập
                kho và cân lại.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

