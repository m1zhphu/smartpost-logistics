import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  StatusBar,
  Text,
  View,
  Vibration,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import UniversalScanner from "../components/UniversalScanner";
import ScanInHubStyles from "../styles/ScanInHubStyles";
import { bagService } from "../services/bagService";
import { useBaggingSession } from "../hooks/useBaggingSession";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import EmptyState from "../components/EmptyState";
import { SPACING } from "../constants/theme";
import Toast from "react-native-toast-message";
import ConfirmModal from "../components/ConfirmModal";

const getBillCode = (item) => {
  if (item === undefined || item === null) return "";
  if (typeof item === "string" || typeof item === "number")
    return String(item).trim();

  return String(
    item.code ||
      item.waybill_code ||
      item.waybill ||
      item.waybillId ||
      item.tracking_number ||
      item.trackingNumber ||
      item.id ||
      "",
  ).trim();
};

const normalizeExpectedBills = (payload = []) => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      const code = getBillCode(item);
      if (!code) return null;

      const warning = Boolean(
        item &&
        typeof item === "object" &&
        (item.hasWarning ||
          item.warning ||
          item.warning_flag ||
          item.error_flag ||
          item.is_warning),
      );

      const warningText =
        item && typeof item === "object"
          ? item.warning_message ||
            item.warningText ||
            item.error_reason ||
            item.note ||
            item.reason
          : "";

      return { code, warning, warningText, source: item };
    })
    .filter(Boolean);
};

