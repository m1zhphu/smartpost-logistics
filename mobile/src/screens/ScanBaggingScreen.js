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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import UniversalScanner from "../components/UniversalScanner";
import ScanBaggingStyles from "../styles/ScanBaggingStyles";
import { bagService } from "../services/bagService";
import { useBaggingSession } from "../hooks/useBaggingSession";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";

export default function ScanBaggingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { sessionState, initBag, addScannedBill, resetSession } =
    useBaggingSession();
  const [bagInitModalVisible, setBagInitModalVisible] = useState(false);
  const [pendingBagCode, setPendingBagCode] = useState("");
  const [estimatedCountInput, setEstimatedCountInput] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRouteAllowed(user, "ScanBagging")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  }, [user]);

  const handleScannerScan = (code) => {
    const scannedValue = String(code || "").trim();
    if (!scannedValue) return;

    if (!sessionState.bagCode) {
      setPendingBagCode(scannedValue);
      setEstimatedCountInput("");
      setBagInitModalVisible(true);
      return;
    }

    if (sessionState.scannedBills.includes(scannedValue)) {
      return;
    }

    addScannedBill(scannedValue);
  };

  const handleConfirmBagInit = async () => {
    const estimatedCount = Number(estimatedCountInput);
    if (!pendingBagCode) {
      return;
    }

    if (Number.isNaN(estimatedCount) || estimatedCount < 1) {
      Alert.alert(
        "Thiếu thông tin",
        "Số lượng bill ước tính phải là số nguyên lớn hơn 0.",
      );
      return;
    }

    setLoading(true);
    try {
      await bagService.createBag(user.token, {
        bag_code: pendingBagCode,
        estimated_count: estimatedCount,
      });
      initBag({ bagCode: pendingBagCode, estimatedCount });
      Toast.show({
        type: "success",
        text1: "Tạo túi thành công",
        text2: `Mã túi: ${pendingBagCode}`,
      });
      setBagInitModalVisible(false);
      setPendingBagCode("");
    } catch (error) {
      Alert.alert("Lỗi tạo túi", error.message || "Không thể tạo túi mới.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (!manualCode.trim()) return;
    if (!sessionState.bagCode) {
      Alert.alert("Tạo túi trước", "Vui lòng quét mã túi trước khi thêm bill.");
      return;
    }

    const code = manualCode.trim();
    if (sessionState.scannedBills.includes(code)) {
      setManualCode("");
      return;
    }

    addScannedBill(code);
    setManualCode("");
  };

  const handleFinishBag = () => {
    if (!sessionState.bagCode) {
      Alert.alert("Chưa có túi", "Vui lòng quét mã túi trước khi chốt.");
      return;
    }

    if (sessionState.scannedBills.length === 0) {
      Alert.alert(
        "Chưa có bill",
        "Vui lòng quét ít nhất một bill trước khi chốt túi.",
      );
      return;
    }

    Alert.alert(
      "Chốt Túi & Mang về kho",
      `Bạn có chắc chắn muốn chốt túi ${sessionState.bagCode} với ${sessionState.scannedBills.length} bill?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            setLoading(true);
            try {
              await bagService.addBillsToBag(
                user.token,
                sessionState.bagCode,
                sessionState.scannedBills,
              );
              Toast.show({
                type: "success",
                text1: "Chốt túi thành công",
                text2: `Đã thêm ${sessionState.scannedBills.length} bill vào túi.`,
              });
              resetSession();
            } catch (error) {
              Alert.alert(
                "Lỗi chốt túi",
                error.message || "Không thể chốt túi. Vui lòng thử lại.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const { bagCode, estimatedCount, scannedBills } = sessionState;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={ScanBaggingStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={[ScanBaggingStyles.cameraArea, { paddingTop: insets.top + 12 }]}> 
        <UniversalScanner
          title={bagCode ? `Túi: ${bagCode}` : "Quét mã túi để bắt đầu"}
          instruction={
            bagCode
              ? "Quét mã bill để thêm vào túi"
              : "Quét mã túi vỏ túi để khởi tạo phiên bagging"
          }
          onScan={handleScannerScan}
        />

        <View style={[ScanBaggingStyles.camHeader, { top: 8 }]}> 
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
          <View style={[ScanBaggingStyles.manualInputContainer, { bottom: 16 }]}> 
            <View style={ScanBaggingStyles.inputBox}>
              <Ionicons
                name="search"
                size={20}
                color="#9fb1a5"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={ScanBaggingStyles.input}
                placeholder="Nhập mã bill thủ công..."
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

      <View style={[ScanBaggingStyles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}> 
        {bagCode ? (
          <>
            <View style={ScanBaggingStyles.sheetHeader}>
              <View>
                <Text style={ScanBaggingStyles.sheetTitle}>Mã túi</Text>
                <Text style={ScanBaggingStyles.bagCodeText}>{bagCode}</Text>
              </View>
              <View style={ScanBaggingStyles.badgeCount}>
                <Text
                  style={{ color: "#FFF", fontWeight: "bold", fontSize: 15 }}
                >
                  {scannedBills.length}
                </Text>
              </View>
            </View>

            <View style={ScanBaggingStyles.progressCard}>
              <Text style={ScanBaggingStyles.progressLabel}>
                Đã quét: {scannedBills.length} / Ước tính: {estimatedCount}
              </Text>
            </View>

            <FlatList
              data={scannedBills}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[ScanBaggingStyles.listContent, { paddingBottom: insets.bottom + 120 }]}
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
                          {item}
                        </Text>
                        <Text
                          style={[
                            ScanBaggingStyles.itemTime,
                            isFirst && ScanBaggingStyles.itemTimePrimary,
                          ]}
                        >
                          Đã quét
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={ScanBaggingStyles.emptyWrap}>
                  <Text style={ScanBaggingStyles.emptyText}>
                    Chưa có bill nào được quét.
                  </Text>
                </View>
              }
            />

            <View style={ScanBaggingStyles.summaryFooter}>
              <TouchableOpacity
                style={ScanBaggingStyles.finishBtn}
                onPress={handleFinishBag}
                disabled={loading}
              >
                <Text style={ScanBaggingStyles.finishBtnText}>
                  CHỐT TÚI & MANG VỀ KHO
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={ScanBaggingStyles.configArea}>
            <View style={ScanBaggingStyles.cardHeaderRow}>
              <View style={ScanBaggingStyles.iconCircleWarning}>
                <Ionicons
                  name="archive-outline"
                  size={20}
                  color={COLORS.processScanOrange}
                />
              </View>
              <Text style={ScanBaggingStyles.configTitle}>KHỞI TẠO TÚI</Text>
            </View>
            <Text style={ScanBaggingStyles.label}>
              Quét mã vỏ túi để khởi tạo phiên đóng túi, sau đó quét bill vào
              túi.
            </Text>
            <TouchableOpacity
              style={ScanBaggingStyles.startBtn}
              onPress={() => setBagInitModalVisible(true)}
            >
              <Ionicons
                name="barcode-outline"
                size={24}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={ScanBaggingStyles.startBtnText}>
                NHẬP MÃ TÚI THỦ CÔNG
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={bagInitModalVisible} transparent animationType="slide">
        <View style={ScanBaggingStyles.modalOverlay}>
          <View style={ScanBaggingStyles.modalContent}>
            <View style={ScanBaggingStyles.modalHeader}>
              <Text style={ScanBaggingStyles.modalTitle}>Tạo túi mới</Text>
              <TouchableOpacity onPress={() => setBagInitModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={ScanBaggingStyles.label}>
              Quét trực tiếp mã túi hoặc nhập mã thủ công ở đây.
            </Text>
            <View style={ScanBaggingStyles.inputBox}>
              <TextInput
                style={ScanBaggingStyles.input}
                placeholder="Mã túi (BAG_XXX)"
                placeholderTextColor="#9fb1a5"
                value={pendingBagCode}
                onChangeText={setPendingBagCode}
              />
            </View>
            <Text style={ScanBaggingStyles.label}>
              Nhập số lượng bill ước tính lấy từ khách.
            </Text>
            <View style={ScanBaggingStyles.inputBox}>
              <TextInput
                style={ScanBaggingStyles.input}
                placeholder="Ước tính số bill"
                placeholderTextColor="#9fb1a5"
                keyboardType="number-pad"
                value={estimatedCountInput}
                onChangeText={setEstimatedCountInput}
              />
            </View>
            <TouchableOpacity
              style={[ScanBaggingStyles.startBtn, { marginTop: 16 }]}
              onPress={handleConfirmBagInit}
              disabled={loading}
            >
              <Text style={ScanBaggingStyles.startBtnText}>
                {loading ? "Đang xử lý..." : "KHỞI TẠO TÚI"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
