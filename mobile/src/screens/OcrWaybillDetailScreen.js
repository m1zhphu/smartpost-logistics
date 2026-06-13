import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import {
  extractBillOcr,
  patchOcrWaybill,
  uploadBillImage,
} from "../services/pickupService";

const PRIMARY = COLORS.primary || "#1B5E20";

const SERVICE_OPTIONS = ["STANDARD", "EXPRESS", "CPN", "HT"];
const PRODUCT_GROUP_OPTIONS = ["DOCUMENT", "PARCEL"];

export default function OcrWaybillDetailScreen({ route, navigation }) {
  const { waybillCode, waybillData } = route.params;

  const initialForm = useMemo(
    () => ({
      receiver_name: waybillData?.receiver_name || "",
      receiver_phone: waybillData?.receiver_phone || "",
      receiver_address: waybillData?.receiver_address || "",
      receiver_province_name: waybillData?.receiver_province_name || "",
      receiver_district_name: waybillData?.receiver_district_name || "",
      receiver_ward_name: waybillData?.receiver_ward_name || "",
      actual_weight:
        waybillData?.actual_weight != null
          ? String(waybillData.actual_weight)
          : "",
      length: waybillData?.length != null ? String(waybillData.length) : "",
      width: waybillData?.width != null ? String(waybillData.width) : "",
      height: waybillData?.height != null ? String(waybillData.height) : "",
      cod_amount:
        waybillData?.cod_amount != null ? String(waybillData.cod_amount) : "0",
      service_type: waybillData?.service_type || "STANDARD",
      product_name: waybillData?.product_name || "",
      product_group: waybillData?.product_group || "DOCUMENT",
      declared_value:
        waybillData?.declared_value != null
          ? String(waybillData.declared_value)
          : "0",
      note: waybillData?.note || "",
      ocr_raw_text: "",
    }),
    [waybillData],
  );

  const [form, setForm] = useState(initialForm);
  const [billImageUrl, setBillImageUrl] = useState(
    waybillData?.bill_image_url || "",
  );
  const [imagePreview, setImagePreview] = useState(
    waybillData?.bill_image_url || "",
  );
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getDisplayImageUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("http") || value.startsWith("file:")) return value;
    const base = process.env.EXPO_PUBLIC_API_BASE_URL || "";
    return `${base}${value}`;
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
          ? "Vui lòng cấp quyền camera để chụp ảnh bill."
          : "Vui lòng cấp quyền thư viện để chọn ảnh bill.",
      );
      return;
    }

    const result =
      mode === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.85,
          });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploading(true);
    setImagePreview(asset.uri);
    const uploadResult = await uploadBillImage({
      uri: asset.uri,
      name: asset.fileName || `bill-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
    setUploading(false);

    if (!uploadResult.success) {
      Toast.show({
        type: "error",
        text1: "Upload ảnh thất bại",
        text2: uploadResult.message,
      });
      return;
    }

    const uploadedUrl =
      uploadResult.data?.image_url || uploadResult.data?.file_url || "";
    setBillImageUrl(uploadedUrl);
    setImagePreview(asset.uri);
    Toast.show({ type: "success", text1: "Đã tải ảnh bill thành công" });
  };

  const handleExtract = async () => {
    if (!imagePreview) {
      Toast.show({
        type: "error",
        text1: "Chưa có ảnh bill",
        text2: "Vui lòng chụp hoặc chọn ảnh trước khi OCR.",
      });
      return;
    }

    setExtracting(true);
    const extractResult = await extractBillOcr({
      uri: imagePreview,
      name: `ocr-${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    setExtracting(false);

    if (!extractResult.success) {
      Toast.show({
        type: "error",
        text1: "OCR thất bại",
        text2: extractResult.message,
      });
      return;
    }

    const data = extractResult.data || {};
    const receiver = data.receiver || {};
    setForm((prev) => ({
      ...prev,
      receiver_name: receiver.name || prev.receiver_name,
      receiver_phone: receiver.phone || prev.receiver_phone,
      receiver_address:
        receiver.address || data.receiver_address || prev.receiver_address,
      product_name: data.product_name || prev.product_name,
      actual_weight:
        data.weight != null ? String(data.weight) : prev.actual_weight,
      cod_amount: data.cod != null ? String(data.cod) : prev.cod_amount,
      ocr_raw_text: JSON.stringify(data),
    }));
    Toast.show({ type: "success", text1: "Đã tự điền OCR vào form" });
  };

  const buildPayload = () => {
    const payload = {
      receiver_name: form.receiver_name.trim(),
      receiver_phone: form.receiver_phone.trim(),
      receiver_address: form.receiver_address.trim(),
      receiver_province_name: form.receiver_province_name.trim(),
      receiver_district_name: form.receiver_district_name.trim(),
      receiver_ward_name: form.receiver_ward_name.trim(),
      service_type: form.service_type,
      product_name: form.product_name.trim(),
      product_group: form.product_group,
      bill_image_url: billImageUrl || undefined,
      note: form.note.trim(),
      ocr_raw_text: form.ocr_raw_text.trim() || undefined,
    };

    const numericFields = [
      "actual_weight",
      "length",
      "width",
      "height",
      "cod_amount",
      "declared_value",
    ];

    numericFields.forEach((field) => {
      const value = form[field];
      if (value !== "") {
        payload[field] = Number(value);
      }
    });

    return payload;
  };

  const handleSave = async () => {
    if (!form.receiver_name.trim() || !form.receiver_phone.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin cơ bản",
        text2: "Vui lòng nhập tên và SDT người nhận.",
      });
      return;
    }

    setSaving(true);
    const result = await patchOcrWaybill(waybillCode, buildPayload());
    setSaving(false);

    if (!result.success) {
      Toast.show({
        type: "error",
        text1: "Không lưu được OCR",
        text2: result.message,
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Đã cập nhật vận đơn",
      text2: `Trạng thái OCR: ${result.data?.ocr_status || "REVIEW"}`,
    });
    navigation.goBack();
  };

  const renderField = (label, key, placeholder, opts = {}) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, opts.multiline && styles.textArea]}
        value={form[key]}
        onChangeText={(value) => setField(key, value)}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={opts.keyboardType || "default"}
        multiline={opts.multiline}
        numberOfLines={opts.multiline ? 3 : 1}
        textAlignVertical={opts.multiline ? "top" : "center"}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{waybillCode}</Text>
          <Text style={styles.headerSubtitle}>
            {waybillData?.ocr_status || "PENDING"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="save-outline" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ANH BILL</Text>
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handlePickImage("camera")}
                disabled={uploading}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={16} color={PRIMARY} />
                <Text style={styles.secondaryButtonText}>Chup anh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handlePickImage("library")}
                disabled={uploading}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={16} color={PRIMARY} />
                <Text style={styles.secondaryButtonText}>Chon anh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.secondaryButtonAccent]}
                onPress={handleExtract}
                disabled={extracting || uploading}
                activeOpacity={0.8}
              >
                {extracting ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <Ionicons name="scan-outline" size={16} color="#7C3AED" />
                )}
                <Text
                  style={[styles.secondaryButtonText, { color: "#7C3AED" }]}
                >
                  OCR
                </Text>
              </TouchableOpacity>
            </View>

            {imagePreview ? (
              <Image
                source={{ uri: getDisplayImageUrl(imagePreview) }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="image-outline" size={30} color="#94A3B8" />
                <Text style={styles.placeholderText}>Chưa có ảnh bill</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>NGUOI NHAN</Text>
            {renderField("Ten nguoi nhan", "receiver_name", "Nguyen Van A")}
            {renderField("So dien thoai", "receiver_phone", "0901234567", {
              keyboardType: "phone-pad",
            })}
            {renderField("Dia chi", "receiver_address", "123 Nguyen Hue", {
              multiline: true,
            })}
            {renderField(
              "Tinh/Thanh",
              "receiver_province_name",
              "TP. Ho Chi Minh",
            )}
            {renderField("Quan/Huyen", "receiver_district_name", "Quan 1")}
            {renderField("Phuong/Xa", "receiver_ward_name", "Ben Nghe")}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>THONG TIN VAN DON</Text>
            {renderField("Can nang thuc te (kg)", "actual_weight", "0.5", {
              keyboardType: "decimal-pad",
            })}
            <View style={styles.row}>
              <View style={styles.col}>
                {renderField("Dai", "length", "30", {
                  keyboardType: "decimal-pad",
                })}
              </View>
              <View style={styles.col}>
                {renderField("Rong", "width", "20", {
                  keyboardType: "decimal-pad",
                })}
              </View>
              <View style={styles.col}>
                {renderField("Cao", "height", "10", {
                  keyboardType: "decimal-pad",
                })}
              </View>
            </View>
            {renderField("COD", "cod_amount", "0", {
              keyboardType: "decimal-pad",
            })}
            {renderField("Ten hang", "product_name", "Thu 1")}
            {renderField("Gia tri khai bao", "declared_value", "0", {
              keyboardType: "decimal-pad",
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CAU HINH</Text>
            <Text style={styles.fieldLabel}>Service type</Text>
            <View style={styles.optionRow}>
              {SERVICE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionChip,
                    form.service_type === item && styles.optionChipActive,
                  ]}
                  onPress={() => setField("service_type", item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      form.service_type === item && styles.optionChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Product group</Text>
            <View style={styles.optionRow}>
              {PRODUCT_GROUP_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionChip,
                    form.product_group === item && styles.optionChipActive,
                  ]}
                  onPress={() => setField("product_group", item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      form.product_group === item &&
                        styles.optionChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {renderField("Ghi chu", "note", "Thong tin them...", {
              multiline: true,
            })}
            {renderField("OCR raw text", "ocr_raw_text", "Luu ket qua OCR...", {
              multiline: true,
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="save-outline" size={18} color="#FFF" />
            )}
            <Text style={styles.saveButtonText}>Luu OCR</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  imageActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonAccent: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "800",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
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
  fieldBlock: { marginBottom: 12 },
  fieldLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  col: { flex: 1 },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipActive: {
    backgroundColor: `${PRIMARY}15`,
    borderColor: `${PRIMARY}45`,
  },
  optionChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  optionChipTextActive: {
    color: PRIMARY,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
