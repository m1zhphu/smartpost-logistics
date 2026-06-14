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
  const {
    user,
    roles,
    logout,
    isWarehouseStaff,
    unreadCount,
    toggleUserOnlineStatus,
  } = useUser();
  const { clearQueue } = useQueue();
  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const roleId = user?.role_id || roles?.[0]?.role_id;
  const isShipperRole = roleId === 4;
  const isPickupOperator = [1, 2, 3, 7].includes(roleId);

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            clearQueue();
            logout();
          },
        },
      ],
    );
  };

  const handleFeaturePress = async (screenName) => {
    const userType = await AsyncStorage.getItem("user_type");
    if (userType === "employee") {
      Alert.alert(
        "Tính năng chưa phát triển",
        "Tính năng này đang được phát triển cho hệ thống kho và sẽ sớm ra mắt.",
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

    Alert.alert(
      "Trạng thái hoạt động",
      `Bạn có muốn ${nextStatus ? "bật" : "tắt"} online?`,
      [
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
              Toast.show({
                type: "error",
                text1: "Không thể cập nhật trạng thái",
              });
            }
          },
        },
      ],
    );
  };

  const MenuItem = ({
    title,
    desc,
    icon,
    color,
    bgColor,
    badgeText,
    onPress,
  }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isMenuVisible || isNotifModalVisible}
    >
      <View style={[styles.cardBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.cardBadgeText, { color }]}>{badgeText}</Text>
      </View>
      <View style={[styles.gridIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.gridCardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.gridCardDesc} numberOfLines={1}>
        {desc}
      </Text>
    </TouchableOpacity>
  );

  const renderRoleMenus = () => {
    if (isPickupOperator && !isShipperRole) {
      return (
        <>
          <View style={styles.rowWrapper}>
            <MenuItem
              title="Chờ điều phối"
              desc="Yêu cầu cần gán"
              icon="git-network-outline"
              color="#0284C7"
              bgColor="#E0F2FE"
              badgeText="ĐIỀU PHỐI"
              onPress={() =>
                navigation.navigate("AdminPickupFlow", {
                  initialTab: "pending",
                })
              }
            />
            <MenuItem
              title="Hub xác nhận"
              desc="Xác nhận chuyển"
              icon="business-outline"
              color="#10B981"
              bgColor="#D1FAE5"
              badgeText="ĐIỀU PHỐI"
              onPress={() =>
                navigation.navigate("AdminPickupFlow", {
                  initialTab: "dispatch",
                })
              }
            />
          </View>
          <View style={styles.rowWrapper}>
            <MenuItem
              title="Chờ gán bưu tá"
              desc="Phân bổ nhân sự"
              icon="person-add-outline"
              color="#D97706"
              bgColor="#FEF3C7"
              badgeText="ĐIỀU PHỐI"
              onPress={() =>
                navigation.navigate("AdminPickupFlow", { initialTab: "assign" })
              }
            />
            <MenuItem
              title="OCR Túi thư"
              desc="Mở túi, OCR bill"
              icon="scan-outline"
              color="#7C3AED"
              bgColor="#F5F3FF"
              badgeText="OCR"
              onPress={() => navigation.navigate("OcrPickupCustomer")}
            />
          </View>
          <View style={styles.rowWrapper}>
            <MenuItem
              title="Tracking"
              desc="Tra cứu hành trình"
              icon="search-outline"
              color="#8B5CF6"
              bgColor="#EDE9FE"
              badgeText="CÔNG CỤ"
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
            desc="Danh sách cần lấy"
            icon="cube-outline"
            color="#0284C7"
            bgColor="#E0F2FE"
            badgeText="NGHIỆP VỤ"
            onPress={() => handleFeaturePress("ShipperPickupList")}
          />
          <MenuItem
            title="Tự điều phối"
            desc="Nhận đơn quét mã"
            icon="git-pull-request-outline"
            color="#10B981"
            bgColor="#D1FAE5"
            badgeText="NGHIỆP VỤ"
            onPress={() => handleFeaturePress("ShipperSelfAssignPickup")}
          />
        </View>
        <View style={styles.rowWrapper}>
          <MenuItem
            title="Giao hàng"
            desc="Danh sách cần giao"
            icon="paper-plane-outline"
            color="#D97706"
            bgColor="#FEF3C7"
            badgeText="NGHIỆP VỤ"
            onPress={() => handleFeaturePress("ShipperDeliveryList")}
          />
        </View>
        <View style={styles.rowWrapper}>
          <MenuItem
            title="Tracking"
            desc="Tra cứu hành trình"
            icon="search-outline"
            color="#8B5CF6"
            bgColor="#EDE9FE"
            badgeText="CÔNG CỤ"
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
          <Text style={styles.userName}>
            {user?.full_name || user?.username || "Nhân viên"}
          </Text>

          <TouchableOpacity
            onPress={handleToggleOnline}
            activeOpacity={isShipperRole ? 0.7 : 1}
            style={styles.roleBadge}
          >
            <View
              style={[
                styles.roleDot,
                {
                  backgroundColor: isShipperRole
                    ? user?.is_online
                      ? "#10B981"
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

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => setIsNotifModalVisible(true)}
            style={styles.appleCircleBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={20} color="#FFF" />
            {unreadCount > 0 && (
              <View style={styles.appleBadge}>
                <Text style={styles.appleBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsMenuVisible(true)}
            style={[styles.appleCircleBtn, { marginLeft: 12 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>{renderRoleMenus()}</View>

      {isShipperRole && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("ShipperCamera")}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={26} color="#FFF" />
        </TouchableOpacity>
      )}

      <NotificationModal
        visible={isNotifModalVisible}
        onClose={() => setIsNotifModalVisible(false)}
      />

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={(e) => {
            e.stopPropagation();
            setIsMenuVisible(false);
          }}
        >
          <Pressable
            style={styles.dropdownMenu}
            onPress={(e) => e.stopPropagation()}
          >
            {isWarehouseStaff() && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setIsMenuVisible(false);
                    navigation.replace("WarehouseHome");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={20}
                      color="#4B5563"
                    />
                  </View>
                  <Text style={styles.menuText}>Giao dien Kho</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                handleLogout();
              }}
              activeOpacity={0.7}
            >
              <View
                style={[styles.menuIconBox, { backgroundColor: "#FEF2F2" }]}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text
                style={[
                  styles.menuText,
                  { color: "#EF4444", fontWeight: "700" },
                ]}
              >
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <GlobalChat />
    </View>
  );
}

// styles moved to ../styles/HomeScreenStyles
