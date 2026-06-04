import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import EmptyState from "../components/EmptyState";
import SkeletonLoader from "../components/SkeletonLoader";
import TaskListStyles from "../styles/TaskListStyles";
import { deliveryService } from "../services/deliveryService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { BORDER_RADIUS, SPACING } from "../constants/theme";
import { isRouteAllowed } from "../utils/roleUtils";

const COMPLETED_STATUSES = ["SUCCESS", "FAILED", "DELIVERED"];
const SKELETON_ITEMS = ["s1", "s2", "s3", "s4", "s5"];

const getStatusMeta = (status) => {
  if (COMPLETED_STATUSES.includes(status)) {
    return {
      label: status === "FAILED" ? "Giao thất bại" : "Hoàn tất",
      backgroundColor:
        status === "FAILED" ? COLORS.dangerAccentBg : COLORS.successBg,
      color: status === "FAILED" ? COLORS.error : COLORS.successAccent,
    };
  }

  return {
    label: "Đang giao hàng",
    backgroundColor: COLORS.successBg,
    color: COLORS.successAccent,
  };
};

const getSLAMeta = (slaStatus) => {
  switch (slaStatus) {
    case "OVERDUE":
      return {
        badge: "QUÁ HẠN",
        badgeColor: COLORS.OVERDUE_BG,
        badgeTextColor: COLORS.dangerAccent,
        borderColor: COLORS.SLA_OVERDUE,
      };
    case "WARNING":
      return {
        badge: "SẮP TRỄ",
        badgeColor: COLORS.warningBg,
        badgeTextColor: COLORS.warningText,
        borderColor: COLORS.SLA_WARNING,
      };
    default:
      return null;
  }
};

const TaskCardSkeleton = () => (
  <View style={TaskListStyles.card}>
    <View style={TaskListStyles.skeletonTopRow}>
      <View style={TaskListStyles.skeletonCodeWrap}>
        <SkeletonLoader
          width="70%"
          height={SPACING.md_sm}
          borderRadius={BORDER_RADIUS.sm}
        />
        <View style={TaskListStyles.skeletonGapXs} />
        <SkeletonLoader
          width="50%"
          height={SPACING.md_sm}
          borderRadius={BORDER_RADIUS.sm}
        />
        <View style={TaskListStyles.skeletonGapXs} />
        <SkeletonLoader
          width="40%"
          height={SPACING.md}
          borderRadius={BORDER_RADIUS.sm}
        />
      </View>
      <SkeletonLoader
        width={SPACING.xxl + SPACING.sm}
        height={SPACING.lg}
        borderRadius={BORDER_RADIUS.round}
      />
    </View>

    <SkeletonLoader
      width="100%"
      height={SPACING.md_sm}
      borderRadius={BORDER_RADIUS.sm}
    />
    <View style={TaskListStyles.skeletonGapSm} />
    <SkeletonLoader
      width="85%"
      height={SPACING.md_sm}
      borderRadius={BORDER_RADIUS.sm}
    />

    <View style={TaskListStyles.skeletonMetaRow}>
      <SkeletonLoader
        width={SPACING.xxl + SPACING.md}
        height={SPACING.lg}
        borderRadius={BORDER_RADIUS.round}
      />
      <SkeletonLoader
        width={SPACING.xxl + SPACING.xl}
        height={SPACING.lg}
        borderRadius={BORDER_RADIUS.sm}
      />
    </View>
  </View>
);

