import React, { useEffect, useState } from "react";
import {
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { waybillService } from "../services/waybillService";
import { accountingService } from "../services/accountingService";
import { COLORS } from "../constants/colors";
import styles from "../styles/WarehouseDashboardStyles";
import SkeletonLoader from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";

const DashboardSkeleton = () => (
  <View style={styles.content}>
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <SkeletonLoader height={16} width="50%" />
          <SkeletonLoader height={28} width="65%" style={styles.skeletonLine} />
        </View>
      ))}
    </View>
  </View>
);

export default function WarehouseDashboardScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    inHubInventory: 0,
    pendingCodTotal: 0,
    pendingShippers: 0,
  });
  const [slaSummary, setSlaSummary] = useState({
    total: 0,
    warning: 0,
    overdue: 0,
  });

  useEffect(() => {
    if (!isRouteAllowed(user, "WarehouseDashboard")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
    fetchDashboard();
  }, [navigation, user.token]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const isManager = [1, 2].includes(Number(user?.role_id));

      const promises = [
        waybillService.searchWaybills(user.token, {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          page: 1,
          size: 1,
        }),
        waybillService.searchWaybills(user.token, {
          status: "IN_HUB",
          page: 1,
          size: 1,
        }),
        accountingService.getCashConfirmationList(user.token).catch(() => []),
      ];

      if (isManager) {
        promises.push(
          waybillService
            .getDashboardSummary(user.token)
            .catch(() => ({ total: 0, warning: 0, overdue: 0 })),
        );
      }

      const [todayRes, inHubRes, cashList, summaryRes] =
        await Promise.all(promises);

      const pendingCodTotal = Array.isArray(cashList)
        ? cashList.reduce(
            (sum, item) => sum + Number(item.expected_cod || 0),
            0,
          )
        : 0;

      setStats({
        todayOrders: todayRes?.total || todayRes?.items?.length || 0,
        inHubInventory: inHubRes?.total || inHubRes?.items?.length || 0,
        pendingCodTotal,
        pendingShippers: Array.isArray(cashList) ? cashList.length : 0,
      });

      if (isManager) {
        setSlaSummary({
          total: summaryRes?.total || 0,
          warning: summaryRes?.warning || 0,
          overdue: summaryRes?.overdue || 0,
        });
        if ((summaryRes?.warning || 0) > 0 || (summaryRes?.overdue || 0) > 0) {
          Toast.show({
            type: "error",
            position: "top",
            text1: "Cảnh báo quá SLA",
            text2:
              "Một số đơn hàng đang có nguy cơ hoặc đã quá SLA. Vui lòng kiểm tra chi tiết.",
            visibilityTime: 5000,
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tải dữ liệu bảng điều khiển.",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { id: "CreateWaybill", label: "Tạo vận đơn", icon: "add-circle-outline" },
    { id: "ScanInHub", label: "Quét nhập kho", icon: "log-in-outline" },
    { id: "ScanBagging", label: "Đóng túi", icon: "cube-outline" },
    {
      id: "ScanManifestLoad",
      label: "Tải manifest",
      icon: "cloud-upload-outline",
    },
    {
      id: "ScanManifestUnload",
      label: "Gỡ manifest",
      icon: "cloud-download-outline",
    },
    { id: "AssignShipper", label: "Giao shipper", icon: "people-outline" },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Bảng điều khiển kho</Text>
          <Text style={styles.headerSubtitle}>
            Tổng quan hoạt động kho và lô hàng
          </Text>
        </View>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Bảng điều khiển kho</Text>
        <Text style={styles.headerSubtitle}>
          Tổng quan hoạt động kho và lô hàng
        </Text>
      </View>

      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <EmptyState
            icon="view-grid-outline"
            title="Không có chức năng nhanh"
            message="Không có chức năng nhanh nào cho vai trò hiện tại."
          />
        }
        ListHeaderComponent={() => (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Thống kê đơn hàng</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Đơn hôm nay</Text>
                <Text style={styles.statValue}>{stats.todayOrders}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Tồn kho</Text>
                <Text style={styles.statValue}>{stats.inHubInventory}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>COD chưa xử lý</Text>
                <Text style={styles.statValue}>{stats.pendingShippers}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Tiền COD</Text>
                <Text style={styles.statValue}>
                  {stats.pendingCodTotal.toLocaleString()} d
                </Text>
              </View>
            </View>

            {[1, 2].includes(Number(user?.role_id)) ? (
              <View style={styles.activitySection}>
                <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>Tổng đơn SLA</Text>
                  <Text style={styles.activityValue}>{slaSummary.total}</Text>
                </View>
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>Cảnh báo SLA</Text>
                  <Text style={styles.activityValue}>{slaSummary.warning}</Text>
                </View>
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>Quá SLA</Text>
                  <Text style={styles.activityValue}>{slaSummary.overdue}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Chức năng nhanh</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate(item.id)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
