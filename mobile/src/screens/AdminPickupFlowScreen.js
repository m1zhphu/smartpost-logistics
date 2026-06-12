import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import { apiClient, useUser } from "../context/UserContext";
import {
  acceptHubDispatchRequest,
  assignPickupShipper,
  dispatchOnlinePickupRequests,
  getActiveHubs,
  getAssignableShippers,
  getHubDispatchRequests,
  getHubPickupRequests,
  getOnlinePickupRequests,
  rejectHubDispatchRequest,
  uploadPickupImage,
} from "../services/pickupService";
import styles from "../styles/AdminPickupFlowStyles";
import {
  formatDateTime,
  formatWeight,
  getPickupStatusColor,
  getPickupStatusLabel,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

const TAB_LABELS = {
  pending: "Chờ xác nhận văn phòng",
  dispatch: "Chờ bưu cục xác nhận",
  received: "Chờ gán bưu tá",
  assigned: "Đang đi lấy",
};

export default function AdminPickupFlowScreen({ navigation, route }) {
  const initialTab = route.params?.initialTab || "pending";
  const { user, roles } = useUser();
  const roleId = user?.role_id || roles?.[0]?.role_id;
  const primaryHubId = user?.primary_hub_id || null;
  const canReviewPending = roleId === 1;
  const canProcessHubFlow = Boolean(primaryHubId);

  const tabs = useMemo(() => {
    const baseTabs = [];
    if (canReviewPending) {
      baseTabs.push({ key: "pending", label: TAB_LABELS.pending });
    }
    if (canProcessHubFlow) {
      baseTabs.push({ key: "dispatch", label: TAB_LABELS.dispatch });
      baseTabs.push({ key: "received", label: TAB_LABELS.received });
      baseTabs.push({ key: "assigned", label: TAB_LABELS.assigned });
    }
    return baseTabs.length > 0 ? baseTabs : [{ key: "pending", label: TAB_LABELS.pending }];
  }, [canProcessHubFlow, canReviewPending]);

  const [activeTab, setActiveTab] = useState(
    tabs.some((tab) => tab.key === initialTab) ? initialTab : tabs[0]?.key || "pending",
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [hubModalVisible, setHubModalVisible] = useState(false);
  const [shipperModalVisible, setShipperModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [pickedModalVisible, setPickedModalVisible] = useState(false);
  const [pickedImageUrl, setPickedImageUrl] = useState("");
  const [pickedImagePreview, setPickedImagePreview] = useState("");
  const [pickedNote, setPickedNote] = useState("Đã lấy hàng thành công");
  const [uploadingPickedImage, setUploadingPickedImage] = useState(false);

  useEffect(() => {
    setActiveTab(tabs.some((tab) => tab.key === initialTab) ? initialTab : tabs[0]?.key || "pending");
  }, [initialTab, tabs]);

  useEffect(() => {
    loadData();
  }, [activeTab, primaryHubId]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("realtime_event", (payload) => {
      const eventName = payload?.event;
      if (typeof eventName === "string" && eventName.startsWith("pickup.")) {
        loadData();
      }
    });

    return () => subscription.remove();
  }, [activeTab, primaryHubId]);

  const loadData = async () => {
    setLoading(true);
    setSelectedIds([]);

    let result;

    if (activeTab === "pending") {
      if (!canReviewPending) {
        setItems([]);
        setLoading(false);
        return;
      }

      const [pendingRes, rejectedRes] = await Promise.all([
        getOnlinePickupRequests("PENDING_CONFIRMATION"),
        getOnlinePickupRequests("HUB_REJECTED"),
      ]);

      if (!pendingRes.success) {
        Toast.show({ type: "error", text1: "Không tải được danh sách", text2: pendingRes.message });
        setItems([]);
        setLoading(false);
        return;
      }

      result = {
        success: true,
        data: [...(pendingRes.data || []), ...(rejectedRes.success ? rejectedRes.data || [] : [])],
      };
    } else if (activeTab === "dispatch") {
      if (!canProcessHubFlow) {
        setItems([]);
        setLoading(false);
        return;
      }
      result = await getHubDispatchRequests("DISPATCHED_TO_HUB", primaryHubId);
    } else if (activeTab === "received") {
      if (!canProcessHubFlow) {
        setItems([]);
        setLoading(false);
        return;
      }
      result = await getHubPickupRequests("RECEIVED", primaryHubId);
    } else {
      if (!canProcessHubFlow) {
        setItems([]);
        setLoading(false);
        return;
      }
      result = await getHubPickupRequests("ASSIGNED_PICKUP", primaryHubId);
    }

    if (result.success) {
      const nextItems = [...(result.data || [])].sort((a, b) => {
        const dateA = new Date(a.latest_request_at || a.dispatched_at || a.created_at || 0).getTime();
        const dateB = new Date(b.latest_request_at || b.dispatched_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      setItems(nextItems);
    } else {
      Toast.show({ type: "error", text1: "Không tải được danh sách", text2: result.message });
      setItems([]);
    }

    setLoading(false);
  };

  const loadHubs = async () => {
    const result = await getActiveHubs();
    if (!result.success) {
      Toast.show({ type: "error", text1: "Không tải được văn phòng", text2: result.message });
      return false;
    }
    setHubs(result.data || []);
    return true;
  };

  const toggleSelect = (requestId) => {
    setSelectedIds((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId],
    );
  };

  const openDispatchModal = async () => {
    if (selectedIds.length === 0) {
      Toast.show({ type: "error", text1: "Chưa chọn yêu cầu nào" });
      return;
    }
    const ok = await loadHubs();
    if (ok) {
      setHubModalVisible(true);
    }
  };

  const confirmDispatch = async (hub) => {
    setHubModalVisible(false);
    setSubmitting(true);
    const result = await dispatchOnlinePickupRequests(selectedIds, hub.hub_id, `Điều phối về ${hub.hub_name}`);
    setSubmitting(false);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Đã điều phối pickup",
        text2: `${selectedIds.length} yêu cầu sang ${hub.hub_name}`,
      });
      loadData();
      return;
    }

    Toast.show({ type: "error", text1: "Điều phối thất bại", text2: result.message });
  };

  const handleAccept = (item) => {
    Alert.alert(
      "Xác nhận tiếp nhận",
      `Xác nhận văn phòng nhận pickup ${item.request_code}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            setSubmitting(true);
            const result = await acceptHubDispatchRequest(item.request_code, "Văn phòng đã xác nhận tiếp nhận");
            setSubmitting(false);
            if (result.success) {
              Toast.show({ type: "success", text1: "Đã tiếp nhận pickup" });
              loadData();
              return;
            }
            Toast.show({ type: "error", text1: "Không thể tiếp nhận", text2: result.message });
          },
        },
      ],
    );
  };

  const openRejectModal = (item) => {
    setSelectedRequest(item);
    setRejectNote("");
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!selectedRequest) {
      return;
    }
    if (!rejectNote.trim()) {
      Toast.show({ type: "error", text1: "Cần nhập lý do từ chối" });
      return;
    }

    setSubmitting(true);
    const result = await rejectHubDispatchRequest(selectedRequest.request_code, rejectNote.trim());
    setSubmitting(false);
    setRejectModalVisible(false);

    if (result.success) {
      Toast.show({ type: "success", text1: "Đã từ chối pickup" });
      loadData();
      return;
    }

    Toast.show({ type: "error", text1: "Từ chối thất bại", text2: result.message });
  };

  const openShipperModal = async (item) => {
    setSelectedRequest(item);
    const result = await getAssignableShippers({
      hubId: item.target_hub_id || primaryHubId,
      isOnline: true,
      managedByCurrentCskh: roleId === 7,
    });

    if (!result.success) {
      Toast.show({ type: "error", text1: "Không tải được bưu tá", text2: result.message });
      return;
    }

    setShippers(result.data || []);
    setShipperModalVisible(true);
  };

  const openPickedModal = (item) => {
    setSelectedRequest(item);
    setPickedImageUrl("");
    setPickedImagePreview("");
    setPickedNote("Đã lấy hàng thành công");
    setPickedModalVisible(true);
  };

  const uploadPickedImage = async (asset) => {
    setUploadingPickedImage(true);
    setPickedImagePreview(asset.uri);

    const result = await uploadPickupImage({
      uri: asset.uri,
      name: asset.fileName || `pickup-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });

    const uploadedUrl = result.data?.image_url || result.data?.file_url;

    if (result.success && uploadedUrl) {
      setPickedImageUrl(uploadedUrl);
      setPickedImagePreview(asset.uri);
      Toast.show({ type: "success", text1: "Đã tải ảnh biên nhận lên thành công" });
    } else {
      setPickedImageUrl("");
      setPickedImagePreview("");
      Toast.show({ type: "error", text1: "Upload ảnh thất bại", text2: result.message });
    }

    setUploadingPickedImage(false);
  };

  const handlePickPickedImage = async (mode) => {
    const permission =
      mode === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Toast.show({ type: "error", text1: "Thiếu quyền truy cập ảnh" });
      return;
    }

    const result =
      mode === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          });

    if (result.canceled || !result.assets?.length) return;
    await uploadPickedImage(result.assets[0]);
  };

  const submitPicked = async () => {
    if (!selectedRequest || !pickedImageUrl) {
      Toast.show({ type: "error", text1: "Vui lòng tải ảnh biên nhận trước" });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/api/delivery/pickup-requests/${selectedRequest.request_code}/picked`, {
        pickup_image_url: pickedImageUrl,
        note: pickedNote.trim() || "Xác nhận bưu tá đã lấy hàng thành công trên mobile",
      });
      Toast.show({ type: "success", text1: "Đã xác nhận lấy hàng" });
      setPickedModalVisible(false);
      loadData();
    } catch (error) {
      Toast.show({ type: "error", text1: "Xác nhận thất bại", text2: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignShipper = async (shipper) => {
    if (!selectedRequest) {
      return;
    }

    setShipperModalVisible(false);
    setSubmitting(true);
    const result = await assignPickupShipper(
      selectedRequest.request_code,
      shipper.user_id || shipper.id,
      `Gán bưu tá ${shipper.full_name || shipper.username || ""}`.trim(),
    );
    setSubmitting(false);

    if (result.success) {
      Toast.show({ type: "success", text1: "Đã gán bưu tá thành công" });
      loadData();
      return;
    }

    Toast.show({ type: "error", text1: "Không thể gán bưu tá", text2: result.message });
  };

  const renderSourceBadge = (source) => {
    const sourceMap = {
      PORTAL: { label: "Khách tự tạo", color: "#0284C7" },
      HOTLINE: { label: "Hotline", color: "#7C3AED" },
      CSKH: { label: "CSKH", color: "#D97706" },
      ADMIN: { label: "Admin", color: "#059669" },
    };
    const info = sourceMap[source] || { label: source || "Khác", color: "#64748B" };
    return (
      <View
        style={[
          styles.sourcePill,
          { backgroundColor: `${info.color}15`, borderColor: `${info.color}30` },
        ]}
      >
        <Text style={[styles.sourcePillText, { color: info.color }]}>{info.label}</Text>
      </View>
    );
  };

  const renderBadge = (status) => {
    const color = getPickupStatusColor(status);
    return (
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: `${color}12`,
            borderColor: `${color}22`,
          },
        ]}
      >
        <Text style={[styles.statusText, { color }]}>{getPickupStatusLabel(status)}</Text>
      </View>
    );
  };

  const renderMeta = (label, value) => (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value || "---"}</Text>
    </View>
  );

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={styles.headerButton}
        activeOpacity={0.78}
    >
        <View style={styles.headerButtonInner}>
            <Ionicons name={icon} size={24} color={COLORS.white} />
        </View>
    </TouchableOpacity>
  );

  const renderCard = ({ item }) => {
    const checked = selectedIds.includes(item.request_id);
    return (
      <TouchableOpacity
        activeOpacity={activeTab === "pending" ? 0.84 : 1}
        onPress={() => activeTab === "pending" && toggleSelect(item.request_id)}
        style={[styles.card, checked && styles.cardChecked]}
      >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrap}>
              {activeTab === "pending" && (
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={24}
                  color={checked ? PRIMARY : "#94A3B8"}
                  style={{ marginRight: 8 }}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.requestCode}>{item.request_code}</Text>
                <Text style={styles.subCode}>
                  KH: {item.customer_code || "---"} · SĐT: {item.sender_phone || "---"}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              {renderBadge(item.status)}
              {renderSourceBadge(item.source)}
            </View>
          </View>

          {renderMeta("Khách hàng", item.customer_name)}
          {renderMeta("Địa chỉ lấy", item.pickup_address)}
          {renderMeta("Số bill trong túi", item.bag_item_count ? String(item.bag_item_count) : "---")}
          {renderMeta("Tổng cân dự kiến", formatWeight(item.total_estimated_weight))}
          {renderMeta("Cập nhật", formatDateTime(item.latest_request_at || item.dispatched_at))}

          {!!item.dispatch_note && renderMeta("Ghi chú điều phối", item.dispatch_note)}
          {!!item.rejection_note && renderMeta("Lý do từ chối", item.rejection_note)}
          {!!item.assigned_shipper_name && renderMeta("Bưu tá", item.assigned_shipper_name)}

          {activeTab === "dispatch" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => openRejectModal(item)} activeOpacity={0.84}>
                <Text style={styles.secondaryActionText}>Từ chối</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryActionWrap} onPress={() => handleAccept(item)} activeOpacity={0.88}>
                  <Text style={styles.primaryActionText}>Tiếp nhận</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "received" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryActionWrap} onPress={() => openShipperModal(item)} activeOpacity={0.88}>
                  <Text style={styles.primaryActionText}>Gán bưu tá</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "assigned" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryActionWrap} onPress={() => openPickedModal(item)} activeOpacity={0.88}>
                  <Text style={styles.primaryActionText}>Xác nhận đã lấy</Text>
              </TouchableOpacity>
            </View>
          )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pickup Online</Text>
          <Text style={styles.headerSub}>
            {primaryHubId ? `Hub phụ trách: ${primaryHubId}` : "Điều phối và tiếp nhận yêu cầu"}
          </Text>
        </View>

        <HeaderButton icon="reload" onPress={loadData} />
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.84}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng yêu cầu</Text>
        <Text style={styles.summaryValue}>{items.length}</Text>
        {activeTab === "pending" && (
          <Text style={styles.summaryHint}>{selectedIds.length} yêu cầu đang được chọn để điều phối</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="file-tray-outline" size={34} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>Không có yêu cầu nào trong bước này.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.request_id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "pending" && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.dispatchButton, (selectedIds.length === 0 || submitting) && { opacity: 0.65 }]}
            onPress={openDispatchModal}
            disabled={selectedIds.length === 0 || submitting}
            activeOpacity={0.88}
          >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.dispatchButtonText}>
                  Điều phối Hub ({selectedIds.length} đơn)
                </Text>
              )}
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={pickedModalVisible} transparent animationType="fade" onRequestClose={() => setPickedModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickedModalVisible(false)}>
          <Pressable style={styles.rejectCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Xác nhận đã lấy hàng</Text>
            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handlePickPickedImage("camera")} disabled={uploadingPickedImage}>
                <Text style={styles.secondaryActionText}>Chụp ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => handlePickPickedImage("library")} disabled={uploadingPickedImage}>
                <Text style={styles.secondaryActionText}>Chọn ảnh</Text>
              </TouchableOpacity>
            </View>
            {pickedImagePreview ? (
              <Image source={{ uri: pickedImagePreview }} style={{ width: "100%", height: 180, borderRadius: 16, marginBottom: 12 }} resizeMode="cover" />
            ) : null}
            <TextInput
              value={pickedNote}
              onChangeText={setPickedNote}
              placeholder="Nhập ghi chú xác nhận"
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.noteInput}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => setPickedModalVisible(false)} activeOpacity={0.84}>
                <Text style={styles.secondaryActionText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectActionWrap} onPress={submitPicked} activeOpacity={0.88} disabled={!pickedImageUrl || submitting}>
                  <Text style={styles.primaryActionText}>Đã lấy hàng</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={hubModalVisible} transparent animationType="fade" onRequestClose={() => setHubModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setHubModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Chọn văn phòng nhận</Text>
            <FlatList
              data={hubs}
              keyExtractor={(item) => String(item.hub_id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => confirmDispatch(item)} activeOpacity={0.84}>
                  <Text style={styles.modalItemTitle}>{item.hub_name}</Text>
                  <Text style={styles.modalItemSub}>{item.hub_code}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={shipperModalVisible} transparent animationType="fade" onRequestClose={() => setShipperModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShipperModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Chọn bưu tá online</Text>
            {shippers.length === 0 ? (
              <Text style={styles.emptyModalText}>Hiện chưa có bưu tá online phù hợp.</Text>
            ) : (
              <FlatList
                data={shippers}
                keyExtractor={(item) => String(item.user_id || item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => handleAssignShipper(item)} activeOpacity={0.84}>
                    <Text style={styles.modalItemTitle}>{item.full_name || item.username}</Text>
                    <Text style={styles.modalItemSub}>{item.phone_number || item.phone || "Bưu tá online"}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRejectModalVisible(false)}>
          <Pressable style={styles.rejectCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Lý do từ chối</Text>
            <TextInput
              value={rejectNote}
              onChangeText={setRejectNote}
              placeholder="Nhập lý do từ chối yêu cầu pickup"
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.noteInput}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => setRejectModalVisible(false)} activeOpacity={0.84}>
                <Text style={styles.secondaryActionText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectActionWrap} onPress={submitReject} activeOpacity={0.88}>
                  <Text style={styles.primaryActionText}>Xác nhận từ chối</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    ...Platform.select({
        ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
        android: { elevation: 8 }
    }),
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#E2E8F0",
  },
  tabButtonActive: {
    backgroundColor: PRIMARY,
  },
  tabText: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "800",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  summaryValue: {
    fontSize: 28,
    color: PRIMARY,
    fontWeight: "900",
    marginTop: 2,
  },
  summaryHint: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
    marginTop: 6,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "700",
    fontSize: 16
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  cardChecked: {
    borderColor: PRIMARY,
    backgroundColor: "#F0FDF4"
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  cardTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  requestCode: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  subCode: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12
  },
  metaLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    flex: 1
  },
  metaValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
    flex: 1.2,
    textAlign: "right"
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12
  },
  secondaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryActionText: {
    color: "#64748B",
    fontWeight: "900",
  },
  primaryActionWrap: {
    flex: 1.5,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  rejectActionWrap: {
    flex: 1.5,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  dispatchButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  dispatchButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    maxHeight: "70%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 }
    })
  },
  rejectCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 }
    })
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemTitle: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "800",
  },
  modalItemSub: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 4,
  },
  emptyModalText: {
    color: "#64748B",
    fontWeight: "700",
  },
  noteInput: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    color: "#0F172A",
    marginBottom: 16,
    fontWeight: "600"
  },
  sourcePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
*/
