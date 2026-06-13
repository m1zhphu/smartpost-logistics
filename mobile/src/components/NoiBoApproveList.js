import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { inventoryService } from "../services/inventory";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";
import { checkNetworkConnectionWithoutToast } from "../utils/networkUtils";

export default function NoiBoApproveList({ navigation, currentAction }) {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBillId, setExpandedBillId] = useState(null);

  const [isNetworkError, setIsNetworkError] = useState(false);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [actionType, setActionType] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  const loadPendingBills = async () => {
    setLoading(true);
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsNetworkError(true);
      setPendingList([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setIsNetworkError(false);
    try {
      const res = await inventoryService.getPendingNoiBo();
      let allData = res.data.data || [];

      if (currentAction === "NOIBO_APPROVE_EXPORT") {
        allData = allData.filter(
          (item) => item.trang_thai === "PENDING_SOURCE",
        );
      } else if (currentAction === "NOIBO_APPROVE") {
        allData = allData.filter(
          (item) => item.trang_thai === "PENDING_DESTINATION",
        );
      }

      setPendingList(allData);
    } catch (error) {
      setIsNetworkError(true);
      setPendingList([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPendingBills();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingBills();
    setRefreshing(false);
  };

  const toggleExpand = (id) => {
    setExpandedBillId((prev) => (prev === id ? null : id));
  };

  const openActionModal = async (bill, type) => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      return Alert.alert(
        "Mất kết nối WiFi hoặc 4G/5G",
        "Vui lòng kiểm tra lại mạng trước khi thao tác!",
      );
    }

    setSelectedBill(bill);
    setActionType(type);
    setActionNote("");
    setActionModalVisible(true);
  };

  const submitAction = async () => {
    if (actionType === "REJECT" && !actionNote.trim()) {
      return Alert.alert("Yêu cầu bắt buộc", "Vui lòng nhập lý do từ chối");
    }

    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      return Alert.alert(
        "Mất kết nối WiFi hoặc 4G/5G",
        "Không thể gửi yêu cầu do rớt mạng. Vui lòng thử lại!",
      );
    }

    setIsSubmitting(true);
    try {
      await inventoryService.actionNoiBo(selectedBill.id, {
        action_type: actionType,
        ghi_chu_duyet: actionNote.trim(),
      });

      setActionModalVisible(false);

      setTimeout(() => {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2:
            actionType === "APPROVE"
              ? "Đã duyệt phiếu luân chuyển!"
              : "Đã từ chối phiếu luân chuyển!",
        });
        loadPendingBills();
      }, 350);
    } catch (error) {
      Alert.alert(
        "Lỗi xử lý",
        error.response?.data?.detail ||
          "Có lỗi xảy ra từ máy chủ, vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBillItem = ({ item }) => {
    const isExpanded = expandedBillId === item.id;
    const isSource = item.trang_thai === "PENDING_SOURCE";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.8}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.headerTop}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="document-text" size={20} color="#0284C7" />
              <Text style={styles.billId}>{item.ma_bill}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isSource ? "#FEF3C7" : "#E0F2FE",
                  borderColor: isSource ? "#FDE68A" : "#BAE6FD",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isSource ? "#D97706" : "#0284C7" },
                ]}
              >
                {isSource ? "Chờ Xuất" : "Chờ Nhận"}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeBox}>
              <Text style={styles.routeLabel}>KHO XUẤT</Text>
              <Text style={styles.routeValue}>{item.kho_xuat}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#94A3B8" />
            <View style={[styles.routeBox, { alignItems: "flex-end" }]}>
              <Text style={styles.routeLabel}>KHO ĐÍCH</Text>
              <Text style={styles.routeValue}>{item.kho_nhan}</Text>
            </View>
          </View>

          <View style={styles.driverInfo}>
            <Ionicons name="car-sport-outline" size={16} color="#64748B" />
            <Text style={styles.driverText}>
              {item.tai_xe} • {item.bien_so_xe} • {item.ngay_tao}
            </Text>
          </View>

          <View style={styles.expandToggle}>
            <Text style={styles.itemCountText}>
              {item.so_mon_hang} mặt hàng
            </Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#9CA3AF"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.detailTitle}>Danh sách mặt hàng:</Text>

            {item.items?.map((prod, idx) => (
              <View key={idx} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productHeaderLeft}>
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color="#0284C7"
                      style={{ marginRight: 6, marginTop: 1 }}
                    />
                    <Text style={styles.productName} numberOfLines={2}>
                      {prod.loai_khach === "THUONG"
                        ? prod.ten_san_pham
                        : prod.ma_may}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          prod.loai_khach === "VIP" ? "#FDF2F8" : "#ECFDF5",
                        borderColor:
                          prod.loai_khach === "VIP" ? "#FBCFE8" : "#D1FAE5",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            prod.loai_khach === "VIP" ? "#DB2777" : "#059669",
                        },
                      ]}
                    >
                      {prod.loai_khach}
                    </Text>
                  </View>
                </View>

                <View style={styles.productDetailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>MÃ BILL</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {prod.ma_bill_item}
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>SỐ LƯỢNG</Text>
                    <Text style={styles.detailValue}>{prod.so_luong}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>SỐ KIỆN</Text>
                    <Text style={styles.detailValue}>
                      {prod.so_kien || "-"}
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>SERIAL (SN)</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {prod.serial || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnReject]}
                onPress={() => openActionModal(item, "REJECT")}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.textReject}>Từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnApprove]}
                onPress={() => openActionModal(item, "APPROVE")}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.textApprove}>
                  Duyệt {isSource ? "Xuất" : "Nhận"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0284C7"]}
            tintColor="#0284C7"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isNetworkError ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="wifi-outline" size={36} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Mất kết nối mạng!</Text>
              <Text style={styles.emptyText}>
                Vui lòng kiểm tra lại Wifi hoặc 4G/5G
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={loadPendingBills}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Tải lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View
                style={[styles.emptyIconBox, { backgroundColor: "#F0FDF4" }]}
              >
                <Ionicons
                  name="checkmark-done-circle"
                  size={40}
                  color="#10B981"
                />
              </View>
              <Text style={styles.emptyTitle}>Tất cả đã hoàn tất!</Text>
              <Text style={styles.emptyText}>
                Không có phiếu nào đang chờ duyệt.
              </Text>
            </View>
          )
        }
        renderItem={renderBillItem}
      />

      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {actionType === "APPROVE" ? "Xác nhận Duyệt" : "Từ chối Phiếu"}
              </Text>
              <Text style={styles.modalSub}>
                Phiếu:{" "}
                <Text style={{ fontWeight: "800", color: "#0F172A" }}>
                  {selectedBill?.ma_bill}
                </Text>
              </Text>

              <TextInput
                style={styles.noteInput}
                placeholder={
                  actionType === "REJECT"
                    ? "Nhập lý do từ chối (Bắt buộc)..."
                    : "Ghi chú thêm (Không bắt buộc)..."
                }
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={actionNote}
                onChangeText={setActionNote}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => setActionModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalBtnCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtnSubmit,
                    {
                      backgroundColor:
                        actionType === "APPROVE" ? "#10B981" : "#EF4444",
                    },
                  ]}
                  onPress={submitAction}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.modalBtnSubmitText}>
                      {actionType === "APPROVE" ? "XÁC NHẬN" : "TỪ CHỐI"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Card Phẳng Chuẩn DNA
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: { padding: 16 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  billId: { fontSize: 16, fontWeight: "900", color: "#0F172A", marginLeft: 8 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "900" },

  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  routeBox: { flex: 1 },
  routeLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },
  routeValue: { fontSize: 15, fontWeight: "900", color: "#0F172A" },

  driverInfo: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  driverText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 8,
    fontWeight: "600",
  },

  expandToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
  },
  itemCountText: { fontSize: 13, color: "#0F172A", fontWeight: "700" },

  expandedContent: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
    lineHeight: 20,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  typeBadgeText: { fontSize: 10, fontWeight: "900" },

  productDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailBox: { width: "46%" },
  detailLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },
  detailValue: { fontSize: 13, color: "#0F172A", fontWeight: "900" },

  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnReject: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  textReject: { color: "#EF4444", fontWeight: "900", marginLeft: 6 },
  btnApprove: { backgroundColor: "#10B981" },
  textApprove: { color: "#FFF", fontWeight: "900", marginLeft: 6 },

  // Empty State Chuẩn
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 20,
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
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  retryText: { color: "#0F172A", fontWeight: "900" },

  // Modal Form Chuẩn DNA
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },

  noteInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: { color: "#475569", fontWeight: "900", fontSize: 14 },
  modalBtnSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSubmitText: { color: "#FFF", fontWeight: "900", fontSize: 14 },
});
