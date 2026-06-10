import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default function CustomerProfileScreen({ navigation }) {
  const { user, refreshProfile } = useUser();
  const [loading, setLoading] = useState(false);

  const blurProps = {
    intensity: Platform.OS === "ios" ? 66 : 40,
    tint: "light",
  };

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
      style={styles.headerButtonShadow}
      activeOpacity={0.78}
    >
      <BlurView {...blurProps} intensity={52} style={styles.headerButton}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.36)",
            "rgba(255,255,255,0.14)",
            "rgba(255,255,255,0.06)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerButtonTopLine} />
        <Ionicons name={icon} size={24} color="#FFF" />
      </BlurView>
    </TouchableOpacity>
  );

  const PrimaryButton = ({ icon, text, onPress, dark }) => (
    <TouchableOpacity
      style={styles.editBtnWrap}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <LinearGradient
        colors={dark ? ["#334155", "#64748B"] : [PRIMARY, "#16A34A", "#4ADE80"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.editBtn}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.44)",
            "rgba(255,255,255,0.1)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGloss}
        />

        <Ionicons name={icon} size={16} color="#FFF" />
        <Text style={styles.editBtnText}>{text}</Text>
      </LinearGradient>
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

      <View style={styles.header}>
        <LinearGradient
          pointerEvents="none"
          colors={[PRIMARY, "#15803D", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerOrbOne} />
        <View pointerEvents="none" style={styles.headerOrbTwo} />
        <View pointerEvents="none" style={styles.headerGlassLine} />

        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>

        <View style={{ width: 42 }} />
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
            <View style={styles.profileCardShadow}>
              <BlurView
                {...blurProps}
                intensity={58}
                style={styles.profileCard}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    "rgba(255,255,255,0.95)",
                    "rgba(255,255,255,0.64)",
                    "rgba(255,255,255,0.34)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View pointerEvents="none" style={styles.cardTopLine} />
                <View pointerEvents="none" style={styles.cardGlow} />

                <View style={styles.avatarPlaceholder}>
                  <LinearGradient
                    colors={["rgba(27,94,32,0.18)", "rgba(34,197,94,0.12)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

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

                <View style={{ height: 10 }} />

                <PrimaryButton
                  icon="lock-closed"
                  text="Đổi mật khẩu"
                  dark
                  onPress={() => navigation.navigate("ChangePassword")}
                />
              </BlurView>
            </View>

            <View style={styles.infoSectionShadow}>
              <BlurView
                {...blurProps}
                intensity={58}
                style={styles.infoSection}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    "rgba(255,255,255,0.95)",
                    "rgba(255,255,255,0.64)",
                    "rgba(255,255,255,0.34)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View pointerEvents="none" style={styles.cardTopLine} />

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
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={user?.email}
                />
                <InfoRow
                  icon="location-outline"
                  label="Địa chỉ"
                  value={user?.address}
                />
              </BlurView>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const glassShadow = {
  ...Platform.select({
    ios: {
      shadowColor: "#123816",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.13,
      shadowRadius: 22,
    },
    android: {
      elevation: 5,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === "ios" ? 55 : 36,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerOrbOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -70,
    right: -45,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  headerOrbTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    bottom: -70,
    left: -38,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  headerGlassLine: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 30,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.34)",
  },

  headerButtonShadow: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  headerButton: {
    flex: 1,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  headerButtonTopLine: {
    position: "absolute",
    top: 1,
    left: 9,
    right: 9,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 28,
  },

  profileCardShadow: {
    margin: 16,
    borderRadius: 28,
    ...glassShadow,
  },

  profileCard: {
    padding: 20,
    borderRadius: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.84)"
        : "rgba(255,255,255,0.36)",
  },

  cardTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  cardGlow: {
    position: "absolute",
    top: 12,
    left: 14,
    width: 62,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
    transform: [{ rotate: "-18deg" }],
  },

  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: PRIMARY,
  },

  userName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },

  userRole: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "700",
  },

  editBtnWrap: {
    borderRadius: 999,
    overflow: "hidden",
  },

  editBtn: {
    minHeight: 42,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  buttonGloss: {
    position: "absolute",
    top: 2,
    left: 10,
    right: 10,
    height: 18,
    borderRadius: 999,
  },

  editBtnText: {
    color: "#FFF",
    fontWeight: "900",
    marginLeft: 8,
  },

  infoSectionShadow: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    ...glassShadow,
  },

  infoSection: {
    padding: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.84)"
        : "rgba(255,255,255,0.36)",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(27,94,32,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
    fontWeight: "700",
  },

  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "800",
  },
});
