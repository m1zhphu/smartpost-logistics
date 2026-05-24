import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import UniversalScanner from "../components/UniversalScanner";
import ScanManifestLoadStyles from "../styles/ScanManifestLoadStyles";
import { warehouseService } from "../services/warehouseService";
import { waybillService } from "../services/waybillService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import EmptyState from "../components/EmptyState";
import { SPACING } from "../constants/theme";
import Toast from "react-native-toast-message";
import ConfirmModal from "../components/ConfirmModal";

export default function ScanManifestLoadScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [isLocked, setIsLocked] = useState(false);
  const [manifestCode, setManifestCode] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [toHubId, setToHubId] = useState("");
  const [hubs, setHubs] = useState([]);
  const [hubModalVisible, setHubModalVisible] = useState(false);
  const [scannedBags, setScannedBags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [pendingBagCode, setPendingBagCode] = useState("");

  useEffect(() => {
    if (!isRouteAllowed(user, "ScanManifestLoad")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
    }
  }, [navigation, user]);

  useEffect(() => {
    if (!user.token) return;

    waybillService
      .getHubs(user.token)
      .then((data) => setHubs(Array.isArray(data) ? data : []))
      .catch(() =>
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải danh sách hub.",
        }),
      );
  }, [user.token]);

  const selectedHub = useMemo(
    () => hubs.find((item) => String(item.hub_id) === String(toHubId)),
    [hubs, toHubId],
  );

  const handleLock = () => {
    let nextManifestCode = manifestCode;
    if (!nextManifestCode) {
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      nextManifestCode = `MFL-${dateStr}-${randomNum}`;
      setManifestCode(nextManifestCode);
    }

    if (!vehicleNumber.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập biển số xe.",
      });
      return;
    }

    if (!toHubId) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn bưu cục đích đến.",
      });
      return;
    }

    setIsLocked(true);
  };

  const handleScanBag = async (bagCode) => {
    if (!bagCode) return;

    if (!isLocked) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chốt thông tin chuyến xe trước khi quét túi.",
      });
      return;
    }

    if (scannedBags.find((item) => item.code === bagCode)) return;    setPendingBagCode(bagCode);
  };

  const executeAddBagToManifest = () => {
    if (!pendingBagCode) return;

    const timeStr = new Date().toLocaleTimeString("vi-VN", {
      hour12: false,
    });
    setScannedBags((prev) => [
      { code: pendingBagCode, time: timeStr },
      ...prev,
    ]);
    setPendingBagCode("");
  };
  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (manualCode.trim()) {
      handleScanBag(manualCode.trim());
      setManualCode("");
    }
  };

  const handleSubmit = async () => {
    if (scannedBags.length === 0) return;

    setLoading(true);
    try {
      await warehouseService.manifestLoad(user.token, {
        manifest_code: manifestCode,
        to_hub_id: Number(toHubId),
        vehicle_number: vehicleNumber.trim(),
        bag_codes: scannedBags.map((item) => item.code),
      });
      Toast.show({
        type: "success",
        text1: "Hoàn thành",
        text2: `Đã chốt chuyến xe ${manifestCode} với ${scannedBags.length} túi.`,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể chốt chuyến xe.",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBag = (code) => {
    setScannedBags((prev) => prev.filter((item) => item.code !== code));
  };

  return (
    <KeyboardAvoidingView
      style={ScanManifestLoadStyles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        style={ScanManifestLoadStyles.container}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.neutralDark}
        />

        <View
          style={[
            ScanManifestLoadStyles.cameraArea,
            { paddingTop: insets.top + SPACING.sm },
          ]}
        >
          <View style={ScanManifestLoadStyles.cameraFrame}>
            {isLocked ? (
              <UniversalScanner
                title="ĐANG BỐC XE"
                instruction={`Xe: ${vehicleNumber} - Đưa mã túi vào khung ng?m`}
                onScan={handleScanBag}
              />
            ) : (
              <View style={ScanManifestLoadStyles.cameraOverlayLock}>
                <Ionicons name="bus" size={60} color={COLORS.white} />
                <Text style={ScanManifestLoadStyles.lockText}>
                  CHỐT THÔNG TIN XE ĐỂ MỞ SCANNER
                </Text>
              </View>
            )}
          </View>

          <View style={[ScanManifestLoadStyles.camHeader, { top: SPACING.sm }]}>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={ScanManifestLoadStyles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </Pressable>

            {isLocked ? (
              <View style={ScanManifestLoadStyles.liveBadge}>
                <Text style={ScanManifestLoadStyles.liveText}>LOADING</Text>
              </View>
            ) : (
              <View style={ScanManifestLoadStyles.backBtn} />
            )}
          </View>
        </View>

        <View
          style={[
            ScanManifestLoadStyles.bottomSheet,
            { paddingBottom: insets.bottom + SPACING.md },
          ]}
        >
          {!isLocked ? (
            <ScrollView
              contentContainerStyle={ScanManifestLoadStyles.configArea}
            >
              <View style={ScanManifestLoadStyles.cardHeaderRow}>
                <View style={ScanManifestLoadStyles.iconCirclePrimary}>
                  <Ionicons name="bus" size={20} color={COLORS.primary} />
                </View>
                <Text style={ScanManifestLoadStyles.configTitle}>
                  Thông tin chuyến xe
                </Text>
              </View>

              <CustomInput
                label="Mã chuyến (tùy chọn)"
                placeholder="Để trống để hệ thống tự sinh mã"
                value={manifestCode}
                onChangeText={setManifestCode}
              />

              <CustomInput
                label="Biển số xe tải"
                placeholder="VD: 51C-123.45"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />

              <Text style={ScanManifestLoadStyles.label}>Bưu cục đích đến</Text>
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={ScanManifestLoadStyles.selectorBtn}
                onPress={() => setHubModalVisible(true)}
              >
                <Text
                  style={[
                    ScanManifestLoadStyles.selectorBtnText,
                    !selectedHub && ScanManifestLoadStyles.selectorPlaceholder,
                  ]}
                >
                  {selectedHub
                    ? `${selectedHub.hub_code} - ${selectedHub.hub_name}`
                    : "Chọn bưu cục đích"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.textMuted}
                />
              </Pressable>

              <CustomButton
                title="Chốt thông tin & Bắt đầu"
                onPress={handleLock}
                leftIcon={
                  <Ionicons name="lock-closed" size={20} color={COLORS.white} />
                }
              />
            </ScrollView>
          ) : (
            <>
              <View style={ScanManifestLoadStyles.sheetHeader}>
                <View>
                  <Text style={ScanManifestLoadStyles.sheetTitle}>
                    Xe: {vehicleNumber}
                  </Text>
                  <Text style={ScanManifestLoadStyles.sheetSub}>
                    Mã chuyến: {manifestCode}
                  </Text>
                </View>
              </View>

              <View style={ScanManifestLoadStyles.statRow}>
                <View style={ScanManifestLoadStyles.statCard}>
                  <Text style={ScanManifestLoadStyles.statLabel}>
                    Tổng số kiện
                  </Text>
                  <Text style={ScanManifestLoadStyles.statValue}>
                    {scannedBags.length}
                  </Text>
                </View>
                <View style={ScanManifestLoadStyles.statCard}>
                  <Text style={ScanManifestLoadStyles.statLabel}>Đã quét</Text>
                  <Text style={ScanManifestLoadStyles.statValue}>
                    {scannedBags.length}
                  </Text>
                </View>
              </View>

              <View style={ScanManifestLoadStyles.manualRow}>
                <CustomInput
                  containerStyle={ScanManifestLoadStyles.manualInput}
                  placeholder="Nhập mã túi thủ công"
                  value={manualCode}
                  onChangeText={setManualCode}
                  onSubmitEditing={handleManualSubmit}
                  leftIcon={
                    <Ionicons
                      name="barcode-outline"
                      size={18}
                      color={COLORS.textMuted}
                    />
                  }
                />
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={ScanManifestLoadStyles.sendBtn}
                  onPress={handleManualSubmit}
                >
                  <Ionicons name="send" size={20} color={COLORS.white} />
                </Pressable>
              </View>

              <FlatList
                data={scannedBags}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={ScanManifestLoadStyles.listContent}
                renderItem={({ item }) => (
                  <View style={ScanManifestLoadStyles.listItem}>
                    <View style={ScanManifestLoadStyles.leftInfo}>
                      <View style={ScanManifestLoadStyles.iconCircle}>
                        <Ionicons
                          name="briefcase-outline"
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>
                      <View>
                        <Text style={ScanManifestLoadStyles.itemCode}>
                          {item.code}
                        </Text>
                        <Text style={ScanManifestLoadStyles.itemTime}>
                          {item.time} • Lên xe
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={ScanManifestLoadStyles.removeBtn}
                      onPress={() => removeBag(item.code)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={18} color={COLORS.error} />
                    </Pressable>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={ScanManifestLoadStyles.emptyWrap}>
                    <EmptyState
                      icon="bag-personal-outline"
                      title="Chưa có túi"
                      message="Đưa mã túi vào camera để quét."
                    />
                  </View>
                }
              />

              <SafeAreaView
                edges={["bottom"]}
                style={ScanManifestLoadStyles.footer}
              >
                <CustomButton
                  title={`Xuất bản & Hoàn tất (${scannedBags.length})`}
                  onPress={handleSubmit}
                  loading={loading}
                  style={ScanManifestLoadStyles.finishBtn}
                  leftIcon={
                    <Ionicons
                      name="paper-plane"
                      size={20}
                      color={COLORS.white}
                    />
                  }
                  disabled={scannedBags.length === 0}
                />
              </SafeAreaView>
            </>
          )}
        </View>

        <Modal visible={hubModalVisible} animationType="slide" transparent>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={ScanManifestLoadStyles.modalOverlay}
            onPress={() => setHubModalVisible(false)}
          >
            <View
              style={ScanManifestLoadStyles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={ScanManifestLoadStyles.modalHeader}>
                <Text style={ScanManifestLoadStyles.modalTitle}>
                  Chọn Bưu Cục Đích
                </Text>
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setHubModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color={COLORS.primary} />
                </Pressable>
              </View>

              <FlatList
                data={hubs}
                keyExtractor={(item, index) => String(item.hub_id || index)}
                renderItem={({ item }) => (
                  <Pressable
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={ScanManifestLoadStyles.optionItem}
                    onPress={() => {
                      setToHubId(String(item.hub_id));
                      setHubModalVisible(false);
                    }}
                  >
                    <Text style={ScanManifestLoadStyles.optionTitle}>
                      {item.hub_code} - {item.hub_name}
                    </Text>
                    <Text style={ScanManifestLoadStyles.optionSub}>
                      {item.address || "Không có địa chỉ"}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>
        <ConfirmModal
          visible={!!pendingBagCode}
          title="Xác nhận bốc hàng"
          description={`Chuyển túi ${pendingBagCode} lên xe ${vehicleNumber}?`}
          cancelText="Hủy"
          confirmText="Đồng ý"
          tone="info"
          iconName="briefcase"
          onCancel={() => setPendingBagCode("")}
          onConfirm={executeAddBagToManifest}
        />      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
