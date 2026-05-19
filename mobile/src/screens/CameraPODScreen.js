import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import CameraPODStyles from "../styles/CameraPODStyles";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { uploadService } from "../services/uploadService";
import { waybillService } from "../services/waybillService";

export default function CameraPODScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState(null);
  const [taking, setTaking] = useState(false);
  const [flash, setFlash] = useState("off");
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [cameraMode, setCameraMode] = useState(
    route?.params?.mode || "POD_MODE",
  );
  const { waybill, returnScreen } = route?.params || {};

  React.useEffect(() => {
    if (!isRouteAllowed(user, "CameraPOD")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  }, [user]);

  const takePicture = async () => {
    if (!cameraRef.current || taking) {
      return;
    }

    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPreview(photo && photo.uri ? photo.uri : null);
    } catch (error) {
      Alert.alert("Lỗi chụp ảnh", "Không thể chụp ảnh lúc này.");
    } finally {
      setTaking(false);
    }
  };

  const toggleFlash = () => {
    setFlash(flash === "on" ? "off" : "on");
  };

  const toggleCameraMode = () => {
    const newMode = cameraMode === "POD_MODE" ? "PICKUP_MODE" : "POD_MODE";
    setCameraMode(newMode);
    Alert.alert(
      "Chuyển chế độ",
      newMode === "PICKUP_MODE"
        ? "Chế độ: Xác minh lấy hàng\n\nChụp ảnh vận đơn để tải lên và xác thực."
        : "Chế độ: Chứng minh giao hàng\n\nChụp ảnh bằng chứng giao hàng cho khách hàng.",
    );
  };

  const confirmPhoto = async () => {
    if (cameraMode === "PICKUP_MODE") {
      await handlePickupImageUpload();
      return;
    }

    // Normal POD mode
    if (returnScreen) {
      navigation.navigate({
        name: returnScreen,
        params: { waybill: waybill, podUri: preview },
        merge: true,
      });
      return;
    }

    navigation.goBack();
  };

  const handlePickupImageUpload = async () => {
    if (!preview || !waybill?.waybill_code) {
      Alert.alert("Lỗi", "Thiếu thông tin vận đơn hoặc ảnh.");
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload ảnh lấy hàng
      console.log("[PICKUP] Uploading pickup image...");
      const billImageUrl = await uploadService.uploadBillImage(
        user?.token,
        preview,
        true,
      );

      if (!billImageUrl) {
        throw new Error("Không thể lấy URL ảnh từ server.");
      }

      console.log("[PICKUP] Image uploaded. URL:", billImageUrl);

      // Step 2: Gọi API updateBillImages để cập nhật bill_image_url cho đơn hàng
      console.log("[PICKUP] Updating waybill with bill image URL...");
      const updateResult = await waybillService.updateBillImages(
        user?.token,
        waybill.waybill_code,
        billImageUrl,
        null,
      );

      console.log("[PICKUP] Update result:", updateResult);

      // Step 3: Hiển thị thành công
      setPreview(null);
      Alert.alert(
        "✓ Tải ảnh thành công",
        "Đơn hàng đang chờ CSKH xác thực. Vui lòng quay lại danh sách nhiệm vụ.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error("[PICKUP] Error:", error);
      Alert.alert(
        "Lỗi tải ảnh",
        error?.message || "Không thể tải ảnh lên server. Vui lòng thử lại.",
      );
    } finally {
      setUploading(false);
    }
  };

  if (!permission) {
    return (
      <View style={CameraPODStyles.center}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={CameraPODStyles.center}>
        <View style={CameraPODStyles.authIconWrap}>
          <Ionicons name="camera-outline" size={42} color={COLORS.secondary} />
        </View>
        <Text style={CameraPODStyles.authText}>
          Ứng dụng cần quyền camera để chụp ảnh bằng chứng.
        </Text>
        <TouchableOpacity
          style={CameraPODStyles.authBtn}
          onPress={requestPermission}
        >
          <Text style={CameraPODStyles.authBtnText}>Cấp Quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (preview) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar hidden />

        <View style={CameraPODStyles.previewContainer}>
          <Image
            source={{ uri: preview }}
            style={CameraPODStyles.previewImage}
          />

          <View style={CameraPODStyles.watermark}>
            <View style={CameraPODStyles.watermarkRow}>
              <Ionicons
                name="cube"
                size={14}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={CameraPODStyles.watermarkText}>
                {(waybill && waybill.waybill_code) || "N/A"}
              </Text>
            </View>

            <View style={CameraPODStyles.watermarkRow}>
              <Ionicons
                name="time"
                size={14}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={CameraPODStyles.watermarkText}>
                {new Date().toLocaleString("vi-VN")}
              </Text>
            </View>
          </View>
        </View>

        <View style={CameraPODStyles.previewActions}>
          <TouchableOpacity
            style={CameraPODStyles.actionBtnReject}
            onPress={() => setPreview(null)}
            disabled={uploading}
          >
            <Ionicons name="refresh-circle" size={24} color="#fff" />
            <Text style={CameraPODStyles.actionText}>Chụp Lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              CameraPODStyles.actionBtnAccept,
              uploading && { opacity: 0.6 },
            ]}
            onPress={confirmPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={CameraPODStyles.actionText}>Đang tải...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={CameraPODStyles.actionText}>Dùng Ảnh Này</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar hidden />

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        flash="off"
        enableTorch={flash === "on"}
      >
        <View style={CameraPODStyles.topActions}>
          <TouchableOpacity
            style={CameraPODStyles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              {cameraMode === "PICKUP_MODE" ? "🔍 Lấy Hàng" : "📸 POD"}
            </Text>
          </View>

          <TouchableOpacity
            style={CameraPODStyles.iconBtn}
            onPress={toggleCameraMode}
          >
            <Ionicons name="swap-horizontal" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={CameraPODStyles.iconBtn}
            onPress={toggleFlash}
          >
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={24}
              color={flash === "on" ? COLORS.processScanOrange : "#fff"}
            />
          </TouchableOpacity>
        </View>

        <View style={CameraPODStyles.overlay}>
          <View style={CameraPODStyles.frame}>
            <View style={[CameraPODStyles.corner, CameraPODStyles.topLeft]} />
            <View style={[CameraPODStyles.corner, CameraPODStyles.topRight]} />
            <View
              style={[CameraPODStyles.corner, CameraPODStyles.bottomLeft]}
            />
            <View
              style={[CameraPODStyles.corner, CameraPODStyles.bottomRight]}
            />
          </View>

          <Text style={CameraPODStyles.guideText}>
            {cameraMode === "PICKUP_MODE"
              ? "Chụp rõ vận đơn để xác minh thông tin"
              : "Căn chỉnh rõ mã vận đơn và gói hàng"}
          </Text>
        </View>

        <View style={CameraPODStyles.bottomActions}>
          <TouchableOpacity
            style={CameraPODStyles.captureBtn}
            onPress={takePicture}
            disabled={taking}
          >
            {taking ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <View style={CameraPODStyles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
