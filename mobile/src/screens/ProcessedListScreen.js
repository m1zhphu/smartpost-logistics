import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import styles from "../styles/ProcessedListScreenStyles";
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


