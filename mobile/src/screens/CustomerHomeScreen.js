import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerHomeScreenStyles";

export default function CustomerHomeScreen({ navigation }) {
  const { user, logout } = useUser();

  // State quản lý Menu và Thông báo
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);

  // Giả lập biến đếm thông báo chưa đọc, bạn có thể lấy từ context nếu có
  const unreadCount = 2;

  const handleLogout = () => {
    Alert.alert(
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

  // UI Component: Thẻ Grid (sao chép y hệt thẻ gridCard của Warehouse)
  const MenuItem = ({
    title,
    desc,
    icon,
    primaryColor,
    lightBgColor,
    badgeText,
    onPress,
  }) => (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.7}
      disabled={isMenuVisible || isNotifModalVisible}
      onPress={onPress}
    >
      <View style={[styles.cardBadge, { backgroundColor: lightBgColor }]}>
        <Text style={[styles.cardBadgeText, { color: primaryColor }]}>
          {badgeText}
        </Text>
      </View>
      <View style={[styles.gridIconBox, { backgroundColor: lightBgColor }]}>
        <Ionicons name={icon} size={28} color={primaryColor} />
      </View>
      <Text style={styles.gridCardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.gridCardDesc} numberOfLines={1}>
        {desc}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER GIỐNG HỆT WAREHOUSE */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.full_name || user?.username || "Khách hàng"}
          </Text>
          <View style={styles.roleBadge}>
            {/* Đổi màu chấm dot thành xanh dương cho Khách hàng */}
            <View style={[styles.roleDot, { backgroundColor: "#3B82F6" }]} />
            <Text style={styles.roleText}>Khách hàng thành viên</Text>
          </View>
        </View>

        {/* 2 NÚT HEADER TÁCH RỜI CHUẨN HIỆN ĐẠI */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* 1. Nút Thông Báo */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Notification")}
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

          {/* 2. Nút Chức năng / Menu */}
          <TouchableOpacity
            onPress={() => setIsMenuVisible(true)}
            style={[styles.appleCircleBtn, { marginLeft: 12 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT & LƯỚI CHỨC NĂNG */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {/* Lưới 2x2 cho 4 nghiệp vụ */}
        <View style={styles.rowWrapper}>
          <MenuItem
            title="Tạo Lấy Hàng"
            desc="Gọi shipper tới lấy"
            icon="add-circle-outline"
            primaryColor="#0284C7"
            lightBgColor="#E0F2FE"
            badgeText="ĐẶT ĐƠN"
            onPress={() => navigation.navigate("CustomerCreatePickup")}
          />
          <MenuItem
            title="Đơn Lấy Hàng"
            desc="Quản lý lịch sử"
            icon="list-outline"
            primaryColor="#D97706"
            lightBgColor="#FEF3C7"
            badgeText="QUẢN LÝ"
            onPress={() => navigation.navigate("CustomerPickupList")}
          />
        </View>

        <View style={styles.rowWrapper}>
          <MenuItem
            title="Danh sách nháp"
            desc="Túi thư / Túi hàng"
            icon="folder-open-outline"
            primaryColor="#10B981"
            lightBgColor="#D1FAE5"
            badgeText="LƯU TRỮ"
            onPress={() => navigation.navigate("CustomerPickupDrafts")}
          />
          <MenuItem
            title="Tra cứu vận đơn"
            desc="Hành trình đơn"
            icon="search-outline"
            primaryColor="#8B5CF6"
            lightBgColor="#EDE9FE"
            badgeText="TIỆN ÍCH"
            onPress={() => navigation.navigate("CustomerTracking")}
          />
        </View>

        {/* KHU VỰC EMPTY STATE (ĐANG PHÁT TRIỂN) */}
        <View style={{ marginTop: 10 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: "#0F172A",
              marginBottom: 12,
            }}
          >
            Dịch vụ khác
          </Text>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="construct-outline" size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Đang phát triển</Text>
            <Text style={styles.emptyText}>
              Các tính năng khác sẽ sớm ra mắt và cập nhật tại đây.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL MENU CHỨC NĂNG (GÓC PHẢI TRÊN) */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
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
            {/* Mục 1: Hồ sơ cá nhân */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate("CustomerProfile");
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="person-outline" size={20} color="#4B5563" />
              </View>
              <Text style={styles.menuText}>Hồ sơ cá nhân</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Mục 2: Đăng xuất */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                handleLogout();
              }}
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
    </View>
  );
}

// ----------------------------------------------------
// BỘ STYLE Y HỆT WAREHOUSE BẠN GỬI
// ----------------------------------------------------
// styles moved to ../styles/CustomerHomeScreenStyles
