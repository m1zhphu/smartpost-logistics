import React, { useState, useEffect } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { Modal, Pressable, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

import { useQueue } from "../context/QueueContext";
import { useUser } from "../context/UserContext";
import GlobalChat from "../components/GlobalChat";
import NotificationModal from "../components/NotificationModal";
import styles from "../styles/HomeScreenStyles";
import { getShipperAssignedPickups } from "../services/pickupService";

export default function HomeScreen({ navigation }) {
  const {
    user,
    roles,
    logout,
    isWarehouseStaff,
    unreadCount,
  } = useUser();

  const { clearQueue } = useQueue();

  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [pendingPickupsCount, setPendingPickupsCount] = useState(0);

  useEffect(() => {
    const fetchPickups = async () => {
      if (!isShipperRole) return;
      const result = await getShipperAssignedPickups();
      if (result.success && result.data) {
        // Lọc các đơn đang chờ xử lý
        const pending = result.data.filter(p => p.pickup_status === 'ASSIGNED' || p.pickup_status === 'PENDING');
        setPendingPickupsCount(pending.length);
      }
    };
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPickups();
    });
    return unsubscribe;
  }, [navigation, isShipperRole]);

  const roleId = user?.role_id || roles?.[0]?.role_id;
  const isShipperRole = roleId === 4;
  const isPickupOperator = [1, 2, 3, 7].includes(roleId);

  const handleLogout = () => {
    CustomAlert.alert(
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
      CustomAlert.alert(
        "Tính năng chưa phát triển",
        "Tính năng này đang được phát triển cho hệ thống kho và sẽ sớm ra mắt.",
      );
      return;
    }
    navigation.navigate(screenName);
  };



  const GCard = ({ badgeText, badgeColor, badgeBg, icon, iconColor, iconBg, title, desc, onPress }) => (
    <TouchableOpacity style={styles.gcard} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.gcardBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.gcardBadgeText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
      <View style={[styles.gcardIco, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.gcardTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.gcardDesc}>{desc}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.full_name || user?.username || "---"}
            </Text>
            <View style={styles.rolePill}>
              <View
                style={[
                  styles.roleDot,
                  { backgroundColor: isShipperRole ? "#10B981" : "#38BDF8" }
                ]}
              />
              <Text style={styles.roleText}>
                {isShipperRole ? "Bưu tá" : "Điều phối"}
              </Text>
            </View>
          </View>

          <View style={styles.headerBtns}>
            <View style={styles.notifWrap}>
              <TouchableOpacity
                onPress={() => setIsNotifModalVisible(true)}
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={18} color="#FFF" />
              </TouchableOpacity>
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </View>
            <TouchableOpacity
              onPress={() => setIsMenuVisible(true)}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="menu-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BANNER CẢNH BÁO */}
        {pendingPickupsCount > 0 && (
          <View style={styles.bannerWrap}>
            <View style={[styles.banner, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
              <View style={[styles.bannerIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="warning-outline" size={24} color="#D97706" />
              </View>
              <View style={styles.bannerTextGroup}>
                <Text style={styles.bannerTitle}>{pendingPickupsCount} đơn chờ xử lý</Text>
                <Text style={styles.bannerSub}>Bạn có yêu cầu lấy hàng cần xác nhận</Text>
              </View>
              <View style={styles.bannerArrow}>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </View>
          </View>
        )}

        {/* NGHIỆP VỤ */}
        <View style={styles.sec}>
          <View style={styles.secHdr}>
            <Text style={styles.secTitle}>Nghiệp vụ</Text>
          </View>
          <View style={styles.grid}>
            <GCard
              badgeText="NGHIỆP VỤ" badgeColor="#0369A1" badgeBg="#E0F2FE"
              icon="cube-outline" iconColor="#0284C7" iconBg="#E0F2FE"
              title="Đơn lấy hàng" desc="Danh sách cần lấy"
              onPress={() => handleFeaturePress("ShipperPickupList")}
            />
            <GCard
              badgeText="NGHIỆP VỤ" badgeColor="#92400E" badgeBg="#FEF3C7"
              icon="paper-plane-outline" iconColor="#D97706" iconBg="#FEF3C7"
              title="Giao hàng" desc="Danh sách cần giao"
              onPress={() => handleFeaturePress("ShipperDeliveryList")}
            />
            <GCard
              badgeText="OCR" badgeColor="#5B21B6" badgeBg="#EDE9FE"
              icon="scan-outline" iconColor="#8B5CF6" iconBg="#EDE9FE"
              title="Đơn chờ OCR" desc="Đơn đã lấy, cần scan"
              onPress={() => handleFeaturePress("ShipperPickedOrders")}
            />
          </View>
        </View>

        {/* ĐIỀU PHỐI (Nếu là operator) */}
        {isPickupOperator && !isShipperRole && (
          <View style={styles.sec}>
            <View style={styles.secHdr}>
              <Text style={styles.secTitle}>Điều phối</Text>
            </View>
            <View style={styles.grid}>
              <GCard
                badgeText="ĐIỀU PHỐI" badgeColor="#0369A1" badgeBg="#E0F2FE"
                icon="git-network-outline" iconColor="#0284C7" iconBg="#E0F2FE"
                title="Chờ điều phối" desc="Yêu cầu cần gán"
                onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "pending" })}
              />
              <GCard
                badgeText="ĐIỀU PHỐI" badgeColor="#065F46" badgeBg="#D1FAE5"
                icon="business-outline" iconColor="#10B981" iconBg="#D1FAE5"
                title="Hub xác nhận" desc="Xác nhận chuyển"
                onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "dispatch" })}
              />
              <GCard
                badgeText="ĐIỀU PHỐI" badgeColor="#92400E" badgeBg="#FEF3C7"
                icon="person-add-outline" iconColor="#D97706" iconBg="#FEF3C7"
                title="Gán bưu tá" desc="Phân bổ nhân sự"
                onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "assign" })}
              />
              <GCard
                badgeText="OCR" badgeColor="#5B21B6" badgeBg="#EDE9FE"
                icon="scan-outline" iconColor="#8B5CF6" iconBg="#EDE9FE"
                title="OCR Túi thư" desc="Mở túi, scan bill"
                onPress={() => navigation.navigate("OcrPickupCustomer")}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB Shipper Camera */}
      {isShipperRole && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("ShipperCamera")}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={26} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* MODALS */}
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
        <Pressable style={styles.menuOverlay} onPress={() => setIsMenuVisible(false)}>
          <Pressable style={styles.dropdownMenu} onPress={(e) => e.stopPropagation()}>
            {isWarehouseStaff() && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setIsMenuVisible(false);
                    navigation.replace("WarehouseHome");
                  }}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons name="swap-horizontal-outline" size={18} color="#4B5563" />
                  </View>
                  <Text style={styles.menuText}>Giao diện Kho</Text>
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
            >
              <View style={[styles.menuIconBox, styles.logoutMenuIconBox]}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, styles.logoutMenuText]}>Đăng xuất</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <GlobalChat />
    </View>
  );
}
