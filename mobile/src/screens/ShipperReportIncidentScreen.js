import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { reportDeliveryFailure } from "../services/deliveryService";
import Toast from "react-native-toast-message";

const PRIMARY = COLORS.primary || "#1B5E20";

const INCIDENT_REASONS = [
  { code: "NOT_HOME", label: "Không có người nhận" },
  { code: "WRONG_ADDRESS", label: "Sai địa chỉ" },
  { code: "REFUSED", label: "Khách từ chối nhận" },
  { code: "DAMAGED", label: "Hàng hóa bị hư hỏng" },
  { code: "OTHER", label: "Lý do khác" },
];

export default function ShipperReportIncidentScreen({ route, navigation }) {
  const { waybillCode } = route.params || {};
  const [selectedReason, setSelectedReason] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Toast.show({ type: "error", text1: "Vui lòng chọn lý do sự cố" });
      return;
    }

    if (selectedReason === "OTHER" && !note.trim()) {
      Toast.show({
        type: "error",
        text1: "Vui lòng nhập ghi chú cho lý do khác",
      });
      return;
    }

    setLoading(true);
    const result = await reportDeliveryFailure(
      waybillCode,
      selectedReason,
      note,
    );
    setLoading(false);

    if (result.success) {
      Toast.show({ type: "success", text1: "Đã báo cáo sự cố thành công" });
      navigation.goBack();
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi báo cáo sự cố",
        text2: result.message,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO BOX */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconBox}>
            <Ionicons name="barcode-outline" size={20} color={PRIMARY} />
          </View>
          <View>
            <Text style={styles.infoLabel}>Mã vận đơn</Text>
            <Text style={styles.infoValue}>{waybillCode || "---"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Chọn lý do (*)</Text>
        <View style={styles.reasonList}>
          {INCIDENT_REASONS.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.reasonItem,
                selectedReason === item.code && styles.reasonItemSelected,
              ]}
              onPress={() => setSelectedReason(item.code)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.radioBtn,
                  selectedReason === item.code && styles.radioBtnSelected,
                ]}
              >
                {selectedReason === item.code && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === item.code && styles.reasonTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ghi chú thêm</Text>
        <TextInput
          style={styles.textArea}
          multiline={true}
          numberOfLines={4}
          placeholder="Mô tả chi tiết sự cố..."
          placeholderTextColor="#94A3B8"
          value={note}
          onChangeText={setNote}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>GỬI BÁO CÁO</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

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
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  headerBtn: {
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

  content: { padding: 16, paddingBottom: 40 },

  // INFO BOX - CHUẨN DNA
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 2,
  },
  infoValue: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
    marginLeft: 4,
  },

  // REASON LIST CHUẨN
  reasonList: { marginBottom: 24 },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reasonItemSelected: { borderColor: PRIMARY, backgroundColor: "#F0FDF4" },
  radioBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioBtnSelected: { borderColor: PRIMARY },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
  reasonText: {
    fontSize: 15,
    color: "#475569",
    marginLeft: 12,
    fontWeight: "700",
  },
  reasonTextSelected: { color: PRIMARY, fontWeight: "900" },

  // TEXT AREA CHUẨN
  textArea: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 32,
    color: "#0F172A",
    fontWeight: "600",
  },

  submitBtn: {
    backgroundColor: "#EF4444",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
});
