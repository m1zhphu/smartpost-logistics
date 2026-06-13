import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { StatusBar } from "expo-status-bar";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ProcessedListComponent({
  queue,
  onClose,
  onClear,
  onDelete,
  onRetry,
  navigation,
}) {
  const [viewingItem, setViewingItem] = useState(null);
  const { user } = useUser();

  const formatTime = (idString) => {
    const timestamp = parseInt(idString.toString().split("_")[0], 10);
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleCreateOrder = (item) => {
    onClose();
    navigation.navigate("CreateOrder", {
      senderData: item.data?.sender,
      receiverData: item.data?.receiver,
      trackingNumber: item.data?.tracking_number,
      username: user.username,
      queueId: item.id,
      bankBranch: item.data?.bank_branch,
      unitCode: item.data?.unit_code,
      customer_id: item.customer_id,
      customer_name: item.customer_name,
      bag_code: item.bag_code,
    });
  };

  const handleRetakeFromModal = () => {
    if (viewingItem) {
      onDelete(viewingItem.id);
      setViewingItem(null);
      setTimeout(
        () => {
          onClose();
        },
        Platform.OS === "ios" ? 500 : 0,
      );
    }
  };

  const getErrorMessage = (type) => {
    switch (type) {
      case "SERVER":
        return "Lỗi máy chủ. Vui lòng thử lại.";
      case "NETWORK":
        return "Thao tác quá nhanh. Vui lòng thử lại.";
      case "ORIENTATION":
        return "Ảnh bị xoay. Vui lòng chụp ngang.";
      case "FORMAT":
      default:
        return "Không nhận diện được. Vui lòng thử lại.";
    }
  };

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item, index }) => {
    const sequenceNumber = queue.length - index;
    const timeStr = formatTime(item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeIndex}>
            <Text style={styles.badgeIndexText}>#{sequenceNumber}</Text>
          </View>
          <Text style={styles.timestampText}>Lúc {timeStr}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={styles.deleteBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <TouchableOpacity
            onPress={() => setViewingItem(item)}
            activeOpacity={0.8}
            style={styles.thumbnailWrapper}
          >
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            <View style={styles.zoomIcon}>
              <Ionicons name="expand" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.infoWrapper}>
            {item.status === "loading" && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={[styles.statusText, { color: "#F59E0B" }]}>
                  Đang xử lý OCR...
                </Text>
              </View>
            )}
            {item.status === "error" && (
              <View>
                <View style={styles.statusRow}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={[styles.statusText, { color: "#EF4444" }]}>
                    Xử lý thất bại
                  </Text>
                </View>
                <Text style={styles.errorText}>
                  {getErrorMessage(item.errorType)}
                </Text>
              </View>
            )}
            {item.status === "success" && (
              <View>
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={16} color={PRIMARY} />
                  <Text style={[styles.statusText, { color: PRIMARY }]}>
                    Nhận diện thành công
                  </Text>
                </View>
                <Text style={styles.trackingText}>
                  {item.data?.tracking_number}
                </Text>
                <Text style={styles.senderText} numberOfLines={1}>
                  Gửi: {item.data?.sender?.name || "---"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {(item.status === "success" || item.status === "error") && (
          <View style={styles.cardFooter}>
            {item.status === "success" && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleCreateOrder(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Tạo Đơn Hàng</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="white"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            )}
            {item.status === "error" && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => onRetry(item)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color="#64748B"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.retryBtnText}>Thử lại OCR</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="scan-outline" size={40} color="#94A3B8" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
      <Text style={styles.emptySubtitle}>
        Hãy căn mã vận đơn vào khung và bấm nút chụp để bắt đầu xử lý.
      </Text>
      <TouchableOpacity
        style={styles.outlineBtn}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <Ionicons
          name="camera-outline"
          size={18}
          color={PRIMARY}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.outlineBtnText}>QUÉT NGAY</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="chevron-down" onPress={onClose} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hàng chờ quét ({queue.length})</Text>
        </View>
        {queue.length > 0 ? (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.clearBtnText}>XÓA HẾT</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {queue.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={queue}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL XEM ẢNH */}
      <Modal
        visible={viewingItem !== null}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlayImage}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setViewingItem(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {viewingItem && (
            <Image
              source={{ uri: viewingItem.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.modalFooter}>
            <Text style={styles.modalHint}>Ảnh bị mờ hoặc sai góc?</Text>
            <TouchableOpacity
              style={styles.modalRetakeBtn}
              onPress={handleRetakeFromModal}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalRetakeText}>XÓA VÀ QUÉT LẠI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },

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

  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(239,68,68,0.8)",
    borderRadius: 8,
  },
  clearBtnText: { color: "white", fontSize: 11, fontWeight: "900" },

  listContent: { padding: 16, paddingBottom: 40 },

  // Empty State Chuẩn
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 24,
    lineHeight: 22,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#FFFFFF",
  },
  outlineBtnText: { color: PRIMARY, fontSize: 15, fontWeight: "900" },

  // Card Phẳng Chuẩn DNA
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  badgeIndex: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeIndexText: { color: "#475569", fontSize: 11, fontWeight: "900" },
  timestampText: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  deleteBtn: { padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 },

  cardBody: { flexDirection: "row" },
  thumbnailWrapper: { position: "relative" },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  zoomIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  infoWrapper: { flex: 1, marginLeft: 12, justifyContent: "center" },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: "800", marginLeft: 4 },
  errorText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    marginTop: 2,
  },
  trackingText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 2,
  },
  senderText: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: { color: "white", fontSize: 13, fontWeight: "900" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  retryBtnText: { color: "#475569", fontSize: 13, fontWeight: "800" },

  // Modal Xem Ảnh (Vẫn giữ nền tối để xem ảnh rõ nét)
  modalOverlayImage: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  fullImage: { width: "100%", height: "70%" },
  modalFooter: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  modalHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },
  modalRetakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalRetakeText: { color: "white", fontWeight: "900", fontSize: 14 },
});
