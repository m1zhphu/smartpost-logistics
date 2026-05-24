import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { deliveryService } from "../services/deliveryService";
import { COLORS } from "../constants/colors";
import { getRoleKey, getRoleLabel } from "../utils/roleUtils";
import styles from "../styles/ProfileStyles";
import CustomButton from "../components/CustomButton";
import ConfirmModal from "../components/ConfirmModal";

const isShipperRole = (user) => getRoleKey(user) === "shipper";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useUser();
  const isFocused = useIsFocused();
  const [codData, setCodData] = useState({
    expected_cod: 0,
    delivered_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isFocused || !isShipperRole(user)) return;

    setLoading(true);
    deliveryService
      .getPendingCOD(user?.token)
      .then((data) => {
        const currentData = Array.isArray(data) ? data[0] : data;
        if (currentData) setCodData(currentData);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [isFocused, user]);

  const userName = user?.full_name || user?.username || "Người dùng";
  const userCode = user?.username ? `@${user.username}` : "Chưa cập nhật";
  const hubId = user?.hub_id || user?.primary_hub_id || "Toàn hệ thống";
  const phone = user?.phone || user?.phone_number || "Chưa cập nhật";

  const menuItems = [
    { icon: "call", label: "Điện thoại", value: phone },
    { icon: "mail", label: "Tài khoản", value: userCode },
    { icon: "business", label: "Hub trực thuộc", value: `Hub ID: #${hubId}` },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.editBadge}
            >
              <Ionicons name="camera" size={18} color={COLORS.white} />
            </Pressable>
          </View>

          <Text style={styles.nameText}>{userName}</Text>
          <Text style={styles.roleText}>{getRoleLabel(user)}</Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                key={item.label}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.menuLabelWrap}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {isShipperRole(user) ? (
          <View style={styles.codCard}>
            <View style={styles.codHeader}>
              <View style={styles.codHeadLeft}>
                <View style={styles.codIconWrap}>
                  <Ionicons
                    name="wallet"
                    size={20}
                    color={COLORS.warningText}
                  />
                </View>
                <Text style={styles.codTitle}>Tiền COD đang giữ</Text>
              </View>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.textMuted}
              />
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <View style={styles.codContent}>
                <Text style={styles.codAmount}>
                  {(Number(codData.expected_cod) || 0).toLocaleString("vi-VN")}{" "}
                  d
                </Text>
                <Text style={styles.codDesc}>
                  Chưa bàn giao khoản tiền cho {codData.delivered_count || 0}{" "}
                  đơn hàng
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.logoutWrap}>
          <CustomButton
            title="Đăng xuất khỏi thiết bị"
            variant="outline"
            style={styles.logoutButton}
            textStyle={{ color: COLORS.error }}
            leftIcon={
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            }
            onPress={() => setShowLogoutModal(true)}
          />
        </View>

        <Text style={styles.versionText}>SmartPost App - Phiên bản 2.0.1</Text>
      </ScrollView>
      <ConfirmModal
        visible={showLogoutModal}
        title="Xác nhận đăng xuất"
        description="Bạn cần đăng nhập lại vào lần sau để tiếp tục sử dụng ứng dụng."
        cancelText="Hủy bỏ"
        confirmText="Đăng xuất"
        iconName="log-out"
        tone="danger"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }}
      />
    </View>
  );
}
