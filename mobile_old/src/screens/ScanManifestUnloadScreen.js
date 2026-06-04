import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
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
import ScanManifestUnloadStyles from "../styles/ScanManifestUnloadStyles";
import { warehouseService } from "../services/warehouseService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";
import CustomButton from "../components/CustomButton";
import EmptyState from "../components/EmptyState";
import { SPACING } from "../constants/theme";
import Toast from "react-native-toast-message";
import ConfirmModal from "../components/ConfirmModal";

export default function ScanManifestUnloadScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [isLocked, setIsLocked] = useState(false);
  const [manifestCode, setManifestCode] = useState("");
  const [incomingManifests, setIncomingManifests] = useState([]);
  const [expectedBags, setExpectedBags] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [manifestModalVisible, setManifestModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!isRouteAllowed(user, "ScanManifestUnload")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  useEffect(() => {
    fetchIncomingManifests();
  }, [user.token]);

  const selectedManifest = useMemo(
    () => incomingManifests.find((item) => item.manifest_code === manifestCode),
    [incomingManifests, manifestCode],
  );

  const fetchIncomingManifests = async () => {
    if (!user.token) return;
    try {
      const data = await warehouseService.getIncomingManifests(user.token);
      const items = Array.isArray(data) ? data : [];
      setIncomingManifests(items);
      if (items.length > 0 && !manifestCode)
        setManifestCode(items[0].manifest_code);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách chuyến xe đang tới.",
      });
    }
  };

  const handleLockAndFetchBags = async () => {
    if (!manifestCode) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn chuyến xe đang cập bến.",
      });
      return;
    }

    setLoadingConfig(true);
    try {
      const res = await warehouseService.getManifestBags(
        user.token,
        manifestCode,
      );
      const formattedBags = (Array.isArray(res) ? res : []).map((item) => ({
        bag_code: item.bag_code,
        is_scanned: false,
      }));
      setExpectedBags(formattedBags);
      setScannedCount(0);
      setIsLocked(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách túi của chuyến xe này.",
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleUnlock = () => {
    setConfirmAction("unlock");
  };
  const handleScanBag = async (scannedCode) => {
    if (!scannedCode || !isLocked) return;

    const bagIndex = expectedBags.findIndex(
      (item) => item.bag_code === scannedCode,
    );
    if (bagIndex === -1) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: `Túi hàng [${scannedCode}] không thuộc chuyến xe này.`,
      });
      return;
    }

    if (expectedBags[bagIndex].is_scanned) return;

    const newExpectedBags = [...expectedBags];
    newExpectedBags[bagIndex].is_scanned = true;
    const scannedBag = newExpectedBags.splice(bagIndex, 1)[0];
    newExpectedBags.unshift(scannedBag);
    setExpectedBags(newExpectedBags);
    setScannedCount((prev) => prev + 1);
  };

  const executeUnload = async () => {
    setSubmitLoading(true);
    try {
      const actualScannedCodes = expectedBags
        .filter((item) => item.is_scanned)
        .map((item) => item.bag_code);
      await warehouseService.manifestUnload(user.token, {
        manifest_code: manifestCode,
        bag_codes: actualScannedCodes,
      });
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Thao tác dỡ hàng hoàn tất.",
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Lỗi hệ thống khi dỡ hàng.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmit = async () => {
    const missingCount = expectedBags.length - scannedCount;
    setConfirmAction(missingCount > 0 ? "submitMissing" : "submitComplete");
  };

  const handleConfirmAction = () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action === "unlock") {
      setIsLocked(false);
      setExpectedBags([]);
      setScannedCount(0);
      return;
    }

    if (action === "submitMissing" || action === "submitComplete") {
      executeUnload();
    }
  };

  const missingConfirmCount = expectedBags.length - scannedCount;
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={ScanManifestUnloadStyles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.neutralDark}
      />

      <View
        style={[
          ScanManifestUnloadStyles.cameraArea,
          { paddingTop: insets.top + SPACING.sm },
        ]}
      >
        <View style={ScanManifestUnloadStyles.cameraFrame}>
          {isLocked ? (
            <UniversalScanner
              title="ĐANG DỞ HÀNG"
              instruction={`Xe: ${manifestCode}`}
              onScan={handleScanBag}
            />
          ) : (
            <View style={ScanManifestUnloadStyles.cameraOverlayLock}>
              <Ionicons name="download" size={60} color={COLORS.white} />
              <Text style={ScanManifestUnloadStyles.lockText}>
                CHỌN CHUYẾN XE ĐỂ KIỂM ĐẾM
              </Text>
            </View>
          )}
        </View>

        <View style={[ScanManifestUnloadStyles.camHeader, { top: SPACING.sm }]}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={ScanManifestUnloadStyles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </Pressable>
          {isLocked ? (
            <View style={ScanManifestUnloadStyles.liveBadge}>
              <Text style={ScanManifestUnloadStyles.liveText}>UNLOADING</Text>
            </View>
          ) : (
            <View style={ScanManifestUnloadStyles.backBtn} />
          )}
        </View>
      </View>

      <View
        style={[
          ScanManifestUnloadStyles.bottomSheet,
          { paddingBottom: insets.bottom + SPACING.md },
        ]}
      >
        {!isLocked ? (
          <ScrollView
            contentContainerStyle={ScanManifestUnloadStyles.configArea}
          >
            <View style={ScanManifestUnloadStyles.cardHeaderRow}>
              <View style={ScanManifestUnloadStyles.iconCircleSuccess}>
                <Ionicons name="download" size={20} color={COLORS.secondary} />
              </View>
              <Text style={ScanManifestUnloadStyles.configTitle}>
                Xe đang cập bến - Chọn chuyến xe để bắt đầu dở hàng
              </Text>
            </View>

            <Text style={ScanManifestUnloadStyles.label}>
              Chọn chuyến xe đang cập bến để tải thông tin túi hàng và bắt đầu
              dở hàng.
            </Text>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={ScanManifestUnloadStyles.selectorBtn}
              onPress={() => setManifestModalVisible(true)}
            >
              <Text
                style={[
                  ScanManifestUnloadStyles.selectorBtnText,
                  !selectedManifest &&
                    ScanManifestUnloadStyles.selectorPlaceholder,
                ]}
              >
                {selectedManifest
                  ? `${selectedManifest.manifest_code} (${selectedManifest.vehicle_number || "N/A"})`
                  : "Chọn chuyến xe"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>

            <CustomButton
              title="Tải dữ liệu & Bắt đầu"
              onPress={handleLockAndFetchBags}
              loading={loadingConfig}
              leftIcon={<Ionicons name="sync" size={20} color={COLORS.white} />}
            />
          </ScrollView>
        ) : (
          <>
            <View style={ScanManifestUnloadStyles.sheetHeader}>
              <View>
                <Text style={ScanManifestUnloadStyles.sheetTitle}>
                  Tiến độ dở hàng
                </Text>
                <Text style={ScanManifestUnloadStyles.sheetSub}>
                  Đã quét: {scannedCount} / {expectedBags.length}
                </Text>
              </View>
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={ScanManifestUnloadStyles.unlockBtn}
                onPress={handleUnlock}
              >
                <Ionicons name="refresh" size={16} color={COLORS.error} />
                <Text style={ScanManifestUnloadStyles.unlockText}>Đổi xe</Text>
              </Pressable>
            </View>

            <View style={ScanManifestUnloadStyles.statRow}>
              <View style={ScanManifestUnloadStyles.statCard}>
                <Text style={ScanManifestUnloadStyles.statLabel}>
                  Tổng số kiện
                </Text>
                <Text style={ScanManifestUnloadStyles.statValue}>
                  {expectedBags.length}
                </Text>
              </View>
              <View style={ScanManifestUnloadStyles.statCard}>
                <Text style={ScanManifestUnloadStyles.statLabel}>Đã quét</Text>
                <Text style={ScanManifestUnloadStyles.statValue}>
                  {scannedCount}
                </Text>
              </View>
            </View>

            <FlatList
              data={expectedBags}
              keyExtractor={(item) => item.bag_code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={ScanManifestUnloadStyles.listContent}
              renderItem={({ item }) => (
                <View
                  style={[
                    ScanManifestUnloadStyles.listItem,
                    item.is_scanned
                      ? ScanManifestUnloadStyles.scannedItem
                      : ScanManifestUnloadStyles.pendingItem,
                  ]}
                >
                  <View style={ScanManifestUnloadStyles.leftInfo}>
                    <View
                      style={[
                        ScanManifestUnloadStyles.iconCircle,
                        {
                          backgroundColor: item.is_scanned
                            ? COLORS.successAccent
                            : COLORS.backgroundSoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.is_scanned ? "checkmark" : "time-outline"}
                        size={20}
                        color={
                          item.is_scanned ? COLORS.white : COLORS.textMuted
                        }
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          ScanManifestUnloadStyles.itemCode,
                          {
                            color: item.is_scanned
                              ? COLORS.successAccent
                              : COLORS.textMuted,
                          },
                        ]}
                      >
                        {item.is_scanned ? "ĐÃ DỠ HÀNG" : "CHỜ QUÉT"}
                      </Text>
                      <Text
                        style={[
                          ScanManifestUnloadStyles.itemTime,
                          {
                            color: item.is_scanned
                              ? COLORS.primary
                              : COLORS.textMuted,
                          },
                        ]}
                      >
                        {item.bag_code}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={ScanManifestUnloadStyles.emptyText}>
                  Chuyến xe này không có túi hàng nào.
                </Text>
              }
            />

            <SafeAreaView
              edges={["bottom"]}
              style={ScanManifestUnloadStyles.footer}
            >
              <CustomButton
                title="Chốt số nhận hàng"
                onPress={handleSubmit}
                loading={submitLoading}
                style={ScanManifestUnloadStyles.finishBtn}
                leftIcon={
                  <Ionicons
                    name="checkbox-outline"
                    size={20}
                    color={COLORS.white}
                  />
                }
              />
            </SafeAreaView>
          </>
        )}
      </View>

      <Modal visible={manifestModalVisible} animationType="slide" transparent>
        <Pressable
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={ScanManifestUnloadStyles.modalOverlay}
          onPress={() => setManifestModalVisible(false)}
        >
          <View
            style={ScanManifestUnloadStyles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={ScanManifestUnloadStyles.modalHeader}>
              <Text style={ScanManifestUnloadStyles.modalTitle}>
                Chọn Chuyến Xe
              </Text>
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => setManifestModalVisible(false)}
              >
                <Ionicons name="close" size={28} color={COLORS.primary} />
              </Pressable>
            </View>

            <FlatList
              data={incomingManifests}
              keyExtractor={(item, index) =>
                item.manifest_code || String(index)
              }
              renderItem={({ item }) => (
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={ScanManifestUnloadStyles.optionItem}
                  onPress={() => {
                    setManifestCode(item.manifest_code);
                    setManifestModalVisible(false);
                  }}
                >
                  <Text style={ScanManifestUnloadStyles.optionTitle}>
                    {item.manifest_code}
                  </Text>
                  <Text style={ScanManifestUnloadStyles.optionSub}>
                    {item.vehicle_number || "Không có biển số"}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
      <ConfirmModal
        visible={!!confirmAction}
        title={
          confirmAction === "submitMissing"
            ? "Cảnh báo thiếu hàng"
            : confirmAction === "unlock"
              ? "Cảnh báo"
              : "Xác nhận"
        }
        description={
          confirmAction === "submitMissing"
            ? `Khai báo: ${expectedBags.length} túi\nThực nhận: ${scannedCount} túi\nThiếu: ${missingConfirmCount} túi\n\nChốt số lượng hàng?`
            : confirmAction === "unlock"
              ? "Đổi chuyến xe sẽ xóa toàn bộ dữ liệu kiểm đếm hiện tại. Bạn có chắc chắn?"
              : `Xác nhận dỡ đủ ${scannedCount} túi xuống kho?`
        }
        cancelText={confirmAction === "submitMissing" ? "Tiếp tục quét" : "Hủy"}
        confirmText={confirmAction === "submitMissing" ? "Chốt số lượng" : "Đồng ý"}
        tone={confirmAction === "submitComplete" ? "info" : "danger"}
        iconName={confirmAction === "unlock" ? "refresh" : "download"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />    </SafeAreaView>
  );
}
