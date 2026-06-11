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
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerHomeScreenStyles";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerHomeScreen({ navigation }) {
  const { user, logout } = useUser();

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
      style={[
        styles.headerButton,
        danger && styles.headerButtonDanger,
        style,
      ]}
      activeOpacity={0.78}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
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
      style={[
        styles.actionCard,
        wide && styles.actionCardWide,
        horizontal && styles.actionCardHorizontal,
      ]}
      onPress={onPress}
      activeOpacity={0.84}
    >
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
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.greeting}>Xin chào,</Text>

          <Text style={styles.userName} numberOfLines={1}>
            {user?.full_name || user?.username || "Khách hàng"}
          </Text>

          <View style={styles.roleBadge}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>Khách hàng thành viên</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <HeaderButton
            icon="person-outline"
            onPress={() => navigation.navigate("CustomerProfile")}
            style={{ marginRight: 12 }}
          />

          <HeaderButton icon="notifications" onPress={() => navigation.navigate("Notification")} />

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
            iconBg="#E0F2FE"
            title="Tạo Lấy Hàng"
            desc="Lên đơn, gọi shipper tới lấy"
            onPress={() => navigation.navigate("CustomerCreatePickup")}
          />

          <ActionCard
            icon="list"
            iconColor="#D97706"
            iconBg="#FEF3C7"
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
          iconBg="#DCFCE7"
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
            iconBg="#F3E8FF"
            title="Tra cứu vận đơn"
            desc="Kiểm tra hành trình đơn hàng"
            onPress={() => navigation.navigate("CustomerTracking")}
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Dịch vụ khác</Text>

          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="construct-outline" size={40} color="#94A3B8" />
            </View>

            <Text style={styles.emptyTitle}>Đang phát triển</Text>

            <Text style={styles.emptyText}>
              Các tính năng khác sẽ sớm ra mắt.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    zIndex: 10,

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
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

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerButtonDanger: {
    backgroundColor: "rgba(239,68,68,0.78)",
  },

  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
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

  actionCard: {
    width: "48%",
    minHeight: 150,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",

    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  actionCardWide: {
    width: "100%",
    marginTop: 12,
  },

  actionCardHorizontal: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
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
    color: "#0F172A",
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
    color: "#0F172A",
    marginBottom: 10,
  },

  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",

    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  emptyIconBg: {
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
});
*/