export default function ScanInHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("expected");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    sessionState,
    initBag,
    addScannedBill,
    setExpectedBills,
    resetSession,
  } = useBaggingSession();
  const { bagCode, scannedBills, expectedBills, isMismatch } = sessionState;

  useEffect(() => {
    if (!isRouteAllowed(user, "ScanInHub")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  const expectedList = useMemo(
    () => normalizeExpectedBills(expectedBills),
    [expectedBills],
  );
  const expectedCodes = useMemo(
    () => new Set(expectedList.map((item) => item.code).filter(Boolean)),
    [expectedList],
  );

  const scannedDetails = useMemo(() => {
    const extras = [];
    const matches = [];

    scannedBills.forEach((item) => {
      const code = String(item).trim();
      if (!code) return;
      if (expectedCodes.has(code)) matches.push({ code, isExtra: false });
      else extras.push({ code, isExtra: true });
    });

    return [...extras, ...matches];
  }, [scannedBills, expectedCodes]);

  const verifyBag = async (scannedBagCode) => {
    if (!scannedBagCode) return;

    if (!user.token) {
      Toast.show({
        type: "error",
        text1: "Thông báo",
        text2: "Phiên đang nhập đã hết hạn. Vui lòng đăng nhập lại.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await bagService.verifyBag(user.token, scannedBagCode);
      const payload = Array.isArray(response)
        ? response
        : response.expectedBills || response.bills || response.data || [];
      const normalized = normalizeExpectedBills(payload);

      initBag({ bagCode: scannedBagCode, estimatedCount: normalized.length });
      setExpectedBills(normalized);
      setActiveTab("expected");
      setLastScanned("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi xác minh túi",
        text2: error.message || "Không thể tải dữ liệu dự kiến của túi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanBill = (billCode) => {
    const normalizedBillCode = String(billCode || "").trim();
    if (!normalizedBillCode) return;

    if (scannedBills.includes(normalizedBillCode)) return;

    addScannedBill(normalizedBillCode);
    setLastScanned(normalizedBillCode);

    if (!expectedCodes.has(normalizedBillCode)) Vibration.vibrate(120);
    setActiveTab("scanned");
  };

  const handleScan = (code) => {
    const scannedValue = String(code || "").trim();
    if (!scannedValue) return;

    if (!bagCode) verifyBag(scannedValue);
    else handleScanBill(scannedValue);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;

    if (!bagCode) verifyBag(manualCode.trim());
    else handleScanBill(manualCode.trim());

    setManualCode("");
  };

  const handleReset = () => {
    if (!bagCode && scannedBills.length === 0) return;

    setShowResetConfirm(true);
  };

  const executeReset = () => {
    setShowResetConfirm(false);
    resetSession();
    setActiveTab("expected");
    setManualCode("");
    setLastScanned("");
  };

  const handleSubmitVerification = async () => {
    if (!bagCode) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng quét mã túi trước khi hoàn tất dò tìm.",
      });
      return;
    }

    if (isMismatch) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          "Còn bill dư hoặc thiếu. Vui lòng điều chỉnh trước khi hoàn tất.",
      });
      return;
    }

    setLoading(true);
    try {
      await bagService.submitVerification(user.token, bagCode, scannedBills);
      Toast.show({
        type: "success",
        text1: "Hoàn tất",
        text2: `Đã xác minh túi ${bagCode} thành công.`,
      });
      resetSession();
      setActiveTab("expected");
      setLastScanned("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi dò tìm",
        text2: error.message || "Không thể hoàn tất dò tìm túi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCount = scannedBills.length;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={ScanInHubStyles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.neutralDark}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={ScanInHubStyles.flex}
      >
        <View
          style={[
            ScanInHubStyles.cameraArea,
            { paddingTop: insets.top + SPACING.sm },
          ]}
        >
          <View style={ScanInHubStyles.cameraFrame}>
            <UniversalScanner
              title={bagCode ? `Túi ${bagCode}` : "Quét mã túi để bắt đầu"}
              instruction={
                bagCode
                  ? "Quét liên tục bill để nhập kho"
                  : "Quét mã túi để tải danh sách bill dự kiến"
              }
              onScan={handleScan}
            />
          </View>

          <View style={[ScanInHubStyles.camHeader, { top: SPACING.sm }]}>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={ScanInHubStyles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </Pressable>
            <View style={ScanInHubStyles.liveBadge}>
              <Text style={ScanInHubStyles.liveText}>
                {bagCode ? "VERIFY" : "READY"}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            ScanInHubStyles.summaryStrip,
            { paddingBottom: insets.bottom + SPACING.md },
          ]}
        >
          <View style={ScanInHubStyles.countCard}>
            <Text style={ScanInHubStyles.countLabel}>Số lượng đã quét</Text>
            <Text style={ScanInHubStyles.countValue}>{totalCount}</Text>
            <Text style={ScanInHubStyles.countSub}>
              Dự kiến {expectedList.length} | Túi {bagCode || "chưa quét"}
            </Text>
          </View>

          {lastScanned ? (
            <View style={ScanInHubStyles.lastScannedCard}>
              <Text style={ScanInHubStyles.lastScannedLabel}>Mã v?a quét</Text>
              <Text style={ScanInHubStyles.lastScannedValue}>
                {lastScanned}
              </Text>
            </View>
          ) : null}

          <View style={ScanInHubStyles.manualWrap}>
            <CustomInput
              placeholder={
                bagCode ? "Nhập mã bill thủ công..." : "Nhập mã túi thủ công..."
              }
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={handleManualSubmit}
              leftIcon={
                <Ionicons
                  name={bagCode ? "barcode-outline" : "keypad-outline"}
                  size={18}
                  color={COLORS.textMuted}
                />
              }
            />
          </View>

          <View style={ScanInHubStyles.tabBar}>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                ScanInHubStyles.tabButton,
                activeTab === "expected" && ScanInHubStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab("expected")}
            >
              <Text
                style={[
                  ScanInHubStyles.tabButtonText,
                  activeTab === "expected" &&
                    ScanInHubStyles.tabButtonTextActive,
                ]}
              >
                Dự kiến ({expectedList.length})
              </Text>
            </Pressable>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                ScanInHubStyles.tabButton,
                activeTab === "scanned" && ScanInHubStyles.tabButtonActive,
              ]}
              onPress={() => setActiveTab("scanned")}
            >
              <Text
                style={[
                  ScanInHubStyles.tabButtonText,
                  activeTab === "scanned" &&
                    ScanInHubStyles.tabButtonTextActive,
                ]}
              >
                Thực tế ({scannedDetails.length})
              </Text>
            </Pressable>
          </View>

          {bagCode ? (
            <FlatList
              data={activeTab === "expected" ? expectedList : scannedDetails}
              keyExtractor={(item, index) => `${item.code}-${index}`}
              contentContainerStyle={ScanInHubStyles.listContent}
              renderItem={({ item }) => {
                const isScanned = scannedBills.includes(item.code);
                const isExtra = item.isExtra === true;

                return (
                  <View style={ScanInHubStyles.listItem}>
                    <View style={ScanInHubStyles.itemContent}>
                      <View style={ScanInHubStyles.leftInfo}>
                        <View style={ScanInHubStyles.iconCircle}>
                          <Ionicons
                            name={
                              isExtra
                                ? "close-circle"
                                : isScanned
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                            }
                            size={18}
                            color={
                              isExtra
                                ? COLORS.error
                                : isScanned
                                  ? COLORS.successAccent
                                  : COLORS.textMuted
                            }
                          />
                        </View>
                        <View style={ScanInHubStyles.leftInfo}>
                          <View>
                            <Text style={ScanInHubStyles.itemCode}>
                              {item.code}
                            </Text>
                            {item.warning ? (
                              <Text style={ScanInHubStyles.warningText}>
                                ! {item.warningText || "Kiểm tra COD / OCR"}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      <View
                        style={[
                          ScanInHubStyles.itemBadge,
                          isExtra && ScanInHubStyles.itemBadgeExtra,
                          activeTab === "expected" &&
                            !isScanned &&
                            ScanInHubStyles.itemBadgeMissing,
                        ]}
                      >
                        <Text
                          style={[
                            ScanInHubStyles.itemBadgeText,
                            isExtra && ScanInHubStyles.itemBadgeTextExtra,
                            activeTab === "expected" &&
                              !isScanned &&
                              ScanInHubStyles.itemBadgeTextMissing,
                          ]}
                        >
                          {activeTab === "expected"
                            ? isScanned
                              ? "ĐÃ QUÉT"
                              : "THIẾU"
                            : isExtra
                              ? "DƯ"
                              : "ĐÚNG"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  icon="archive-search-outline"
                  title="Chưa có dữ liệu quét"
                  message="Quét mã để bắt đầu kiểm tra nhập kho."
                />
              }
            />
          ) : (
            <View style={ScanInHubStyles.emptyContainer}>
              <EmptyState
                icon="barcode-scan"
                title="Chưa có túi để quét"
                message="Quét mã túi để tải danh sách bill dự kiến và bắt đầu quét liên tục."
              />
            </View>
          )}

          <SafeAreaView edges={["bottom"]} style={ScanInHubStyles.footer}>
            <CustomButton
              title="Kết thúc nhập kho"
              onPress={handleSubmitVerification}
              loading={loading}
              disabled={isMismatch || !bagCode || scannedDetails.length === 0}
              style={ScanInHubStyles.submitBtn}
            />
            {isMismatch ? (
              <Text style={ScanInHubStyles.hintText}>
                Không thể hoàn tất khi còn bill thiếu hoặc bill dư.
              </Text>
            ) : null}
            <CustomButton
              title="Bắt đầu lại phiên"
              variant="outline"
              onPress={handleReset}
            />
          </SafeAreaView>
        </View>

        <ConfirmModal
          visible={showResetConfirm}
          title="Xác nhận"
          description="Bạn có chắc chắn muốn bắt đầu lại?"
          cancelText="Hủy"
          confirmText="Bắt đầu lại"
          tone="danger"
          iconName="refresh"
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={executeReset}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
