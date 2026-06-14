import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { notificationService } from "../services/notification";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import styles from "../styles/NotificationScreenStyles";

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
// styles moved to ../styles/NotificationScreenStyles
