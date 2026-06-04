import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useUser } from "../context/UserContext";
import {
  getHomeMenuItems,
  getRoleKey,
  getRoleLabel,
  getBottomTabItems,
  isRouteAllowed,
} from "../utils/roleUtils";
import { deliveryService } from "../services/deliveryService";
import { waybillService } from "../services/waybillService";
import HomeStyles from "../styles/HomeStyles";
import { COLORS } from "../constants/colors";

// ─── Route → icon / màu sắc ───────────────────────────────────────────────────
const ROUTE_META = {
  CreateWaybill: {
    icon: "cube-outline",
    bg: COLORS.blueAccentBg,
    color: COLORS.blueAccent,
    accent: COLORS.blueAccent,
    sub: "Nhập hàng mới",
  },
  ScanTask: {
    icon: "scan-outline",
    bg: COLORS.amberAccentBg,
    color: COLORS.amberAccent,
    accent: COLORS.amberAccent,
    sub: "Scan barcode",
  },
  TaskList: {
    icon: "list-outline",
    bg: COLORS.amberAccentBg,
    color: COLORS.amberAccent,
    accent: COLORS.amberAccent,
    sub: "Nhiệm vụ",
  },
  ShopStatement: {
    icon: "receipt-outline",
    bg: COLORS.purpleAccentBg,
    color: COLORS.purpleAccent,
    accent: COLORS.purpleAccent,
    sub: "Sao kê cửa hàng",
  },
  AccountingDashboard: {
    icon: "bar-chart-outline",
    bg: COLORS.purpleAccentBg,
    color: COLORS.purpleAccent,
    accent: COLORS.purpleAccent,
    sub: "Tổng quan",
  },
  CashConfirm: {
    icon: "cash-outline",
    bg: COLORS.purpleAccentBg,
    color: COLORS.purpleAccent,
    accent: COLORS.purpleAccent,
    sub: "Xác nhận tiền mặt",
  },
  WarehouseDashboard: {
    icon: "grid-outline",
    bg: COLORS.successBg,
    color: COLORS.successAccent,
    accent: COLORS.successAccent,
    sub: "Tổng quan kho",
  },
  WarehouseMenu: {
    icon: "layers-outline",
    bg: COLORS.successBg,
    color: COLORS.successAccent,
    accent: COLORS.successAccent,
    sub: "Menu kho",
  },
  ScanInHub: {
    icon: "log-in-outline",
    bg: COLORS.successBg,
    color: COLORS.successAccent,
    accent: COLORS.successAccent,
    sub: "Nhập kho",
  },
  ScanBagging: {
    icon: "bag-outline",
    bg: COLORS.successBg,
    color: COLORS.successAccent,
    accent: COLORS.successAccent,
    sub: "Đóng túi",
  },
  ScanManifestLoad: {
    icon: "arrow-up-circle-outline",
    bg: COLORS.successBg,
    color: COLORS.successAccent,
    accent: COLORS.successAccent,
    sub: "Load hàng",
  },
  ScanManifestUnload: {
    icon: "arrow-down-circle-outline",
    bg: COLORS.successBg,
    color: COLORS.successAccent,
    accent: COLORS.successAccent,
    sub: "Dỡ hàng",
  },
  HubManagement: {
    icon: "business-outline",
    bg: COLORS.dangerAccentBg,
    color: COLORS.dangerAccent,
    accent: COLORS.dangerAccent,
    sub: "Quản lý hub",
  },
  StaffManagement: {
    icon: "people-outline",
    bg: COLORS.dangerAccentBg,
    color: COLORS.dangerAccent,
    accent: COLORS.dangerAccent,
    sub: "Nhân sự",
  },
  AdminOperations: {
    icon: "settings-outline",
    bg: COLORS.dangerAccentBg,
    color: COLORS.dangerAccent,
    accent: COLORS.dangerAccent,
    sub: "Vận hành",
  },
};

const getMeta = (route) =>
  ROUTE_META[route] ?? {
    icon: "apps-outline",
    bg: COLORS.inputBg,
    color: COLORS.neutralMid,
    accent: COLORS.neutralMid,
    sub: "",
  };

