import React, { useEffect, useState } from "react";
import { CustomAlert } from './CustomAlert';

import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { notificationService } from "../services/notification";
import { COLORS } from "../constants/colors";
import Toast from "react-native-toast-message";
import { checkNetworkConnectionWithoutToast } from "../utils/networkUtils";
import NetInfo from "@react-native-community/netinfo";
import { useUser } from "../context/UserContext";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function NotificationModal({ visible, onClose }) {
  const { notifications, setNotifications } = useUser();
  const [isNetworkError, setIsNetworkError] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsNetworkError(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkAsRead = async (id) => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsNetworkError(true);
      CustomAlert.alert("Không có mạng", "Vui lòng kiểm tra lại Wifi hoặc 4G/5G");
      return;
    }

    setNotifications((prev) => prev.filter((item) => item.id !== id));

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể đánh dấu đã đọc lúc này!",
      });
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

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <View style={styles.container}>
        {/* HEADER CHUẨN FORM TRONG MODAL */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thông Báo Mới</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={28} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {isNetworkError ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTextTitle}>Mất kết nối mạng!</Text>
            <Text style={styles.emptyTextDesc}>
              Vui lòng kiểm tra lại Wifi hoặc 4G/5G
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View
                  style={[styles.emptyIconBox, { backgroundColor: "#F0FDF4" }]}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={40}
                    color="#10B981"
                  />
                </View>
                <Text style={styles.emptyTextTitle}>
                  Bạn đã đọc hết thông báo!
                </Text>
                <Text style={styles.emptyTextDesc}>
                  Các thông báo mới sẽ tự động xuất hiện ở đây.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.notificationCard}
                activeOpacity={0.8}
                onPress={() => handleMarkAsRead(item.id)}
              >
                <View style={styles.iconContainer}>
                  {renderIcon(item.type)}
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.message} numberOfLines={3}>
                    {item.message}
                  </Text>
                  <Text style={styles.time}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={styles.unreadDot} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  closeBtn: { padding: 4 },

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
  textContainer: { flex: 1, marginRight: 12 },
  title: { fontSize: 15, fontWeight: "900", color: "#0F172A", marginBottom: 4 },
  message: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 8,
    fontWeight: "600",
  },
  time: { fontSize: 12, color: "#94A3B8", fontWeight: "700" },
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
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "rgba(241,245,249,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyTextTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyTextDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
  },
});
