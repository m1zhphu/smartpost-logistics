import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { notificationService } from "../services/notification";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { setUnreadCount } = useUser();

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getUnread();
      const data = res.data.data || res.data;
      setNotifications(data);

      setUnreadCount(data.length);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải thông báo. Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationService.markAsRead(id);
    } catch (error) {
      loadNotifications();
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case "NOI_BO":
        return <Ionicons name="swap-horizontal" size={24} color="#8B5CF6" />;
      case "WARNING":
        return <Ionicons name="warning" size={24} color="#F59E0B" />;
      default:
        return <Ionicons name="information-circle" size={24} color="#3B82F6" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thông Báo</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons
                name="notifications-off-outline"
                size={36}
                color="#94A3B8"
              />
            </View>
            <Text style={styles.emptyTitle}>Bạn chưa có thông báo</Text>
            <Text style={styles.emptyText}>
              Các thông báo mới sẽ xuất hiện ở đây.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationCard}
            activeOpacity={0.7}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <View style={styles.iconContainer}>{renderIcon(item.type)}</View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },

  headerBtn: {
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

  listContent: { padding: 16, paddingBottom: 40 },

  // Card Phẳng Chuẩn DNA
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textContainer: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  message: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  time: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },

  // Empty State Chuẩn
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyIconBg: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
  },
});
