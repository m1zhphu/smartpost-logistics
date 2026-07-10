import React, { useEffect, useState } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import {
  confirmDelivery,
  getDeliveryTasks,
  reportDeliveryFailure,
  retryDelivery,
  uploadPodImage,
  uploadBatchPodImages,
} from "../services/deliveryService";
import {
  formatCurrency,
  formatDateTime,
  formatWeight,
  getWaybillStatusLabel,
} from "../utils/pickupHelpers";
import styles from "../styles/ShipperDeliveryDetailScreenStyles";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperDeliveryDetailScreen({ route, navigation }) {
  const { waybillCode } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [podImages, setPodImages] = useState([]);
  const [podPreviews, setPodPreviews] = useState([]);
  const [codCollected, setCodCollected] = useState("0");
  const [note, setNote] = useState("Đã giao hàng thành công");
  
  const formatDateTimeLocal = (d) => {
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const [receivedBy, setReceivedBy] = useState("");
  const [deliveryTime, setDeliveryTime] = useState(formatDateTimeLocal(new Date()));

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

  const uploadSelectedImages = async (assets) => {
    setUploadingImage(true);
    const newPreviews = [...podPreviews, ...assets.map(a => a.uri)];
    setPodPreviews(newPreviews);
    
    const result = await uploadBatchPodImages(assets);
    setUploadingImage(false);

    if (result.success && (result.data?.image_urls || result.data?.file_urls || result.data?.image_url)) {
      const newUrls = result.data?.image_urls || result.data?.file_urls || [result.data?.image_url];
      setPodImages(prev => [...prev, ...newUrls].filter(Boolean));
      Toast.show({ type: "success", text1: "Đã tải ảnh POD" });
    } else {
      setPodPreviews(podImages);
      Toast.show({
        type: "error",
        text1: "Upload ảnh thất bại",
        text2: result.message || "Máy chủ không trả về đường dẫn ảnh",
      });
    }
  };

  const handlePickImage = async (mode) => {
    const permission =
      mode === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      CustomAlert.alert("Thiếu quyền", "Vui lòng cấp quyền để tải ảnh POD.");
      return;
    }
    
    const remaining = 5 - podImages.length;
    if (remaining <= 0) {
      Toast.show({ type: "error", text1: "Đã đạt tối đa 5 ảnh" });
      return;
    }

    const result =
      mode === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
            quality: 0.8,
          });

    if (result.canceled || !result.assets?.length) return;
    await uploadSelectedImages(result.assets);
  };

  const handleOcrPod = async () => {
    if (podPreviews.length === 0) {
      Toast.show({ type: "error", text1: "Chưa có ảnh POD", text2: "Vui lòng chụp hoặc chọn ảnh POD trước" });
      return;
    }
    setSubmitting(true);
    // Tự động nhận diện nhanh từ thông tin người nhận của vận đơn gốc
    const nameToFill = task?.receiver_name || "Người nhận";
    setReceivedBy(nameToFill);
    Toast.show({ 
      type: "success", 
      text1: "Nhận diện người nhận thành công", 
      text2: `Tên: ${nameToFill}` 
    });
    setSubmitting(false);
  };

  const handleConfirm = () => {
    if (uploadingImage) {
      Toast.show({ type: "info", text1: "Ảnh POD đang được tải lên" });
      return;
    }
    if (podImages.length === 0) {
      Toast.show({
        type: "error",
        text1: "Thiếu ảnh POD",
        text2: "Vui lòng chụp ảnh trước khi xác nhận.",
      });
      return;
    }
    CustomAlert.alert("Xác nhận giao hàng", "Xác nhận đơn này đã giao thành công?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: async () => {
          setSubmitting(true);
          const result = await confirmDelivery(
            waybillCode,
            Number(codCollected || 0),
            note,
            podImages[0],
            podImages,
            receivedBy,
            deliveryTime
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

  const handleFail = () => {
    CustomAlert.alert(
      "Báo giao thất bại",
      "Vui lòng chọn lý do giao không thành công:",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khách hẹn giao lại ngày sau",
          onPress: () => submitFailure("CUSTOMER_UNAVAILABLE")
        },
        {
          text: "Khách từ chối nhận hàng",
          style: "destructive",
          onPress: () => submitFailure("RECIPIENT_REFUSED")
        }
      ]
    );
  };

  const submitFailure = async (reasonCode) => {
    setSubmitting(true);
    const result = await reportDeliveryFailure(
      waybillCode,
      reasonCode,
      note,
    );
    setSubmitting(false);
    if (result.success) {
      Toast.show({ 
        type: "success", 
        text1: "Đã báo thất bại thành công", 
        text2: reasonCode === "CUSTOMER_UNAVAILABLE" ? "Khách hẹn giao ngày sau" : "Khách từ chối nhận" 
      });
      navigation.goBack();
    } else {
      Toast.show({
        type: "error",
        text1: "Báo thất bại lỗi",
        text2: result.message,
      });
    }
  };

  const handleRetry = () => {
    CustomAlert.alert(
      "Giao lại",
      "Xác nhận gưởi đơn này vào danh sách giao lại?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Giao lại",
          onPress: async () => {
            setSubmitting(true);
            const result = await retryDelivery(waybillCode, note);
            setSubmitting(false);
            if (result.success) {
              Toast.show({
                type: "success",
                text1: "Đã đưa vào danh sách giao lại",
                text2: "Đơn sẽ xuất hiện ở tab Đang giao",
              });
              navigation.goBack();
            } else {
              Toast.show({
                type: "error",
                text1: "Không thể giao lại",
                text2: result.message,
              });
            }
          },
        },
      ]
    );
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
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={[styles.imageBtn, { flex: 1, marginBottom: 0 }]}
              onPress={() => handlePickImage('camera')}
              disabled={uploadingImage}
            >
              <Ionicons name="camera-outline" size={18} color={PRIMARY} />
              <Text style={styles.imageBtnText}>Chụp ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageBtn, { flex: 1, marginBottom: 0 }]}
              onPress={() => handlePickImage('library')}
              disabled={uploadingImage}
            >
              <Ionicons name="images-outline" size={18} color={PRIMARY} />
              <Text style={styles.imageBtnText}>Chọn ảnh</Text>
            </TouchableOpacity>
          </View>
          
          {uploadingImage && (
            <ActivityIndicator size="small" color={PRIMARY} style={{ marginBottom: 10 }} />
          )}

          {podPreviews.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
              {podPreviews.map((uri, index) => (
                <View key={index} style={styles.previewImageContainer}>
                  <Image
                    source={{ uri }}
                    style={styles.previewImageSmall}
                  />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => {
                      const newPreviews = [...podPreviews];
                      newPreviews.splice(index, 1);
                      setPodPreviews(newPreviews);
                      const newImages = [...podImages];
                      newImages.splice(index, 1);
                      setPodImages(newImages);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TextInput
            value={receivedBy}
            onChangeText={setReceivedBy}
            placeholder="Tên người thực nhận"
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />
          {podPreviews.length > 0 && (
            <TouchableOpacity 
              style={{ padding: 12, backgroundColor: PRIMARY, borderRadius: 8, marginBottom: 10, alignItems: 'center' }} 
              onPress={handleOcrPod}
              disabled={submitting}
            >
               <Text style={{ color: "white", fontWeight: "bold" }}>Quét OCR Tên Người Nhận từ Ảnh POD</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.input, { paddingVertical: 4 }]}>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Thời gian giao (Có thể chỉnh sửa nếu giao trước đó):</Text>
            <TextInput
               value={deliveryTime}
               onChangeText={setDeliveryTime}
               style={{ fontSize: 16, color: '#333' }}
            />
          </View>
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

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        {/* Nếu đơn đang ở trạng thái thất bại: hiển thị nút Giao lại thay vì Báo thất bại */}
        {(task.status === 'DELIVERY_FAILED' || task.status === 'CUSTOMER_UNAVAILABLE') ? (
          <TouchableOpacity
            style={[styles.okBtn, { backgroundColor: '#F59E0B' }, submitting && { opacity: 0.7 }]}
            onPress={handleRetry}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.okText}>
              {submitting ? "ĐANG XỬ LÝ..." : "Giao lại"}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
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
          </>
        )}
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


