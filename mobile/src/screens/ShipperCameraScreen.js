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
  Linking,
  Animated,
  Easing,
  TextInput,
  ScrollView,
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
import {
  getOcrCustomerPickups,
  getOcrCustomers,
} from "../services/pickupService";
import styles from "../styles/ShipperCameraScreenStyles";
import { useQueue } from "../context/QueueContext";
import { COLORS } from "../constants/colors";
import { checkNetworkConnection } from "../utils/networkUtils";

import ProcessedListScreen from "./ProcessedListScreen";
import { useUser } from "../context/UserContext";
import Constants from "expo-constants";

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
      const res = await getOcrCustomers(keyword);
      setCustomers(res.success ? res.data?.items || [] : []);
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
      const res = await getOcrCustomerPickups(customerId);
      setBags(res.success ? res.data?.bags || [] : []);
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
    fetchBagsData(customer.customer_id);
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

  // HÀM XỬ LÝ KHI NGƯỜI DÙNG CHẠM MÀN HÌNH (CÓ ANIMATION)
  const handleTapToFocus = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    // ... (Giữ nguyên đoạn code tính toán giới hạn vùng bấm trong scanFrame mà tôi hướng dẫn ở turn trước) ...
    const { width: screenW, height: screenH } = Dimensions.get("window");
    const frameW = screenW * 0.8;
    const frameH = screenW * 1.2;
    const minX = (screenW - frameW) / 2;
    const maxX = minX + frameW;
    const minY = (screenH - frameH) / 2 - 50;
    const maxY = minY + frameH;

    // KIỂM TRA: Ngón tay có nằm trong khung không?
    if (pageX >= minX && pageX <= maxX && pageY >= minY && pageY <= maxY) {
      // 1. DỪNG TẤT CẢ ANIMATION ĐANG CHẠY (Nếu người dùng bấm liên tiếp)
      focusAnim.stopAnimation();
      focusAnim.setValue(0); // Reset về trạng thái ban đầu

      // 2. Lưu tọa độ ngón tay để vẽ
      setFocusPoint({ x: pageX, y: pageY });

      // 3. KÍCH HOẠT CHUỖI ANIMATION MƯỢT MÀ
      Animated.sequence([
        // Pha 1: Hiện lên và Thu nhỏ nhẹ (Tạo cảm giác "bắt điểm")
        Animated.timing(focusAnim, {
          toValue: 1, // Đi đến trạng thái 1 (hiện rõ)
          duration: 200, // Chạy trong 0.2 giây
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true, // Dùng phần cứng để mượt nhất
        }),
        // Pha 2: Chờ 0.8 giây cho người dùng nhìn rõ
        Animated.delay(800),
        // Pha 3: Thu nhỏ dần và Mờ dần (Fade out)
        Animated.timing(focusAnim, {
          toValue: 0, // Về lại 0 (ẩn đi)
          duration: 400, // Chạy trong 0.4 giây
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        // Khi toàn bộ chuỗi animation xong, mới xóa tọa độ để ẩn hẳn View
        if (finished) setFocusPoint(null);
      });
    } else {
      // NẾU KHÔNG (Bấm ra ngoài vùng viền mờ): Không làm gì cả
      return;
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

  // const handleDeleteAccount = () => {
  //     const email = "nmhien3007@gmail.com";
  //     const subject = "Yêu cầu xóa tài khoản Speed Light";
  //     const body = `Xin chào Admin,\n\nTôi là user: ${user.username || '...'}.\nTôi muốn yêu cầu xóa tài khoản và dữ liệu cá nhân của mình khỏi hệ thống.\n\nLý do (nếu có): ...`;

  //     const mailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  //     Linking.openURL(mailUrl).catch(() => {
  //         Alert.alert("Lỗi", "Không thể mở ứng dụng Mail. Vui lòng gửi thủ công tới: " + email);
  //     });
  // };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing.current || !isCameraReady) return;

    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      return;
    }

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
          customer_id: ocrConfig.customer?.customer_id,
          customer_name: ocrConfig.customer?.customer_name,
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

        const newItem = addToQueue(manipResult.uri, {
          customer_id: ocrConfig.customer?.customer_id,
          customer_name: ocrConfig.customer?.customer_name,
          bag_code: ocrConfig.bagCode,
        });
        // processQueueItem(newItem);
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
        extractUrl = "https://speedlight.minhhien.click/extract"; // We can use the hardcoded one or ADMIN_ENDPOINTS.EXTRACT if imported

      const response = await fetch(extractUrl, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const textResponse = await response.text();

      if (!response.ok) {
        // console.error(`!!! Server Error ${response.status}:`, textResponse);
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
        <Ionicons name="videocam-off" size={50} color="#666" />
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
        {/* <View style={StyleSheet.absoluteFill}> */}
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
              // ----------------------------------------------------
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.09)",
                borderRadius: 25,
                paddingHorizontal: 4,
                paddingVertical: 4,
                zIndex: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ padding: 8, paddingHorizontal: 12 }}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>

              {/* Vạch ngăn cách dọc mờ ở giữa */}
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
              {/* --- THÊM 4 CÁI GÓC VUÔNG VÀO ĐÂY --- */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {/* ------------------------------------- */}
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
                <Text style={{ color: "#333", fontWeight: "bold" }}>
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
        {/* </View > */}
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
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
              <View style={styles.iconBox}>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.menuText}>Đơn lấy hàng (Pickup)</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("ShipperSelfAssignPickup");
              }}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name="git-pull-request-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.menuText}>Tự điều phối nhận</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowAccountInfo(true);
              }}
            >
              <View style={styles.iconBox}>
                <Ionicons name="person" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.menuText}>Thông tin tài khoản</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={[styles.iconBox, { backgroundColor: "#ffebee" }]}>
                <Ionicons name="log-out" size={20} color={COLORS.logOut} />
              </View>
              <Text style={[styles.menuText, { color: COLORS.logOut }]}>
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
        <View style={styles.accountModalContainer}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountHeaderTitle}>Tài khoản</Text>
            <TouchableOpacity
              onPress={() => setShowAccountInfo(false)}
              style={styles.closeBtnCircle}
            >
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.accountBody}>
            <View style={{ alignItems: "center", marginBottom: 30 }}>
              <View style={styles.avatarCircle}>
                {/* Nhớ dùng user?.username để tránh lỗi văng app khi đăng xuất */}
                <Text
                  style={{ fontSize: 30, color: "white", fontWeight: "bold" }}
                >
                  {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}>
                {user?.username}
              </Text>
              <Text style={{ color: "#666" }}>Thành viên Speed Light</Text>
            </View>

            <View style={styles.sectionBox}>
              <TouchableOpacity style={styles.rowItem}>
                <Text style={styles.rowLabel}>Tên đăng nhập</Text>
                <Text style={styles.rowValue}>{user?.username}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity style={styles.rowItem}>
                <Text style={styles.rowLabel}>Phiên bản App</Text>
                <Text style={styles.rowValue}>{appVersion}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        Modal
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
            // processQueueItem(item);
          }}
        />
      </Modal>

      {/* Modal Config */}
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
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            activeOpacity={1}
            onPress={() => setShowOcrConfig(false)}
          >
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                minHeight: 300,
              }}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  Cấu hình chung OCR
                </Text>
                <TouchableOpacity onPress={() => setShowOcrConfig(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text
                style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}
              >
                1. Khách hàng
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowOcrConfig(false);
                  setShowCustomerModal(true);
                  fetchCustomersData("");
                }}
              >
                <Text
                  style={{
                    color: ocrConfig.customer ? "#333" : "#999",
                    flex: 1,
                  }}
                >
                  {ocrConfig.customer
                    ? `[${ocrConfig.customer.customer_code}] ${ocrConfig.customer.customer_name}`
                    : "Chọn khách hàng..."}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>

              <Text
                style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}
              >
                2. Túi thư (Bag Code)
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 8,
                    padding: 12,
                    backgroundColor: "#f9f9f9",
                    marginRight: 10,
                  }}
                  placeholder="Nhập mã túi..."
                  value={ocrConfig.bagCode}
                  onChangeText={(t) =>
                    setOcrConfig((prev) => ({ ...prev, bagCode: t }))
                  }
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    padding: 12,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
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
                  <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                    + Chọn từ danh sách túi của KH
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginTop: 10,
                }}
                onPress={() => setShowOcrConfig(false)}
              >
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
                >
                  Xong
                </Text>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowCustomerModal(false);
                setShowOcrConfig(true);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                flex: 1,
                textAlign: "center",
                marginRight: 32,
              }}
            >
              Chọn Khách Hàng
            </Text>
          </View>
          <View style={{ padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "white",
                borderRadius: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "#ddd",
              }}
            >
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={{ flex: 1, padding: 12 }}
                placeholder="Tìm tên, mã khách hàng..."
                value={searchCustomer}
                onChangeText={setSearchCustomer}
              />
            </View>
          </View>
          {isLoadingCustomers ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item) => item.customer_id.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                  onPress={() => handleSelectCustomer(item)}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {item.customer_name}
                  </Text>
                  <Text style={{ color: "#666", marginTop: 4 }}>
                    Mã: {item.customer_code} | SĐT: {item.phone_number || "---"}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowBagModal(false);
                setShowOcrConfig(true);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                flex: 1,
                textAlign: "center",
                marginRight: 32,
              }}
            >
              Chọn Túi
            </Text>
          </View>
          {isLoadingBags ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 20 }}
            />
          ) : bags.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#666" }}>
                Không có túi nào đang chờ của khách hàng này
              </Text>
            </View>
          ) : (
            <FlatList
              data={bags}
              keyExtractor={(item) =>
                item.bag_id ? item.bag_id.toString() : item.bag_code
              }
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => handleSelectBag(item.bag_code)}
                >
                  <View>
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 16,
                        color: COLORS.primary,
                      }}
                    >
                      {item.bag_code}
                    </Text>
                    <Text style={{ color: "#666", marginTop: 4 }}>
                      Số bill hiện tại: {item.actual_quantity || 0}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
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
