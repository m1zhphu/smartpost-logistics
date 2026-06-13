import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { COLORS } from "../constants/colors";
import {
  confirmPickup,
  getShipperPickupDetail,
  sendGpsLocation,
  uploadPickupImage,
} from "../services/pickupService";
import {
  formatCurrency,
  formatDateTime,
  formatWeight,
  getPickupStatusColor,
  getPickupStatusLabel,
  getPriceStatusLabel,
  getWaybillStatusLabel,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default function ShipperPickupDetailScreen({ route, navigation }) {
  const { requestCode } = route.params;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [pickupImageUrl, setPickupImageUrl] = useState("");
  const [pickupImagePreview, setPickupImagePreview] = useState("");
  const [pickedNote, setPickedNote] = useState(
    "Đã lấy hàng từ khách và chuẩn bị mang về bưu cục",
  );

  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    const result = await getShipperPickupDetail(requestCode);
    if (result.success) {
      setDetail(result.data);
      setPickupImageUrl(result.data?.pickup_image_url || "");
      setPickupImagePreview(result.data?.pickup_image_url || "");
    } else {
      Toast.show({
        type: "error",
        text1: "Không tải được chi tiết",
        text2: result.message,
      });
    }
    setLoading(false);
  };

  const getDisplayImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http") || value.startsWith("file:")) return value;
    const base = process.env.EXPO_PUBLIC_API_BASE_URL || "";
    return `${base}${value}`;
  };

  const handleCall = async () => {
    if (!detail?.sender_phone) return;
    const url = `tel:${detail.sender_phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) Linking.openURL(url);
  };

  const handleOpenMap = async () => {
    if (!detail?.pickup_address) return;
    const query = encodeURIComponent(detail.pickup_address);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    const canOpen = await Linking.canOpenURL(mapUrl);
    if (canOpen) Linking.openURL(mapUrl);
  };

  const handleSendLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Vui lòng cấp quyền truy cập vị trí để gửi GPS.",
      );
      return;
    }
    Toast.show({ type: "info", text1: "Đang lấy vị trí..." });
    try {
      const location = await Location.getCurrentPositionAsync({});
      const result = await sendGpsLocation(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy,
        "Shipper gửi vị trí khi đi lấy hàng",
      );
      if (result.success) {
        Toast.show({ type: "success", text1: "Gửi vị trí thành công" });
      } else {
        Toast.show({
          type: "error",
          text1: "Gửi vị trí thất bại",
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Không lấy được GPS",
        text2: error.message,
      });
    }
  };

  const uploadSelectedImage = async (asset) => {
    setUploadingImage(true);
    setPickupImagePreview(asset.uri);
    const result = await uploadPickupImage({
      uri: asset.uri,
      name: asset.fileName || `pickup-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
    setUploadingImage(false);

    const uploadedUrl = result.data?.image_url || result.data?.file_url;
    if (result.success && uploadedUrl) {
      setPickupImageUrl(uploadedUrl);
      setPickupImagePreview(asset.uri);
      Toast.show({
        type: "success",
        text1: "Đã tải ảnh pickup lên thành công",
      });
      return;
    }
    setPickupImagePreview("");
    setPickupImageUrl("");
    Toast.show({
      type: "error",
      text1: "Upload ảnh thất bại",
      text2: result.message,
    });
  };

  const handlePickImage = async (mode) => {
    const permission =
      mode === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert(
        "Thiếu quyền",
        mode === "camera"
          ? "Vui lòng cấp quyền camera để chụp ảnh pickup."
          : "Vui lòng cấp quyền thư viện ảnh để chọn ảnh pickup.",
      );
      return;
    }

    const result =
      mode === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          });

    if (result.canceled || !result.assets?.length) return;
    await uploadSelectedImage(result.assets[0]);
  };

  const handleConfirmPicked = async () => {
    if (!pickupImageUrl) {
      Toast.show({
        type: "error",
        text1: "Thiếu ảnh xác nhận",
        text2: "Vui lòng chụp hoặc chọn ảnh pickup trước khi xác nhận.",
      });
      return;
    }

    Alert.alert("Xác nhận", "Bạn có chắc chắn đã lấy hàng thành công?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          setSubmitting(true);
          const result = await confirmPickup(
            requestCode,
            pickupImageUrl,
            pickedNote.trim() || "Đã lấy hàng thành công",
          );
          setSubmitting(false);

          if (result.success) {
            Toast.show({
              type: "success",
              text1: "Xác nhận lấy hàng thành công",
            });
            navigation.goBack();
          } else {
            Toast.show({
              type: "error",
              text1: "Lỗi xác nhận",
              text2: result.message,
            });
          }
        },
      },
    ]);
  };

  const handleMockAction = (actionName) => {
    Toast.show({
      type: "info",
      text1: "Đang chờ phát triển",
      text2: `Tính năng ${actionName} đang được phát triển.`,
    });
  };

  const handleCreateBill = (billType) => {
    setShowBillModal(false);
    navigation.navigate("ShipperCreateBill", { billType, requestCode });
  };

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
    </TouchableOpacity>
  );

  const Row = ({ label, value, bold, color }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[bold ? styles.valueBold : styles.value, color && { color }]}
      >
        {value}
      </Text>
    </View>
  );

  const ColumnRow = ({ label, value }) => (
    <View style={styles.columnRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valueBlock}>{value}</Text>
    </View>
  );

  const PrimaryButton = ({ icon, text, colors, onPress, disabled, style }) => (
    <TouchableOpacity
      style={[
        styles.primaryButtonWrap,
        style,
        { backgroundColor: colors[0] },
        disabled && styles.disabledBtn,
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.primaryButtonInner}>
        <Ionicons name={icon} size={18} color="#FFF" />
        <Text style={styles.primaryButtonText}>{text}</Text>
      </View>
    </TouchableOpacity>
  );

  const SecondaryButton = ({ icon, text, onPress, disabled, style }) => (
    <TouchableOpacity
      style={[
        styles.secondaryButtonWrap,
        style,
        disabled && styles.disabledBtn,
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.secondaryButtonInner}>
        <Ionicons name={icon} size={18} color={PRIMARY} />
        <Text style={styles.secondaryButtonText}>{text}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>Không thể tải chi tiết lấy hàng.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chi tiết lấy hàng</Text>
        </View>
        <HeaderButton icon="location-outline" onPress={handleSendLocation} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>THÔNG TIN PICKUP</Text>
            <Row
              label="Mã yêu cầu:"
              value={detail.request_code}
              bold
              color={PRIMARY}
            />
            <Row
              label="Mã vận đơn:"
              value={detail.waybill_code || "---"}
              bold
            />
            <Row
              label="Trạng thái pickup:"
              value={getPickupStatusLabel(detail.pickup_status)}
              bold
              color={getPickupStatusColor(detail.pickup_status)}
            />
            <Row
              label="Trạng thái vận đơn:"
              value={getWaybillStatusLabel(detail.waybill_status)}
            />
            <Row
              label="Thời gian hẹn lấy:"
              value={formatDateTime(detail.requested_pickup_time)}
            />
            <Row
              label="Văn phòng tiếp nhận:"
              value={detail.target_hub_name || "---"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>NGƯỜI GỬI</Text>
            <Row label="Tên:" value={detail.sender_name || "---"} />
            <Row label="SĐT:" value={detail.sender_phone || "---"} bold />
            <ColumnRow
              label="Địa chỉ lấy:"
              value={detail.pickup_address || "---"}
            />
            <View style={styles.actionRow}>
              <PrimaryButton
                icon="call"
                text="Gọi điện"
                colors={["#10B981", "#34D399"]}
                onPress={handleCall}
                style={styles.actionButtonSpacer}
              />
              <PrimaryButton
                icon="map"
                text="Bản đồ"
                colors={["#3B82F6", "#60A5FA"]}
                onPress={handleOpenMap}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>NGƯỜI NHẬN</Text>
            <Row label="Tên:" value={detail.receiver_name || "---"} />
            <Row label="SĐT:" value={detail.receiver_phone || "---"} />
            <ColumnRow
              label="Địa chỉ nhận:"
              value={detail.receiver_address || "---"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>KIỆN HÀNG</Text>
            <Row
              label="Loại hàng:"
              value={detail.product_name || detail.product_type || "---"}
            />
            <Row label="Số kiện:" value={detail.est_quantity || 0} />
            <Row
              label="Khối lượng ước tính:"
              value={formatWeight(detail.est_weight)}
            />
            <Row label="COD:" value={formatCurrency(detail.cod_amount)} />
            <Row
              label="Cước:"
              value={`${getPriceStatusLabel(detail.price_status)} - ${formatCurrency(detail.estimated_total_amount)}`}
            />
            <ColumnRow
              label="Ghi chú:"
              value={detail.note || "Không có ghi chú"}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ẢNH XÁC NHẬN PICKUP</Text>
            <View style={styles.uploadActions}>
              <SecondaryButton
                icon="camera-outline"
                text="Chụp ảnh"
                disabled={uploadingImage}
                onPress={() => handlePickImage("camera")}
                style={styles.secondaryButtonSpacer}
              />
              <SecondaryButton
                icon="images-outline"
                text="Chọn ảnh"
                disabled={uploadingImage}
                onPress={() => handlePickImage("library")}
              />
            </View>

            {pickupImagePreview ? (
              <Image
                source={{ uri: getDisplayImageUrl(pickupImagePreview) }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="image-outline" size={32} color="#94A3B8" />
                <Text style={styles.placeholderText}>Chưa có ảnh pickup</Text>
              </View>
            )}

            <View style={styles.noteInputContainer}>
              <TextInput
                style={styles.noteInput}
                value={pickedNote}
                onChangeText={setPickedNote}
                placeholder="Ghi chú xác nhận đã lấy hàng"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                underlineColorAndroid="transparent"
                keyboardAppearance="light"
              />
            </View>

            {uploadingImage ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.uploadingText}>Đang tải ảnh lên...</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showBillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBillModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBillModal(false)}
        >
          <Pressable
            style={styles.billMenuContainer}
            onPress={(event) => event.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.billMenuItem}
              onPress={() => handleCreateBill("Tạo bill tổng")}
              activeOpacity={0.7}
            >
              <Text style={styles.billMenuText}>Tạo bill tổng</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.billMenuItem}
              onPress={() => handleCreateBill("Tạo bill lẻ")}
              activeOpacity={0.7}
            >
              <Text style={styles.billMenuText}>Tạo bill lẻ</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.billMenuItem}
              onPress={() => handleCreateBill("Tạo bill đầy đủ")}
              activeOpacity={0.7}
            >
              <Text style={styles.billMenuText}>Tạo bill đầy đủ</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.billMenuItemCancel}
              onPress={() => setShowBillModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.billMenuTextCancel}>Huỷ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* BOTTOM DOCK CHUẨN FORM */}
      <View style={styles.bottomDock}>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={handleConfirmPicked}
            disabled={submitting || uploadingImage}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
            )}
            <Text style={[styles.actionGridText, { color: PRIMARY }]}>
              Đã nhận
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => handleMockAction("Từ chối")}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
            <Text style={[styles.actionGridText, { color: "#EF4444" }]}>
              Từ chối
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => handleMockAction("Phụ phí")}
            activeOpacity={0.7}
          >
            <Ionicons name="cash-outline" size={24} color={SECONDARY} />
            <Text style={[styles.actionGridText, { color: SECONDARY }]}>
              Phụ phí
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => handleMockAction("Sự cố")}
            activeOpacity={0.7}
          >
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={[styles.actionGridText, { color: "#F59E0B" }]}>
              Sự cố
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => setShowBillModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="list-circle" size={24} color="#3B82F6" />
            <Text style={[styles.actionGridText, { color: "#3B82F6" }]}>
              Bill
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  errorText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: { color: "white", fontWeight: "900", fontSize: 14 },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
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

  scrollContent: { padding: 16, paddingBottom: 120 },

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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  columnRow: { marginBottom: 12 },
  label: { color: "#64748B", fontSize: 14, flex: 1, fontWeight: "600" },
  value: {
    color: "#0F172A",
    fontSize: 14,
    flex: 1.2,
    textAlign: "right",
    fontWeight: "700",
  },
  valueBold: { fontWeight: "900" },
  valueBlock: {
    color: "#0F172A",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 22,
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionButtonSpacer: { marginRight: 10 },
  primaryButtonWrap: { flex: 1, borderRadius: 12 },
  primaryButtonInner: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
    marginLeft: 6,
  },

  uploadActions: { flexDirection: "row", marginBottom: 16 },
  secondaryButtonWrap: { flex: 1, borderRadius: 12 },
  secondaryButtonSpacer: { marginRight: 10 },
  secondaryButtonInner: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontWeight: "800",
    marginLeft: 6,
    fontSize: 14,
  },

  placeholderBox: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  placeholderText: { marginTop: 8, color: "#64748B", fontWeight: "700" },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  noteInputContainer: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  noteInput: {
    minHeight: 90,
    padding: 14,
    textAlignVertical: "top",
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },

  uploadingRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  uploadingText: {
    color: "#475569",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "700",
  },
  disabledBtn: { opacity: 0.7 },

  // Bottom Bar Chuẩn Form
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 10,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionGridBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  actionGridText: { fontSize: 11, fontWeight: "900", marginTop: 4 },

  // Modal Chuẩn
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  billMenuContainer: {
    width: "85%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: "hidden",
  },
  billMenuItem: {
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  billMenuItemCancel: {
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  billMenuText: { fontSize: 16, color: PRIMARY, fontWeight: "900" },
  billMenuTextCancel: { fontSize: 16, color: "#EF4444", fontWeight: "900" },
  divider: { height: 1, backgroundColor: "#F1F5F9" },
});
