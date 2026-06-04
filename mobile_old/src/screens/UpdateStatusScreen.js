import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import UpdateStatusStyles from "../styles/UpdateStatusStyles";
import { deliveryService } from "../services/deliveryService";
import { uploadService } from "../services/uploadService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import Toast from "react-native-toast-message";

export default function UpdateStatusScreen({ route, navigation }) {
  const { user } = useUser();
  const { waybill, podUri } = route.params || {};
  const [statusType, setStatusType] = useState("SUCCESS");
  const expectedCod = Number(waybill?.cod_amount) || 0;
  const [codMode, setCodMode] = useState("FULL");
  const [actualCod, setActualCod] = useState(expectedCod.toString());
  const [successNote, setSuccessNote] = useState("");
  const [failureNote, setFailureNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRouteAllowed(user, "UpdateStatus")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  useEffect(() => {
    if (codMode === "FULL") setActualCod(expectedCod.toString());
    if (codMode === "ZERO") setActualCod("0");
  }, [codMode, expectedCod]);

  if (!waybill) {
    return <View style={UpdateStatusStyles.flex1} />;
  }

  const formatMoney = (value) => {
    const num = Number(String(value).replace(/[^0-9]/g, ""));
    return num.toLocaleString("vi-VN");
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (statusType === "FAILED") {
        if (!failureNote.trim()) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: "Vui lòng nhập lý do giao thất bại.",
          });
          return;
        }

        await deliveryService.reportFailure(user.token, {
          waybill_code: waybill.waybill_code,
          reason_code: "DELIVERY_FAILED",
          note: failureNote.trim(),
        });

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã báo cáo giao thất bại.",
        });
      } else {
        if (!podUri) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: "Vui lòng chụp ảnh kiện hàng (POD).",
          });
          return;
        }

        const uploadedUrl = await uploadService.uploadPOD(user.token, podUri);

        await deliveryService.confirmSuccess(user.token, {
          waybill_code: waybill.waybill_code,
          actual_cod_collected: Number(
            String(actualCod).replace(/[^0-9]/g, ""),
          ),
          pod_image_url: uploadedUrl,
          note: successNote.trim(),
        });

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: `Chốt don ${waybill.waybill_code} thành công.`,
        });
      }

      navigation.navigate("TaskList");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Lỗi hệ thống.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={UpdateStatusStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={UpdateStatusStyles.headerArea}>
        <View style={UpdateStatusStyles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={UpdateStatusStyles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={UpdateStatusStyles.headerCenter}>
            <Text style={UpdateStatusStyles.headerSubTitle}>
              CẬP NHẬT TRẠNG THÁI
            </Text>
            <Text style={UpdateStatusStyles.headerTitle}>
              {waybill.waybill_code}
            </Text>
          </View>
          <View style={UpdateStatusStyles.headerRightPlaceholder} />
        </View>
      </View>

      <View style={UpdateStatusStyles.customerBar}>
        <Ionicons name="person-outline" size={18} color={COLORS.primary} />
        <Text style={UpdateStatusStyles.custName} numberOfLines={1}>
          {waybill.receiver_name}
        </Text>
        <Text style={UpdateStatusStyles.custPhone}>
          {waybill.receiver_phone}
        </Text>
        <View style={UpdateStatusStyles.codBadge}>
          <Text style={UpdateStatusStyles.codBadgeText}>
            COD: {expectedCod >= 1000 ? `${expectedCod / 1000}k` : expectedCod}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={UpdateStatusStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={UpdateStatusStyles.statusToggleCard}>
          <TouchableOpacity
            style={[
              UpdateStatusStyles.toggleBtn,
              statusType === "SUCCESS" &&
                UpdateStatusStyles.toggleBtnActiveSuccess,
            ]}
            onPress={() => setStatusType("SUCCESS")}
          >
            <Ionicons
              name={
                statusType === "SUCCESS" ? "checkmark" : "checkmark-outline"
              }
              size={20}
              color={statusType === "SUCCESS" ? COLORS.white : COLORS.textMuted}
            />
            <Text
              style={[
                UpdateStatusStyles.toggleText,
                statusType === "SUCCESS" && UpdateStatusStyles.toggleTextActive,
              ]}
            >
              Thành công
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              UpdateStatusStyles.toggleBtn,
              statusType === "FAILED" && UpdateStatusStyles.toggleBtnActiveFail,
            ]}
            onPress={() => setStatusType("FAILED")}
          >
            <Ionicons
              name={statusType === "FAILED" ? "close" : "close-outline"}
              size={20}
              color={statusType === "FAILED" ? COLORS.white : COLORS.textMuted}
            />
            <Text
              style={[
                UpdateStatusStyles.toggleText,
                statusType === "FAILED" && UpdateStatusStyles.toggleTextActive,
              ]}
            >
              Thất bại
            </Text>
          </TouchableOpacity>
        </View>

        {statusType === "SUCCESS" ? (
          <>
            <View style={UpdateStatusStyles.card}>
              <View style={UpdateStatusStyles.cardHeaderRow}>
                <View style={UpdateStatusStyles.cardHeaderLeft}>
                  <View style={UpdateStatusStyles.dotWarning} />
                  <Text style={UpdateStatusStyles.cardTitleWarning}>
                    Tiền COD thực tế
                  </Text>
                </View>
                <Text style={UpdateStatusStyles.expectedText}>
                  Dự kiến: {expectedCod.toLocaleString("vi-VN")} d
                </Text>
              </View>

              <View style={UpdateStatusStyles.codInputWrapper}>
                <Text style={UpdateStatusStyles.codInput}>
                  {formatMoney(actualCod)}
                </Text>
                <Text style={UpdateStatusStyles.codCurrency}>d</Text>
              </View>

              <View style={UpdateStatusStyles.quickActionRow}>
                <TouchableOpacity
                  style={[
                    UpdateStatusStyles.quickBtn,
                    codMode === "FULL" && UpdateStatusStyles.quickBtnActive,
                  ]}
                  onPress={() => setCodMode("FULL")}
                >
                  <Text
                    style={[
                      UpdateStatusStyles.quickBtnText,
                      codMode === "FULL" &&
                        UpdateStatusStyles.quickBtnTextActive,
                    ]}
                  >
                    Đầy đủ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    UpdateStatusStyles.quickBtn,
                    codMode === "MANUAL" && UpdateStatusStyles.quickBtnActive,
                  ]}
                  onPress={() => setCodMode("MANUAL")}
                >
                  <Text
                    style={[
                      UpdateStatusStyles.quickBtnText,
                      codMode === "MANUAL" &&
                        UpdateStatusStyles.quickBtnTextActive,
                    ]}
                  >
                    Nhập tay
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    UpdateStatusStyles.quickBtn,
                    codMode === "ZERO" && UpdateStatusStyles.quickBtnActive,
                  ]}
                  onPress={() => setCodMode("ZERO")}
                >
                  <Text
                    style={[
                      UpdateStatusStyles.quickBtnText,
                      codMode === "ZERO" &&
                        UpdateStatusStyles.quickBtnTextActive,
                    ]}
                  >
                    Không thu
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={UpdateStatusStyles.card}>
              <View style={UpdateStatusStyles.cardHeaderRow}>
                <View style={UpdateStatusStyles.cardHeaderLeft}>
                  <View style={UpdateStatusStyles.dotPrimary} />
                  <Text style={UpdateStatusStyles.cardTitlePrimary}>
                    Ảnh bằng chứng POD
                  </Text>
                </View>
                <View style={UpdateStatusStyles.requiredBadge}>
                  <Text style={UpdateStatusStyles.requiredText}>Bắt buộc</Text>
                </View>
              </View>

              {podUri ? (
                <View>
                  <Image
                    source={{ uri: podUri }}
                    style={UpdateStatusStyles.podImage}
                  />
                  <TouchableOpacity
                    style={UpdateStatusStyles.reCamBtn}
                    onPress={() =>
                      navigation.navigate("CameraPOD", {
                        waybill,
                        returnScreen: "UpdateStatus",
                      })
                    }
                  >
                    <Ionicons
                      name="camera-reverse"
                      size={24}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={UpdateStatusStyles.cameraBox}
                  onPress={() =>
                    navigation.navigate("CameraPOD", {
                      waybill,
                      returnScreen: "UpdateStatus",
                    })
                  }
                >
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={COLORS.primary}
                  />
                  <Text style={UpdateStatusStyles.cameraBoxTitle}>
                    Chụp ảnh kiện hàng
                  </Text>
                  <Text style={UpdateStatusStyles.cameraBoxSub}>
                    Ảnh phải thấy rõ kiện hàng và mã vận đơn trên gói hàng
                  </Text>
                </TouchableOpacity>
              )}

              <CustomButton
                title="Mở lại camera POD"
                variant="outline"
                style={UpdateStatusStyles.galleryBtn}
                onPress={() =>
                  navigation.navigate("CameraPOD", {
                    waybill,
                    returnScreen: "UpdateStatus",
                  })
                }
                leftIcon={
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                }
              />
            </View>

            <View style={UpdateStatusStyles.card}>
              <View style={UpdateStatusStyles.cardHeaderLeft}>
                <View style={UpdateStatusStyles.dotGray} />
                <Text style={UpdateStatusStyles.cardTitleGray}>
                  Ghi chú thêm
                </Text>
              </View>
              <CustomInput
                value={successNote}
                onChangeText={setSuccessNote}
                placeholder="Nhập thêm thông tin nếu cần..."
                multiline
                inputStyle={UpdateStatusStyles.inputNotePlain}
              />
            </View>
          </>
        ) : (
          <View style={UpdateStatusStyles.card}>
            <View style={UpdateStatusStyles.cardHeaderRow}>
              <View style={UpdateStatusStyles.cardHeaderLeft}>
                <View style={UpdateStatusStyles.dotDanger} />
                <Text style={UpdateStatusStyles.cardTitleDanger}>
                  Lý do thất bại
                </Text>
              </View>
              <View style={UpdateStatusStyles.requiredBadge}>
                <Text style={UpdateStatusStyles.requiredText}>Bắt buộc</Text>
              </View>
            </View>
            <CustomInput
              value={failureNote}
              onChangeText={setFailureNote}
              multiline
              placeholder="Khách không nghe máy, boom hàng, sai địa chỉ..."
              inputStyle={UpdateStatusStyles.inputNoteArea}
            />
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={UpdateStatusStyles.footer}>
        {statusType === "SUCCESS" ? (
          <View style={UpdateStatusStyles.summaryBanner}>
            <Text style={UpdateStatusStyles.summaryBannerText}>
              Tổng thu: {formatMoney(actualCod)} d
            </Text>
            <Ionicons name="checkmark" size={18} color={COLORS.secondary} />
          </View>
        ) : null}
        <CustomButton
          title="Lưu cập nhật"
          onPress={handleConfirm}
          loading={loading}
          style={UpdateStatusStyles.submitBtn}
          leftIcon={
            <Ionicons
              name={
                statusType === "SUCCESS"
                  ? "checkbox-outline"
                  : "close-circle-outline"
              }
              size={22}
              color={COLORS.white}
            />
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
