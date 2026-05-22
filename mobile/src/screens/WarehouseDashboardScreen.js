import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { waybillService } from "../services/waybillService";
import { accountingService } from "../services/accountingService";
import { COLORS } from "../constants/colors";
import styles from "../styles/WarehouseDashboardStyles";

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
  const [systemAlert, setSystemAlert] = useState(null);

  useEffect(() => {
    if (!isRouteAllowed(user, "WarehouseDashboard")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return;
    }
    fetchDashboard();
  }, [user.token]);

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
              "Một số đơn đang có nguy cơ quá SLA. Vui lòng kiểm tra ngay.",
            visibilityTime: 5000,
            topOffset: Platform.OS === "android" ? 50 : 70,
          });
        }
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải dữ liệu bảng điều khiển.",
      );
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      {/* Toast container is registered globally in App.js */}

      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Bảng điều khiển kho</Text>
        <Text style={styles.headerSubtitle}>
          Tổng quan hoạt động kho và lô hàng
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          color={COLORS.secondary}
          size="large"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={quickActions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Hôm nay</Text>
                  <Text style={styles.statValue}>{stats.todayOrders}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Tồn kho</Text>
                  <Text style={styles.statValue}>{stats.inHubInventory}</Text>
                </View>
              </View>
              <View style={styles.widgetGrid}>
                <View style={styles.widgetCard}>
                  <Text style={styles.widgetTitle}>Tổng đơn</Text>
                  <Text style={styles.widgetValue}>{slaSummary.total}</Text>
                  <View
                    style={[
                      styles.widgetBadge,
                      { backgroundColor: COLORS.primary },
                    ]}
                  >
                    <Text style={styles.widgetBadgeText}>Tổng</Text>
                  </View>
                </View>
                <View style={styles.widgetCard}>
                  <Text style={styles.widgetTitle}>Đúng SLA</Text>
                  <Text style={styles.widgetValue}>
                    {Math.max(
                      0,
                      slaSummary.total -
                        slaSummary.warning -
                        slaSummary.overdue,
                    )}
                  </Text>
                  <View
                    style={[
                      styles.widgetBadge,
                      { backgroundColor: COLORS.SLA_ON_TIME },
                    ]}
                  >
                    <Text style={styles.widgetBadgeText}>Đúng SLA</Text>
                  </View>
                </View>
                <View style={styles.widgetCard}>
                  <Text style={styles.widgetTitle}>Sắp trễ</Text>
                  <Text style={styles.widgetValue}>{slaSummary.warning}</Text>
                  <View
                    style={[
                      styles.widgetBadge,
                      { backgroundColor: COLORS.SLA_WARNING },
                    ]}
                  >
                    <Text style={styles.widgetBadgeText}>Cảnh báo</Text>
                  </View>
                </View>
                <View style={styles.widgetCard}>
                  <Text style={styles.widgetTitle}>Quá SLA</Text>
                  <Text style={styles.widgetValue}>{slaSummary.overdue}</Text>
                  <View
                    style={[
                      styles.widgetBadge,
                      { backgroundColor: COLORS.SLA_OVERDUE },
                    ]}
                  >
                    <Text style={styles.widgetBadgeText}>Quá SLA</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>COD chờ</Text>
                  <Text style={styles.statValue}>{stats.pendingShippers}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Tiền COD</Text>
                  <Text style={styles.statValue}>
                    {stats.pendingCodTotal.toLocaleString()} đ
                  </Text>
                </View>
              </View>
              {[1, 2].includes(Number(user?.role_id)) && (
                <View>
                  <Text style={styles.sectionTitle}>SLA & Trễ hạn</Text>
                  <View style={styles.slaRow}>
                    <View style={styles.slaCard}>
                      <Text style={styles.slaLabel}>Đang giữ</Text>
                      <Text style={styles.slaValue}>{slaSummary.total}</Text>
                    </View>
                    <View style={styles.slaCard}>
                      <Text style={styles.slaLabel}>Cảnh báo</Text>
                      <Text style={styles.slaValue}>{slaSummary.warning}</Text>
                    </View>
                    <View style={styles.slaCard}>
                      <Text style={styles.slaLabel}>Trễ hạn</Text>
                      <Text style={styles.slaValue}>{slaSummary.overdue}</Text>
                    </View>
                  </View>
                </View>
              )}
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
      )}
    </View>
  );
}
