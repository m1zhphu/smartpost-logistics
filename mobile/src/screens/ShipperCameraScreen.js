import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { CommonActions } from "@react-navigation/native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { CUSTOMER_ENDPOINTS } from "../constants/customerEndpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { customerService } from "../services/customer";
import { useQueue } from "../context/QueueContext";
import { COLORS } from "../constants/colors";
import { checkNetworkConnection } from "../utils/networkUtils";

import ProcessedListScreen from "./ProcessedListScreen";
import { useUser } from "../context/UserContext";
import Constants from "expo-constants";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperCameraScreen({ route, navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const { user, isWarehouseStaff } = useUser();

  const { queue, addToQueue, updateQueueItem, removeQueueItem, clearQueue } =
    useQueue();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  const isProcessing = useRef(false);
  const isUploadingRef = useRef(false);

  const appVersion =
    Constants.expoConfig?.version || Constants.manifest?.version || "1.0.2";
  const [focusPoint, setFocusPoint] = useState(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  // --- OCR CONFIG STATES ---
  const [ocrConfig, setOcrConfig] = useState({ customer: null, bagCode: "" });
  const [showOcrConfig, setShowOcrConfig] = useState(false);

  // Customer Selection
  const [customers, setCustomers] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Bag Selection
  const [bags, setBags] = useState([]);
  const [showBagModal, setShowBagModal] = useState(false);
  const [isLoadingBags, setIsLoadingBags] = useState(false);

  // Scanning
  const [isScanningBag, setIsScanningBag] = useState(false);

  const fetchCustomersData = async (keyword = "") => {
    setIsLoadingCustomers(true);
    try {
      const res = await customerService.getCustomers(0, 100, keyword);
      setCustomers(res.data.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải danh sách khách hàng" });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (!showCustomerModal) return;
    const delayDebounceFn = setTimeout(() => {
      fetchCustomersData(searchCustomer);
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [searchCustomer, showCustomerModal]);

  const fetchBagsData = async (customerId) => {
    if (!customerId) return;
    setIsLoadingBags(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(
        `https://api.speedlight.minhhien.click/api/warehouse/pickup-bags?status=CREATED&customer_id=${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setBags(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải danh sách túi" });
    } finally {
      setIsLoadingBags(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setOcrConfig((prev) => ({ ...prev, customer: customer, bagCode: "" }));
    setShowCustomerModal(false);
    setShowOcrConfig(true);
    fetchBagsData(customer.id);
  };

  const handleSelectBag = (bagCode) => {
    setOcrConfig((prev) => ({ ...prev, bagCode: bagCode }));
    setShowBagModal(false);
    setShowOcrConfig(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (isScanningBag) {
      setOcrConfig((prev) => ({ ...prev, bagCode: data }));
      setIsScanningBag(false);
      setShowOcrConfig(true);
    }
  };

  useEffect(() => {
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    }
    lockOrientation();
  }, []);

  const handleTapToFocus = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    const { width: screenW, height: screenH } = Dimensions.get("window");
    const frameW = screenW * 0.8;
    const frameH = screenW * 1.2;
    const minX = (screenW - frameW) / 2;
    const maxX = minX + frameW;
    const minY = (screenH - frameH) / 2 - 50;
    const maxY = minY + frameH;

    if (pageX >= minX && pageX <= maxX && pageY >= minY && pageY <= maxY) {
      focusAnim.stopAnimation();
      focusAnim.setValue(0);
      setFocusPoint({ x: pageX, y: pageY });

      Animated.sequence([
        Animated.timing(focusAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(focusAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setFocusPoint(null);
      });
    }
  };

  const handleLogout = () => {
    setShowMenu(false);
    Alert.alert("Đăng xuất", "Bạn có muốn thoát không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: () => {
          clearQueue();
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
          );
        },
        style: "destructive",
      },
    ]);
  };

  useEffect(() => {
    const processNextItem = async () => {
      if (isUploadingRef.current) return;
      const nextItem = [...queue]
        .reverse()
        .find((item) => item.status === "loading");
      if (nextItem) {
        isUploadingRef.current = true;
        await processQueueItem(nextItem);
        isUploadingRef.current = false;
      }
    };
    processNextItem();
  }, [queue]);

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing.current || !isCameraReady) return;

    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    try {
      isProcessing.current = true;
      setIsCapturing(true);

      if (Platform.OS === "ios") {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          exif: true,
        });
        let currentUri = photo.uri;
        let currentW = photo.width;
        let currentH = photo.height;

        if (currentW < currentH) {
          const rotated = await manipulateAsync(currentUri, [{ rotate: 270 }], {
            format: SaveFormat.JPEG,
          });
          currentUri = rotated.uri;
          currentW = rotated.width;
          currentH = rotated.height;
        }

        const { width: screenWidth } = Dimensions.get("window");
        const scale = currentH / screenWidth;

        const cropRealW = screenWidth * 1.2 * scale;
        const cropRealH = screenWidth * 0.8 * scale;

        let originX = (currentW - cropRealW) / 2;
        let originY = (currentH - cropRealH) / 2;
        const shiftReal = 50 * scale;
        originX = originX - shiftReal;

        const safeX = Math.max(0, Math.floor(originX));
        const safeY = Math.max(0, Math.floor(originY));
        const safeW = Math.min(Math.floor(cropRealW), currentW - safeX);
        const safeH = Math.min(Math.floor(cropRealH), currentH - safeY);

        const manipResult = await manipulateAsync(
          currentUri,
          [
            {
              crop: {
                originX: safeX,
                originY: safeY,
                width: safeW,
                height: safeH,
              },
            },
            { resize: { width: 1800 } },
          ],
          { compress: 0.7, format: SaveFormat.JPEG },
        );

        addToQueue(manipResult.uri, {
          customer_id: ocrConfig.customer?.id,
          customer_name: ocrConfig.customer?.ten_khach_hang,
          bag_code: ocrConfig.bagCode,
        });
      } else {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        const fixedPhoto = await manipulateAsync(photo.uri, [{ rotate: 0 }], {
          format: SaveFormat.JPEG,
        });
        let realW = fixedPhoto.width;
        let realH = fixedPhoto.height;
        let currentUri = fixedPhoto.uri;

        if (realW < realH) {
          const rotated = await manipulateAsync(currentUri, [{ rotate: 270 }], {
            format: SaveFormat.JPEG,
          });
          currentUri = rotated.uri;
          realW = rotated.width;
          realH = rotated.height;
        }

        const { width: screenW, height: screenH } = Dimensions.get("window");
        const scale = realW / screenH;
        const cropTargetW = screenW * 1.2 * scale;
        const cropTargetH = screenW * 0.8 * scale;
        const visibleImgW = screenH * scale;
        const visibleImgH = screenW * scale;
        const visibleOriginY = (realH - visibleImgH) / 2;
        let cropY_in_Visible = (visibleImgH - cropTargetH) / 2;
        let originX = (realW - cropTargetW) / 2;
        let originY = visibleOriginY + cropY_in_Visible;
        const SHIFT_PIXEL_UI = 50;
        originX = originX - SHIFT_PIXEL_UI * scale;

        let finalX = Math.floor(Math.max(0, originX));
        let finalY = Math.floor(Math.max(0, originY));
        let finalW = Math.floor(cropTargetW);
        let finalH = Math.floor(cropTargetH);

        if (finalX + finalW > realW) finalW = realW - finalX;
        if (finalY + finalH > realH) finalH = realH - finalY;
        finalW = Math.max(1, finalW - 2);
        finalH = Math.max(1, finalH - 2);

        const actions = [
          {
            crop: {
              originX: finalX,
              originY: finalY,
              width: finalW,
              height: finalH,
            },
          },
        ];
        actions.push({ resize: { width: 1800 } });

        const manipResult = await manipulateAsync(currentUri, actions, {
          compress: 0.7,
          format: SaveFormat.JPEG,
        });

        addToQueue(manipResult.uri, {
          customer_id: ocrConfig.customer?.id,
          customer_name: ocrConfig.customer?.ten_khach_hang,
          bag_code: ocrConfig.bagCode,
        });
      }
      Toast.show({
        type: "success",
        text1: "Đã thêm vào hàng chờ xử lý",
        visibilityTime: 1400,
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi chụp ảnh" });
    } finally {
      isProcessing.current = false;
      setIsCapturing(false);
    }
  };

  const processQueueItem = async (item) => {
    try {
      const formData = new FormData();
      const cleanUri =
        Platform.OS === "android" ? item.uri : item.uri.replace("file://", "");
      const filename = cleanUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("file", { uri: cleanUri, name: filename, type });

      let extractUrl = "https://speedlight.minhhien.click/extract";
      const uType = (await AsyncStorage.getItem("user_type")) || "employee";
      if (uType === "customer") extractUrl = CUSTOMER_ENDPOINTS.EXTRACT;
      else if (uType === "admin")
        extractUrl = "https://speedlight.minhhien.click/extract";

      const response = await fetch(extractUrl, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const textResponse = await response.text();

      if (!response.ok) {
        throw new Error(`SERVER_${response.status}_${textResponse}`);
      }

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error("JSON_PARSE_ERROR");
      }

      let success = data.sender || data.receiver || data.tracking_number;

      if (success) {
        updateQueueItem(item.id, { status: "success", data: data });
      } else {
        updateQueueItem(item.id, { status: "error", errorType: "FORMAT" });
      }
    } catch (error) {
      updateQueueItem(item.id, { status: "error", errorType: "SERVER" });
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="videocam-off" size={50} color="#64748B" />
        <Text style={styles.permissionText}>Cần cấp quyền Camera</Text>
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
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={handleTapToFocus}
      >
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
          autoFocus="on"
          flash="auto"
          barcodeScannerSettings={
            isScanningBag
              ? { barcodeTypes: ["qr", "ean13", "code128", "code39"] }
              : undefined
          }
          onBarcodeScanned={isScanningBag ? handleBarcodeScanned : undefined}
        />

        {focusPoint && (
          <Animated.View
            style={{
              position: "absolute",
              top: focusPoint.y - 25,
              left: focusPoint.x - 25,
              width: 50,
              height: 50,
              borderWidth: 2,
              borderColor: "#FFD700",
              backgroundColor: "transparent",
              zIndex: 10,
              opacity: focusAnim,
              transform: [
                {
                  scale: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.3, 1],
                  }),
                },
              ],
            }}
          />
        )}

        <SafeAreaView style={styles.cameraOverlay} pointerEvents="box-none">
          <View style={styles.headerRow}>
            <View style={styles.headerToolsGroup}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ padding: 8, paddingHorizontal: 12 }}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>

              {isWarehouseStaff() && (
                <>
                  <View
                    style={{
                      width: 1,
                      height: 22,
                      backgroundColor: "rgba(255, 255, 255, 0.4)",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => navigation.replace("WarehouseHome")}
                    style={{ padding: 8, paddingHorizontal: 12 }}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={24}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setShowOcrConfig(true)}
                style={[
                  styles.listButton,
                  {
                    zIndex: 20,
                    marginRight: 8,
                    backgroundColor:
                      ocrConfig.customer || ocrConfig.bagCode
                        ? COLORS.primary
                        : "rgba(255, 255, 255, 0.2)",
                  },
                ]}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 12 }}
                >
                  Cấu hình
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowList(true)}
                style={[styles.listButton, { zIndex: 20 }]}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Hàng chờ
                </Text>
                {queue.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{queue.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.scanFrameContainer} pointerEvents="none">
            <View style={styles.maskOverlay} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={[styles.maskBase, styles.maskTop]} />
              <View style={[styles.maskBase, styles.maskBottom]} />
              <View style={[styles.maskBase, styles.maskLeft]} />
              <View style={[styles.maskBase, styles.maskRight]} />
            </View>
            <Text style={styles.scanHintText}>
              {isScanningBag
                ? "Căn mã vạch túi thư vào khung ảnh"
                : "Căn mã vận đơn vào khung ảnh"}
            </Text>
          </View>

          <View style={styles.captureFloatingContainer}>
            {isScanningBag ? (
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 25,
                  elevation: 5,
                }}
                onPress={() => {
                  setIsScanningBag(false);
                  setShowOcrConfig(true);
                }}
              >
                <Text style={{ color: "#0F172A", fontWeight: "bold" }}>
                  Hủy Quét
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.shutterBtnOuter,
                  isCapturing && { opacity: 0.5 },
                ]}
                onPress={takePicture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <View style={styles.shutterBtnInner} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayLight}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.dropdownMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Tiện ích</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("ShipperPickupList");
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.menuText}>Đơn lấy hàng (Pickup)</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("ShipperSelfAssignPickup");
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons
                  name="git-pull-request-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.menuText}>Tự điều phối nhận</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowAccountInfo(true);
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.menuText}>Thông tin tài khoản</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View
                style={[styles.menuIconBox, { backgroundColor: "#FEE2E2" }]}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text
                style={[
                  styles.menuText,
                  { color: "#EF4444", fontWeight: "700" },
                ]}
              >
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAccountInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountInfo(false)}
      >
        <View style={styles.dnaContainer}>
          <View style={styles.dnaHeader}>
            <Text style={styles.dnaHeaderTitle}>Tài khoản</Text>
            <TouchableOpacity onPress={() => setShowAccountInfo(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View style={styles.dnaContent}>
            <View style={{ alignItems: "center", marginBottom: 30 }}>
              <View style={styles.avatarCircle}>
                <Text
                  style={{ fontSize: 30, color: "white", fontWeight: "bold" }}
                >
                  {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  marginTop: 10,
                  color: "#0F172A",
                }}
              >
                {user?.username}
              </Text>
              <Text style={{ color: "#64748B", fontWeight: "600" }}>
                Thành viên Speed Light
              </Text>
            </View>
            <View style={styles.dnaCard}>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Tên đăng nhập</Text>
                <Text style={styles.rowValue}>{user?.username}</Text>
              </View>
              <View style={styles.menuDivider} />
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>Phiên bản App</Text>
                <Text style={styles.rowValue}>{appVersion}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowList(false)}
      >
        <ProcessedListScreen
          queue={queue}
          navigation={navigation}
          onClose={() => setShowList(false)}
          onClear={clearQueue}
          onDelete={(id) => removeQueueItem(id)}
          onRetry={(item) => {
            updateQueueItem(item.id, { status: "loading" });
          }}
        />
      </Modal>

      <Modal
        visible={showOcrConfig}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOcrConfig(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlayDark}
            activeOpacity={1}
            onPress={() => setShowOcrConfig(false)}
          >
            <View
              style={styles.bottomSheet}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Cấu hình chung OCR</Text>
                <TouchableOpacity onPress={() => setShowOcrConfig(false)}>
                  <Ionicons name="close-circle" size={28} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>1. Khách hàng</Text>
              <TouchableOpacity
                style={styles.selectionBox}
                onPress={() => {
                  setShowOcrConfig(false);
                  setShowCustomerModal(true);
                  fetchCustomersData("");
                }}
              >
                <Text
                  style={[
                    styles.selectionText,
                    !ocrConfig.customer && { color: "#94A3B8" },
                  ]}
                >
                  {ocrConfig.customer
                    ? `[${ocrConfig.customer.ma_khach_hang}] ${ocrConfig.customer.ten_khach_hang}`
                    : "Chọn khách hàng..."}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94A3B8" />
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>2. Túi thư (Bag Code)</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Nhập mã túi..."
                  placeholderTextColor="#94A3B8"
                  value={ocrConfig.bagCode}
                  onChangeText={(t) =>
                    setOcrConfig((prev) => ({ ...prev, bagCode: t }))
                  }
                />
                <TouchableOpacity
                  style={styles.scanBarcodeBtn}
                  onPress={() => {
                    setShowOcrConfig(false);
                    setIsScanningBag(true);
                  }}
                >
                  <Ionicons name="barcode-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {ocrConfig.customer && (
                <TouchableOpacity
                  style={{ alignSelf: "flex-start", marginBottom: 20 }}
                  onPress={() => {
                    setShowOcrConfig(false);
                    setShowBagModal(true);
                  }}
                >
                  <Text style={{ color: PRIMARY, fontWeight: "700" }}>
                    + Chọn từ danh sách túi của KH
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.primarySheetBtn}
                onPress={() => setShowOcrConfig(false)}
              >
                <Text style={styles.primarySheetBtnText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Chọn Khách Hàng */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCustomerModal(false);
          setShowOcrConfig(true);
        }}
      >
        <View style={styles.dnaContainer}>
          <View style={styles.dnaHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCustomerModal(false);
                setShowOcrConfig(true);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.dnaHeaderTitle}>Chọn Khách Hàng</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={{ padding: 16 }}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm tên, mã khách hàng..."
                placeholderTextColor="#94A3B8"
                value={searchCustomer}
                onChangeText={setSearchCustomer}
              />
            </View>
          </View>
          {isLoadingCustomers ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dnaCard}
                  onPress={() => handleSelectCustomer(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardTitleBlack}>
                    {item.ten_khach_hang}
                  </Text>
                  <Text style={styles.cardSub}>
                    Mã: {item.ma_khach_hang} | SĐT: {item.sdt}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Modal Chọn Túi */}
      <Modal
        visible={showBagModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowBagModal(false);
          setShowOcrConfig(true);
        }}
      >
        <View style={styles.dnaContainer}>
          <View style={styles.dnaHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowBagModal(false);
                setShowOcrConfig(true);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.dnaHeaderTitle}>Chọn Túi</Text>
            <View style={{ width: 32 }} />
          </View>
          {isLoadingBags ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 20 }}
            />
          ) : bags.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons
                name="file-tray-outline"
                size={40}
                color="#94A3B8"
                style={{ marginBottom: 10 }}
              />
              <Text style={{ color: "#64748B", fontWeight: "600" }}>
                Không có túi nào đang chờ của khách hàng này
              </Text>
            </View>
          ) : (
            <FlatList
              data={bags}
              keyExtractor={(item) =>
                item.bag_id ? item.bag_id.toString() : item.bag_code
              }
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dnaCard,
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleSelectBag(item.bag_code)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={[styles.cardTitleBlack, { color: PRIMARY }]}>
                      {item.bag_code}
                    </Text>
                    <Text style={styles.cardSub}>
                      Số bill hiện tại: {item.actual_quantity || 0}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          elevation: 9999,
          pointerEvents: "box-none",
        }}
      >
        <Toast position="top" topOffset={Platform.OS === "android" ? 40 : 60} />
      </View>
    </View>
  );
}

// STYLES CHUẨN DNA & CAMERA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
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

  cameraOverlay: { flex: 1, justifyContent: "space-between" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 10,
    alignItems: "center",
  },
  headerToolsGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    zIndex: 20,
  },
  listButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "900" },

  scanFrameContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  maskOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  scanFrame: {
    width: "80%",
    aspectRatio: 1 / 1.2,
    backgroundColor: "transparent",
    position: "relative",
  },
  scanHintText: {
    color: "white",
    marginTop: 30,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },

  // Corners for scan frame
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#10B981",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },

  // Masks for scan frame clearing
  maskBase: { position: "absolute", backgroundColor: "rgba(0,0,0,0.45)" },
  maskTop: { top: -1000, bottom: "100%", left: -1000, right: -1000 },
  maskBottom: { top: "100%", bottom: -1000, left: -1000, right: -1000 },
  maskLeft: { top: 0, bottom: 0, left: -1000, right: "100%" },
  maskRight: { top: 0, bottom: 0, left: "100%", right: -1000 },

  captureFloatingContainer: { alignItems: "center", marginBottom: 40 },
  shutterBtnOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF",
  },

  // Menu Dropdown
  modalOverlayLight: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "flex-start",
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 70,
    right: 20,
    width: 220,
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#334155" },
  menuDivider: { height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 16 },

  // Bottom Sheet Chuẩn DNA
  modalOverlayDark: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  sectionLabel: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "700",
  },

  selectionBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  selectionText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },
  sheetInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  scanBarcodeBtn: {
    backgroundColor: PRIMARY,
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primarySheetBtn: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primarySheetBtnText: { color: "#FFF", fontSize: 16, fontWeight: "900" },

  // DNA Full Screen (Cho modal chọn list)
  dnaContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  dnaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dnaHeaderTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  dnaContent: { flex: 1, padding: 16 },
  dnaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleBlack: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardSub: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },

  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#E2E8F0",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  rowLabel: { fontSize: 14, color: "#64748B", fontWeight: "700" },
  rowValue: { fontSize: 14, color: "#0F172A", fontWeight: "800" },
});
