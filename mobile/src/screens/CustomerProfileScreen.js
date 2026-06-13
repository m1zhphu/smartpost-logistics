import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";

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
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },

  content: { flex: 1 },
  contentContainer: { paddingBottom: 30, paddingTop: 16 },

  // Card Phẳng Chuẩn DNA
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarText: { fontSize: 34, fontWeight: "900", color: PRIMARY },
  userName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 20,
    fontWeight: "700",
  },

  editBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  editBtnText: {
    color: "#FFF",
    fontWeight: "800",
    marginLeft: 8,
    fontSize: 14,
  },

  infoSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 20,
  },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
    fontWeight: "700",
  },
  infoValue: { fontSize: 14, color: "#0F172A", fontWeight: "800" },
});
