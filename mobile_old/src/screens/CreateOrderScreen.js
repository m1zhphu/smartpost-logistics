import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { submitShipment } from "../services/shipmentService";
import styles from "../styles/CreateOrderStyles";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import { useQueue } from "../context/QueueContext";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { SPACING } from "../constants/theme";

export default function CreateOrderScreen({ route, navigation }) {
  const {
    senderData,
    receiverData,
    username,
    trackingNumber,
    queueId,
    bankBranch,
    unitCode,
  } = route.params || {};

  const [rName, setRName] = useState(receiverData?.name || "");
  const [rPhone, setRPhone] = useState(receiverData?.phone || "");
  const [rAddress, setRAddress] = useState(receiverData?.address || "");

  const [sName, setSName] = useState(senderData?.name || "");
  const [sPhone, setSPhone] = useState(senderData?.phone || "");
  const [sAddress, setSAddress] = useState(senderData?.address || "");

  const [loading, setLoading] = useState(false);
  const [bank_branch, setBank_Branch] = useState(bankBranch || "");
  const [unit_code, setUnit_Code] = useState(unitCode || "");

  const [trackingCode, setTrackingCode] = useState(trackingNumber || "");

  const scrollViewRef = useRef(null);
  const [senderCardY, setSenderCardY] = useState(0);

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
        text2: "Vui lòng nhập Số điện thoại người nhận",
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
        text2: "Vui lòng nhập Số điện thoại người gửi",
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

    const payload = {
      username,
      sender: {
        name: sName?.trim(),
        phone: sPhone?.trim(),
        address: sAddress?.trim(),
      },
      receiver: {
        name: rName.trim(),
        phone: rPhone.trim(),
        address: rAddress.trim(),
      },
      tracking_number: trackingCode.trim(),
      bank_branch: bank_branch.trim(),
      unit_code: unit_code.trim(),
    };

    setLoading(true);
    try {
      const result = await submitShipment(payload);

      if (result.success) {
        if (queueId) {
          removeQueueItem(queueId);
        }
        navigation.navigate("Success", {
          trackingNumber: payload.tracking_number,
        });
      } else if (result.isDuplicate) {
        Toast.show({
          type: "error",
          text1: "Trùng mã vận đơn!",
          text2: `${payload.tracking_number} đã tồn tại trên hệ thống`,
          visibilityTime: 4000,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Gửi thất bại",
          text2: result.message || "Lỗi không xác định. Vui lòng thử lại",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tạo đơn hàng",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFocusSenderAddress = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: senderCardY, animated: true });
      }
    }, 100);
  };

  const handleFocusReceiverAddress = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{
            top: SPACING.md,
            bottom: SPACING.md,
            left: SPACING.md,
            right: SPACING.md,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>M� v?n don</Text>
            <CustomInput
              value={trackingCode}
              onChangeText={setTrackingCode}
              placeholder="Nh?p m� don h�ng"
              leftIcon={
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              }
              inputStyle={styles.strongInputText}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Th�ng tin don v?</Text>
            <View style={styles.fieldGroup}>
              <CustomInput
                value={bank_branch}
                onChangeText={setBank_Branch}
                placeholder="Ng�n h�ng / Chi nh�nh"
                leftIcon={
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
              />
              <CustomInput
                value={unit_code}
                onChangeText={setUnit_Code}
                placeholder="M� don v?"
                leftIcon={
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
              />
            </View>
          </View>

          <View
            style={styles.section}
            onLayout={(event) => {
              setSenderCardY(event.nativeEvent.layout.y);
            }}
          >
            <Text style={styles.sectionTitle}>Th�ng tin ngu?i g?i</Text>
            <View style={styles.fieldGroup}>
              <CustomInput
                value={sName}
                onChangeText={setSName}
                placeholder="H? t�n ngu?i g?i"
                leftIcon={
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
              />
              <CustomInput
                value={sPhone}
                onChangeText={setSPhone}
                placeholder="S? di?n tho?i"
                keyboardType="phone-pad"
                leftIcon={
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
              />
              <CustomInput
                value={sAddress}
                onChangeText={setSAddress}
                placeholder="�?a ch? g?i h�ng"
                multiline
                onFocus={handleFocusSenderAddress}
                leftIcon={
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
                inputStyle={styles.multilineInput}
                inputWrapperStyle={styles.multilineWrapper}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Th�ng tin ngu?i nh?n</Text>
            <View style={styles.fieldGroup}>
              <CustomInput
                value={rName}
                onChangeText={setRName}
                placeholder="H? t�n ngu?i nh?n"
                leftIcon={
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
              />
              <CustomInput
                value={rPhone}
                onChangeText={setRPhone}
                placeholder="S? di?n tho?i"
                keyboardType="phone-pad"
                leftIcon={
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
              />
              <CustomInput
                value={rAddress}
                onChangeText={setRAddress}
                placeholder="�?a ch? giao h�ng"
                multiline
                onFocus={handleFocusReceiverAddress}
                leftIcon={
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                }
                inputStyle={styles.multilineInput}
                inputWrapperStyle={styles.multilineWrapper}
              />
            </View>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.bottomDock}>
          <CustomButton
            title="Xác nhận tạo đơn"
            onPress={handleConfirm}
            loading={loading}
            rightIcon={
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.white}
              />
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  );
}
