import React, { useState, useRef, useMemo } from "react";
import localProvincesData from "../utils/vietnam_provinces.json";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "../styles/CreateOrderScreenStyles";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { submitShipment } from "../services/shipmentService";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import { useQueue } from "../context/QueueContext";
import { useUser } from "../context/UserContext";
import AddressPickerModal from "../components/AddressPickerModal";
import { PROVINCES_34, resolveToNewProvince, getOldProvinceNames } from "../utils/provinces";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CreateOrderScreen({ route, navigation }) {
  const {
    senderData,
    receiverData,
    username,
    trackingNumber,
    queueId,
    bankBranch,
    unitCode,
    customer_id,
    customer_name,
    bag_code,
  } = route.params || {};
  const { user } = useUser();
  const isShipper = user?.role_id === 4 || user?.is_shipper;

  const normalizedBagCode = (() => {
    const value = String(bag_code || '').trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return null;
    return value === String(trackingNumber || '').trim() ? null : value;
  })();

  const [rName, setRName] = useState(receiverData?.name || "");
  const [rPhone, setRPhone] = useState(receiverData?.phone || "");
  const [rAddress, setRAddress] = useState(receiverData?.address || "");

  const [sName, setSName] = useState(senderData?.name || "");
  const [sPhone, setSPhone] = useState(senderData?.phone || "");
  const [sAddress, setSAddress] = useState(senderData?.address || "");
  const [sProvince, setSProvince] = useState(senderData?.province_name || "");
  const [sWard, setSWard] = useState(senderData?.ward_name || "");
  const [showSProvincePicker, setShowSProvincePicker] = useState(false);
  const [showSWardPicker, setShowSWardPicker] = useState(false);

  const [rProvince, setRProvince] = useState(receiverData?.province_name || "");
  const [rWard, setRWard] = useState(receiverData?.ward_name || "");
  const [showRProvincePicker, setShowRProvincePicker] = useState(false);
  const [showRWardPicker, setShowRWardPicker] = useState(false);

  const handleSProvinceSelect = (val) => {
    setSProvince(val);
    setSWard("");
  };

  const handleRProvinceSelect = (val) => {
    setRProvince(val);
    setRWard("");
  };

  const cleanProvinceName = (name) => {
    if (!name) return "";
    const resolved = resolveToNewProvince(name);
    return resolved
      .toLowerCase()
      .replace(/^(thành phố|tỉnh|tp\.|tp)\s*/i, "")
      .replace(/\s+/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const availableSenderWards = useMemo(() => {
    if (!sProvince) return [];
    const cleanS = cleanProvinceName(sProvince);
    const found = localProvincesData.find(p => cleanProvinceName(p.FullName) === cleanS);
    return found ? found.Wards.map(w => w.FullName) : [];
  }, [sProvince]);

  const availableReceiverWards = useMemo(() => {
    if (!rProvince) return [];
    const cleanR = cleanProvinceName(rProvince);
    const found = localProvincesData.find(p => cleanProvinceName(p.FullName) === cleanR);
    return found ? found.Wards.map(w => w.FullName) : [];
  }, [rProvince]);

  const [loading, setLoading] = useState(false);
  // Ẩn thông tin đơn vị và phí — web không sử dụng
  // const [bank_branch, setBank_Branch] = useState(bankBranch || "");
  // const [unit_code, setUnit_Code] = useState(unitCode || "");

  const [trackingCode, setTrackingCode] = useState(trackingNumber || "");
  const [actualWeight, setActualWeight] = useState("");
  const [codAmount, setCodAmount] = useState("0");
  // Phí vận chuyển sẽ được tính ở web (bước sau)
  // const [shippingFee, setShippingFee] = useState("");
  const [serviceType, setServiceType] = useState("STANDARD");
  const [productName, setProductName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const scrollViewRef = useRef(null);
  const [senderCardY, setSenderCardY] = useState(0);
  const [receiverCardY, setReceiverCardY] = useState(0);

  const { removeQueueItem } = useQueue();

  const handleConfirm = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    if (!trackingCode || trackingCode.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Mã vận đơn không được để trống",
      });
      return;
    }

    if (!rName || rName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập Tên người nhận",
      });
      return;
    }

    if (!rPhone || rPhone.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập SĐT người nhận",
      });
      return;
    }

    if (!rAddress || rAddress.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập Địa chỉ người nhận",
      });
      return;
    }

    if (!sName || sName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập Tên người gửi",
      });
      return;
    }

    if (!sPhone || sPhone.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập SĐT người gửi",
      });
      return;
    }

    if (!sAddress || sAddress.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập Địa chỉ người gửi",
      });
      return;
    }

    if (!productName || productName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập Tên hàng hóa",
      });
      return;
    }

    const weightParsed = actualWeight ? parseFloat(actualWeight.toString().replace(",", ".")) : 0;
    if (isShipper) {
      if (!actualWeight || isNaN(weightParsed) || weightParsed <= 0) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Vui lòng nhập Trọng lượng (kg) > 0",
        });
        return;
      }
    }

    const payload = {
      waybill_code: trackingCode.trim(),
      sender_name: sName?.trim(),
      sender_phone: sPhone?.trim(),
      sender_address: sAddress?.trim(),
      receiver_name: rName.trim(),
      receiver_phone: rPhone.trim(),
      receiver_address: rAddress.trim(),
      sender_province_name: sProvince.trim(),
      sender_district_name: "",
      sender_ward_name: sWard.trim(),
      receiver_province_name: rProvince.trim(),
      receiver_district_name: "",
      receiver_ward_name: rWard.trim(),
      actual_weight: weightParsed,
      cod_amount: parseFloat(codAmount) || 0,
      shipping_fee: 0,
      service_type: serviceType,
      product_name: productName.trim(),
      length: length ? parseFloat(length) : null,
      width: width ? parseFloat(width) : null,
      height: height ? parseFloat(height) : null,
      payment_method: "SENDER_PAY",
      // bank_branch và unit_code ẩn đi — web không xử lý
      // bank_branch: bank_branch.trim(),
      // unit_code: unit_code.trim(),
      customer_id: customer_id || null,
      bag_code: normalizedBagCode,
    };

    if (!isShipper) {
      CustomAlert.alert(
        "Tính năng đang phát triển",
        "Tính năng tạo đơn từ OCR dành cho Kho đang chờ cập nhật endpoint của Kho.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await submitShipment(payload);

      if (result.success) {
        if (queueId) {
          removeQueueItem(queueId);
        }
        navigation.navigate("Success", {
          trackingNumber: result.data?.waybill_code || payload.waybill_code,
        });
      } else {
        if (result.isDuplicate) {
          Toast.show({
            type: "error",
            text1: "Trùng mã vận đơn!",
            text2: `${payload.waybill_code} đã tồn tại trên hệ thống`,
            visibilityTime: 4000,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Gửi thất bại",
            text2: result.message || "Lỗi không xác định. Vui lòng thử lại",
          });
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tạo đơn",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFocusSenderAddress = () => {
    setTimeout(() => {
      if (scrollViewRef.current)
        scrollViewRef.current.scrollTo({ y: senderCardY - 20, animated: true });
    }, 250);
  };

  const handleFocusSenderName = () => {
    setTimeout(() => {
      if (scrollViewRef.current)
        scrollViewRef.current.scrollTo({ y: senderCardY - 20, animated: true });
    }, 250);
  };

  const handleFocusReceiverName = () => {
    setTimeout(() => {
      if (scrollViewRef.current)
        scrollViewRef.current.scrollTo({
          y: receiverCardY - 20,
          animated: true,
        });
    }, 250);
  };

  const handleFocusReceiverAddress = () => {
    setTimeout(() => {
      if (scrollViewRef.current)
        scrollViewRef.current.scrollTo({
          y: receiverCardY - 20,
          animated: true,
        });
    }, 250);
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={100}
        showsVerticalScrollIndicator={false}
        ref={scrollViewRef}
      >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="qr-code-outline" size={20} color="#0F766E" />
              <Text style={styles.sectionTitle}>MÃ VẬN ĐƠN</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  { fontWeight: "900", fontSize: 16, color: PRIMARY },
                ]}
                value={trackingCode}
                onChangeText={setTrackingCode}
                placeholder="Nhập mã đơn hàng"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.connectorContainer}>
            <View style={styles.dottedLine} />
            <Ionicons
              name="chevron-down-circle"
              size={20}
              color="#94A3B8"
              style={styles.connectorIcon}
            />
          </View>

          {/* HIỂN THỊ THÔNG TIN TÚI/KHÁCH HÀNG (Nếu có) */}
          {(customer_name || bag_code) && (
            <>
              <View
                style={[
                  styles.card,
                  { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="pricetags-outline"
                    size={20}
                    color={PRIMARY}
                  />
                  <Text style={[styles.sectionTitle, { color: PRIMARY }]}>
                    CẤU HÌNH OCR
                  </Text>
                </View>
                {customer_name && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color="#64748B"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ fontSize: 14, color: "#475569" }}>
                      Khách hàng:{" "}
                      <Text style={{ fontWeight: "bold", color: "#0F172A" }}>
                        {customer_name}
                      </Text>
                    </Text>
                  </View>
                )}
                {bag_code && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="bag-handle-outline"
                      size={16}
                      color="#64748B"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{ fontSize: 14, color: "#475569" }}>
                      Túi thư:{" "}
                      <Text style={{ fontWeight: "bold", color: "#0F172A" }}>
                        {bag_code}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.connectorContainer}>
                <View style={styles.dottedLine} />
                <Ionicons
                  name="chevron-down-circle"
                  size={20}
                  color="#94A3B8"
                  style={styles.connectorIcon}
                />
              </View>
            </>
          )}


          <View style={styles.connectorContainer}>
            <View style={styles.dottedLine} />
            <Ionicons
              name="chevron-down-circle"
              size={20}
              color="#94A3B8"
              style={styles.connectorIcon}
            />
          </View>

          <View
            style={styles.card}
            onLayout={(e) => setSenderCardY(e.nativeEvent.layout.y)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="arrow-up-circle" size={20} color="#0284C7" />
              <Text style={[styles.sectionTitle, { color: "#0284C7" }]}>
                NGƯỜI GỬI
              </Text>
            </View>

            <View
              style={[
                styles.inputWrapper,
                { alignItems: "flex-start", paddingVertical: 12 },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    borderWidth: 0,
                    paddingHorizontal: 0,
                    minHeight: 20,
                  },
                ]}
                value={sName}
                onChangeText={setSName}
                placeholder="Họ tên người gửi"
                placeholderTextColor="#94A3B8"
                multiline
                onFocus={
                  Platform.OS === "ios" ? handleFocusSenderName : undefined
                }
              />
            </View>

            <View style={[styles.inputWrapper, { marginTop: 12 }]}>
              <Ionicons
                name="call-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                ]}
                value={sPhone}
                onChangeText={setSPhone}
                placeholder="Số điện thoại"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  marginTop: 12,
                  alignItems: "flex-start",
                  paddingVertical: 12,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    borderWidth: 0,
                    paddingHorizontal: 0,
                    minHeight: 40,
                  },
                ]}
                value={sAddress}
                onChangeText={setSAddress}
                placeholder="Địa chỉ gửi hàng"
                placeholderTextColor="#94A3B8"
                multiline
                onFocus={
                  Platform.OS === "ios" ? handleFocusSenderAddress : undefined
                }
              />
            </View>

            <TouchableOpacity
              style={[styles.inputWrapper, { marginTop: 12, alignItems: 'flex-start', paddingVertical: 10 }]}
              onPress={() => setShowSProvincePicker(true)}
            >
              <Ionicons name="map-outline" size={18} color="#94A3B8" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: sProvince ? '#0F172A' : '#94A3B8', fontWeight: sProvince ? '600' : '400' }}>
                  {sProvince || "Tỉnh/Thành phố"}
                </Text>
                {sProvince && getOldProvinceNames(sProvince).filter(n => n !== sProvince).length > 0 && (
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Sáp nhập từ: {getOldProvinceNames(sProvince).filter(n => n !== sProvince).join(', ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>



            <TouchableOpacity style={[styles.inputWrapper, { marginTop: 12 }]} onPress={() => setShowSWardPicker(true)}>
              <Ionicons name="home-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: sWard ? '#0F172A' : '#94A3B8' }}>{sWard || "Phường/Xã"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.connectorContainer}>
            <View style={styles.dottedLine} />
            <Ionicons
              name="chevron-down-circle"
              size={20}
              color="#94A3B8"
              style={styles.connectorIcon}
            />
          </View>

          <View
            style={styles.card}
            onLayout={(e) => setReceiverCardY(e.nativeEvent.layout.y)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="arrow-down-circle" size={20} color="#D97706" />
              <Text style={[styles.sectionTitle, { color: "#D97706" }]}>
                NGƯỜI NHẬN
              </Text>
            </View>

            <View
              style={[
                styles.inputWrapper,
                { alignItems: "flex-start", paddingVertical: 12 },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    borderWidth: 0,
                    paddingHorizontal: 0,
                    minHeight: 20,
                  },
                ]}
                value={rName}
                onChangeText={setRName}
                placeholder="Họ tên người nhận"
                placeholderTextColor="#94A3B8"
                multiline
                onFocus={
                  Platform.OS === "ios" ? handleFocusReceiverName : undefined
                }
              />
            </View>

            <View style={[styles.inputWrapper, { marginTop: 12 }]}>
              <Ionicons
                name="call-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                ]}
                value={rPhone}
                onChangeText={setRPhone}
                placeholder="Số điện thoại"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  marginTop: 12,
                  alignItems: "flex-start",
                  paddingVertical: 12,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    borderWidth: 0,
                    paddingHorizontal: 0,
                    minHeight: 40,
                  },
                ]}
                value={rAddress}
                onChangeText={setRAddress}
                placeholder="Địa chỉ giao hàng"
                placeholderTextColor="#94A3B8"
                multiline
                onFocus={
                  Platform.OS === "ios" ? handleFocusReceiverAddress : undefined
                }
              />
            </View>

            <TouchableOpacity
              style={[styles.inputWrapper, { marginTop: 12, alignItems: 'flex-start', paddingVertical: 10 }]}
              onPress={() => setShowRProvincePicker(true)}
            >
              <Ionicons name="map-outline" size={18} color="#94A3B8" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: rProvince ? '#0F172A' : '#94A3B8', fontWeight: rProvince ? '600' : '400' }}>
                  {rProvince || "Tỉnh/Thành phố"}
                </Text>
                {rProvince && getOldProvinceNames(rProvince).filter(n => n !== rProvince).length > 0 && (
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    Sáp nhập từ: {getOldProvinceNames(rProvince).filter(n => n !== rProvince).join(', ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>



            <TouchableOpacity style={[styles.inputWrapper, { marginTop: 12 }]} onPress={() => setShowRWardPicker(true)}>
              <Ionicons name="home-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: rWard ? '#0F172A' : '#94A3B8' }}>{rWard || "Phường/Xã"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.connectorContainer}>
            <View style={styles.dottedLine} />
            <Ionicons
              name="chevron-down-circle"
              size={20}
              color="#94A3B8"
              style={styles.connectorIcon}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={20} color="#0F766E" />
              <Text style={[styles.sectionTitle, { color: "#0F766E" }]}>
                THÔNG TIN HÀNG HÓA
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                ]}
                value={productName}
                onChangeText={setProductName}
                placeholder="Tên hàng hóa (*)"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {isShipper ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <View
                    style={[styles.inputWrapper, { flex: 1, marginRight: 5 }]}
                  >
                    <Ionicons
                      name="scale-outline"
                      size={18}
                      color="#94A3B8"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                      ]}
                      value={actualWeight}
                      onChangeText={setActualWeight}
                      placeholder="Nặng(kg)*"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  <View
                    style={[styles.inputWrapper, { flex: 1, marginLeft: 5 }]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color="#94A3B8"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                      ]}
                      value={codAmount}
                      onChangeText={setCodAmount}
                      placeholder="COD (VNĐ)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>


                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <View
                    style={[styles.inputWrapper, { flex: 1, marginRight: 5 }]}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          borderWidth: 0,
                          paddingHorizontal: 0,
                          textAlign: "center",
                        },
                      ]}
                      value={length}
                      onChangeText={setLength}
                      placeholder="Dài (cm)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      { flex: 1, marginHorizontal: 5 },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          borderWidth: 0,
                          paddingHorizontal: 0,
                          textAlign: "center",
                        },
                      ]}
                      value={width}
                      onChangeText={setWidth}
                      placeholder="Rộng (cm)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                  <View
                    style={[styles.inputWrapper, { flex: 1, marginLeft: 5 }]}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          borderWidth: 0,
                          paddingHorizontal: 0,
                          textAlign: "center",
                        },
                      ]}
                      value={height}
                      onChangeText={setHeight}
                      placeholder="Cao (cm)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={[styles.inputWrapper, { marginTop: 12 }]}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color="#94A3B8"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, borderWidth: 0, paddingHorizontal: 0 },
                  ]}
                  value={codAmount}
                  onChangeText={setCodAmount}
                  placeholder="Thu hộ COD (VNĐ)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
      </KeyboardAwareScrollView>
      <View style={[styles.bottomDock, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>LƯU & XÁC NHẬN</Text>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
      <AddressPickerModal
        visible={showSProvincePicker}
        onClose={() => setShowSProvincePicker(false)}
        data={PROVINCES_34}
        title="Chọn Tỉnh/Thành phố gửi"
        onSelect={handleSProvinceSelect}
        showMergeInfo={true}
      />
      <AddressPickerModal
        visible={showSWardPicker}
        onClose={() => setShowSWardPicker(false)}
        data={availableSenderWards}
        title="Chọn Phường/Xã gửi"
        onSelect={setSWard}
      />

      <AddressPickerModal
        visible={showRProvincePicker}
        onClose={() => setShowRProvincePicker(false)}
        data={PROVINCES_34}
        title="Chọn Tỉnh/Thành phố nhận"
        onSelect={handleRProvinceSelect}
        showMergeInfo={true}
      />
      <AddressPickerModal
        visible={showRWardPicker}
        onClose={() => setShowRWardPicker(false)}
        data={availableReceiverWards}
        title="Chọn Phường/Xã nhận"
        onSelect={setRWard}
      />
    </View>
  );
}
