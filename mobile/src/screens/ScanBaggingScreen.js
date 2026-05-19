import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UniversalScanner from "../components/UniversalScanner";
import ScanBaggingStyles from "../styles/ScanBaggingStyles";
import { bagService } from "../services/bagService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";

export default function ScanBaggingScreen({ navigation }) {
  const { user } = useUser();
  const [bagCode, setBagCode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [manualCode, setManualCode] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [baggingErrorModalVisible, setBaggingErrorModalVisible] =
    useState(false);
  const [baggingErrorMessage, setBaggingErrorMessage] = useState("");

  useEffect(() => {
    if (!isRouteAllowed(user, "ScanBagging")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  }, [user]);

  const handleCreateBag = async () => {
    if (!user?.primary_hub_id) {
      Alert.alert(
        "Lỗi",
        "Không xác định được bưu cục hiện tại. Vui lòng đăng nhập lại.",
      );
      return;
    }

    setLoading(true);
    try {
      const timeStr = new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(2, 14);
      const code = `BG-${user.primary_hub_id}-${timeStr}`;
      setBagCode(code);
      setScannedItems([]);
      setIsLocked(true);
      Alert.alert("Tạo túi thành công", `Mã túi: ${code}`);
    } catch (error) {
      Alert.alert("Lỗi tạo túi", error.message || "Không thể tạo túi mới.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanItem = async (waybillCode) => {
    if (!waybillCode) {
      return;
    }

    if (!bagCode) {
      Alert.alert(
        "Tạo túi trước",
        "Vui lòng tạo túi mới trước khi quét vận đơn.",
      );
      return;
    }

    if (scannedItems.find((item) => item.code === waybillCode)) {
      return;
    }

    try {
      await bagService.scanBagIn(
        user.token,
        bagCode,
        user.primary_hub_id,
        waybillCode,
      );

      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      setScannedItems((prev) => [
        { code: waybillCode, time: timeStr },
        ...prev,
      ]);
    } catch (error) {
      if (error.status === 400) {
        Vibration.vibrate([0, 120, 40, 120]);
        setBaggingErrorMessage(
          "LỖI! Đơn hàng chưa được xác thực Bill. Không thể xuất kho!",
        );
        setBaggingErrorModalVisible(true);
      } else {
        Alert.alert(
          "Lỗi không xác định",
          error.message || "Đã xảy ra lỗi, vui lòng thử lại sau.",
        );
      }
    }
  };

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (manualCode.trim()) {
      handleScanItem(manualCode.trim());
      setManualCode("");
    }
  };

  const finishBagging = () => {
    if (!bagCode) {
      return;
    }

    Alert.alert(
      "Chốt Túi Hàng",
      `Bạn có chắc chắn muốn hoàn tất túi ${bagCode} với ${scannedItems.length} đơn?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: () => {
            Alert.alert("Hoàn tất", `Đã hoàn tất túi ${bagCode}.`);
            setBagCode("");
            setScannedItems([]);
            setManualCode("");
            setIsLocked(false);
          },
        },
      ],
    );
  };

  const handleResetBag = () => {
    setBagCode("");
    setScannedItems([]);
    setManualCode("");
    setIsLocked(false);
  };

  return (
    <View style={ScanBaggingStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={ScanBaggingStyles.cameraArea}>
        {bagCode ? (
          <UniversalScanner
            title={`Túi: ${bagCode}`}
            instruction="Quét mã vận đơn để thêm vào túi"
            onScan={handleScanItem}
          />
        ) : (
          <View style={ScanBaggingStyles.cameraOverlayLock}>
            <Ionicons
              name="archive-outline"
              size={60}
              color="rgba(255,255,255,0.6)"
            />
            <Text style={ScanBaggingStyles.lockText}>
              Nhấn Tạo Túi Mới để bắt đầu
            </Text>
          </View>
        )}

        <View style={ScanBaggingStyles.camHeader}>
          <TouchableOpacity
            style={ScanBaggingStyles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={ScanBaggingStyles.liveBadge}>
            <Text
              style={{
                color: COLORS.processScanOrange,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {bagCode ? "SCANNING" : "READY"}
            </Text>
          </View>
        </View>

        {bagCode ? (
          <View style={ScanBaggingStyles.manualInputContainer}>
            <View style={ScanBaggingStyles.inputBox}>
              <Ionicons
                name="search"
                size={20}
                color="#9fb1a5"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={ScanBaggingStyles.input}
                placeholder="Nhập mã đơn thủ công..."
                placeholderTextColor="#9fb1a5"
                value={manualCode}
                onChangeText={setManualCode}
                onSubmitEditing={handleManualSubmit}
                returnKeyType="send"
              />
            </View>
            <TouchableOpacity
              style={ScanBaggingStyles.sendBtn}
              onPress={handleManualSubmit}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={ScanBaggingStyles.bottomSheet}>
        {!bagCode ? (
          <View style={ScanBaggingStyles.configArea}>
            <View style={ScanBaggingStyles.cardHeaderRow}>
              <View style={ScanBaggingStyles.iconCircleWarning}>
                <Ionicons
                  name="archive-outline"
                  size={20}
                  color={COLORS.processScanOrange}
                />
              </View>
              <Text style={ScanBaggingStyles.configTitle}>TẠO TÚI MỚI</Text>
            </View>

            <Text style={ScanBaggingStyles.label}>
              Tạo mã túi tự động, sau đó quét mã vận đơn để thêm vào túi.
            </Text>

            <TouchableOpacity
              style={ScanBaggingStyles.startBtn}
              onPress={handleCreateBag}
              disabled={loading}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={ScanBaggingStyles.startBtnText}>
                {loading ? "Đang tạo..." : "TẠO TÚI MỚI"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={ScanBaggingStyles.sheetHeader}>
              <View>
                <Text style={ScanBaggingStyles.sheetTitle}>Chi tiết túi</Text>
                <Text style={ScanBaggingStyles.bagCodeText}>
                  Mã: <Text style={{ color: COLORS.secondary }}>{bagCode}</Text>
                </Text>
              </View>
              <View style={ScanBaggingStyles.badgeCount}>
                <Text
                  style={{ color: "#FFF", fontWeight: "bold", fontSize: 15 }}
                >
                  {scannedItems.length}
                </Text>
              </View>
            </View>

            <FlatList
              data={scannedItems}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={ScanBaggingStyles.listContent}
              renderItem={({ item, index }) => {
                const isFirst = index === 0;
                return (
                  <View
                    style={[
                      ScanBaggingStyles.listItem,
                      isFirst && ScanBaggingStyles.firstItem,
                    ]}
                  >
                    <View style={ScanBaggingStyles.leftInfo}>
                      <View style={ScanBaggingStyles.iconCircle}>
                        <Ionicons
                          name="cube"
                          size={20}
                          color={isFirst ? "#fff" : COLORS.processScanOrange}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            ScanBaggingStyles.itemCode,
                            isFirst && ScanBaggingStyles.itemCodePrimary,
                          ]}
                        >
                          {item.code}
                        </Text>
                        <Text
                          style={[
                            ScanBaggingStyles.itemTime,
                            isFirst && ScanBaggingStyles.itemTimePrimary,
                          ]}
                        >
                          {item.time} • Đã quét
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={isFirst ? "#fff" : COLORS.secondary}
                    />
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={ScanBaggingStyles.emptyWrap}>
                  <Ionicons
                    name="briefcase-outline"
                    size={60}
                    color="#d1d8d3"
                  />
                  <Text style={ScanBaggingStyles.emptyText}>
                    Quét mã vận đơn để thêm vào túi.
                  </Text>
                </View>
              }
            />

            <View style={ScanBaggingStyles.summaryFooter}>
              <TouchableOpacity
                style={ScanBaggingStyles.finishBtn}
                onPress={finishBagging}
              >
                <Ionicons
                  name="lock-closed"
                  size={22}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={ScanBaggingStyles.finishBtnText}>
                  HOÀN TẤT TÚI ({scannedItems.length})
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                ScanBaggingStyles.startBtn,
                { marginTop: 12, backgroundColor: "#555" },
              ]}
              onPress={handleResetBag}
            >
              <Text style={ScanBaggingStyles.startBtnText}>TẠO LẠI TÚI</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal
        visible={baggingErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBaggingErrorModalVisible(false)}
      >
        <View style={ScanBaggingStyles.errorModalOverlay}>
          <View style={ScanBaggingStyles.errorModalCard}>
            <View style={ScanBaggingStyles.errorModalIconWrap}>
              <Ionicons name="warning" size={36} color="#DC2626" />
            </View>
            <Text style={ScanBaggingStyles.errorModalTitle}>LỖI!</Text>
            <Text style={ScanBaggingStyles.errorModalText}>
              {baggingErrorMessage}
            </Text>
            <TouchableOpacity
              style={ScanBaggingStyles.errorModalCloseBtn}
              onPress={() => setBaggingErrorModalVisible(false)}
            >
              <Text style={ScanBaggingStyles.errorModalCloseText}>ĐÓNG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
