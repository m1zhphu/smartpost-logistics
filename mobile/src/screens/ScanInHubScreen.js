import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UniversalScanner from "../components/UniversalScanner";
import ScanInHubStyles from "../styles/ScanInHubStyles";
import { bagService } from "../services/bagService";
import { useBaggingSession } from "../hooks/useBaggingSession";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";

const getBillCode = (item) => {
  if (item === undefined || item === null) {
    return "";
  }

  if (typeof item === "string" || typeof item === "number") {
    return String(item).trim();
  }

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
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      const code = getBillCode(item);
      if (!code) {
        return null;
      }

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

      return {
        code,
        warning,
        warningText,
        source: item,
      };
    })
    .filter(Boolean);
};

export default function ScanInHubScreen({ navigation }) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("expected");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
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
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  }, [user]);

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
      if (!code) {
        return;
      }

      if (expectedCodes.has(code)) {
        matches.push({ code, isExtra: false });
      } else {
        extras.push({ code, isExtra: true });
      }
    });

    return [...extras, ...matches];
  }, [scannedBills, expectedCodes]);

  const missingCount = useMemo(() => {
    const scannedSet = new Set(
      scannedBills.map((item) => String(item).trim()).filter(Boolean),
    );
    return expectedList.filter(
      (item) => item.code && !scannedSet.has(item.code),
    ).length;
  }, [expectedList, scannedBills]);

  const extraCount = useMemo(
    () => scannedDetails.filter((item) => item.isExtra).length,
    [scannedDetails],
  );

  const verifyBag = async (scannedBagCode) => {
    if (!scannedBagCode) {
      return;
    }

    if (!user.token) {
      Alert.alert(
        "Thông báo",
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );
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
    } catch (error) {
      Alert.alert(
        "Lỗi xác minh túi",
        error.message || "Không thể tải dữ liệu dự kiến của túi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (code) => {
    const scannedValue = String(code || "").trim();
    if (!scannedValue) {
      return;
    }

    if (!bagCode) {
      verifyBag(scannedValue);
      return;
    }

    handleScanBill(scannedValue);
  };

  const handleScanBill = (billCode) => {
    const normalizedBillCode = String(billCode || "").trim();
    if (!normalizedBillCode) {
      return;
    }

    if (scannedBills.includes(normalizedBillCode)) {
      return;
    }

    addScannedBill(normalizedBillCode);

    if (!expectedCodes.has(normalizedBillCode)) {
      Vibration.vibrate(120);
    }

    setActiveTab("scanned");
  };

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (!manualCode.trim()) {
      return;
    }

    if (!bagCode) {
      verifyBag(manualCode.trim());
    } else {
      handleScanBill(manualCode.trim());
    }

    setManualCode("");
  };

  const handleReset = () => {
    if (!bagCode && scannedBills.length === 0) {
      return;
    }

    Alert.alert("Xác nhận", "Bạn muốn bắt đầu lại phiên đối soát?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Bắt đầu lại",
        style: "destructive",
        onPress: () => {
          resetSession();
          setActiveTab("expected");
          setManualCode("");
        },
      },
    ]);
  };

  const handleSubmitVerification = async () => {
    if (!bagCode) {
      Alert.alert("Lỗi", "Vui lòng quét mã túi trước khi hoàn tất đối soát.");
      return;
    }

    if (isMismatch) {
      Alert.alert(
        "Chưa thể đóng túi",
        "Có bill dư hoặc thiếu. Vui lòng điều chỉnh trước khi hoàn tất.",
      );
      return;
    }

    setLoading(true);
    try {
      await bagService.submitVerification(user.token, bagCode, scannedBills);
      Alert.alert("Hoàn tất", `Đã đóng túi ${bagCode} thành công.`, [
        {
          text: "OK",
          onPress: () => {
            resetSession();
            setActiveTab("expected");
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Lỗi đối soát",
        error.message || "Không thể hoàn tất đối soát túi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const scannerTitle = bagCode ? `Túi ${bagCode}` : "Quét mã túi để bắt đầu";
  const scannerInstruction = bagCode
    ? "Quét bill vật lý để đối soát với danh sách dự kiến"
    : "Quét mã túi để lấy danh sách bill dự kiến";

  return (
    <View style={ScanInHubStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={ScanInHubStyles.cameraArea}>
        <UniversalScanner
          title={scannerTitle}
          instruction={scannerInstruction}
          onScan={handleScan}
        />

        <View style={ScanInHubStyles.camHeader}>
          <TouchableOpacity
            style={ScanInHubStyles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              ĐỐI SOÁT TÚI
            </Text>
            <Text
              style={{ color: COLORS.white, fontSize: 18, fontWeight: "bold" }}
            >
              Quét nhập kho túi
            </Text>
          </View>

          <View style={ScanInHubStyles.liveBadge}>
            <Text style={ScanInHubStyles.liveText}>
              {bagCode ? "VERIFY" : "READY"}
            </Text>
          </View>
        </View>

        <View style={ScanInHubStyles.manualInputContainer}>
          <View style={ScanInHubStyles.inputBox}>
            <Ionicons
              name="search"
              size={20}
              color="#c7d1ca"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={ScanInHubStyles.input}
              placeholder={
                bagCode ? "Nhập mã bill thủ công..." : "Nhập mã túi thủ công..."
              }
              placeholderTextColor="#c7d1ca"
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="send"
            />
          </View>

          <TouchableOpacity
            style={ScanInHubStyles.sendBtn}
            onPress={handleManualSubmit}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={ScanInHubStyles.contentArea}>
        <View style={ScanInHubStyles.headerCard}>
          <View style={ScanInHubStyles.headerTitleRow}>
            <Text style={ScanInHubStyles.headerTitle}>Túi đối soát</Text>
            {bagCode ? (
              <View style={ScanInHubStyles.countBadge}>
                <Text style={ScanInHubStyles.countBadgeText}>{bagCode}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={ScanInHubStyles.clearBtn}
            onPress={handleReset}
          >
            <Text style={ScanInHubStyles.clearBtnText}>
              {bagCode ? "Bắt đầu lại" : "Xóa"}
            </Text>
          </TouchableOpacity>
        </View>

        {bagCode ? (
          <View style={ScanInHubStyles.statusBanner}>
            <Text style={ScanInHubStyles.statusText}>
              Dự kiến {expectedList.length} bill • Đã quét{" "}
              {scannedDetails.length}
            </Text>
            {missingCount > 0 ? (
              <Text style={ScanInHubStyles.hintText}>
                {missingCount} bill thiếu
              </Text>
            ) : null}
            {extraCount > 0 ? (
              <Text style={[ScanInHubStyles.hintText, { color: "#c63737" }]}>
                +{extraCount} bill dư
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={ScanInHubStyles.tabBar}>
          <TouchableOpacity
            style={[
              ScanInHubStyles.tabButton,
              activeTab === "expected" && ScanInHubStyles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("expected")}
          >
            <Text
              style={[
                ScanInHubStyles.tabButtonText,
                activeTab === "expected" && ScanInHubStyles.tabButtonTextActive,
              ]}
            >
              Dự kiến ({expectedList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              ScanInHubStyles.tabButton,
              activeTab === "scanned" && ScanInHubStyles.tabButtonActive,
              { marginRight: 0 },
            ]}
            onPress={() => setActiveTab("scanned")}
          >
            <Text
              style={[
                ScanInHubStyles.tabButtonText,
                activeTab === "scanned" && ScanInHubStyles.tabButtonTextActive,
              ]}
            >
              Thực tế ({scannedDetails.length})
            </Text>
          </TouchableOpacity>
        </View>

        {bagCode ? (
          <FlatList
            data={activeTab === "expected" ? expectedList : scannedDetails}
            keyExtractor={(item, index) =>
              `${item.code}-${index}-${item.isExtra ? "extra" : "expected"}`
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={ScanInHubStyles.listContent}
            renderItem={({ item }) => {
              const isScanned = scannedBills.includes(item.code);
              const isExtra = item.isExtra === true;

              const containerStyle = [
                ScanInHubStyles.listItem,
                isExtra && {
                  borderColor: "#fdc7c6",
                  backgroundColor: "#fff1f1",
                },
                activeTab === "expected" &&
                  isScanned && {
                    borderColor: "#d4f1e1",
                    backgroundColor: "#f3fbf6",
                  },
              ];

              return (
                <View style={containerStyle}>
                  <View style={ScanInHubStyles.itemContent}>
                    <View style={ScanInHubStyles.leftInfo}>
                      <View
                        style={[
                          ScanInHubStyles.iconCircle,
                          isExtra && { backgroundColor: "#fce9e9" },
                          activeTab === "expected" &&
                            isScanned && { backgroundColor: "#e1f5e9" },
                        ]}
                      >
                        <Ionicons
                          name={
                            isExtra
                              ? "close-circle"
                              : isScanned
                                ? "checkmark-circle"
                                : "stopwatch"
                          }
                          size={18}
                          color={
                            isExtra
                              ? "#c63737"
                              : isScanned
                                ? "#2d8f55"
                                : "#7a857d"
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={ScanInHubStyles.itemCode}>
                          {item.code}
                        </Text>
                        {item.warning ? (
                          <View style={ScanInHubStyles.warningRow}>
                            <Text style={ScanInHubStyles.warningText}>
                              ⚠️ {item.warningText || "Kiểm tra COD / OCR"}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      {activeTab === "expected" ? (
                        <View
                          style={[
                            ScanInHubStyles.itemBadge,
                            isScanned ? null : ScanInHubStyles.itemBadgeMissing,
                          ]}
                        >
                          <Text
                            style={[
                              ScanInHubStyles.itemBadgeText,
                              !isScanned &&
                                ScanInHubStyles.itemBadgeTextMissing,
                            ]}
                          >
                            {isScanned ? "ĐÃ QUÉT" : "THIẾU BILL"}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            ScanInHubStyles.itemBadge,
                            isExtra ? ScanInHubStyles.itemBadgeExtra : null,
                          ]}
                        >
                          <Text
                            style={[
                              ScanInHubStyles.itemBadgeText,
                              isExtra
                                ? ScanInHubStyles.itemBadgeTextExtra
                                : null,
                            ]}
                          >
                            {isExtra ? "DƯ BILL" : "ĐÚNG"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={ScanInHubStyles.emptyContainer}>
                <Ionicons name="clipboard-outline" size={56} color="#d3dbd5" />
                <Text style={ScanInHubStyles.emptyText}>
                  {activeTab === "expected"
                    ? "Không tìm thấy bill dự kiến."
                    : "Chưa quét bill nào cho túi này."}
                </Text>
              </View>
            }
          />
        ) : (
          <View style={ScanInHubStyles.emptyContainer}>
            <Ionicons name="barcode-outline" size={64} color="#d3dbd5" />
            <Text style={ScanInHubStyles.emptyText}>
              Quét mã túi để tải danh sách bill dự kiến và bắt đầu đối soát.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            ScanInHubStyles.submitBtn,
            (isMismatch || !bagCode || scannedDetails.length === 0) &&
              ScanInHubStyles.submitBtnDisabled,
          ]}
          onPress={handleSubmitVerification}
          disabled={
            isMismatch || !bagCode || loading || scannedDetails.length === 0
          }
        >
          <Text style={ScanInHubStyles.submitBtnText}>
            HOÀN TẤT ĐÓNG TÚI (CLOSED)
          </Text>
        </TouchableOpacity>
        {isMismatch ? (
          <Text
            style={[
              ScanInHubStyles.hintText,
              { marginHorizontal: 20, marginBottom: 14 },
            ]}
          >
            Không thể hoàn tất khi còn bill thiếu hoặc bill dư.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
