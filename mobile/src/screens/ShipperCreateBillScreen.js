import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { ADMIN_ENDPOINTS } from "../constants/adminEndpoints";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperCreateBillScreen({ route, navigation }) {
  const { billType, requestCode } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [scannedList, setScannedList] = useState([]);
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeTab, setActiveTab] = useState(
    billType.includes("tổng") ? "Bill tổng" : "Bill lẻ",
  );

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleAddManual = () => {
    if (!manualCode.trim()) return;
    if (scannedList.find((i) => i.code === manualCode.trim())) {
      Toast.show({
        type: "info",
        text1: "Mã đã tồn tại",
        text2: "Mã bill này đã được quét trước đó",
      });
      return;
    }
    setScannedList((prev) => [
      ...prev,
      { id: Date.now().toString(), code: manualCode.trim() },
    ]);
    setManualCode("");
  };

  const removeScannedItem = (id) => {
    setScannedList((prev) => prev.filter((item) => item.id !== id));
  };

  const extractBillCode = async (uri) => {
    try {
      const formData = new FormData();
      const cleanUri =
        Platform.OS === "android" ? uri : uri.replace("file://", "");
      const filename = cleanUri.split("/").pop() || "bill.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("file", { uri: cleanUri, name: filename, type });

      const response = await fetch(ADMIN_ENDPOINTS.EXTRACT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const textResponse = await response.text();

      if (!response.ok) {
        throw new Error(`SERVER_${response.status}_${textResponse}`);
      }

      const data = JSON.parse(textResponse);
      const code =
        data.tracking_number ||
        data.ma_bill ||
        data.sender?.phone ||
        `OCR_${Date.now()}`;

      if (scannedList.find((i) => i.code === code)) {
        Toast.show({ type: "info", text1: "Mã đã tồn tại" });
      } else {
        setScannedList((prev) => [
          ...prev,
          { id: Date.now().toString(), code: code },
        ]);
        Toast.show({
          type: "success",
          text1: "Quét thành công",
          text2: `Mã: ${code}`,
        });
      }
    } catch (error) {
      console.log("OCR Error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi nhận diện mã",
        text2: "Vui lòng thử lại hoặc nhập tay",
      });
    }
  };

  const handleScan = async () => {
    if (!cameraRef.current || isProcessing || !isCameraReady) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

      const manipResult = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      );

      await extractBillCode(manipResult.uri);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi chụp ảnh" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (scannedList.length === 0) {
      Alert.alert(
        "Lưu ý",
        "Danh sách rỗng, vui lòng quét hoặc nhập mã bill trước khi lưu.",
      );
      return;
    }
    Toast.show({
      type: "success",
      text1: "Đã lưu đơn hàng",
      text2: "Chức năng đang chờ backend phát triển",
    });
    navigation.goBack();
  };

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={50} color="#64748B" />
        <Text style={styles.permissionText}>
          Cần cấp quyền Camera để quét mã
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.btnPermission}
        >
          <Text style={styles.btnPermissionText}>CẤP QUYỀN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tạo mới đơn hàng</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* TABS CHUẨN FORM */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Bill tổng" && styles.activeTab]}
          onPress={() => setActiveTab("Bill tổng")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Bill tổng" && styles.activeTabText,
            ]}
          >
            Bill tổng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Bill lẻ" && styles.activeTab]}
          onPress={() => setActiveTab("Bill lẻ")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Bill lẻ" && styles.activeTabText,
            ]}
          >
            Bill lẻ
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            ref={cameraRef}
            onCameraReady={() => setIsCameraReady(true)}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.scanTarget} />
            </View>
          </CameraView>
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text
                style={{ color: "white", marginTop: 10, fontWeight: "700" }}
              >
                Đang nhận diện...
              </Text>
            </View>
          )}
        </View>

        {/* Input Section (Card Phẳng) */}
        <View style={styles.inputCard}>
          <Text style={styles.sectionTitle}>Nhập mã barcode cần quét</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Quét mã hoặc nhập tay"
              placeholderTextColor="#94A3B8"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={manualCode ? handleAddManual : handleScan}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons
                name={manualCode ? "add" : "scan"}
                size={20}
                color="white"
              />
              <Text style={styles.scanBtnText}>
                {manualCode ? "Thêm" : "Quét mã"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scanned List (Card Phẳng) */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>DANH SÁCH ĐÃ QUÉT</Text>
          {scannedList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có mã nào được quét</Text>
            </View>
          ) : (
            <FlatList
              data={scannedList}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={styles.listItem}>
                  <View style={styles.listIndex}>
                    <Text style={styles.listIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listCode}>{item.code}</Text>
                  <TouchableOpacity
                    onPress={() => removeScannedItem(item.id)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* Bottom Actions Chuẩn Form */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Hủy thao tác</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Lưu & Xác nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentWrapper: { flex: 1, padding: 16 },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  permissionText: {
    fontSize: 16,
    color: "#475569",
    marginVertical: 15,
    fontWeight: "700",
  },
  btnPermission: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPermissionText: { color: "white", fontWeight: "900" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "white" },
  tabText: { color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 14 },
  activeTabText: { color: "white", fontWeight: "900" },

  cameraContainer: {
    height: 250,
    backgroundColor: "black",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  cameraOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanTarget: {
    width: 250,
    height: 100,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Card Phẳng Chuẩn DNA
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  inputRow: { flexDirection: "row" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontWeight: "600",
  },
  scanBtn: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
  },
  scanBtnText: { color: "white", fontWeight: "900", marginLeft: 6 },

  listCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748B", textAlign: "center", fontWeight: "600" },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  listIndex: {
    backgroundColor: "#EF4444",
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listIndexText: { color: "white", fontWeight: "900", fontSize: 11 },
  listCode: { flex: 1, fontSize: 15, fontWeight: "700", color: "#0F172A" },

  // Bottom Bar Chuẩn Form
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: { color: "#475569", fontWeight: "800", fontSize: 15 },
  primaryBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "900", fontSize: 15 },
});
