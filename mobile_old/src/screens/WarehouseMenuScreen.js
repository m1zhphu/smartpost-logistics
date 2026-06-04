import React, { useCallback, useEffect, useMemo, useState } from "react";
import {  FlatList, RefreshControl, StatusBar, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import {
  getRoleKey,
  getRoleLabel,
  roleRouteGroups,
  isRouteAllowed,
} from "../utils/roleUtils";
import { waybillService } from "../services/waybillService";
import { accountingService } from "../services/accountingService";
import { COLORS } from "../constants/colors";
import { SPACING, TYPOGRAPHY } from "../constants/theme";
import CustomButton from "../components/CustomButton";
import EmptyState from "../components/EmptyState";
import SkeletonLoader from "../components/SkeletonLoader";
import styles from "../styles/WarehouseMenuStyles";
import Toast from "react-native-toast-message";

export default function WarehouseMenuScreen({ navigation }) {
  const { user } = useUser();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    inHubInventory: 0,
    pendingShippers: 0,
  });

  const roleKey = getRoleKey(user);
  const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;

  const mainFunctions = useMemo(
    () => [
      {
        id: "CreateWaybill",
        title: "Tạo vận đơn",
        sub: "Tạo mới đơn hàng",
        icon: "add-circle-outline",
      },
      {
        id: "ScanInHub",
        title: "Nhập kho",
        sub: "Quét nhận hàng vào",
        icon: "log-in-outline",
      },
      {
        id: "ScanBagging",
        title: "Đóng túi",
        sub: "Đóng gói vận chuyển",
        icon: "briefcase-outline",
      },
      {
        id: "ScanManifestLoad",
        title: "Bốc lên xe",
        sub: "Load manifest xuất",
        icon: "swap-horizontal-outline",
      },
    ],
    [],
  );

  const otherFunctions = useMemo(
    () => [
      {
        id: "ScanManifestUnload",
        title: "Gỡ xuống xe",
        sub: "Nhận hàng từ tài xế",
        icon: "arrow-down-outline",
      },
      {
        id: "AssignShipper",
        title: "Giao shipper",
        sub: "Phân công giao hàng",
        icon: "people-outline",
      },
      {
        id: "CashConfirm",
        title: "Thu tiền COD",
        sub: "Xác nhận thanh toán",
        icon: "card-outline",
      },
      {
        id: "WaybillList",
        title: "DS vận đơn",
        sub: "Tra cứu & chỉnh sửa",
        icon: "list-outline",
      },
      {
        id: "PricingRules",
        title: "Cấu hình giá",
        sub: "Quản lý bảng giá",
        icon: "calculator-outline",
      },
      {
        id: "StaffManagement",
        title: "Quản lý nhân sự",
        sub: "Nhân viên & tài xế",
        icon: "people-circle-outline",
      },
      {
        id: "HubManagement",
        title: "Hệ thống bưu cục",
        sub: "Quản trị mạng lưới",
        icon: "business-outline",
      },
      {
        id: "AdminOperations",
        title: "Quản trị hệ thống",
        sub: "Thiết lập vận hành",
        icon: "settings-outline",
      },
    ],
    [],
  );

  const visibleMainFunctions = mainFunctions.filter((item) =>
    allowedRoutes.includes(item.id),
  );
  const visibleOtherFunctions = otherFunctions.filter((item) =>
    allowedRoutes.includes(item.id),
  );

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const hubIdFilter = user.role_id === 1 ? undefined : user.primary_hub_id;
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date();
      endToday.setHours(23, 59, 59, 999);

      const [todayRes, inHubRes, cashList] = await Promise.all([
        waybillService.searchWaybills(user.token, {
          origin_hub_id: hubIdFilter,
          start_date: startToday.toISOString(),
          end_date: endToday.toISOString(),
          page: 1,
          size: 1,
        }),
        waybillService.searchWaybills(user.token, {
          status: "IN_HUB",
          dest_hub_id: hubIdFilter,
          page: 1,
          size: 1,
        }),
        accountingService.getCashConfirmationList(user.token).catch(() => []),
      ]);

      setStats({
        todayOrders: todayRes?.total || todayRes?.items?.length || 0,
        inHubInventory: inHubRes?.total || inHubRes?.items?.length || 0,
        pendingShippers: Array.isArray(cashList) ? cashList.length : 0,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: error.message || "Không thể tải dữ liệu bảng điều khiển.",
      });
    }
       finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isRouteAllowed(user, "WarehouseMenu")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
      return;
    }

    if (isFocused) {
      fetchDashboardData();
    }
  }, [isFocused, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const renderStatCard = (label, value, unit) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      {loading ? (
        <SkeletonLoader height={TYPOGRAPHY.lineHeight.headingSm} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );

  const renderMainItem = ({ item }) => (
    <View style={styles.mainGridItem}>
      <CustomButton
        title={item.title}
        onPress={() => navigation.navigate(item.id)}
        style={styles.mainCardButton}
        contentStyle={styles.mainCardContent}
        leftIcon={({ color }) => (
          <Ionicons name={item.icon} size={TYPOGRAPHY.fontSize.subtitle} color={color} />
        )}
      />
      <Text style={styles.mainCardSub}>{item.sub}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={styles.mainHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.hubInfo}>
            <View style={styles.hubIconWrap}>
              <Ionicons
                name={roleKey === "admin" ? "globe-outline" : "home-outline"}
                size={TYPOGRAPHY.fontSize.bodySm}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.hubName}>
              {roleKey === "admin"
                ? "Trung tâm toàn quốc"
                : `Bưu cục ${user.primary_hub_id || user.hub_id || "N/A"}`}
            </Text>
          </View>
        </View>

        <Text style={styles.headerSubTitle}>VẬN HÀNH</Text>
        <Text style={styles.headerTitle}>{getRoleLabel(user)}</Text>

        <View style={styles.statsRow}>
          {renderStatCard("Hôm nay", stats.todayOrders, "vận đơn")}
          {renderStatCard("Tồn kho", stats.inHubInventory, "kiện")}
          {renderStatCard("COD chờ", stats.pendingShippers, "shipper")}
        </View>
      </View>

      <FlatList
        data={visibleMainFunctions}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.mainGridRow}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={<Text style={styles.sectionTitle}>CHỨC NĂNG CHÍNH</Text>}
        ListEmptyComponent={
          <EmptyState
            icon="view-grid-outline"
            title="Không có chức năng chính"
            message="Vai trò hiện tại chưa được cấp chức năng thao tác."
          />
        }
        renderItem={renderMainItem}
        ListFooterComponent={
          <View style={styles.footerContainer}>
            <Text style={styles.sectionTitle}>THAO TÁC KHÁC</Text>

            {visibleOtherFunctions.length > 0 ? (
              <View style={styles.otherList}>
                {visibleOtherFunctions.map((item) => (
                  <CustomButton
                    key={item.id}
                    title={item.title}
                    variant="outline"
                    onPress={() => navigation.navigate(item.id)}
                    style={styles.otherItemButton}
                    contentStyle={styles.otherItemContent}
                    leftIcon={({ color }) => (
                      <Ionicons
                        name={item.icon}
                        size={TYPOGRAPHY.fontSize.body}
                        color={color}
                      />
                    )}
                    rightIcon={({ color }) => (
                      <Ionicons
                        name="chevron-forward-outline"
                        size={TYPOGRAPHY.fontSize.body}
                        color={color}
                      />
                    )}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="view-grid-outline"
                title="Không có chức năng"
                message="Vai trò hiện tại chưa có thao tác bổ sung."
              />
            )}
          </View>
        }
      />
    </View>
  );
}
