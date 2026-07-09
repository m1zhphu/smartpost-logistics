import React, { useState, useRef } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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
import { PROVINCES_34 } from "../utils/provinces";

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
  const [sDistrict, setSDistrict] = useState(senderData?.district_name || "");
  const [sWard, setSWard] = useState(senderData?.ward_name || "");
  const [showSProvincePicker, setShowSProvincePicker] = useState(false);

  const [rProvince, setRProvince] = useState(receiverData?.province_name || "");
  const [rDistrict, setRDistrict] = useState(receiverData?.district_name || "");
  const [rWard, setRWard] = useState(receiverData?.ward_name || "");
  const [showRProvincePicker, setShowRProvincePicker] = useState(false);

  const [provincesRaw, setProvincesRaw] = useState([]);
  
  const [sDistrictsRaw, setSDistrictsRaw] = useState([]);
  const [sWardsRaw, setSWardsRaw] = useState([]);
  const [showSDistrictPicker, setShowSDistrictPicker] = useState(false);
  const [showSWardPicker, setShowSWardPicker] = useState(false);

  const [rDistrictsRaw, setRDistrictsRaw] = useState([]);
  const [rWardsRaw, setRWardsRaw] = useState([]);
  const [showRDistrictPicker, setShowRDistrictPicker] = useState(false);
  const [showRWardPicker, setShowRWardPicker] = useState(false);

  React.useEffect(() => {
    fetch("https://provinces.open-api.vn/api/v2/")
      .then(res => res.json())
      .then(data => setProvincesRaw(data))
      .catch(e => console.log(e));
  }, []);

  const getProvCode = (name) => {
    const normalized = name.replace("TP. ", "Thành phố ").replace("Tỉnh ", "");
    const match = provincesRaw.find(p => p.name.includes(normalized) || normalized.includes(p.name));
    return match ? match.code : null;
  };

  const fetchDistricts = async (provCode, setRawData) => {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provCode}?depth=2`);
      const data = await res.json();
      setRawData(data.districts || []);
    } catch (e) {}
  };

  const fetchWards = async (distCode, setRawData) => {
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/v2/d/${distCode}?depth=2`);
      const data = await res.json();
      setRawData(data.wards || []);
    } catch (e) {}
  };

  React.useEffect(() => {
    if (provincesRaw.length > 0) {
      if (sProvince) {
        const code = getProvCode(sProvince);
        if (code) fetchDistricts(code, setSDistrictsRaw);
      }
      if (rProvince) {
        const code = getProvCode(rProvince);
        if (code) fetchDistricts(code, setRDistrictsRaw);
      }
    }
  }, [provincesRaw]);

  const handleSProvinceSelect = (val) => {
    setSProvince(val);
    setSDistrict("");
    setSWard("");
    const code = getProvCode(val);
    if (code) fetchDistricts(code, setSDistrictsRaw);
  };
  const handleSDistrictSelect = (val) => {
    setSDistrict(val);
    setSWard("");
    const match = sDistrictsRaw.find(d => d.name === val);
    if (match) fetchWards(match.code, setSWardsRaw);
  };
  const handleRProvinceSelect = (val) => {
    setRProvince(val);
    setRDistrict("");
    setRWard("");
    const code = getProvCode(val);
    if (code) fetchDistricts(code, setRDistrictsRaw);
  };
  const handleRDistrictSelect = (val) => {
    setRDistrict(val);
    setRWard("");
    const match = rDistrictsRaw.find(d => d.name === val);
    if (match) fetchWards(match.code, setRWardsRaw);
  };

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
      sender_district_name: sDistrict.trim(),
      sender_ward_name: sWard.trim(),
      receiver_province_name: rProvince.trim(),
      receiver_district_name: rDistrict.trim(),
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
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
              style={[styles.inputWrapper, { marginTop: 12 }]}
              onPress={() => setShowSProvincePicker(true)}
            >
              <Ionicons name="map-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: sProvince ? '#0F172A' : '#94A3B8' }}>{sProvince || "Tỉnh/Thành phố"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.inputWrapper, { marginTop: 12 }]} onPress={() => setShowSDistrictPicker(true)}>
              <Ionicons name="business-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: sDistrict ? '#0F172A' : '#94A3B8' }}>{sDistrict || "Quận/Huyện"}</Text>
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
              style={[styles.inputWrapper, { marginTop: 12 }]}
              onPress={() => setShowRProvincePicker(true)}
            >
              <Ionicons name="map-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: rProvince ? '#0F172A' : '#94A3B8' }}>{rProvince || "Tỉnh/Thành phố"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.inputWrapper, { marginTop: 12 }]} onPress={() => setShowRDistrictPicker(true)}>
              <Ionicons name="business-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: rDistrict ? '#0F172A' : '#94A3B8' }}>{rDistrict || "Quận/Huyện"}</Text>
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
                      keyboardType="decimal-pad"
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
        </ScrollView>

        <View style={styles.bottomDock}>
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
      </KeyboardAvoidingView>
      <AddressPickerModal
        visible={showSProvincePicker}
        onClose={() => setShowSProvincePicker(false)}
        data={PROVINCES_34}
        title="Chọn Tỉnh/Thành phố gửi"
        onSelect={handleSProvinceSelect}
      />
      <AddressPickerModal
        visible={showSDistrictPicker}
        onClose={() => setShowSDistrictPicker(false)}
        data={sDistrictsRaw.map(d => d.name)}
        title="Chọn Quận/Huyện gửi"
        onSelect={handleSDistrictSelect}
      />
      <AddressPickerModal
        visible={showSWardPicker}
        onClose={() => setShowSWardPicker(false)}
        data={sWardsRaw.map(w => w.name)}
        title="Chọn Phường/Xã gửi"
        onSelect={setSWard}
      />

      <AddressPickerModal
        visible={showRProvincePicker}
        onClose={() => setShowRProvincePicker(false)}
        data={PROVINCES_34}
        title="Chọn Tỉnh/Thành phố nhận"
        onSelect={handleRProvinceSelect}
      />
      <AddressPickerModal
        visible={showRDistrictPicker}
        onClose={() => setShowRDistrictPicker(false)}
        data={rDistrictsRaw.map(d => d.name)}
        title="Chọn Quận/Huyện nhận"
        onSelect={handleRDistrictSelect}
      />
      <AddressPickerModal
        visible={showRWardPicker}
        onClose={() => setShowRWardPicker(false)}
        data={rWardsRaw.map(w => w.name)}
        title="Chọn Phường/Xã nhận"
        onSelect={setRWard}
      />
    </View>
  );
}
