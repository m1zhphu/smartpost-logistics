import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import styles from "../styles/ShipperReportIncidentScreenStyles";
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
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      extraScrollHeight={100}
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
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

      <View style={[styles.content, { flex: 1 }]}>
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
      </View>
    </KeyboardAwareScrollView>
  );
}

// STYLES CHUẨN DNA
// styles moved to ../styles/ShipperReportIncidentScreenStyles
