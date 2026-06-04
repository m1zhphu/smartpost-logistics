import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { adminService } from "../services/adminService";
import AdminOperationsStyles from "../styles/AdminOperationsStyles";
import { COLORS } from "../constants/colors";
import { SPACING, TYPOGRAPHY } from "../constants/theme";
import Toast from "react-native-toast-message";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_OPTIONS = [
  { value: "SUCCESS", label: "Giao thành công" },
  { value: "CANCELED", label: "Hủy" },
  { value: "IN_HUB", label: "Về kho" },
];

export default function AdminOperationsScreen({ navigation }) {
  const { user } = useUser();
  const [overrideForm, setOverrideForm] = useState({
    waybill_code: "",
    new_status: "SUCCESS",
    reason: "",
  });
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  useEffect(() => {
    if (!isRouteAllowed(user, "AdminOperations")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
      return;
    }
    fetchAuditLogs();
  }, [navigation, user]);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await adminService.getAuditLogs(user.token);
      setLogs(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải nhật ký",
        text2: error.message || "Không thể tải nhật ký lúc này.",
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOverrideStatus = () => {
    if (!overrideForm.waybill_code || !overrideForm.reason) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập mã vận đơn và lý do ghi đè.",
      });
      return;
    }

    setShowOverrideConfirm(true);
  };

  const executeOverrideStatus = async () => {
    setShowOverrideConfirm(false);
    setLoadingOverride(true);
    try {
      await adminService.overrideWaybillStatus(user.token, overrideForm);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã ghi đè trạng thái vận đơn.",
      });
      setOverrideForm({
        waybill_code: "",
        new_status: "SUCCESS",
        reason: "",
      });
      fetchAuditLogs();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Ghi đè thất bại.",
      });
    } finally {
      setLoadingOverride(false);
    }
  };

  const triggerScanOverdue = async () => {
    setLoadingScan(true);
    try {
      const response = await adminService.scanOverdue(user.token);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: response?.message || "Đã khởi chạy quét đơn quá hạn.",
      });
      fetchAuditLogs();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể quét đơn quá hạn lúc này.",
      });
    } finally {
      setLoadingScan(false);
    }
  };

  const actionCards = [
    {
      key: "override",
      title: "Ghi đè trạng thái",
      sub: "Xử lý tình huống đặc biệt",
      icon: "warning",
      iconBg: COLORS.error,
      style: AdminOperationsStyles.actionCardDanger,
    },
    {
      key: "scan",
      title: "Quét đơn quá hạn",
      sub: "Kích hoạt cảnh báo hệ thống",
      icon: "scan",
      iconBg: COLORS.warning,
      style: AdminOperationsStyles.actionCardWarning,
    },
    {
      key: "logs",
      title: "Nhật ký hệ thống",
      sub: "Theo dõi thao tác quản trị",
      icon: "document-text",
      iconBg: COLORS.secondary,
      style: null,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={AdminOperationsStyles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={AdminOperationsStyles.headerArea}>
        <View style={AdminOperationsStyles.headerCircleDecoration} />
        <View style={AdminOperationsStyles.headerTop}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
            style={AdminOperationsStyles.backBtn}
            hitSlop={{
              top: SPACING.md_sm,
              bottom: SPACING.md_sm,
              left: SPACING.md_sm,
              right: SPACING.md_sm,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={TYPOGRAPHY.fontSize.subtitle}
              color={COLORS.white}
            />
          </Pressable>
          <Text style={AdminOperationsStyles.headerTitle}>
            Hệ thống kỹ thuật
          </Text>
          <View style={AdminOperationsStyles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={AdminOperationsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={AdminOperationsStyles.actionsGrid}>
          {actionCards.map((item) => (
            <View
              key={item.key}
              style={[AdminOperationsStyles.actionCard, item.style]}
            >
              <View
                style={[
                  AdminOperationsStyles.actionCardIcon,
                  { backgroundColor: item.iconBg },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={TYPOGRAPHY.fontSize.bodySm}
                  color={COLORS.white}
                />
              </View>
              <Text style={AdminOperationsStyles.actionCardTitle}>
                {item.title}
              </Text>
              <Text style={AdminOperationsStyles.actionCardSub}>
                {item.sub}
              </Text>
            </View>
          ))}
        </View>

        <View style={AdminOperationsStyles.sectionCard}>
          <View style={AdminOperationsStyles.sectionHeader}>
            <View
              style={[
                AdminOperationsStyles.iconCircle,
                { backgroundColor: COLORS.error },
              ]}
            >
              <Ionicons
                name="warning"
                size={TYPOGRAPHY.fontSize.bodySm}
                color={COLORS.white}
              />
            </View>
            <Text style={AdminOperationsStyles.sectionTitle}>
              GHI ĐÈ TRẠNG THÁI
            </Text>
          </View>

          <CustomInput
            label="Mã vận đơn *"
            placeholder="VD: WB123456"
            value={overrideForm.waybill_code}
            onChangeText={(text) =>
              setOverrideForm({ ...overrideForm, waybill_code: text })
            }
            autoCapitalize="characters"
          />

          <Text style={AdminOperationsStyles.label}>Trạng thái đích</Text>
          <View style={AdminOperationsStyles.statusRow}>
            {STATUS_OPTIONS.map((status) => (
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                key={status.value}
                style={[
                  AdminOperationsStyles.statusBtn,
                  overrideForm.new_status === status.value &&
                    AdminOperationsStyles.statusBtnActive,
                ]}
                onPress={() =>
                  setOverrideForm({ ...overrideForm, new_status: status.value })
                }
                hitSlop={{
                  top: SPACING.md_sm,
                  bottom: SPACING.md_sm,
                  left: SPACING.md_sm,
                  right: SPACING.md_sm,
                }}
              >
                <Text
                  style={[
                    AdminOperationsStyles.statusText,
                    overrideForm.new_status === status.value &&
                      AdminOperationsStyles.statusTextActive,
                  ]}
                >
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <CustomInput
            label="Lý do *"
            placeholder="Nhập lý do..."
            multiline
            value={overrideForm.reason}
            onChangeText={(text) =>
              setOverrideForm({ ...overrideForm, reason: text })
            }
            inputStyle={AdminOperationsStyles.inputMultilineText}
            inputWrapperStyle={AdminOperationsStyles.inputMultiline}
          />

          <View style={AdminOperationsStyles.ctaRow}>
            <CustomButton
              title="GHI ĐÈ TRẠNG THÁI"
              onPress={handleOverrideStatus}
              loading={loadingOverride}
              disabled={loadingOverride}
            />
          </View>
        </View>

        <View style={AdminOperationsStyles.sectionCard}>
          <View style={AdminOperationsStyles.sectionHeader}>
            <View
              style={[
                AdminOperationsStyles.iconCircle,
                { backgroundColor: COLORS.warning },
              ]}
            >
              <Ionicons
                name="scan"
                size={TYPOGRAPHY.fontSize.bodySm}
                color={COLORS.white}
              />
            </View>
            <Text style={AdminOperationsStyles.sectionTitle}>
              QUÉT ĐƠN QUÁ HẠN
            </Text>
          </View>
          <Text style={AdminOperationsStyles.helperText}>
            Chạy quy trình quét đơn quá hạn và tạo cảnh báo cho hệ thống.
          </Text>
          <View style={AdminOperationsStyles.ctaRow}>
            <CustomButton
              title="CHẠY QUÉT"
              onPress={triggerScanOverdue}
              loading={loadingScan}
              disabled={loadingScan}
              variant="secondary"
            />
          </View>
        </View>

        <View style={AdminOperationsStyles.sectionCard}>
          <View style={AdminOperationsStyles.sectionHeader}>
            <View
              style={[
                AdminOperationsStyles.iconCircle,
                { backgroundColor: COLORS.secondary },
              ]}
            >
              <Ionicons
                name="document-text"
                size={TYPOGRAPHY.fontSize.bodySm}
                color={COLORS.white}
              />
            </View>
            <Text style={AdminOperationsStyles.sectionTitle}>
              NHẬT KÝ HỆ THỐNG
            </Text>
          </View>

          {loadingLogs ? (
            <View style={AdminOperationsStyles.logsLoadingWrap}>
              <ActivityIndicator color={COLORS.secondary} />
            </View>
          ) : logs.length === 0 ? (
            <Text style={AdminOperationsStyles.helperText}>
              Không có bản ghi nào.
            </Text>
          ) : (
            logs.slice(0, 10).map((log, index) => (
              <View key={log.id || index} style={AdminOperationsStyles.logItem}>
                <View style={AdminOperationsStyles.logHeader}>
                  <Text style={AdminOperationsStyles.logTitle}>
                    Admin #{log.admin_id || "N/A"}
                  </Text>
                  <Text style={AdminOperationsStyles.logTime}>
                    {new Date(log.timestamp).toLocaleString("vi-VN")}
                  </Text>
                </View>
                <Text style={AdminOperationsStyles.logText}>
                  Bảng: {log.target_table || "N/A"}
                </Text>
                <Text style={AdminOperationsStyles.logText}>
                  Cột: {log.column_name || "N/A"}
                </Text>
                <Text style={AdminOperationsStyles.logText}>
                  Giá trị: {log.old_value || "---"} → {log.new_value || "---"}
                </Text>
                <Text style={AdminOperationsStyles.logReason}>
                  Lý do: {log.reason || "Không có"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <ConfirmModal
        visible={showOverrideConfirm}
        title="Xác nhận ghi đè"
        description={`Ghi đè trạng thái vận đơn ${overrideForm.waybill_code} sẽ bỏ qua quy trình bình thường. Tiếp tục?`}
        cancelText="Hủy"
        confirmText="Tiếp tục"
        tone="danger"
        onCancel={() => setShowOverrideConfirm(false)}
        onConfirm={executeOverrideStatus}
      />
    </KeyboardAvoidingView>
  );
}
