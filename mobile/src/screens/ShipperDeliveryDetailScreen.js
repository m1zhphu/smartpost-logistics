import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import { confirmDelivery, getDeliveryTasks, reportDeliveryFailure, uploadPickupImage } from "../services/deliveryService";
import { formatCurrency, formatDateTime, formatWeight, getWaybillStatusLabel } from "../utils/pickupHelpers";

const PRIMARY = COLORS.primary || "#1B5E20";

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

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.78}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={24} color="#FFF" />
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={PRIMARY} /></View>;
  if (!task) return <View style={[styles.container, styles.center]}><Text style={styles.emptyText}>Không tìm thấy đơn giao này.</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Chi tiết giao hàng</Text>
          <Text style={styles.headerSub}>{waybillCode}</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
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
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748B", fontSize: 16, fontWeight: "700" },
  
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
    ...Platform.select({
      ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
      android: { elevation: 8 },
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

  headerTitleGroup: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },

  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, fontWeight: "700" },
  
  card: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  
  sectionTitle: { fontSize: 14, fontWeight: "900", color: COLORS.secondary, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 12 },
  label: { color: "#64748B", fontSize: 14, flex: 1, fontWeight: "700" },
  value: { color: "#0F172A", fontSize: 14, flex: 1.2, textAlign: "right" },
  valueBold: { fontWeight: "900", color: PRIMARY },
  blockText: { color: "#0F172A", fontSize: 14, lineHeight: 22, fontWeight: "700" },
  
  imageBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 12, marginBottom: 10 },
  imageBtnText: { color: "white", fontWeight: "900", marginLeft: 8 },
  previewHint: { color: "#16A34A", fontSize: 12, marginBottom: 10, fontWeight: "700", textAlign: "center" },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, color: "#0F172A", fontWeight: "600" },
  
  bottomBar: { 
    flexDirection: "row", 
    gap: 12, 
    padding: 16, 
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#FFFFFF", 
    borderTopWidth: 1, 
    borderTopColor: "#E2E8F0" 
  },
  failBtn: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#EF4444" },
  failText: { color: "#EF4444", fontWeight: "900" },
  okBtn: { flex: 1.5, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  okText: { color: "white", fontWeight: "900" },
});