export default function TaskListScreen({ navigation }) {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Current");

  useEffect(() => {
    if (!isRouteAllowed(user, "TaskList")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
      return;
    }

    if (user.token) {
      fetchTasks();
    }
  }, [user]);

  useEffect(() => {
    const notificationReceivedSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        if (data?.type === "waybill_transfer" || data?.action === "transfer") {
          Toast.show({
            type: "info",
            text1: "Bạn vừa nhận được đơn hàng điều chuyển mới",
            text2:
              data?.message ||
              "Vui lòng xem danh sách nhiệm vụ để biết chi tiết",
            visibilityTime: 3000,
          });
          fetchTasks();
        }
      });

    const notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === "waybill_transfer" || data?.action === "transfer") {
          fetchTasks();
        }
      });

    return () => {
      notificationReceivedSubscription?.remove();
      notificationResponseSubscription?.remove();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await deliveryService.getMyTasks(user.token);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const pendingTasks = useMemo(() => {
    const unsorted = tasks.filter(
      (item) => !COMPLETED_STATUSES.includes(item.status),
    );
    return unsorted.sort((a, b) => {
      const priorityMap = { OVERDUE: 0, WARNING: 1, ON_TIME: 2 };
      const aPriority = priorityMap[a.sla_status] ?? 2;
      const bPriority = priorityMap[b.sla_status] ?? 2;
      return aPriority - bPriority;
    });
  }, [tasks]);

  const completedTasks = useMemo(
    () => tasks.filter((item) => COMPLETED_STATUSES.includes(item.status)),
    [tasks],
  );

  const expressTasksCount = pendingTasks.filter(
    (item) => item.service_type === "EXPRESS",
  ).length;

  const displayedTasks =
    activeTab === "Current" ? pendingTasks : completedTasks;

  const renderTask = ({ item }) => {
    const statusMeta = getStatusMeta(item.status);
    const slaMeta = getSLAMeta(item.sla_status);

    return (
      <TouchableOpacity
        style={[
          TaskListStyles.card,
          slaMeta
            ? {
                backgroundColor: slaMeta.badgeColor,
                borderColor: slaMeta.borderColor,
                borderWidth: 1,
              }
            : null,
        ]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("TaskDetail", { waybill: item })}
      >
        <View style={TaskListStyles.cardTop}>
          <View style={TaskListStyles.codeWrap}>
            <Text style={TaskListStyles.code}>{item.waybill_code}</Text>
            <Text style={TaskListStyles.nameLine}>{item.receiver_name}</Text>
            <Text style={TaskListStyles.phoneLine}>{item.receiver_phone}</Text>
          </View>
          <View
            style={[
              TaskListStyles.statusBadge,
              { backgroundColor: statusMeta.backgroundColor },
            ]}
          >
            <Text
              style={[TaskListStyles.statusText, { color: statusMeta.color }]}
            >
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {slaMeta ? (
          <View
            style={[
              TaskListStyles.slaBadge,
              {
                backgroundColor: slaMeta.badgeColor,
                borderLeftColor: slaMeta.borderColor,
              },
            ]}
          >
            <Text
              style={[
                TaskListStyles.slaBadgeText,
                { color: slaMeta.badgeTextColor },
              ]}
            >
              {slaMeta.badge}
            </Text>
          </View>
        ) : null}

        <View style={TaskListStyles.addressRow}>
          <Ionicons
            name="location-outline"
            size={SPACING.md_sm}
            color={COLORS.neutralMuted}
          />
          <Text style={TaskListStyles.addressText} numberOfLines={2}>
            {item.receiver_address || "Chưa có địa chỉ giao hàng"}
          </Text>
        </View>

        <View style={TaskListStyles.metaRow}>
          <View style={TaskListStyles.serviceBadge}>
            <Text style={TaskListStyles.serviceBadgeText}>
              {item.service_type || "STANDARD"}
            </Text>
          </View>
          <Text style={TaskListStyles.codText}>
            COD: {Number(item.cod_amount || 0).toLocaleString("vi-VN")} d
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={TaskListStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={TaskListStyles.headerArea}>
        <View style={TaskListStyles.headerCircleDecoration} />
        <View style={TaskListStyles.headerTop}>
          <View>
            <Text style={TaskListStyles.greeting}>Xin chào,</Text>
            <Text style={TaskListStyles.name}>
              {user.full_name || user.username || "Người giao hàng"}
            </Text>
          </View>
          <View style={TaskListStyles.headerRight}>
            <View style={TaskListStyles.roleBadge}>
              <View style={TaskListStyles.roleDot} />
              <Text style={TaskListStyles.roleText}>
                {user.role || "Shipper"}
              </Text>
            </View>
            <TouchableOpacity
              style={TaskListStyles.avatarWrap}
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons
                name="person"
                size={SPACING.md_sm}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={TaskListStyles.tabContainerWrapper}>
        <View style={TaskListStyles.tabContainer}>
          <TouchableOpacity
            style={[
              TaskListStyles.tabButton,
              activeTab === "Current" && TaskListStyles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("Current")}
          >
            <Text
              style={[
                TaskListStyles.tabText,
                activeTab === "Current" && TaskListStyles.tabTextActive,
              ]}
            >
              Chờ giao ({pendingTasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              TaskListStyles.tabButton,
              activeTab === "Completed" && TaskListStyles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("Completed")}
          >
            <Text
              style={[
                TaskListStyles.tabText,
                activeTab === "Completed" && TaskListStyles.tabTextActive,
              ]}
            >
              Hoàn tất ({completedTasks.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <FlatList
          data={SKELETON_ITEMS}
          keyExtractor={(item) => item}
          renderItem={() => <TaskCardSkeleton />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={TaskListStyles.listContent}
        />
      ) : (
        <FlatList
          data={displayedTasks}
          keyExtractor={(item, index) =>
            String(item.waybill_id || item.waybill_code || index)
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={TaskListStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.secondary]}
            />
          }
          ListHeaderComponent={
            activeTab === "Current" && expressTasksCount > 0 ? (
              <View style={TaskListStyles.warningBanner}>
                <Ionicons
                  name="time-outline"
                  size={SPACING.md_sm}
                  color={COLORS.processScanOrange}
                />
                <Text style={TaskListStyles.warningText}>
                  {expressTasksCount} đơn hàng hỏa tốc cần ưu tiên giao trong
                  ngày
                </Text>
              </View>
            ) : null
          }
          renderItem={renderTask}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-text-outline"
              title="Chưa có nhiệm vụ nào"
              message="Danh sách nhiệm vụ hiện đang trống. Hay tải lại để cập nhật dữ liệu mới nhất."
              actionButton={{
                label: "Tải lại trang",
                onPress: fetchTasks,
              }}
            />
          }
        />
      )}

      <TouchableOpacity
        style={TaskListStyles.fab}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("ScanTask")}
      >
        <Ionicons
          name="qr-code-outline"
          size={SPACING.xl}
          color={COLORS.white}
        />
      </TouchableOpacity>

      <Toast />
    </View>
  );
}