const ACTION_LIMIT = 6;
const CUSTOM_ACTIONS_KEY = "@HomeScreen:customActions";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, valueColor, loading }) {
  return (
    <View style={HomeStyles.statCard}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Text style={[HomeStyles.statValue, { color: valueColor }]}>
          {value}
        </Text>
      )}
      <Text style={HomeStyles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ item, onPress, style }) {
  const meta = getMeta(item.route);
  return (
    <TouchableOpacity
      style={[HomeStyles.actionCard, style]}
      activeOpacity={0.82}
      onPress={() => onPress(item.route)}
    >
      {/* Accent bar trên đầu card */}
      <View
        style={[HomeStyles.cardTopAccent, { backgroundColor: meta.accent }]}
      />

      <View style={[HomeStyles.actionIcon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      <Text style={HomeStyles.actionLabel} numberOfLines={2}>
        {item.label}
      </Text>
      {meta.sub ? (
        <Text style={HomeStyles.actionSub} numberOfLines={1}>
          {meta.sub}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ dotColor, title, badgeText, badgeStyle }) {
  return (
    <View style={HomeStyles.activityRow}>
      <View style={[HomeStyles.actDot, { backgroundColor: dotColor }]} />
      <Text style={HomeStyles.actTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={[HomeStyles.actBadge, badgeStyle]}>
        <Text
          style={[HomeStyles.actBadgeText, { color: badgeStyle?.textColor }]}
        >
          {badgeText}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const menuItems = getHomeMenuItems(user);
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const { width, height } = useWindowDimensions();
  const [showAllActions, setShowAllActions] = useState(false);
  const [customActions, setCustomActions] = useState([]);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState({
    total: 0,
    on_time: 0,
    warning: 0,
    overdue: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [savingCustomActions, setSavingCustomActions] = useState(false);

  const displayName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Người dùng";
  const roleText = getRoleLabel(user);
  const bottomTabs = getBottomTabItems(user);
  const isShipper = getRoleKey(user) === "shipper";
  const scanTaskAvailable = isRouteAllowed(user, "ScanTask");
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 18 : 14);

  useEffect(() => {
    if (
      isShipper &&
      user?.isAuthenticated &&
      isRouteAllowed(user, "TaskList")
    ) {
      navigation.replace("TaskList");
    }
  }, [isShipper, user?.isAuthenticated, navigation]);
  const isCompactScreen = width < 380 || height < 660;
  const actionColumns = isCompactScreen ? 1 : 2;
  const actionCardWidth = actionColumns === 1 ? "100%" : "48.5%";

  const pinnedActionItems = safeMenuItems.filter((item) =>
    customActions.includes(item.route),
  );
  const availableCustomActions = safeMenuItems.filter(
    (item) => !customActions.includes(item.route),
  );
  const filteredMenuItems = safeMenuItems.filter(
    (item) => !customActions.includes(item.route),
  );

  const displayedActions = showAllActions
    ? filteredMenuItems
    : filteredMenuItems.slice(0, ACTION_LIMIT);

  const actionGridStyle = [
    HomeStyles.actionGrid,
    {
      justifyContent: actionColumns === 1 ? "center" : "space-between",
      gap: actionColumns === 1 ? 10 : 10,
    },
  ];
  const actionCardItemStyle = { width: actionCardWidth };
  const homeContentContainerStyle = [
    HomeStyles.homeContent,
    { paddingBottom: HomeStyles.homeContent.paddingBottom + bottomInset },
  ];

  const activitySummaryLabel = (item) => {
    if (!item) return "Hoạt động";
    return item.waybill_code
      ? `${item.waybill_code} · ${item.receiver_name || item.receiver_phone || ""}`
      : item.title || "Hoạt động";
  };

  const loadCustomActions = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_ACTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomActions(parsed);
        }
      }
    } catch (error) {
      console.warn("Lỗi load custom actions", error);
    }
  };

  const saveCustomActions = async (routes) => {
    try {
      setSavingCustomActions(true);
      await AsyncStorage.setItem(CUSTOM_ACTIONS_KEY, JSON.stringify(routes));
      setCustomActions(routes);
    } catch (error) {
      console.warn("Lỗi lưu custom actions", error);
    } finally {
      setSavingCustomActions(false);
    }
  };

  const fetchDashboardSummary = async () => {
    if (!user?.token) {
      return;
    }
    setLoadingSummary(true);
    try {
      const summary = await waybillService.getDashboardSummary(user.token);
      setDashboardSummary({
        total: summary?.total || 0,
        on_time: summary?.on_time || 0,
        warning: summary?.warning || 0,
        overdue: summary?.overdue || 0,
      });
    } catch (error) {
      console.warn("Lỗi tải summary", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchActivities = async () => {
    if (!user?.token) {
      return;
    }
    setLoadingActivities(true);
    try {
      const items = await deliveryService.getMyTasks(user.token);
      setActivities(Array.isArray(items) ? items.slice(0, 5) : []);
    } catch (error) {
      console.warn("Lỗi tải hoạt động", error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadCustomActions();
    fetchDashboardSummary();
    fetchActivities();
  }, [user?.token]);

  const handleAddCustomAction = (route) => {
    if (!route || customActions.includes(route)) {
      return;
    }
    saveCustomActions([...customActions, route]);
    setCustomModalVisible(false);
  };

  const handleRemoveCustomAction = (route) => {
    saveCustomActions(customActions.filter((item) => item !== route));
  };

  // Avatar initials tự động
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(-2)
    .join("");

  const handleNavigate = (route) => {
    if (!route) return;
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={HomeStyles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── HEADER BANNER (xanh lá primary) ── */}
      <View style={HomeStyles.headerBanner}>
        <View style={HomeStyles.headerTop}>
          <View style={HomeStyles.homeTextGroup}>
            <Text style={HomeStyles.homeGreeting}>Xin chào,</Text>
            <Text style={HomeStyles.homeName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={HomeStyles.rolePill}>
              <View style={HomeStyles.roleDot} />
              <Text style={HomeStyles.roleText}>{roleText}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={HomeStyles.profileButton}
            onPress={() => handleNavigate("Profile")}
            activeOpacity={0.82}
          >
            <View style={HomeStyles.avatarCircle}>
              <Text style={HomeStyles.avatarText}>{initials}</Text>
            </View>
            <Text style={HomeStyles.profileButtonText}>Hồ sơ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── STAT CARDS nổi lên từ banner ── */}
      <View style={HomeStyles.statRow}>
        <StatCard
          value={dashboardSummary.total.toString()}
          label="Tổng đơn"
          valueColor={COLORS.successAccent}
          loading={loadingSummary}
        />
        <StatCard
          value={dashboardSummary.on_time.toString()}
          label="Đúng hẹn"
          valueColor={COLORS.secondary}
          loading={loadingSummary}
        />
        <StatCard
          value={dashboardSummary.warning.toString()}
          label="Cảnh báo"
          valueColor={COLORS.amberAccent}
          loading={loadingSummary}
        />
        <StatCard
          value={dashboardSummary.overdue.toString()}
          label="Quá hạn"
          valueColor={COLORS.dangerAccent}
          loading={loadingSummary}
        />
      </View>

      {/* ── SCROLL CONTENT ── */}
      <ScrollView
        contentContainerStyle={homeContentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* Chức năng chính */}
        <View style={HomeStyles.sectionHeader}>
          <Text style={HomeStyles.sectionTitle}>Chức năng chính</Text>
          <TouchableOpacity
            onPress={() => setCustomModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text style={HomeStyles.customizeActionText}>Tùy chỉnh</Text>
          </TouchableOpacity>
        </View>

        {safeMenuItems.length > 0 ? (
          <>
            {pinnedActionItems.length > 0 && (
              <>
                <View style={HomeStyles.sectionHeader}>
                  <Text style={HomeStyles.sectionTitle}>Chức năng ghim</Text>
                  <Text style={HomeStyles.sectionSub}>Dùng nhanh</Text>
                </View>
                <View style={actionGridStyle}>
                  {pinnedActionItems.map((item) => (
                    <ActionCard
                      key={`${item.route}-pinned`}
                      item={item}
                      onPress={handleNavigate}
                      style={actionCardItemStyle}
                    />
                  ))}
                </View>
              </>
            )}

            <View style={actionGridStyle}>
              {displayedActions.map((item) => (
                <ActionCard
                  key={item.route}
                  item={item}
                  onPress={handleNavigate}
                  style={actionCardItemStyle}
                />
              ))}
            </View>

            {filteredMenuItems.length > ACTION_LIMIT && (
              <TouchableOpacity
                style={HomeStyles.viewMoreButton}
                onPress={() => setShowAllActions(!showAllActions)}
                activeOpacity={0.8}
              >
                <Text style={HomeStyles.viewMoreText}>
                  {showAllActions
                    ? "Thu gọn"
                    : `Xem thêm (${filteredMenuItems.length - ACTION_LIMIT})`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={HomeStyles.emptyState}>
            <Ionicons
              name="lock-closed-outline"
              size={28}
              color={COLORS.textGray}
            />
            <Text style={HomeStyles.emptyTitle}>Không có chức năng nào</Text>
            <Text style={HomeStyles.emptyText}>
              Tài khoản chưa được cấp quyền. Liên hệ quản trị viên để được hỗ
              trợ.
            </Text>
          </View>
        )}

        {/* Hoạt động gần đây */}
        <View style={HomeStyles.sectionHeader}>
          <Text style={HomeStyles.sectionTitle}>Hoạt động gần đây</Text>
          <Text style={HomeStyles.sectionSub}>Hôm nay</Text>
        </View>

        <View style={HomeStyles.activityCard}>
          {loadingActivities ? (
            <View style={HomeStyles.loadingActivity}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : activities.length > 0 ? (
            activities.map((item, index) => {
              const status = (item.status || item.state || "")
                .toString()
                .toLowerCase();
              const title = activitySummaryLabel(item);
              const badgeText = item.status || item.state || "Mới";
              const badgeStyle =
                status.includes("delivered") || status.includes("success")
                  ? HomeStyles.badgeGreen
                  : status.includes("warning") ||
                      status.includes("hold") ||
                      status.includes("issue")
                    ? HomeStyles.badgeAmber
                    : HomeStyles.badgeBlue;

              return (
                <ActivityRow
                  key={`${item.id || item.waybill_code || index}-${index}`}
                  dotColor={
                    badgeStyle === HomeStyles.badgeGreen
                      ? COLORS.successAccent
                      : badgeStyle === HomeStyles.badgeAmber
                        ? COLORS.amberAccent
                        : COLORS.blueAccent
                  }
                  title={title}
                  badgeText={badgeText}
                  badgeStyle={badgeStyle}
                />
              );
            })
          ) : (
            <View style={HomeStyles.emptyState}>
              <Text style={HomeStyles.emptyTitle}>
                Không có hoạt động gần đây
              </Text>
              <Text style={HomeStyles.emptyText}>
                Dữ liệu đang được cập nhật hoặc bạn chưa có hoạt động phù hợp.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── SCAN TASK FAB cho Shipper ── */}
      {isShipper && scanTaskAvailable && (
        <TouchableOpacity
          style={[
            HomeStyles.floatingAction,
            { bottom: HomeStyles.floatingAction.bottom + bottomInset },
          ]}
          activeOpacity={0.88}
          onPress={() => handleNavigate("ScanTask")}
        >
          <Ionicons name="qr-code-outline" size={20} color={COLORS.white} />
          <Text style={HomeStyles.floatingText}>Quét nhiệm vụ</Text>
        </TouchableOpacity>
      )}

      {/* ── BOTTOM TABS ── */}
      <View
        style={[
          HomeStyles.bottomTabsContainer,
          {
            paddingBottom:
              HomeStyles.bottomTabsContainer.paddingBottom + bottomInset,
          },
        ]}
      >
        {bottomTabs.map((tab) => {
          const isActive = tab.route === "Home";
          return (
            <TouchableOpacity
              key={tab.route}
              style={HomeStyles.bottomTabItem}
              activeOpacity={0.8}
              onPress={() => handleNavigate(tab.route)}
            >
              <View
                style={[
                  HomeStyles.bottomTabIcon,
                  isActive && HomeStyles.bottomTabIconActive,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={isActive ? COLORS.secondary : COLORS.textGray}
                />
              </View>
              <Text
                style={[
                  HomeStyles.bottomTabLabel,
                  isActive && HomeStyles.bottomTabActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={customModalVisible} transparent animationType="fade">
        <View style={HomeStyles.modalOverlay}>
          <View style={HomeStyles.modalContent}>
            <Text style={HomeStyles.modalTitle}>Ghim chức năng</Text>
            <Text style={HomeStyles.modalSubtitle}>
              Chọn các chức năng bạn muốn xuất hiện nhanh trên Home.
            </Text>

            <ScrollView
              style={HomeStyles.modalList}
              contentContainerStyle={HomeStyles.modalListContent}
              showsVerticalScrollIndicator={false}
            >
              {availableCustomActions.length === 0 ? (
                <View style={HomeStyles.emptyState}>
                  <Text style={HomeStyles.emptyTitle}>
                    Không còn chức năng để ghim
                  </Text>
                  <Text style={HomeStyles.emptyText}>
                    Bạn có thể bỏ ghim các chức năng đã ghim để thêm mới.
                  </Text>
                </View>
              ) : (
                availableCustomActions.map((item) => (
                  <Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    key={item.route}
                    style={HomeStyles.modalItem}
                    onPress={() => handleAddCustomAction(item.route)}
                  >
                    <Text style={HomeStyles.modalItemText}>{item.label}</Text>
                    <Text style={HomeStyles.modalItemAction}>Ghim</Text>
                  </Pressable>
                ))
              )}

              {pinnedActionItems.length > 0 && (
                <View style={HomeStyles.modalSection}>
                  <Text style={HomeStyles.modalSectionTitle}>Đã ghim</Text>
                  {pinnedActionItems.map((item) => (
                    <Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      key={`remove-${item.route}`}
                      style={HomeStyles.modalItem}
                      onPress={() => handleRemoveCustomAction(item.route)}
                    >
                      <Text style={HomeStyles.modalItemText}>{item.label}</Text>
                      <Text style={HomeStyles.modalRemoveText}>Bỏ ghim</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={HomeStyles.modalActions}>
              <Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={HomeStyles.modalCancelButton}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={HomeStyles.modalCancelText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
