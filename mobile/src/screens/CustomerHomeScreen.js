import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";

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
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: COLORS.primary || "#1B5E20",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerTextGroup: { flex: 1 },
  greeting: {
    fontSize: Platform.OS === "ios" ? 14 : 11,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: Platform.OS === "ios" ? 18 : 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 8,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  roleText: {
    fontSize: Platform.OS === "ios" ? 13 : 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  appleCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Kính mờ
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appleBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary || "#1B5E20",
    paddingHorizontal: 4,
  },
  appleBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)", // Nền mờ để chống bấm xuyên thấu
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 115 : 75,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: 220,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  menuDivider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  listContainer: { paddingBottom: 40 },
  rowWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  gridCard: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: Platform.OS === "ios" ? 10 : 6,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  gridIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 20,
    minHeight: 36,
  },
  gridCardDesc: {
    fontSize: Platform.OS === "ios" ? 12 : 9,
    color: "#94A3B8",
    textAlign: "center",
  },

  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#FFF",
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    paddingHorizontal: 30,
    lineHeight: 20,
  },
});
