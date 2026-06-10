import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerHomeScreen({ navigation }) {
  const { user, logout } = useUser();

  const blurProps = {
    intensity: Platform.OS === "ios" ? 68 : 42,
    tint: "light",
  };

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => logout(),
        },
      ],
    );
  };

  const HeaderButton = ({ icon, onPress, danger, style }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.headerButtonShadow, style]}
      activeOpacity={0.78}
    >
      <BlurView
        {...blurProps}
        intensity={58}
        style={[styles.appleCircleBtn, danger && styles.appleCircleBtnDanger]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={
            danger
              ? [
                  "rgba(239,68,68,0.96)",
                  "rgba(248,113,113,0.84)",
                  "rgba(255,255,255,0.16)",
                ]
              : [
                  "rgba(255,255,255,0.36)",
                  "rgba(255,255,255,0.14)",
                  "rgba(255,255,255,0.06)",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerButtonTopLine} />

        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </BlurView>
    </TouchableOpacity>
  );

  const ActionCard = ({
    icon,
    iconColor,
    iconBg,
    title,
    desc,
    onPress,
    wide,
    horizontal,
  }) => (
    <TouchableOpacity
      style={[styles.actionCardShadow, wide && styles.actionCardShadowWide]}
      onPress={onPress}
      activeOpacity={0.84}
    >
      <BlurView
        {...blurProps}
        intensity={56}
        style={[
          styles.actionCard,
          wide && styles.actionCardWide,
          horizontal && styles.actionCardHorizontal,
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.94)",
            "rgba(255,255,255,0.62)",
            "rgba(255,255,255,0.34)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.cardTopLine} />
        <View pointerEvents="none" style={styles.cardGlow} />

        <View
          style={[
            styles.iconBox,
            horizontal && styles.iconBoxHorizontal,
            {
              backgroundColor: iconBg,
              borderColor: `${iconColor}22`,
            },
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,255,255,0.72)", "rgba(255,255,255,0.18)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Ionicons name={icon} size={32} color={iconColor} />
        </View>

        {horizontal ? (
          <>
            <View style={styles.horizontalTextGroup}>
              <Text style={[styles.actionTitle, styles.actionTitleWide]}>
                {title}
              </Text>
              <Text style={[styles.actionDesc, styles.actionDescLeft]}>
                {desc}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </>
        ) : (
          <>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionDesc}>{desc}</Text>
          </>
        )}
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
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

        <View style={styles.headerTextGroup}>
          <Text style={styles.greeting}>Xin chào,</Text>

          <Text style={styles.userName} numberOfLines={1}>
            {user?.full_name || user?.username || "Khách hàng"}
          </Text>

          <BlurView {...blurProps} intensity={42} style={styles.roleBadge}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0.28)", "rgba(255,255,255,0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.roleDot} />
            <Text style={styles.roleText}>Khách hàng thành viên</Text>
          </BlurView>
        </View>

        <View style={styles.headerActions}>
          <HeaderButton
            icon="person-outline"
            onPress={() => navigation.navigate("CustomerProfile")}
            style={{ marginRight: 12 }}
          />

          <HeaderButton icon="notifications" onPress={() => {}} />

          <HeaderButton
            icon="log-out-outline"
            onPress={handleLogout}
            danger
            style={{ marginLeft: 12 }}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.quickActions}>
          <ActionCard
            icon="add-circle"
            iconColor="#0284C7"
            iconBg="rgba(224,242,254,0.92)"
            title="Tạo Lấy Hàng"
            desc="Lên đơn, gọi shipper tới lấy"
            onPress={() => navigation.navigate("CustomerCreatePickup")}
          />

          <ActionCard
            icon="list"
            iconColor="#D97706"
            iconBg="rgba(254,243,199,0.92)"
            title="Đơn Lấy Hàng"
            desc="Quản lý trạng thái, lịch sử"
            onPress={() => navigation.navigate("CustomerPickupList")}
          />
        </View>

        <ActionCard
          wide
          horizontal
          icon="folder-open"
          iconColor="#16A34A"
          iconBg="rgba(220,252,231,0.92)"
          title="Danh sách nháp"
          desc="Chọn nhiều nháp để tạo 1 túi thư/túi hàng"
          onPress={() => navigation.navigate("CustomerPickupDrafts")}
        />

        <View style={styles.quickActions}>
          <ActionCard
            wide
            horizontal
            icon="search"
            iconColor="#9333EA"
            iconBg="rgba(243,232,255,0.92)"
            title="Tra cứu vận đơn"
            desc="Kiểm tra hành trình đơn hàng"
            onPress={() => navigation.navigate("CustomerTracking")}
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Dịch vụ khác</Text>

          <View style={styles.emptyStateShadow}>
            <BlurView {...blurProps} intensity={52} style={styles.emptyState}>
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.92)",
                  "rgba(255,255,255,0.58)",
                  "rgba(255,255,255,0.32)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View pointerEvents="none" style={styles.cardTopLine} />

              <View style={styles.emptyIconBg}>
                <Ionicons name="construct-outline" size={40} color="#94A3B8" />
              </View>

              <Text style={styles.emptyTitle}>Đang phát triển</Text>

              <Text style={styles.emptyText}>
                Các tính năng khác sẽ sớm ra mắt.
              </Text>
            </BlurView>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    overflow: "hidden",
    zIndex: 10,

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  headerOrbOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    top: -80,
    right: -62,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  headerOrbTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -70,
    left: -42,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  headerGlassLine: {
    position: "absolute",
    left: 28,
    right: 28,
    top: Platform.OS === "ios" ? 48 : 28,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.34)",
  },

  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    fontSize: Platform.OS === "ios" ? 14 : 11,
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.5,
    fontWeight: "600",
  },

  userName: {
    fontSize: Platform.OS === "ios" ? 20 : 14,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 8,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginRight: 7,
  },

  roleText: {
    fontSize: Platform.OS === "ios" ? 13 : 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButtonShadow: {
    width: 40,
    height: 40,
    borderRadius: 20,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  appleCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  appleCircleBtnDanger: {
    backgroundColor: "rgba(239,68,68,0.78)",
    borderColor: "rgba(255,255,255,0.36)",
  },

  headerButtonTopLine: {
    position: "absolute",
    top: 1,
    left: 8,
    right: 8,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  actionCardShadow: {
    width: "48%",
    borderRadius: 24,
    ...glassShadow,
  },

  actionCardShadowWide: {
    width: "100%",
    marginTop: 12,
  },

  actionCard: {
    minHeight: 150,
    padding: 15,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    alignItems: "center",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.82)"
        : "rgba(255,255,255,0.36)",
  },

  actionCardWide: {
    width: "100%",
  },

  actionCardHorizontal: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
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
    width: 58,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    transform: [{ rotate: "-18deg" }],
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },

  iconBoxHorizontal: {
    marginBottom: 0,
    marginRight: 15,
  },

  horizontalTextGroup: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: "center",
  },

  actionTitleWide: {
    fontSize: 16,
    textAlign: "left",
  },

  actionDesc: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 17,
  },

  actionDescLeft: {
    textAlign: "left",
    fontSize: 13,
  },

  sectionBlock: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 10,
  },

  emptyStateShadow: {
    borderRadius: 24,
    ...glassShadow,
  },

  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.82)"
        : "rgba(255,255,255,0.36)",
  },

  emptyIconBg: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: "rgba(243,244,246,0.82)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#374151",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
});
