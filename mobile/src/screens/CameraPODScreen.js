import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import CameraPODStyles from "../styles/CameraPODStyles";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { uploadService } from "../services/uploadService";
import { waybillService } from "../services/waybillService";
import CustomButton from "../components/CustomButton";
import Toast from "react-native-toast-message";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

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
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  const takePicture = async () => {
    if (!cameraRef.current || taking) {
      return;
    }

    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPreview(photo && photo.uri ? photo.uri : null);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi chụp ảnh",
        text2: error.message || "Không thể chụp ảnh lúc này.",
      });
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
    Toast.show({
      type: "info",
      text1: "Chuyển chế độ",
      text2:
        newMode === "PICKUP_MODE"
          ? "Chế độ: Xác minh lấy hàng\n\nChụp ảnh vận đơn để tải lên và xác thực."
          : "Chế độ: Chứng minh giao hàng\n\nChụp ảnh bảng chứng giao hàng cho khách hàng.",
    });
  };

  const confirmPhoto = async () => {
    if (cameraMode === "PICKUP_MODE") {
      await handlePickupImageUpload();
      return;
    }

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
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập mã vận đơn và tải ảnh lên.",
      });
      return;
    }

    setUploading(true);
    try {
      const billImageUrl = await uploadService.uploadBillImage(
        user?.token,
        preview,
        true,
      );

      if (!billImageUrl) {
        throw new Error("Khong the lay URL anh tu server.");
      }

      await waybillService.updateBillImages(
        user?.token,
        waybill.waybill_code,
        billImageUrl,
        null,
      );

      setPreview(null);
      Toast.show({
        type: "success",
        text1: "Tải ảnh thành công",
        text2:
          "Đơn hàng đang chờ CSKH xác thực. Vui lòng quay lại danh sách nhiệm vụ.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải ảnh",
        text2:
          error?.message || "Không thể tải ảnh lên server. Vui lòng thử lại.",
      });
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
          Ung dung can quyen camera de chup anh bang chung.
        </Text>
        <CustomButton
          title="Cap Quyen Camera"
          onPress={requestPermission}
          variant="secondary"
          style={CameraPODStyles.authBtn}
        />
      </View>
    );
  }

  if (preview) {
    return (
      <View style={CameraPODStyles.rootCameraBg}>
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
                color={COLORS.white}
                style={CameraPODStyles.watermarkIcon}
              />
              <Text style={CameraPODStyles.watermarkText}>
                {(waybill && waybill.waybill_code) || "N/A"}
              </Text>
            </View>

            <View style={CameraPODStyles.watermarkRowNoMargin}>
              <Ionicons
                name="time"
                size={14}
                color={COLORS.white}
                style={CameraPODStyles.watermarkIcon}
              />
              <Text style={CameraPODStyles.watermarkText}>
                {new Date().toLocaleString("vi-VN")}
              </Text>
            </View>
          </View>
        </View>

        <SafeAreaView
          edges={["bottom"]}
          style={CameraPODStyles.previewActionsSafeArea}
        >
          <View style={CameraPODStyles.previewActions}>
            <CustomButton
              title="Chup lai"
              variant="outline"
              onPress={() => setPreview(null)}
              disabled={uploading}
              style={CameraPODStyles.previewButton}
            />
            <CustomButton
              title={uploading ? "Dang tai..." : "Xac nhan"}
              variant="primary"
              onPress={confirmPhoto}
              loading={uploading}
              disabled={uploading}
              style={CameraPODStyles.previewButton}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={CameraPODStyles.rootCameraBg}>
      <StatusBar hidden />

      <CameraView
        ref={cameraRef}
        style={CameraPODStyles.cameraFill}
        facing="back"
        flash="off"
        enableTorch={flash === "on"}
      >
        <SafeAreaView edges={["top"]} style={CameraPODStyles.topSafeArea}>
          <View style={CameraPODStyles.topActions}>
            <Pressable
              hitSlop={HIT_SLOP}
              style={CameraPODStyles.iconBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </Pressable>

            <View style={CameraPODStyles.modeCenterWrap}>
              <Text style={CameraPODStyles.modeCenterText}>
                {cameraMode === "PICKUP_MODE" ? "Lay Hang" : "POD"}
              </Text>
            </View>

            <View style={CameraPODStyles.rightControlsWrap}>
              <Pressable
                hitSlop={HIT_SLOP}
                style={CameraPODStyles.iconBtn}
                onPress={toggleCameraMode}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={24}
                  color={COLORS.white}
                />
              </Pressable>

              <Pressable
                hitSlop={HIT_SLOP}
                style={CameraPODStyles.iconBtn}
                onPress={toggleFlash}
              >
                <Ionicons
                  name={flash === "on" ? "flash" : "flash-off"}
                  size={24}
                  color={
                    flash === "on" ? COLORS.processScanOrange : COLORS.white
                  }
                />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

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
              ? "Chup ro van don de xac minh thong tin"
              : "Can chinh ro ma van don va goi hang"}
          </Text>
        </View>

        <SafeAreaView
          edges={["bottom"]}
          style={CameraPODStyles.bottomActionsSafeArea}
        >
          <View style={CameraPODStyles.bottomActions}>
            <Pressable
              hitSlop={HIT_SLOP}
              style={CameraPODStyles.captureBtn}
              onPress={takePicture}
              disabled={taking}
            >
              {taking ? (
                <ActivityIndicator size="large" color={COLORS.white} />
              ) : (
                <View style={CameraPODStyles.captureInner} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
