import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import { confirmDelivery, getDeliveryTasks, reportDeliveryFailure, uploadPickupImage } from "../services/deliveryService";
import { formatCurrency, formatDateTime, formatWeight, getWaybillStatusLabel } from "../utils/pickupHelpers";

export default function ShipperDeliveryDetailScreen({ route, navigation }) {
  const { waybillCode } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [podImageUrl, setPodImageUrl] = useState("");
  const [podPreview, setPodPreview] = useState("");
  const [codCollected, setCodCollected] = useState("0");
  const [note, setNote] = useState("Đã giao hàng thành công");

  useEffect(() => { fetchTask(); }, []);

  const fetchTask = async () => {
    setLoading(true);
    const result = await getDeliveryTasks();
    if (result.success) {
      setTask((result.data || []).find((item) => item.waybill_code === waybillCode) || null);
    }
    setLoading(false);
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Thiếu quyền", "Vui lòng cấp quyền camera để chụp POD.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setPodPreview(asset.uri);
    const upload = await uploadPickupImage({ uri: asset.uri, name: asset.fileName || `pod-${Date.now()}.jpg`, type: asset.mimeType || "image/jpeg" });
    const uploaded = upload.data?.image_url || upload.data?.file_url;
    if (upload.success && uploaded) {
      setPodImageUrl(uploaded);
      Toast.show({ type: "success", text1: "Đã tải ảnh POD" });
    } else {
      setPodPreview("");
      setPodImageUrl("");
      Toast.show({ type: "error", text1: "Upload ảnh thất bại", text2: upload.message });
    }
  };

  const handleConfirm = () => {
    if (!podImageUrl) {
      Toast.show({ type: "error", text1: "Thiếu ảnh POD", text2: "Vui lòng chụp ảnh trước khi xác nhận." });
      return;
    }
    Alert.alert("Xác nhận giao hàng", "Xác nhận đơn này đã giao thành công?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: async () => {
        setSubmitting(true);
        const result = await confirmDelivery(waybillCode, Number(codCollected || 0), note, podImageUrl);
        setSubmitting(false);
        if (result.success) {
          Toast.show({ type: "success", text1: "Đã xác nhận giao hàng" });
          navigation.goBack();
        } else {
          Toast.show({ type: "error", text1: "Xác nhận thất bại", text2: result.message });
        }
      }},
    ]);
  };

  const handleFail = async () => {
    Alert.alert("Báo thất bại", "Bạn muốn báo giao không thành công?", [
      { text: "Hủy", style: "cancel" },
      { text: "Báo thất bại", style: "destructive", onPress: async () => {
        setSubmitting(true);
        const result = await reportDeliveryFailure(waybillCode, "CUSTOMER_UNAVAILABLE", note);
        setSubmitting(false);
        if (result.success) {
          Toast.show({ type: "success", text1: "Đã báo thất bại" });
          navigation.goBack();
        } else {
          Toast.show({ type: "error", text1: "Báo thất bại lỗi", text2: result.message });
        }
      }},
    ]);
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!task) return <View style={[styles.container, styles.center]}><Text style={styles.emptyText}>Không tìm thấy đơn giao này.</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Chi tiết giao hàng</Text>
          <Text style={styles.headerSub}>{waybillCode}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 120 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>THÔNG TIN ĐƠN</Text>
          <Row label="Mã vận đơn" value={task.waybill_code} bold />
          <Row label="Trạng thái" value={getWaybillStatusLabel(task.status || task.waybill_status)} bold />
          <Row label="Người nhận" value={task.receiver_name || "---"} />
          <Row label="SĐT nhận" value={task.receiver_phone || "---"} />
          <Row label="Hẹn giao" value={formatDateTime(task.requested_pickup_time || task.created_at)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ĐỊA CHỈ GIAO</Text>
          <Text style={styles.blockText}>{task.receiver_address || "---"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>COD & KIỆN HÀNG</Text>
          <Row label="COD" value={formatCurrency(task.cod_amount)} />
          <Row label="Khối lượng" value={formatWeight(task.actual_weight || task.est_weight)} />
          <Row label="Số kiện" value={task.est_quantity || 1} />
          <Row label="Cước phải thu" value={formatCurrency(task.total_amount_to_collect || task.final_total_amount || task.estimated_total_amount)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>XÁC NHẬN GIAO</Text>
          <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
            <Ionicons name="camera-outline" size={18} color="white" />
            <Text style={styles.imageBtnText}>Chụp ảnh POD</Text>
          </TouchableOpacity>
          {podPreview ? <Text style={styles.previewHint}>Đã chọn ảnh</Text> : null}
          <TextInput value={codCollected} onChangeText={setCodCollected} keyboardType="number-pad" placeholder="Tiền COD thu được" style={styles.input} />
          <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú" style={[styles.input, { minHeight: 80 }]} multiline />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.failBtn, submitting && { opacity: 0.7 }]} onPress={handleFail} disabled={submitting}>
          <Text style={styles.failText}>Báo thất bại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.okBtn, submitting && { opacity: 0.7 }]} onPress={handleConfirm} disabled={submitting}>
          <Text style={styles.okText}>{submitting ? "ĐANG XỬ LÝ..." : "Xác nhận giao"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Row = ({ label, value, bold }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, bold && styles.valueBold]}>{String(value ?? "---")}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.primary, paddingHorizontal: 15, paddingTop: 40, paddingBottom: 14 },
  iconBtn: { padding: 5 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  card: { backgroundColor: "white", borderRadius: 16, padding: 15, marginBottom: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.secondary, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 12 },
  label: { color: "#64748b", fontSize: 14, flex: 1, fontWeight: "700" },
  value: { color: "#0f172a", fontSize: 14, flex: 1.2, textAlign: "right" },
  valueBold: { fontWeight: "800" },
  blockText: { color: "#0f172a", fontSize: 14, lineHeight: 22, fontWeight: "700" },
  imageBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, marginBottom: 10 },
  imageBtnText: { color: "white", fontWeight: "800", marginLeft: 8 },
  previewHint: { color: "#16a34a", fontSize: 12, marginBottom: 10 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, color: "#0f172a" },
  bottomBar: { flexDirection: "row", gap: 10, padding: 14, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  failBtn: { flex: 1, backgroundColor: "#fff1f2", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#fecdd3" },
  failText: { color: "#e11d48", fontWeight: "800" },
  okBtn: { flex: 1.3, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  okText: { color: "white", fontWeight: "800" },
});
