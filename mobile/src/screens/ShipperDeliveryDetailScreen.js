import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import {
  confirmDelivery,
  getDeliveryTasks,
  reportDeliveryFailure,
  uploadPodImage,
} from "../services/deliveryService";
import {
  formatCurrency,
  formatDateTime,
  formatWeight,
  getWaybillStatusLabel,
} from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperDeliveryDetailScreen({ route, navigation }) {
  const { waybillCode } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [podImageUrl, setPodImageUrl] = useState("");
  const [podPreview, setPodPreview] = useState("");
  const [codCollected, setCodCollected] = useState("0");
  const [note, setNote] = useState("Đã giao hàng thành công");

  useEffect(() => {
    fetchTask();
  }, []);

  const fetchTask = async () => {
    setLoading(true);
    const result = await getDeliveryTasks();
    if (result.success) {
      setTask(
        (result.data || []).find((item) => item.waybill_code === waybillCode) ||
          null,
      );
    }
    setLoading(false);
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Thiếu quyền", "Vui lòng cấp quyền camera để chụp POD.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    setPodPreview("");
    setPodImageUrl("");
    try {
      const upload = await uploadPodImage({
        uri: asset.uri,
        name: asset.fileName || `pod-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
      const uploaded = upload.data?.image_url || upload.data?.file_url;
      if (upload.success && uploaded) {
        setPodPreview(asset.uri);
        setPodImageUrl(uploaded);
        Toast.show({ type: "success", text1: "Đã tải ảnh POD" });
      } else {
        Toast.show({
          type: "error",
          text1: "Upload ảnh thất bại",
          text2: upload.message || "Máy chủ không trả về đường dẫn ảnh",
        });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleConfirm = () => {
    if (uploadingImage) {
      Toast.show({ type: "info", text1: "Ảnh POD đang được tải lên" });
      return;
    }
    if (!podImageUrl) {
      Toast.show({
        type: "error",
        text1: "Thiếu ảnh POD",
        text2: "Vui lòng chụp ảnh trước khi xác nhận.",
      });
      return;
    }
    Alert.alert("Xác nhận giao hàng", "Xác nhận đơn này đã giao thành công?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          setSubmitting(true);
          const result = await confirmDelivery(
            waybillCode,
            Number(codCollected || 0),
            note,
            podImageUrl,
          );
          setSubmitting(false);
          if (result.success) {
            Toast.show({ type: "success", text1: "Đã xác nhận giao hàng" });
            navigation.goBack();
          } else {
            Toast.show({
              type: "error",
              text1: "Xác nhận thất bại",
              text2: result.message,
            });
          }
        },
      },
    ]);
  };

  const handleFail = async () => {
    Alert.alert("Báo thất bại", "Bạn muốn báo giao không thành công?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Báo thất bại",
        style: "destructive",
        onPress: async () => {
          setSubmitting(true);
          const result = await reportDeliveryFailure(
            waybillCode,
            "CUSTOMER_UNAVAILABLE",
            note,
          );
          setSubmitting(false);
          if (result.success) {
            Toast.show({ type: "success", text1: "Đã báo thất bại" });
            navigation.goBack();
          } else {
            Toast.show({
              type: "error",
              text1: "Báo thất bại lỗi",
              text2: result.message,
            });
          }
        },
      },
    ]);
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

  if (loading)
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  if (!task)
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <Text style={styles.emptyText}>Không tìm thấy đơn giao này.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            marginTop: 20,
            backgroundColor: PRIMARY,
            padding: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chi tiết giao hàng</Text>
          <Text style={styles.headerSub}>{waybillCode}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>THÔNG TIN ĐƠN</Text>
          <Row label="Mã vận đơn" value={task.waybill_code} bold />
          <Row
            label="Trạng thái"
            value={getWaybillStatusLabel(task.status || task.waybill_status)}
            bold
            color={PRIMARY}
          />
          <Row label="Người nhận" value={task.receiver_name || "---"} />
          <Row label="SĐT nhận" value={task.receiver_phone || "---"} />
          <Row
            label="Hẹn giao"
            value={formatDateTime(
              task.requested_pickup_time || task.created_at,
            )}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ĐỊA CHỈ GIAO</Text>
          <Text style={styles.blockText}>{task.receiver_address || "---"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>COD & KIỆN HÀNG</Text>
          <Row
            label="COD"
            value={formatCurrency(task.cod_amount)}
            color="#EF4444"
            bold
          />
          <Row
            label="Khối lượng"
            value={formatWeight(task.actual_weight || task.est_weight)}
          />
          <Row label="Số kiện" value={task.est_quantity || 1} />
          <Row
            label="Cước phải thu"
            value={formatCurrency(
              task.total_amount_to_collect ||
                task.final_total_amount ||
                task.estimated_total_amount,
            )}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>XÁC NHẬN GIAO</Text>
          <TouchableOpacity
            style={styles.imageBtn}
            onPress={handlePickImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Ionicons name="camera-outline" size={18} color={PRIMARY} />
            )}
            <Text style={styles.imageBtnText}>{uploadingImage ? "Đang tải ảnh..." : "Chụp ảnh POD"}</Text>
          </TouchableOpacity>
          {podPreview ? (
            <Text style={styles.previewHint}>Đã chọn ảnh</Text>
          ) : null}
          <TextInput
            value={codCollected}
            onChangeText={setCodCollected}
            keyboardType="number-pad"
            placeholder="Tiền COD thu được (VNĐ)"
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú (Không bắt buộc)"
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>
      </ScrollView>

      {/* BOTTOM BAR CHUẨN FORM */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.failBtn, submitting && { opacity: 0.7 }]}
          onPress={handleFail}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.failText}>Báo thất bại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.okBtn, submitting && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={submitting || uploadingImage}
          activeOpacity={0.8}
        >
          <Text style={styles.okText}>
            {submitting ? "ĐANG XỬ LÝ..." : "Xác nhận giao"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Row = ({ label, value, bold, color }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, bold && styles.valueBold, color && { color }]}>
      {String(value ?? "---")}
    </Text>
  </View>
);

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
  emptyText: { color: "#0F172A", fontSize: 16, fontWeight: "700" },

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
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },

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
  label: { color: "#64748B", fontSize: 14, flex: 1, fontWeight: "700" },
  value: {
    color: "#0F172A",
    fontSize: 14,
    flex: 1.2,
    textAlign: "right",
    fontWeight: "600",
  },
  valueBold: { fontWeight: "900" },
  blockText: {
    color: "#0F172A",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },

  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageBtnText: { color: PRIMARY, fontWeight: "900", marginLeft: 8 },
  previewHint: {
    color: "#16A34A",
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    color: "#0F172A",
    fontWeight: "600",
  },

  // Bottom Bar Chuẩn Form
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  failBtn: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  failText: { color: "#EF4444", fontWeight: "900" },
  okBtn: {
    flex: 1.5,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  okText: { color: "white", fontWeight: "900" },
});
