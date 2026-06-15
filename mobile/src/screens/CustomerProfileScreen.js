import React, { useEffect, useState } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Modal, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerProfileScreenStyles";
import { customerService } from "../services/customer";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerProfileScreen({ navigation }) {
  const { user, refreshProfile, logout } = useUser();
  const [loading, setLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    };
    load();
  }, []);

  const getInitial = () =>
    (user?.full_name || user?.username || "K").charAt(0).toUpperCase();

  const HeaderIconBtn = ({ icon, onPress, accessibilityLabel }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerIconBtn}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={COLORS.white} />
    </TouchableOpacity>
  );

  const InfoRow = ({ icon, iconBg, iconColor, label, value, onPress, multiline }) => (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, !value && styles.infoValueEmpty]}
          numberOfLines={multiline ? undefined : 1}
        >
          {value || "Chưa cập nhật"}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );

  const QuickCard = ({ icon, iconBg, iconColor, label, sub, onPress }) => (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    CustomAlert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    CustomAlert.alert(
      "Xóa tài khoản",
      "Thao tác này sẽ xóa mềm tài khoản của bạn khỏi hệ thống. Bạn có chắc chắn muốn thực hiện?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const data = await customerService.deleteCustomerAccount();
              // API trả về status: "DELETED" hoặc action: "DELETED"
              if (data && (data.status === "DELETED" || data.action === "DELETED")) {
                Toast.show({ type: "success", text1: "Đã xóa tài khoản thành công" });
                logout();
              } else {
                Toast.show({ type: "success", text1: "Đã gửi yêu cầu xoá tài khoản" });
                logout();
              }
            } catch (error) {
              setLoading(false);
              CustomAlert.alert("Lỗi", "Không thể xóa tài khoản lúc này, vui lòng thử lại sau.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <HeaderIconBtn
          icon="arrow-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Quay lại"
        />
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <HeaderIconBtn
          icon="ellipsis-vertical"
          onPress={() => setIsMenuVisible(true)}
          accessibilityLabel="Tuỳ chọn"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={PRIMARY}
            style={{ marginTop: 60 }}
          />
        ) : (
          <>
            {/* HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarLetter}>{getInitial()}</Text>
                <View style={styles.avatarBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              </View>

              <Text style={styles.userName}>
                {user?.full_name || "Chưa cập nhật tên"}
              </Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>Khách hàng thành viên</Text>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => navigation.navigate("CustomerUpdateProfile")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pencil-outline" size={16} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Cập nhật</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => navigation.navigate("ChangePassword")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="#334155" />
                  <Text style={styles.btnSecondaryText}>Đổi mật khẩu</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* THÔNG TIN LIÊN HỆ */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Thông tin liên hệ</Text>
              <View style={styles.infoCard}>
                <InfoRow
                  icon="person-outline"
                  iconBg="#F0FDF4"
                  iconColor="#16A34A"
                  label="Tên đăng nhập"
                  value={user?.username}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="call-outline"
                  iconBg="#EFF6FF"
                  iconColor="#2563EB"
                  label="Số điện thoại"
                  value={user?.phone_number}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="mail-outline"
                  iconBg="#FFF7ED"
                  iconColor="#EA580C"
                  label="Email"
                  value={user?.email}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="location-outline"
                  iconBg="#F5F3FF"
                  iconColor="#7C3AED"
                  label="Địa chỉ"
                  value={user?.address}
                  multiline
                />
              </View>
            </View>

            {/* TIỆN ÍCH 
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tiện ích</Text>
              <View style={styles.quickRow}>
                <QuickCard
                  icon="receipt-outline"
                  iconBg="#F0FDF4"
                  iconColor={PRIMARY}
                  label="Đơn hàng"
                  sub="Quản lý đơn"
                  onPress={() => navigation.navigate("CustomerPickupList")}
                />
                <QuickCard
                  icon="star-outline"
                  iconBg="#FFFBEB"
                  iconColor="#D97706"
                  label="Điểm thưởng"
                  sub="Sắp ra mắt"
                />
                <QuickCard
                  icon="gift-outline"
                  iconBg="#F0FDF4"
                  iconColor={PRIMARY}
                  label="Voucher"
                  sub="Sắp ra mắt"
                />
              </View>
            </View>
            {/* TIỆN ÍCH 
            ... 
            */}
          </>
        )}
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
                handleDeleteAccount();
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: "#FEF2F2" }]}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, { color: "#EF4444" }]}>Xoá tài khoản</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                handleLogout();
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: "#F3F4F6" }]}>
                <Ionicons name="log-out-outline" size={18} color="#4B5563" />
              </View>
              <Text style={styles.menuText}>Đăng xuất</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}
