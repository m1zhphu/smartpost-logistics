import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerProfileScreenStyles";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerProfileScreen({ navigation }) {
  const { user, refreshProfile } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    };
    load();
  }, []);

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );

  const PrimaryButton = ({ icon, text, onPress, dark }) => (
    <TouchableOpacity
      style={[
        styles.editBtn,
        dark ? { backgroundColor: "#334155" } : { backgroundColor: PRIMARY },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={16} color={COLORS.white} />
      <Text style={styles.editBtnText}>{text}</Text>
    </TouchableOpacity>
  );

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color={PRIMARY} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM MỚI */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={PRIMARY}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(user?.full_name || user?.username || "K")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <Text style={styles.userName}>
                {user?.full_name || "Chưa cập nhật tên"}
              </Text>
              <Text style={styles.userRole}>Khách hàng thành viên</Text>

              <PrimaryButton
                icon="pencil"
                text="Cập nhật thông tin"
                onPress={() => navigation.navigate("CustomerUpdateProfile")}
              />
              <View style={{ height: 12 }} />
              <PrimaryButton
                icon="lock-closed"
                text="Đổi mật khẩu"
                dark
                onPress={() => navigation.navigate("ChangePassword")}
              />
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

              <InfoRow
                icon="person-outline"
                label="Tên đăng nhập"
                value={user?.username}
              />
              <InfoRow
                icon="call-outline"
                label="Số điện thoại"
                value={user?.phone_number}
              />
              <InfoRow icon="mail-outline" label="Email" value={user?.email} />
              <InfoRow
                icon="location-outline"
                label="Địa chỉ"
                value={user?.address}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// STYLES CHUẨN DNA
// styles moved to ../styles/CustomerProfileScreenStyles
