import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { useQueue } from "../context/QueueContext";
import { useUser } from "../context/UserContext";
import GlobalChat from "../components/GlobalChat";
import NotificationModal from "../components/NotificationModal";
import styles from "../styles/HomeScreenStyles";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function HomeScreen({ navigation }) {
  const { user, roles, logout, isWarehouseStaff, unreadCount, toggleUserOnlineStatus } = useUser();
  const { clearQueue } = useQueue();
  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const roleId = user?.role_id || roles?.[0]?.role_id;
  const isShipperRole = roleId === 4;
  const isPickupOperator = [1, 2, 3, 7].includes(roleId);

  const handleLogout = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          clearQueue();
          logout();
        },
      },
    ]);
  };

  const handleFeaturePress = async (screenName) => {
    const userType = await AsyncStorage.getItem("user_type");
    if (userType === "employee") {
      Alert.alert(
        "Tính năng chưa phát triển",
        "Tính năng này đang được phát triển cho hệ thống Kho và sẽ sớm ra mắt.",
      );
      return;
    }
    navigation.navigate(screenName);
  };

  const handleToggleOnline = () => {
    if (!isShipperRole) {
      return;
    }

    const nextStatus = !user?.is_online;
    const note = nextStatus ? "Bắt đầu ca làm" : "Kết thúc ca làm";

    Alert.alert("Trạng thái hoạt động", `Bạn có muốn ${nextStatus ? "bật" : "tắt"} online?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          try {
            const { shipperService } = require("../services/shipper");
            await shipperService.toggleAvailability(nextStatus, note);
            toggleUserOnlineStatus(nextStatus);
            Toast.show({ type: "success", text1: "Đã cập nhật trạng thái" });
          } catch (error) {
            Toast.show({ type: "error", text1: "Không thể cập nhật trạng thái" });
          }
        },
      },
    ]);
  };

  const CircleButton = ({ icon, onPress, children, style }) => (
    <TouchableOpacity onPress={onPress} style={[styles.circleButton, style]} activeOpacity={0.78}>
      <Ionicons name={icon} size={22} color={COLORS.white} />
      {children}
    </TouchableOpacity>
  );

  const MenuItem = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.gridIconBox, { backgroundColor: `${color}15`, borderColor: `${color}25` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.gridCardTitle} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const DropdownMenuItem = ({ title, icon, onPress, danger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.78}>
      <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.textSecondary} />
      </View>
      <Text style={[styles.menuText, danger && styles.menuTextDanger]}>{title}</Text>
    </TouchableOpacity>
  );

  const renderRoleMenus = () => {
    if (isPickupOperator && !isShipperRole) {
      return (
        <>
          <View style={styles.rowWrapper}>
            <MenuItem
              title="Chờ điều phối"
              icon="git-network-outline"
              color="#0284C7"
              onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "pending" })}
            />
            <MenuItem
              title="Hub xác nhận"
              icon="business-outline"
              color="#10B981"
              onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "dispatch" })}
            />
          </View>
          <View style={styles.rowWrapper}>
            <MenuItem
              title="Chờ gán bưu tá"
              icon="person-add-outline"
              color="#D97706"
              onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "assign" })}
            />
            <MenuItem
              title="Tracking"
              icon="search-outline"
              color="#8B5CF6"
              onPress={() => handleFeaturePress("ShipperTracking")}
            />
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.rowWrapper}>
          <MenuItem
            title="Đơn lấy hàng"
            icon="cube-outline"
            color="#0284C7"
            onPress={() => handleFeaturePress("ShipperPickupList")}
          />
          <MenuItem
            title="Tự điều phối"
            icon="git-pull-request-outline"
            color="#10B981"
            onPress={() => handleFeaturePress("ShipperSelfAssignPickup")}
          />
        </View>
        <View style={styles.rowWrapper}>
          <MenuItem
            title="Giao hàng"
            icon="paper-plane-outline"
            color="#D97706"
            onPress={() => handleFeaturePress("ShipperDeliveryList")}
          />
          <MenuItem
            title="Tracking"
            icon="search-outline"
            color="#8B5CF6"
            onPress={() => handleFeaturePress("ShipperTracking")}
          />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.full_name || user?.username || "Nhân viên"}</Text>

          <TouchableOpacity onPress={handleToggleOnline} activeOpacity={isShipperRole ? 0.7 : 1} style={styles.roleBadge}>
            <View
              style={[
                styles.roleDot,
                {
                  backgroundColor: isShipperRole
                    ? user?.is_online
                      ? "#22C55E"
                      : "#9CA3AF"
                    : "#38BDF8",
                },
              ]}
            />
            <Text style={styles.roleText}>
              {isShipperRole
                ? user?.is_online
                  ? "Đang Online"
                  : "Đang Offline"
                : "Điều phối pickup online"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <CircleButton icon="notifications" onPress={() => setIsNotifModalVisible(true)}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </CircleButton>
          <CircleButton icon="options-outline" onPress={() => setIsMenuVisible(true)} style={{ marginLeft: 12 }} />
        </View>
      </View>

      <View style={styles.content}>{renderRoleMenus()}</View>

      {isShipperRole && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("ShipperCamera")} activeOpacity={0.86}>
            <Ionicons name="camera" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <NotificationModal visible={isNotifModalVisible} onClose={() => setIsNotifModalVisible(false)} />

      <Modal visible={isMenuVisible} transparent animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setIsMenuVisible(false)}>
          <Pressable style={styles.dropdownMenu} onPress={(event) => event.stopPropagation()}>
              {isWarehouseStaff() && (
                <>
                  <DropdownMenuItem
                    title="Giao diện Kho"
                    icon="swap-horizontal-outline"
                    onPress={() => {
                      setIsMenuVisible(false);
                      navigation.replace("WarehouseHome");
                    }}
                  />
                  <View style={styles.menuDivider} />
                </>
              )}
              <DropdownMenuItem
                title="Đăng xuất"
                icon="log-out-outline"
                danger
                onPress={() => {
                  setIsMenuVisible(false);
                  handleLogout();
                }}
              />
          </Pressable>
        </Pressable>
      </Modal>

      <GlobalChat />
    </View>
  );
}
