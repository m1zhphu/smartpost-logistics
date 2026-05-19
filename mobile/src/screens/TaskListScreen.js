import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import TaskListStyles from "../styles/TaskListStyles";
import { deliveryService } from "../services/deliveryService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";

const COMPLETED_STATUSES = ["SUCCESS", "FAILED", "DELIVERED"];

const getStatusMeta = (status) => {
  if (COMPLETED_STATUSES.includes(status)) {
    return {
      label: status === "FAILED" ? "Giao thất bại" : "Hoàn tất",
      backgroundColor: status === "FAILED" ? "#fee2e2" : "#edf8ef",
      color: status === "FAILED" ? COLORS.error : COLORS.secondary,
    };
  }

  return {
    label: "Đang giao hàng",
    backgroundColor: "#edf8ef",
    color: COLORS.secondary,
  };
};

// Hàm lấy SLA metadata để hiển thị cảnh báo
const getSLAMeta = (slaStatus) => {
  switch (slaStatus) {
    case "OVERDUE":
      return {
        badge: "🔴 QUÁ HẠN",
        badgeColor: "#FFF1F2",
        badgeTextColor: "#C2185B",
        borderColor: "#EF5350",
      };
    case "WARNING":
      return {
        badge: "🟠 SẮP TRỄ",
        badgeColor: "#FFF8E1",
        badgeTextColor: "#F57F17",
        borderColor: "#FBC02D",
      };
    default:
      return null;
  }
};

export default function TaskListScreen({ navigation }) {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Current");

  useEffect(() => {
    if (!isRouteAllowed(user, "TaskList")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return;
    }
    if (user.token) {
      fetchTasks();
    }
  }, [user]);

  // [PUSH-NOTIFICATION] Lắng nghe notification khi app đang mở
  useEffect(() => {
    let notificationReceivedSubscription;
    let notificationResponseSubscription;

    // Xử lý khi notification đến lúc app mở
    notificationReceivedSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(
          "[PUSH-LISTENER] Notification received:",
          notification.request.content,
        );

        const data = notification.request.content.data;
        // Nếu notification là về điều chuyển đơn hàng, tự động refresh danh sách
        if (data?.type === "waybill_transfer" || data?.action === "transfer") {
          console.log(
            "[PUSH-LISTENER] Waybill transfer detected - auto-refreshing tasks",
          );

          // Hiển thị toast thông báo
          Toast.show({
            type: "info",
            text1: "📦 Bạn vừa nhận được đơn hàng điều chuyển mới!",
            text2: data?.message || "Vui lòng xem danh sách nhiệm vụ",
            visibilityTime: 3000,
          });

          // Tự động refresh danh sách tasks
          fetchTasks();
        }
      });

    // Xử lý khi user bấm vào notification
    notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "[PUSH-LISTENER] Notification response:",
          response.notification.request.content,
        );

        const data = response.notification.request.content.data;
        // Nếu user bấm vào notification về điều chuyển, refresh danh sách
        if (data?.type === "waybill_transfer" || data?.action === "transfer") {
          console.log(
            "[PUSH-LISTENER] User tapped transfer notification - auto-refreshing tasks",
          );
          fetchTasks();
        }
      });

    // Cleanup subscriptions khi component unmount
    return () => {
      notificationReceivedSubscription?.remove();
      notificationResponseSubscription?.remove();
    };
  }, []); // Chỉ setup listeners một lần khi component mount

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
    // Ưu tiên: OVERDUE > WARNING > ON_TIME
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

    // Nếu có cảnh báo SLA, sử dụng nền từ SLA thay vì status
    const cardBackgroundColor = slaMeta ? slaMeta.badgeColor : undefined;
    const cardBorderColor = slaMeta ? slaMeta.borderColor : undefined;

    return (
      <TouchableOpacity
        style={[
          TaskListStyles.card,
          cardBackgroundColor && { backgroundColor: cardBackgroundColor },
          cardBorderColor && { borderWidth: 1.5, borderColor: cardBorderColor },
        ]}
        activeOpacity={0.85}
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

        {/* Hiển thị SLA warning badge nếu có */}
        {slaMeta && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              marginBottom: 8,
              backgroundColor: slaMeta.badgeColor,
              borderRadius: 4,
              borderLeftWidth: 3,
              borderLeftColor: slaMeta.borderColor,
            }}
          >
            <Text
              style={{
                color: slaMeta.badgeTextColor,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {slaMeta.badge}
            </Text>
          </View>
        )}

        <View style={TaskListStyles.addressRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color="#7b867e"
            style={{ marginRight: 8, marginTop: 2 }}
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
            COD: {Number(item.cod_amount || 0).toLocaleString("vi-VN")} đ
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
              <Ionicons name="person" size={20} color={COLORS.primary} />
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
                size={20}
                color={COLORS.processScanOrange}
              />
              <Text style={TaskListStyles.warningText}>
                {expressTasksCount} đơn hỏa tốc cần ưu tiên giao trong ngày
              </Text>
            </View>
          ) : null
        }
        renderItem={renderTask}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.secondary}
              style={{ marginTop: 50 }}
            />
          ) : (
            <View style={TaskListStyles.emptyState}>
              <Ionicons
                name="checkmark-done-circle"
                size={80}
                color={COLORS.secondary}
              />
              <Text style={TaskListStyles.emptyTitle}>Không có đơn hàng</Text>
              <Text style={TaskListStyles.emptySub}>
                Không có đơn hàng nào trong mục này.
              </Text>
            </View>
          )
        }
      />

      <TouchableOpacity
        style={TaskListStyles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ScanTask")}
      >
        <Ionicons name="qr-code-outline" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* [PUSH-NOTIFICATION] Toast container để hiển thị thông báo khi nhận transfer */}
      <Toast />
    </View>
  );
}
