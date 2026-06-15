import React, { useState, useEffect } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerHomeScreenStyles";
import NotificationModal from "../components/NotificationModal";
import { getCustomerPickups } from "../services/pickupService";

export default function CustomerHomeScreen({ navigation }) {
  const { user, unreadCount, logout } = useUser();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [activePickupsCount, setActivePickupsCount] = useState(0);

  useEffect(() => {
    const fetchPickups = async () => {
      const result = await getCustomerPickups();
      if (result.success && result.data) {
        // Lọc các đơn chưa hoàn thành hoặc chưa huỷ nếu cần, tạm thời đếm tổng
        const active = result.data.filter(p => p.pickup_status !== 'COMPLETED' && p.pickup_status !== 'CANCELLED');
        setActivePickupsCount(active.length);
      }
    };
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPickups();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    CustomAlert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => logout(),
        },
      ],
    );
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
              {user?.full_name || user?.username || "Khách hàng"}
            </Text>
            <View style={styles.rolePill}>
              <View style={[styles.roleDot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.roleText}>Khách hàng thành viên</Text>
            </View>
          </View>

          <View style={styles.headerBtns}>
            <View style={styles.notifWrap}>
              <TouchableOpacity
                onPress={() => setIsNotificationVisible(true)}
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
        {/* BANNER */}
        {activePickupsCount > 0 && (
          <View style={styles.bannerWrap}>
            <View style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Ionicons name="time-outline" size={24} color="#1B5E20" />
              </View>
              <View style={styles.bannerTextGroup}>
                <Text style={styles.bannerTitle}>{activePickupsCount} đơn đang xử lý</Text>
                <Text style={styles.bannerSub}>Đang chờ điều phối và bưu tá lấy hàng</Text>
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
              badgeText="ĐẶT ĐƠN" badgeColor="#0369A1" badgeBg="#E0F2FE"
              icon="add-circle-outline" iconColor="#0284C7" iconBg="#E0F2FE"
              title="Tạo lấy hàng" desc="Gọi shipper tới lấy"
              onPress={() => navigation.navigate("CustomerCreatePickup")}
            />
            <GCard
              badgeText="QUẢN LÝ" badgeColor="#92400E" badgeBg="#FEF3C7"
              icon="list-outline" iconColor="#D97706" iconBg="#FEF3C7"
              title="Đơn lấy hàng" desc="Quản lý lịch sử"
              onPress={() => navigation.navigate("CustomerPickupList")}
            />
            <GCard
              badgeText="LƯU TRỮ" badgeColor="#065F46" badgeBg="#D1FAE5"
              icon="folder-open-outline" iconColor="#10B981" iconBg="#D1FAE5"
              title="Danh sách nháp" desc="Túi thư / túi hàng"
              onPress={() => navigation.navigate("CustomerPickupDrafts")}
            />
            <GCard
              badgeText="TIỆN ÍCH" badgeColor="#5B21B6" badgeBg="#EDE9FE"
              icon="search-outline" iconColor="#8B5CF6" iconBg="#EDE9FE"
              title="Tra cứu vận đơn" desc="Hành trình đơn"
              onPress={() => navigation.navigate("CustomerTracking")}
            />
          </View>
        </View>
      </ScrollView>

      {/* MODAL MENU */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setIsMenuVisible(false)}>
          <Pressable style={styles.dropdownMenu} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate("CustomerProfile");
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="person-outline" size={18} color="#4B5563" />
              </View>
              <Text style={styles.menuText}>Hồ sơ cá nhân</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                handleLogout();
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: "#FEF2F2" }]}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, { color: "#EF4444" }]}>Đăng xuất</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <NotificationModal
        visible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
      />
    </View>
  );
}
