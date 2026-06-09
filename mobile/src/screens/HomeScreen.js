import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { useQueue } from "../context/QueueContext";
import NotificationModal from "../components/NotificationModal";
import GlobalChat from "../components/GlobalChat";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function HomeScreen({ navigation }) {
  const { user, logout, isWarehouseStaff, unreadCount } = useUser();
  const { clearQueue } = useQueue();

  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const blurProps = {
    intensity: Platform.OS === "ios" ? 68 : 42,
    tint: "light",
  };

  const handleLogout = () => {
    Alert.alert(
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
    const uType = await AsyncStorage.getItem("user_type");

    if (uType === "employee") {
      Alert.alert(
        "Tính năng chưa phát triển",
        "Tính năng này đang được phát triển cho hệ thống Kho và sẽ sớm ra mắt.",
      );
      return;
    }

    navigation.navigate(screenName);
  };

  const GlassCircleButton = ({ icon, onPress, children, style }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.circleButtonShadow, style]}
      activeOpacity={0.78}
    >
      <BlurView {...blurProps} intensity={58} style={styles.appleCircleBtn}>
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

        <View pointerEvents="none" style={styles.circleButtonTopLine} />

        <Ionicons name={icon} size={20} color="#FFF" />
        {children}
      </BlurView>
    </TouchableOpacity>
  );

  const MenuItem = ({ title, icon, onPress, color }) => (
    <TouchableOpacity
      style={styles.gridCardTouchable}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={isMenuVisible || isNotifModalVisible}
    >
      <BlurView {...blurProps} intensity={56} style={styles.gridCard}>
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
        <View pointerEvents="none" style={styles.cardGlow} />

        <View
          style={[
            styles.gridIconBox,
            {
              backgroundColor: `${color}18`,
              borderColor: `${color}22`,
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

          <Ionicons name={icon} size={28} color={color} />
        </View>

        <Text style={styles.gridCardTitle} numberOfLines={2}>
          {title}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );

  const DropdownMenuItem = ({ title, icon, onPress, danger }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#EF4444" : "#4B5563"}
        />
      </View>

      <Text style={[styles.menuText, danger && styles.menuTextDanger]}>
        {title}
      </Text>
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

          <Text style={styles.userName}>
            {user?.username || user?.full_name || "Shipper"}
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
            <Text style={styles.roleText}>Tài xế giao hàng</Text>
          </BlurView>
        </View>

        <View style={styles.headerActions}>
          <GlassCircleButton
            icon="notifications"
            onPress={() => setIsNotifModalVisible(true)}
          >
            {unreadCount > 0 && (
              <View style={styles.appleBadge}>
                <Text style={styles.appleBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </GlassCircleButton>

          <GlassCircleButton
            icon="options-outline"
            onPress={() => setIsMenuVisible(true)}
            style={{ marginLeft: 12 }}
          />
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.content}>
        <View style={styles.rowWrapper}>
          <MenuItem
            title="Đơn lấy hàng"
            icon="cube-outline"
            color="#0284C7"
            onPress={() => handleFeaturePress("ShipperPickupList")}
          />

          <MenuItem
            title="Tự điều phối"
            icon="git-pull-request-outline"
            color="#10B981"
            onPress={() => handleFeaturePress("ShipperSelfAssignPickup")}
          />
        </View>

        <View style={styles.rowWrapper}>
          <MenuItem
            title="Giao hàng"
            icon="paper-plane-outline"
            color="#D97706"
            onPress={() => handleFeaturePress("ShipperDeliveryList")}
          />

          <MenuItem
            title="Tracking"
            icon="search-outline"
            color="#8B5CF6"
            onPress={() => handleFeaturePress("ShipperTracking")}
          />
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ShipperCamera")}
        activeOpacity={0.86}
      >
        <LinearGradient
          colors={[
            "rgba(249,115,22,0.98)",
            "rgba(251,146,60,0.95)",
            "rgba(253,186,116,0.9)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.5)",
              "rgba(255,255,255,0.12)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGloss}
          />

          <Ionicons name="camera" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* MODAL 1: THÔNG BÁO */}
      <NotificationModal
        visible={isNotifModalVisible}
        onClose={() => setIsNotifModalVisible(false)}
      />

      {/* MODAL 2: MENU CHỨC NĂNG */}
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
            style={styles.dropdownShadow}
            onPress={(e) => e.stopPropagation()}
          >
            <BlurView {...blurProps} intensity={76} style={styles.dropdownMenu}>
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.94)",
                  "rgba(255,255,255,0.68)",
                  "rgba(255,255,255,0.42)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View pointerEvents="none" style={styles.dropdownTopLine} />

              {isWarehouseStaff() && (
                <>
                  <DropdownMenuItem
                    title="Giao diện Kho"
                    icon="swap-horizontal-outline"
                    onPress={() => {
                      setIsMenuVisible(false);
                      navigation.replace("WarehouseHome");
                    }}
                  />

                  <View style={styles.menuDivider} />
                </>
              )}

              <DropdownMenuItem
                title="Đăng xuất"
                icon="log-out-outline"
                danger
                onPress={() => {
                  setIsMenuVisible(false);
                  handleLogout();
                }}
              />
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>

      <GlobalChat />
    </View>
  );
}

const glassShadow = {
  ...Platform.select({
    ios: {
      shadowColor: "#123816",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 22,
    },
    android: {
      elevation: 6,
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
    paddingRight: 14,
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
    backgroundColor: "#22C55E",
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

  circleButtonShadow: {
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

  circleButtonTopLine: {
    position: "absolute",
    top: 1,
    left: 8,
    right: 8,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.48)",
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
    borderColor: PRIMARY,
    paddingHorizontal: 4,
  },

  appleBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },

  rowWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  gridCardTouchable: {
    width: "48%",
    borderRadius: 24,
    ...glassShadow,
  },

  gridCard: {
    minHeight: 142,
    paddingVertical: 20,
    paddingHorizontal: 8,
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

  gridIconBox: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
  },

  gridCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 22,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    zIndex: 999,

    ...Platform.select({
      ios: {
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.36,
        shadowRadius: 14,
      },
      android: {
        elevation: 9,
      },
    }),
  },

  fabGradient: {
    flex: 1,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    overflow: "hidden",
  },

  fabGloss: {
    position: "absolute",
    top: 4,
    left: 10,
    right: 10,
    height: 24,
    borderRadius: 999,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.18)",
  },

  dropdownShadow: {
    position: "absolute",
    top: Platform.OS === "ios" ? 115 : 75,
    right: 20,
    width: 220,
    borderRadius: 22,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  dropdownMenu: {
    width: 220,
    paddingVertical: 8,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.92)"
        : "rgba(255,255,255,0.42)",
  },

  dropdownTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(243,244,246,0.86)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
  },

  menuIconBoxDanger: {
    backgroundColor: "rgba(254,242,242,0.9)",
  },

  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  menuTextDanger: {
    color: "#EF4444",
    fontWeight: "800",
  },

  menuDivider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.18)",
    marginHorizontal: 16,
  },
});
