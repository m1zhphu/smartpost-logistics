import React, { useState, useRef, useEffect } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList, Dimensions, Platform } from 'react-native';
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { ADMIN_ENDPOINTS } from "../constants/adminEndpoints";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import styles from "../styles/ShipperCreateBillScreenStyles";

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
      CustomAlert.alert(
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


