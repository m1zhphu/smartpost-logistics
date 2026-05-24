import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getShipment } from "../services/shipmentService";
import styles from "../styles/OrderDetailStyles";
import TimelineTracker from "../components/TimelineTracker";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import SkeletonLoader from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";

const getStatusConfig = (status) => {
  const normalized = (status || "").toUpperCase();

  if (
    ["DELIVERED", "SUCCESS", "COMPLETED"].some((item) =>
      normalized.includes(item),
    )
  ) {
    return {
      backgroundColor: COLORS.successBg,
      textColor: COLORS.successAccent,
      icon: "checkmark-circle",
    };
  }

  if (
    ["PENDING", "PROCESSING", "IN_TRANSIT"].some((item) =>
      normalized.includes(item),
    )
  ) {
    return {
      backgroundColor: COLORS.warningBg,
      textColor: COLORS.warningText,
      icon: "time",
    };
  }

  if (
    ["FAILED", "CANCEL", "RETURN"].some((item) => normalized.includes(item))
  ) {
    return {
      backgroundColor: COLORS.errorBg,
      textColor: COLORS.error,
      icon: "alert-circle",
    };
  }

  return {
    backgroundColor: COLORS.blueAccentBg,
    textColor: COLORS.blueAccent,
    icon: "information-circle",
  };
};

const DetailRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "-"}</Text>
  </View>
);

const DetailSection = ({ icon, title, iconColor, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.sectionTitle, { color: iconColor }]}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const LoadingSkeleton = () => (
  <View style={styles.skeletonWrap}>
    <View style={styles.heroCard}>
      <SkeletonLoader height={16} width="35%" />
      <SkeletonLoader
        height={36}
        width="70%"
        style={styles.skeletonSpacingSm}
      />
      <SkeletonLoader
        height={20}
        width="45%"
        style={styles.skeletonSpacingSm}
      />
      <SkeletonLoader
        height={28}
        width="30%"
        style={styles.skeletonSpacingMd}
      />
    </View>

    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.sectionCard}>
        <SkeletonLoader height={20} width="50%" />
        <SkeletonLoader
          height={20}
          width="100%"
          style={styles.skeletonSpacingMd}
        />
        <SkeletonLoader
          height={20}
          width="100%"
          style={styles.skeletonSpacingSm}
        />
        <SkeletonLoader
          height={20}
          width="80%"
          style={styles.skeletonSpacingSm}
        />
      </View>
    ))}
  </View>
);

export default function OrderDetailScreen({ route, navigation }) {
  const { trackingNumber } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [waybillId, setWaybillId] = useState(route.params?.waybillId || null);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      setLoading(false);
      setError("Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.");
      return;
    }

    try {
      const result = await getShipment(user?.token, trackingNumber);

      if (result.success) {
        setOrder(result.data);
        setWaybillId(
          result.data?.waybill_id || route.params?.waybillId || null,
        );
      } else {
        setError("Không tìm thấy dữ liệu vận đơn. Vui lòng thử lại sau.");
      }
    } catch (err) {
      setError(
        err.message || "Không thể tải dữ liệu vận đơn. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = useMemo(
    () => getStatusConfig(order?.status || ""),
    [order?.status],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={styles.header}>
        <Pressable
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết vận đơn</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Không thể tải dữ liệu"
          message={error}
          actionButton={{ label: "Thử lại", onPress: fetchData }}
        />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Mã vận đơn</Text>
            <Text style={styles.trackingNumber}>
              {order?.tracking_number || "-"}
            </Text>
            <Text style={styles.dateText}>
              {order?.created_at
                ? new Date(order.created_at).toLocaleString("vi-VN")
                : "-"}
            </Text>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.backgroundColor },
              ]}
            >
              <Ionicons
                name={statusConfig.icon}
                size={16}
                color={statusConfig.textColor}
              />
              <Text
                style={[styles.statusText, { color: statusConfig.textColor }]}
              >
                {order?.status || "Chưa có trạng thái"}
              </Text>
            </View>
          </View>

          <DetailSection
            icon="arrow-up-circle"
            title="Người gửi"
            iconColor={COLORS.secondary}
          >
            <DetailRow label="Tên" value={order?.sender_name} />
            <DetailRow label="SĐT" value={order?.sender_phone} />
            <DetailRow label="Địa chỉ" value={order?.sender_address} />
          </DetailSection>

          <DetailSection
            icon="arrow-down-circle"
            title="Người nhận"
            iconColor={COLORS.processScanOrange}
          >
            <DetailRow label="Tên" value={order?.receiver_name} />
            <DetailRow label="SĐT" value={order?.receiver_phone} />
            <DetailRow label="Địa chỉ" value={order?.receiver_address} />
          </DetailSection>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="time-outline"
                size={20}
                color={COLORS.secondary}
              />
              <Text style={[styles.sectionTitle, styles.timelineTitle]}>
                Trạng thái và hành trình
              </Text>
            </View>
            <View style={styles.sectionBody}>
              <TimelineTracker
                waybillRef={
                  waybillId || order?.waybill_id || order?.tracking_number
                }
              />
            </View>
          </View>

          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.homeBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.homeBtnText}>V? trang ch?</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
