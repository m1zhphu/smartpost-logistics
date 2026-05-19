import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CreateWaybillStyles from "../styles/CreateWaybillStyles";
import { waybillService } from "../services/waybillService";
import { pricingService } from "../services/pricingService";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";

const TABS = ["Gửi & nhận", "Hàng hóa", "Dịch vụ", "Cước phí"];

export default function CreateWaybillScreen({ navigation, route }) {
  const { user } = useUser();
  const scrollViewRef = useRef(null);
  const sectionLayouts = useRef({});
  const isAutoScrolling = useRef(false);
  const typingTimeoutRef = useRef(null);

  const [hubs, setHubs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Gửi & nhận");
  const [form, setForm] = useState({
    customer_id: "",
    service_type: "STANDARD",
    origin_hub_id: "",
    dest_hub_id: "",
    sender_name: "",
    sender_phone: "",
    sender_address: "",
    receiver_name: "",
    receiver_phone: "",
    receiver_address: "",
    actual_weight: "0.5",
    length: "",
    width: "",
    height: "",
    product_name: "",
    payment_method: "SENDER_PAY",
    cod_amount: "0",
    note: "",
    extra_services: [],
    receiver_address_detail: "",
    bank_branch: "",
    unit_code: "",
    waybill_code: "",
  });
  const [fees, setFees] = useState({
    main_fee: 0,
    extra_fee: 0,
    remote_fee: 0,
    vat: 0,
    total: 0,
  });
  const [pricingSource, setPricingSource] = useState("");
  const [feeLoading, setFeeLoading] = useState(false);
  const recipientHistoryTimeoutRef = useRef(null);

  // Modal States
  const [showCustModal, setShowCustModal] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [showHubModal, setShowHubModal] = useState(false);
  const [hubSearch, setHubSearch] = useState("");
  const [hubTarget, setHubTarget] = useState("origin");
  const [showCreateCustModal, setShowCreateCustModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  // Address Picker State
  const [provinces, setProvinces] = useState([]);
  const [receiverDistricts, setReceiverDistricts] = useState([]);
  const [receiverWards, setReceiverWards] = useState([]);
  const [receiverProvince, setReceiverProvince] = useState(null);
  const [receiverDistrict, setReceiverDistrict] = useState(null);
  const [receiverWard, setReceiverWard] = useState(null);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  const [ocrSuggestion, setOcrSuggestion] = useState(null);

  useEffect(() => {
    if (!isRouteAllowed(user, "CreateWaybill")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  }, [user]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!receiverProvince) {
      setReceiverDistricts([]);
      setReceiverWards([]);
      return;
    }
    setReceiverDistrict(null);
    setReceiverWard(null);
    setReceiverWards([]);
    fetch(
      `https://provinces.open-api.vn/api/p/${receiverProvince.code}?depth=2`,
    )
      .then((r) => r.json())
      .then((data) => setReceiverDistricts(data.districts || []))
      .catch(() => {});
  }, [receiverProvince]);

  useEffect(() => {
    if (!receiverDistrict) {
      setReceiverWards([]);
      setReceiverWard(null);
      return;
    }
    setReceiverWard(null);
    fetch(
      `https://provinces.open-api.vn/api/d/${receiverDistrict.code}?depth=2`,
    )
      .then((r) => r.json())
      .then((data) => setReceiverWards(data.wards || []))
      .catch(() => {});
  }, [receiverDistrict]);

  useEffect(() => {
    const parts = [
      receiverWard?.name,
      receiverDistrict?.name,
      receiverProvince?.name,
    ]
      .filter(Boolean)
      .join(", ");
    if (parts) setForm((prev) => ({ ...prev, receiver_address: parts }));
  }, [receiverProvince, receiverDistrict, receiverWard]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [resHubs, resCustomers, resServices] = await Promise.all([
          waybillService.getHubs(user.token),
          waybillService.getCustomers(user.token),
          pricingService.getExtraServices(user.token).catch(() => []),
        ]);

        setHubs(resHubs);
        setCustomers(resCustomers);
        setAvailableServices(
          (resServices || []).filter((item) => item.is_active !== false),
        );

        let defaultOrigin = "";
        if (user.role_id !== 1)
          defaultOrigin = user.primary_hub_id
            ? String(user.primary_hub_id)
            : "";
        else if (resHubs.length > 0) defaultOrigin = String(resHubs[0].hub_id);

        setForm((prev) => ({ ...prev, origin_hub_id: defaultOrigin }));

        const ocrData = route?.params?.ocrData;
        if (ocrData) {
          setForm((prev) => ({
            ...prev,
            receiver_name: ocrData.receiver?.name || "",
            receiver_phone: (ocrData.receiver?.phone || "")
              .replace(/[^0-9]/g, "")
              .slice(0, 10),
            receiver_address: ocrData.receiver?.address || "",
            bank_branch: ocrData.bank_branch || "",
            unit_code: ocrData.unit_code || "",
            waybill_code: ocrData.tracking_number || "",
          }));

          const senderPhone = (ocrData.sender?.phone || "").replace(
            /[^0-9]/g,
            "",
          );
          if (senderPhone) {
            const matched = resCustomers.find(
              (c) => (c.phone || "").replace(/[^0-9]/g, "") === senderPhone,
            );
            if (matched)
              setForm((prev) => ({
                ...prev,
                customer_id: String(matched.customer_id),
              }));
            else {
              setOcrSuggestion({
                name: ocrData.sender?.name || "",
                phone: senderPhone,
                address: ocrData.sender?.address || "",
              });
              setNewCustForm({
                name: ocrData.sender?.name || "",
                phone: senderPhone,
                address: ocrData.sender?.address || "",
              });
            }
          }
        }
      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải dữ liệu danh mục.");
      } finally {
        setDataLoading(false);
      }
    };
    if (user.token) fetchMasterData();
  }, [user.token]);

  useEffect(() => {
    const fetchFee = async () => {
      const weight = Number(form.actual_weight);
      if (!weight || weight <= 0 || !form.origin_hub_id || !form.dest_hub_id) {
        setFees({ main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0, total: 0 });
        setPricingSource("");
        return;
      }

      setFeeLoading(true);
      try {
        const res = await pricingService.calculateFee(user.token, {
          origin_hub_id: Number(form.origin_hub_id),
          dest_hub_id: Number(form.dest_hub_id),
          dest_district_id: receiverDistrict?.code || null,
          dest_ward_id: receiverWard?.code || null,
          weight,
          length: Number(form.length) || 0,
          width: Number(form.width) || 0,
          height: Number(form.height) || 0,
          service_type: form.service_type,
          extra_services: form.extra_services,
          cod_amount: Number(form.cod_amount),
          customer_id: form.customer_id ? Number(form.customer_id) : null,
        });
        setFees({
          main_fee: res.main_fee || res.base_price || 0,
          extra_fee: res.extra_fee || res.services_fee || 0,
          remote_fee: res.remote_fee || res.remote_surcharge || 0,
          vat: res.vat || 0,
          total: res.total || res.total_price || 0,
        });
        setPricingSource(res.matched_rule || "");
      } catch (error) {
        setFees({ main_fee: 0, extra_fee: 0, remote_fee: 0, vat: 0, total: 0 });
        setPricingSource("chưa có bảng giá");
      } finally {
        setFeeLoading(false);
      }
    };

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => fetchFee(), 400);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [
    form.actual_weight,
    form.length,
    form.width,
    form.height,
    form.service_type,
    form.origin_hub_id,
    form.dest_hub_id,
    form.cod_amount,
    receiverDistrict,
    receiverWard,
    JSON.stringify(form.extra_services),
  ]);

  useEffect(() => {
    if (recipientHistoryTimeoutRef.current) {
      clearTimeout(recipientHistoryTimeoutRef.current);
      recipientHistoryTimeoutRef.current = null;
    }

    const phone = (form.receiver_phone || "").replace(/[^0-9]/g, "");
    if (!user.token || phone.length !== 10) {
      return;
    }

    recipientHistoryTimeoutRef.current = setTimeout(async () => {
      try {
        const history = await waybillService.getRecipientHistory(
          user.token,
          phone,
        );
        if (history && (history.receiver_name || history.receiver_address)) {
          setForm((prev) => ({
            ...prev,
            receiver_name: history.receiver_name || prev.receiver_name,
            receiver_address: history.receiver_address || prev.receiver_address,
          }));
        }
      } catch (error) {
        console.log(
          "[AUTOFILL] Không lấy được lịch sử người nhận:",
          error?.message || error,
        );
      }
    }, 500);

    return () => {
      if (recipientHistoryTimeoutRef.current) {
        clearTimeout(recipientHistoryTimeoutRef.current);
      }
    };
  }, [form.receiver_phone, user.token]);

  const filteredCustomers = customers.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(custSearch.toLowerCase()) ||
      (item.phone || "").includes(custSearch) ||
      (item.customer_code || "")
        .toLowerCase()
        .includes(custSearch.toLowerCase()),
  );
  const filteredHubs = hubs.filter(
    (item) =>
      (item.hub_name || "").toLowerCase().includes(hubSearch.toLowerCase()) ||
      (item.hub_code || "").toLowerCase().includes(hubSearch.toLowerCase()),
  );

  const scrollToSection = (tabName) => {
    setActiveTab(tabName);
    isAutoScrolling.current = true;
    if (scrollViewRef.current)
      scrollViewRef.current.scrollTo({
        y: sectionLayouts.current[tabName] || 0,
        animated: true,
      });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 500);
  };

  const handleScroll = (event) => {
    if (isAutoScrolling.current) return;
    const y = event.nativeEvent.contentOffset.y;
    const offset = 120;
    if (y >= (sectionLayouts.current["Cước phí"] || 9999) - offset)
      setActiveTab("Cước phí");
    else if (y >= (sectionLayouts.current["Dịch vụ"] || 9999) - offset)
      setActiveTab("Dịch vụ");
    else if (y >= (sectionLayouts.current["Hàng hóa"] || 9999) - offset)
      setActiveTab("Hàng hóa");
    else setActiveTab("Gửi & nhận");
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.receiver_phone.match(/^[0-9]{10}$/))
      return Alert.alert(
        "Lỗi dữ liệu",
        "Số điện thoại người nhận phải đúng 10 chữ số.",
      );
    const weight = Number(form.actual_weight);
    if (isNaN(weight) || weight <= 0)
      return Alert.alert("Lỗi dữ liệu", "Khối lượng phải lớn hơn 0 kg.");
    if (!form.customer_id)
      return Alert.alert("Thiếu thông tin", "Vui lòng chọn khách hàng gửi.");
    if (!form.dest_hub_id)
      return Alert.alert("Thiếu thông tin", "Vui lòng chọn bưu cục nhận hàng.");
    if (!form.receiver_name || (!form.receiver_address && !receiverProvince))
      return Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đủ tên và địa chỉ người nhận.",
      );

    const addressParts = [
      form.receiver_address_detail,
      receiverWard?.name,
      receiverDistrict?.name,
      receiverProvince?.name,
    ].filter(Boolean);
    const fullReceiverAddress =
      addressParts.length > 0 ? addressParts.join(", ") : form.receiver_address;

    setSubmitLoading(true);
    try {
      const res = await waybillService.createWaybill(user.token, {
        ...form,
        customer_id: Number(form.customer_id),
        origin_hub_id: Number(form.origin_hub_id),
        dest_hub_id: Number(form.dest_hub_id),
        dest_district_id: receiverDistrict?.code || null,
        dest_ward_id: receiverWard?.code || null,
        actual_weight: weight,
        cod_amount: Number(form.cod_amount) || 0,
        length: Number(form.length) || 0,
        width: Number(form.width) || 0,
        height: Number(form.height) || 0,
        shipping_fee: fees.total,
        receiver_address: fullReceiverAddress,
      });
      Alert.alert("Thành công", `Tạo vận đơn ${res.waybill_code} thành công.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi hệ thống", error.message || "Lưu đơn hàng thất bại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustForm.name || !newCustForm.phone)
      return Alert.alert("Lỗi", "Vui lòng nhập tên và số điện thoại.");
    setIsCreatingCust(true);
    try {
      const payload = {
        customer_code: `KH${new Date().getTime().toString().slice(-6)}`,
        customer_type: "SHOP",
        name: newCustForm.name,
        company_name: newCustForm.name,
        phone: newCustForm.phone,
        address: newCustForm.address,
        status: "ACTIVE",
      };
      const newCust = await waybillService.createCustomer(user.token, payload);
      setCustomers([newCust, ...customers]);
      setForm({ ...form, customer_id: String(newCust.customer_id) });
      Alert.alert("Thành công", "Đã lưu thông tin khách hàng mới.");
      setShowCreateCustModal(false);
      setShowCustModal(false);
      setNewCustForm({ name: "", phone: "", address: "" });
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tạo khách hàng lúc này.");
    } finally {
      setIsCreatingCust(false);
    }
  };

  if (dataLoading)
    return (
      <View style={CreateWaybillStyles.center}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={CreateWaybillStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

        <View style={CreateWaybillStyles.mainHeader}>
          <View style={CreateWaybillStyles.headerTopRow}>
            <TouchableOpacity
              style={CreateWaybillStyles.backCircleBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={CreateWaybillStyles.headerTitleWrap}>
              <Text style={CreateWaybillStyles.headerHubName}>
                {hubs.find(
                  (item) => String(item.hub_id) === String(form.origin_hub_id),
                )?.hub_code || "BƯU CỤC TẠO"}
              </Text>
              <Text style={CreateWaybillStyles.headerMainTitle}>
                Tạo vận đơn mới
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={CreateWaybillStyles.tabScroll}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => scrollToSection(tab)}
                style={[
                  CreateWaybillStyles.tabItem,
                  activeTab === tab && CreateWaybillStyles.tabActive,
                ]}
              >
                <Text
                  style={[
                    CreateWaybillStyles.tabText,
                    activeTab === tab && CreateWaybillStyles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={CreateWaybillStyles.scrollContent}
        >
          <View style={CreateWaybillStyles.card}>
            <View style={CreateWaybillStyles.sectionHeader}>
              <View
                style={[
                  CreateWaybillStyles.dot,
                  { backgroundColor: COLORS.secondary },
                ]}
              />
              <Text style={CreateWaybillStyles.sectionTitle}>
                THÔNG TIN ĐƠN VỊ
              </Text>
            </View>
            <View style={CreateWaybillStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>
                  Ngân hàng / Chi nhánh
                </Text>
                <TextInput
                  style={CreateWaybillStyles.input}
                  placeholder="Tên chi nhánh..."
                  value={form.bank_branch}
                  onChangeText={(t) => setForm({ ...form, bank_branch: t })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>Mã đơn vị</Text>
                <TextInput
                  style={CreateWaybillStyles.input}
                  placeholder="Nhập mã..."
                  value={form.unit_code}
                  onChangeText={(t) => setForm({ ...form, unit_code: t })}
                />
              </View>
            </View>
            <Text style={CreateWaybillStyles.label}>
              Mã vận đơn (Từ nhãn dán)
            </Text>
            <TextInput
              style={[
                CreateWaybillStyles.input,
                { fontWeight: "800", color: COLORS.primary, fontSize: 16 },
              ]}
              placeholder="Quét hoặc nhập mã..."
              value={form.waybill_code}
              onChangeText={(t) => setForm({ ...form, waybill_code: t })}
            />
          </View>

          <View
            style={CreateWaybillStyles.card}
            onLayout={(e) =>
              (sectionLayouts.current["Gửi & nhận"] = e.nativeEvent.layout.y)
            }
          >
            <View style={CreateWaybillStyles.sectionHeader}>
              <View
                style={[
                  CreateWaybillStyles.dot,
                  { backgroundColor: COLORS.secondary },
                ]}
              />
              <Text style={CreateWaybillStyles.sectionTitle}>
                THÔNG TIN GỬI & NHẬN
              </Text>
            </View>

            <Text style={CreateWaybillStyles.label}>
              Khách hàng gửi (Shop){" "}
              <Text style={CreateWaybillStyles.req}>*</Text>
            </Text>
            <TouchableOpacity
              style={CreateWaybillStyles.mockInput}
              onPress={() => {
                setCustSearch("");
                setShowCustModal(true);
              }}
            >
              <Text
                style={
                  form.customer_id
                    ? CreateWaybillStyles.textMain
                    : CreateWaybillStyles.textMuted
                }
              >
                {form.customer_id
                  ? customers.find(
                      (item) => String(item.customer_id) === form.customer_id,
                    )?.name
                  : "Tìm tên, SĐT, mã khách..."}
              </Text>
              <Ionicons name="search" size={20} color={COLORS.textGray} />
            </TouchableOpacity>

            <Text style={CreateWaybillStyles.label}>Dịch vụ vận chuyển</Text>
            <View style={CreateWaybillStyles.serviceTypeRow}>
              {["STANDARD", "EXPRESS", "ECONOMY"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    CreateWaybillStyles.serviceBtn,
                    form.service_type === type &&
                      CreateWaybillStyles.serviceBtnActive,
                  ]}
                  onPress={() => setForm({ ...form, service_type: type })}
                >
                  <Text
                    style={[
                      CreateWaybillStyles.serviceBtnText,
                      form.service_type === type &&
                        CreateWaybillStyles.serviceBtnTextActive,
                    ]}
                  >
                    {type === "STANDARD"
                      ? "Tiêu chuẩn"
                      : type === "EXPRESS"
                        ? "Hỏa tốc"
                        : "Tiết kiệm"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={CreateWaybillStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>Bưu cục gửi</Text>
                <TouchableOpacity
                  style={CreateWaybillStyles.mockInput}
                  disabled={user.role_id !== 1}
                  onPress={() => {
                    setHubTarget("origin");
                    setHubSearch("");
                    setShowHubModal(true);
                  }}
                >
                  <Text style={CreateWaybillStyles.textMain} numberOfLines={1}>
                    {hubs.find(
                      (item) => String(item.hub_id) === form.origin_hub_id,
                    )?.hub_code || "Chọn"}
                  </Text>
                  <Ionicons
                    name="caret-down"
                    size={16}
                    color={COLORS.textGray}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ justifyContent: "center", marginTop: -5 }}>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={COLORS.borderLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>
                  Bưu cục nhận <Text style={CreateWaybillStyles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={CreateWaybillStyles.mockInput}
                  onPress={() => {
                    setHubTarget("dest");
                    setHubSearch("");
                    setShowHubModal(true);
                  }}
                >
                  <Text
                    style={
                      form.dest_hub_id
                        ? CreateWaybillStyles.textMain
                        : CreateWaybillStyles.textMuted
                    }
                    numberOfLines={1}
                  >
                    {hubs.find(
                      (item) => String(item.hub_id) === form.dest_hub_id,
                    )?.hub_code || "Tìm BC..."}
                  </Text>
                  <Ionicons name="search" size={16} color={COLORS.textGray} />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: COLORS.inputBg,
                marginVertical: 10,
              }}
            />
            <Text
              style={[
                CreateWaybillStyles.label,
                {
                  color: COLORS.textMuted,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                },
              ]}
            >
              Thông tin người nhận
            </Text>

            {ocrSuggestion && !form.customer_id && (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.warningBg,
                  borderWidth: 1,
                  borderColor: "#FDE68A",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 16,
                }}
                onPress={() => {
                  setShowCustModal(false);
                  setShowCreateCustModal(true);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="person-add"
                    size={20}
                    color={COLORS.processScanOrange}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "800",
                        color: COLORS.warningText,
                        fontSize: 13,
                        marginBottom: 2,
                      }}
                    >
                      Khách chưa có trong hệ thống
                    </Text>
                    <Text style={{ color: "#B45309", fontSize: 12 }}>
                      {ocrSuggestion.name} • {ocrSuggestion.phone}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: COLORS.processScanOrange,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    Tạo ngay
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <Text style={CreateWaybillStyles.label}>
              Số điện thoại <Text style={CreateWaybillStyles.req}>*</Text>
            </Text>
            <View style={CreateWaybillStyles.inputWrap}>
              <Ionicons
                name="call"
                size={18}
                color={COLORS.textGray}
                style={{ marginLeft: 16 }}
              />
              <TextInput
                style={[CreateWaybillStyles.inputFlex, { paddingLeft: 10 }]}
                placeholder="Nhập 10 số (VD: 0901234567)"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.receiver_phone}
                onChangeText={(t) =>
                  setForm({ ...form, receiver_phone: t.replace(/[^0-9]/g, "") })
                }
              />
            </View>

            <Text style={CreateWaybillStyles.label}>
              Họ tên <Text style={CreateWaybillStyles.req}>*</Text>
            </Text>
            <TextInput
              style={CreateWaybillStyles.input}
              placeholder="Nhập họ và tên..."
              value={form.receiver_name}
              onChangeText={(t) => setForm({ ...form, receiver_name: t })}
            />

            <Text style={CreateWaybillStyles.label}>
              Địa chỉ giao hàng <Text style={CreateWaybillStyles.req}>*</Text>
            </Text>
            <TouchableOpacity
              style={[CreateWaybillStyles.mockInput, { marginBottom: 12 }]}
              onPress={() => {
                setProvinceSearch("");
                setShowProvinceModal(true);
              }}
            >
              <Ionicons
                name="location"
                size={18}
                color={COLORS.textGray}
                style={{ marginRight: 10 }}
              />
              <Text
                style={
                  receiverProvince
                    ? CreateWaybillStyles.textMain
                    : CreateWaybillStyles.textMuted
                }
                numberOfLines={1}
              >
                {receiverProvince?.name || "Chọn Tỉnh / Thành phố..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                CreateWaybillStyles.mockInput,
                { marginBottom: 12, opacity: receiverProvince ? 1 : 0.5 },
              ]}
              onPress={() => {
                if (!receiverProvince)
                  return Alert.alert("Lỗi", "Chọn Tỉnh/TP trước.");
                setDistrictSearch("");
                setShowDistrictModal(true);
              }}
            >
              <Ionicons
                name="map"
                size={18}
                color={COLORS.textGray}
                style={{ marginRight: 10 }}
              />
              <Text
                style={
                  receiverDistrict
                    ? CreateWaybillStyles.textMain
                    : CreateWaybillStyles.textMuted
                }
                numberOfLines={1}
              >
                {receiverDistrict?.name || "Chọn Quận / Huyện..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                CreateWaybillStyles.mockInput,
                { marginBottom: 12, opacity: receiverDistrict ? 1 : 0.5 },
              ]}
              onPress={() => {
                if (!receiverDistrict)
                  return Alert.alert("Lỗi", "Chọn Quận/Huyện trước.");
                setWardSearch("");
                setShowWardModal(true);
              }}
            >
              <Ionicons
                name="business"
                size={18}
                color={COLORS.textGray}
                style={{ marginRight: 10 }}
              />
              <Text
                style={
                  receiverWard
                    ? CreateWaybillStyles.textMain
                    : CreateWaybillStyles.textMuted
                }
                numberOfLines={1}
              >
                {receiverWard?.name || "Chọn Phường / Xã..."}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textGray} />
            </TouchableOpacity>

            <TextInput
              style={[
                CreateWaybillStyles.input,
                { height: 80, textAlignVertical: "top" },
              ]}
              placeholder="Số nhà, tên đường (VD: 123 Nguyễn Trãi)..."
              multiline
              value={form.receiver_address_detail || ""}
              onChangeText={(t) =>
                setForm({ ...form, receiver_address_detail: t })
              }
            />
          </View>

          <View
            style={CreateWaybillStyles.card}
            onLayout={(e) =>
              (sectionLayouts.current["Hàng hóa"] = e.nativeEvent.layout.y)
            }
          >
            <View style={CreateWaybillStyles.sectionHeader}>
              <View
                style={[
                  CreateWaybillStyles.dot,
                  { backgroundColor: COLORS.secondary },
                ]}
              />
              <Text style={CreateWaybillStyles.sectionTitle}>
                HÀNG HÓA & THANH TOÁN
              </Text>
            </View>

            <View style={CreateWaybillStyles.row}>
              <View style={{ flex: 0.4 }}>
                <Text style={CreateWaybillStyles.label}>Khối lượng</Text>
                <View style={CreateWaybillStyles.inputWrap}>
                  <TextInput
                    style={[
                      CreateWaybillStyles.inputFlex,
                      { fontWeight: "800", fontSize: 18 },
                    ]}
                    keyboardType="numeric"
                    value={form.actual_weight}
                    onChangeText={(t) => setForm({ ...form, actual_weight: t })}
                  />
                  <Text
                    style={{
                      marginRight: 16,
                      color: COLORS.textGray,
                      fontWeight: "800",
                    }}
                  >
                    kg
                  </Text>
                </View>
              </View>
              <View style={{ flex: 0.6 }}>
                <Text style={CreateWaybillStyles.label}>Tên sản phẩm</Text>
                <TextInput
                  style={CreateWaybillStyles.input}
                  placeholder="Quần áo..."
                  value={form.product_name}
                  onChangeText={(t) => setForm({ ...form, product_name: t })}
                />
              </View>
            </View>

            <View style={CreateWaybillStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>Dài (cm)</Text>
                <TextInput
                  style={CreateWaybillStyles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  value={form.length}
                  onChangeText={(t) =>
                    setForm({ ...form, length: t.replace(/[^0-9.]/g, "") })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>Rộng (cm)</Text>
                <TextInput
                  style={CreateWaybillStyles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  value={form.width}
                  onChangeText={(t) =>
                    setForm({ ...form, width: t.replace(/[^0-9.]/g, "") })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={CreateWaybillStyles.label}>Cao (cm)</Text>
                <TextInput
                  style={CreateWaybillStyles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  value={form.height}
                  onChangeText={(t) =>
                    setForm({ ...form, height: t.replace(/[^0-9.]/g, "") })
                  }
                />
              </View>
            </View>

            <Text style={CreateWaybillStyles.label}>Người thanh toán cước</Text>
            <View style={CreateWaybillStyles.paymentRow}>
              <TouchableOpacity
                style={[
                  CreateWaybillStyles.payBtn,
                  form.payment_method === "SENDER_PAY" &&
                    CreateWaybillStyles.payBtnActive,
                ]}
                onPress={() =>
                  setForm({ ...form, payment_method: "SENDER_PAY" })
                }
              >
                <Text
                  style={[
                    CreateWaybillStyles.payBtnText,
                    form.payment_method === "SENDER_PAY" &&
                      CreateWaybillStyles.payBtnTextActive,
                  ]}
                >
                  Người gửi trả
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  CreateWaybillStyles.payBtn,
                  form.payment_method === "RECEIVER_PAY" &&
                    CreateWaybillStyles.payBtnActive,
                ]}
                onPress={() =>
                  setForm({ ...form, payment_method: "RECEIVER_PAY" })
                }
              >
                <Text
                  style={[
                    CreateWaybillStyles.payBtnText,
                    form.payment_method === "RECEIVER_PAY" &&
                      CreateWaybillStyles.payBtnTextActive,
                  ]}
                >
                  Người nhận trả
                </Text>
              </TouchableOpacity>
            </View>

            <View style={CreateWaybillStyles.codBox}>
              <Text style={CreateWaybillStyles.codLabel}>
                TIỀN THU HỘ (COD)
              </Text>
              <View style={CreateWaybillStyles.rowBetween}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    style={CreateWaybillStyles.codInput}
                    keyboardType="numeric"
                    value={form.cod_amount}
                    onChangeText={(t) =>
                      setForm({ ...form, cod_amount: t.replace(/[^0-9]/g, "") })
                    }
                  />
                  <Text style={CreateWaybillStyles.codCurrency}>VND</Text>
                </View>
                <View style={CreateWaybillStyles.codIconWrap}>
                  <Ionicons name="pencil" size={16} color={COLORS.white} />
                </View>
              </View>
            </View>

            <Text style={CreateWaybillStyles.label}>Ghi chú đơn hàng</Text>
            <TextInput
              style={[CreateWaybillStyles.input, { marginBottom: 0 }]}
              placeholder="Lưu ý khi giao (VD: Hàng dễ vỡ)..."
              value={form.note}
              onChangeText={(t) => setForm({ ...form, note: t })}
            />
          </View>

          <View
            style={CreateWaybillStyles.card}
            onLayout={(e) =>
              (sectionLayouts.current["Dịch vụ"] = e.nativeEvent.layout.y)
            }
          >
            <View style={CreateWaybillStyles.sectionHeader}>
              <View
                style={[
                  CreateWaybillStyles.dot,
                  { backgroundColor: COLORS.secondary },
                ]}
              />
              <Text style={CreateWaybillStyles.sectionTitle}>
                DỊCH VỤ TIỆN ÍCH
              </Text>
            </View>
            {availableServices.length === 0 ? (
              <Text style={{ color: COLORS.textGray, fontStyle: "italic" }}>
                Chưa có dịch vụ tiện ích nào.
              </Text>
            ) : (
              availableServices.map((service) => {
                const isChecked = form.extra_services.includes(
                  service.service_code,
                );
                return (
                  <View
                    key={service.service_code}
                    style={[
                      CreateWaybillStyles.serviceBox,
                      isChecked && CreateWaybillStyles.serviceBoxActive,
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={CreateWaybillStyles.serviceName}>
                        {service.service_name}
                      </Text>
                      <Text style={CreateWaybillStyles.serviceDesc}>
                        Áp dụng phụ phí theo quy định
                      </Text>
                    </View>
                    <Switch
                      value={isChecked}
                      onValueChange={(val) =>
                        val
                          ? setForm({
                              ...form,
                              extra_services: [
                                ...form.extra_services,
                                service.service_code,
                              ],
                            })
                          : setForm({
                              ...form,
                              extra_services: form.extra_services.filter(
                                (item) => item !== service.service_code,
                              ),
                            })
                      }
                      trackColor={{
                        false: COLORS.borderLight,
                        true: COLORS.secondary,
                      }}
                      thumbColor={COLORS.white}
                    />
                  </View>
                );
              })
            )}
          </View>

          <View
            style={[
              CreateWaybillStyles.card,
              { borderColor: COLORS.secondary, borderWidth: 2 },
            ]}
            onLayout={(e) =>
              (sectionLayouts.current["Cước phí"] = e.nativeEvent.layout.y)
            }
          >
            <View style={CreateWaybillStyles.rowBetween}>
              <View
                style={[
                  CreateWaybillStyles.sectionHeader,
                  { marginBottom: 15 },
                ]}
              >
                <Ionicons
                  name="receipt"
                  size={20}
                  color={COLORS.secondary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    CreateWaybillStyles.sectionTitle,
                    { color: COLORS.secondary },
                  ]}
                >
                  TẠM TÍNH CƯỚC
                </Text>
              </View>
              {pricingSource && pricingSource !== "chưa có bảng giá" && (
                <View style={CreateWaybillStyles.badge}>
                  <Text style={CreateWaybillStyles.badgeText}>
                    Bảng giá chuẩn
                  </Text>
                </View>
              )}
            </View>

            {feeLoading && (
              <Text
                style={{
                  color: COLORS.secondary,
                  marginBottom: 15,
                  fontStyle: "italic",
                  fontWeight: "600",
                }}
              >
                Đang tính toán hệ thống...
              </Text>
            )}
            {pricingSource === "chưa có bảng giá" && (
              <Text
                style={{
                  color: COLORS.error,
                  marginBottom: 15,
                  fontWeight: "700",
                }}
              >
                Tuyến này chưa được thiết lập bảng giá.
              </Text>
            )}

            <View style={CreateWaybillStyles.feeRow}>
              <Text style={CreateWaybillStyles.feeLabel}>Cước vận chuyển</Text>
              <Text style={CreateWaybillStyles.feeValue}>
                {fees.main_fee.toLocaleString()} đ
              </Text>
            </View>
            <View style={CreateWaybillStyles.feeRow}>
              <Text style={CreateWaybillStyles.feeLabel}>Phí dịch vụ thêm</Text>
              <Text style={CreateWaybillStyles.feeValue}>
                {fees.extra_fee.toLocaleString()} đ
              </Text>
            </View>
            <View style={CreateWaybillStyles.feeRow}>
              <Text style={CreateWaybillStyles.feeLabel}>
                Phụ phí vùng sâu/xa
              </Text>
              <Text style={CreateWaybillStyles.feeValue}>
                {fees.remote_fee.toLocaleString()} đ
              </Text>
            </View>
            <View style={CreateWaybillStyles.feeRow}>
              <Text style={CreateWaybillStyles.feeLabel}>Thuế VAT (8%)</Text>
              <Text style={CreateWaybillStyles.feeValue}>
                {fees.vat.toLocaleString()} đ
              </Text>
            </View>

            <View style={CreateWaybillStyles.dividerDashed} />

            <View style={[CreateWaybillStyles.feeRow, { marginBottom: 0 }]}>
              <Text style={CreateWaybillStyles.totalLabel}>
                Tổng thanh toán
              </Text>
              <Text style={CreateWaybillStyles.totalValue}>
                {fees.total.toLocaleString()} đ
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={CreateWaybillStyles.bottomFooter}>
          <TouchableOpacity
            style={[
              CreateWaybillStyles.submitBtn,
              (fees.total === 0 || pricingSource === "chưa có bảng giá") && {
                backgroundColor: COLORS.textGray,
                shadowOpacity: 0,
              },
            ]}
            onPress={handleSubmit}
            disabled={
              submitLoading ||
              fees.total === 0 ||
              pricingSource === "chưa có bảng giá"
            }
          >
            {submitLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={COLORS.white}
                  style={{ marginRight: 8 }}
                />
                <Text style={CreateWaybillStyles.submitBtnText}>
                  XÁC NHẬN TẠO VẬN ĐƠN
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Modals --- */}
        {[
          {
            visible: showCustModal,
            setVisible: setShowCustModal,
            title: "Tìm Khách Hàng",
            search: custSearch,
            setSearch: setCustSearch,
            placeholder: "SĐT, Tên, Mã KH...",
            data: filteredCustomers,
            renderItem: ({ item }) => (
              <TouchableOpacity
                style={CreateWaybillStyles.searchItem}
                onPress={() => {
                  setForm({
                    ...form,
                    customer_id: String(item.customer_id),
                    sender_name: item.contact_name || item.name || "",
                    sender_phone: item.contact_phone || item.phone || "",
                    sender_address: item.address || "",
                  });
                  setShowCustModal(false);
                }}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 16,
                    color: COLORS.primary,
                  }}
                >
                  {item.name}
                </Text>
                <Text style={{ color: COLORS.textMuted, marginTop: 4 }}>
                  {item.phone} • {item.customer_code}
                </Text>
              </TouchableOpacity>
            ),
            extraBtn: (
              <TouchableOpacity
                style={CreateWaybillStyles.createNewBtn}
                onPress={() => setShowCreateCustModal(true)}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={COLORS.white}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: COLORS.white,
                    fontWeight: "800",
                    fontSize: 15,
                  }}
                >
                  Thêm Khách Mới
                </Text>
              </TouchableOpacity>
            ),
          },
          {
            visible: showHubModal,
            setVisible: setShowHubModal,
            title: `Tìm Bưu Cục ${hubTarget === "origin" ? "Gửi" : "Nhận"}`,
            search: hubSearch,
            setSearch: setHubSearch,
            placeholder: "Mã BC, Tên BC...",
            data: filteredHubs,
            renderItem: ({ item }) => (
              <TouchableOpacity
                style={CreateWaybillStyles.searchItem}
                onPress={() => {
                  hubTarget === "origin"
                    ? setForm({ ...form, origin_hub_id: String(item.hub_id) })
                    : setForm({ ...form, dest_hub_id: String(item.hub_id) });
                  setShowHubModal(false);
                }}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 16,
                    color: COLORS.primary,
                  }}
                >
                  {item.hub_code}
                </Text>
                <Text style={{ color: COLORS.textMuted, marginTop: 4 }}>
                  {item.hub_name}
                </Text>
              </TouchableOpacity>
            ),
          },
          {
            visible: showProvinceModal,
            setVisible: setShowProvinceModal,
            title: "Tỉnh / Thành phố",
            search: provinceSearch,
            setSearch: setProvinceSearch,
            placeholder: "Tìm Tỉnh/TP...",
            data: provinces.filter((p) =>
              p.name.toLowerCase().includes(provinceSearch.toLowerCase()),
            ),
            renderItem: ({ item }) => (
              <TouchableOpacity
                style={CreateWaybillStyles.searchItem}
                onPress={() => {
                  setReceiverProvince(item);
                  setShowProvinceModal(false);
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    color: COLORS.primary,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ),
          },
          {
            visible: showDistrictModal,
            setVisible: setShowDistrictModal,
            title: "Quận / Huyện",
            search: districtSearch,
            setSearch: setDistrictSearch,
            placeholder: "Tìm Quận/Huyện...",
            data: receiverDistricts.filter((d) =>
              d.name.toLowerCase().includes(districtSearch.toLowerCase()),
            ),
            renderItem: ({ item }) => (
              <TouchableOpacity
                style={CreateWaybillStyles.searchItem}
                onPress={() => {
                  setReceiverDistrict(item);
                  setShowDistrictModal(false);
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    color: COLORS.primary,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ),
          },
          {
            visible: showWardModal,
            setVisible: setShowWardModal,
            title: "Phường / Xã",
            search: wardSearch,
            setSearch: setWardSearch,
            placeholder: "Tìm Phường/Xã...",
            data: receiverWards.filter((w) =>
              w.name.toLowerCase().includes(wardSearch.toLowerCase()),
            ),
            renderItem: ({ item }) => (
              <TouchableOpacity
                style={CreateWaybillStyles.searchItem}
                onPress={() => {
                  setReceiverWard(item);
                  setShowWardModal(false);
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    color: COLORS.primary,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ),
          },
        ].map((modal, idx) => (
          <Modal
            key={idx}
            visible={modal.visible}
            animationType="slide"
            transparent
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <TouchableOpacity
                style={CreateWaybillStyles.modalOverlay}
                activeOpacity={1}
                onPress={() => modal.setVisible(false)}
              >
                <View
                  style={CreateWaybillStyles.modalContainer}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={CreateWaybillStyles.sheetHandle} />
                  <View style={CreateWaybillStyles.modalHeader}>
                    <Text style={CreateWaybillStyles.modalTitle}>
                      {modal.title}
                    </Text>
                    <TouchableOpacity onPress={() => modal.setVisible(false)}>
                      <Ionicons name="close-circle" size={28} color="#D1D5DB" />
                    </TouchableOpacity>
                  </View>
                  <View style={CreateWaybillStyles.searchWrap}>
                    <Ionicons name="search" size={20} color={COLORS.textGray} />
                    <TextInput
                      style={{
                        flex: 1,
                        height: 50,
                        paddingLeft: 10,
                        fontSize: 15,
                        fontWeight: "500",
                      }}
                      placeholder={modal.placeholder}
                      value={modal.search}
                      onChangeText={modal.setSearch}
                    />
                  </View>
                  <FlatList
                    data={modal.data}
                    keyExtractor={(item, index) =>
                      String(
                        item.id ||
                          item.code ||
                          item.customer_id ||
                          item.hub_id ||
                          index,
                      )
                    }
                    keyboardShouldPersistTaps="handled"
                    renderItem={modal.renderItem}
                    ListEmptyComponent={
                      <Text
                        style={{
                          textAlign: "center",
                          marginTop: 20,
                          color: COLORS.textGray,
                          fontWeight: "500",
                        }}
                      >
                        Không tìm thấy.
                      </Text>
                    }
                  />
                  {modal.extraBtn}
                </View>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Modal>
        ))}

        {/* Create Customer Modal */}
        <Modal visible={showCreateCustModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={CreateWaybillStyles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCreateCustModal(false)}
            >
              <View
                style={CreateWaybillStyles.modalContainer}
                onStartShouldSetResponder={() => true}
              >
                <View style={CreateWaybillStyles.sheetHandle} />
                <View style={CreateWaybillStyles.modalHeader}>
                  <Text style={CreateWaybillStyles.modalTitle}>
                    Thêm Khách Hàng
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCreateCustModal(false)}
                  >
                    <Ionicons name="close-circle" size={28} color="#D1D5DB" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={CreateWaybillStyles.label}>
                    Tên Shop / Người gửi{" "}
                    <Text style={CreateWaybillStyles.req}>*</Text>
                  </Text>
                  <TextInput
                    style={CreateWaybillStyles.input}
                    placeholder="Nhập tên..."
                    value={newCustForm.name}
                    onChangeText={(t) =>
                      setNewCustForm({ ...newCustForm, name: t })
                    }
                  />
                  <Text style={CreateWaybillStyles.label}>
                    Số điện thoại <Text style={CreateWaybillStyles.req}>*</Text>
                  </Text>
                  <TextInput
                    style={CreateWaybillStyles.input}
                    placeholder="Nhập 10 số..."
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={newCustForm.phone}
                    onChangeText={(t) =>
                      setNewCustForm({
                        ...newCustForm,
                        phone: t.replace(/[^0-9]/g, ""),
                      })
                    }
                  />
                  <Text style={CreateWaybillStyles.label}>Địa chỉ</Text>
                  <TextInput
                    style={[
                      CreateWaybillStyles.input,
                      { height: 80, textAlignVertical: "top" },
                    ]}
                    placeholder="Địa chỉ cửa hàng..."
                    multiline
                    value={newCustForm.address}
                    onChangeText={(t) =>
                      setNewCustForm({ ...newCustForm, address: t })
                    }
                  />
                  <TouchableOpacity
                    style={[
                      CreateWaybillStyles.submitBtn,
                      { marginTop: 10, marginBottom: 20 },
                    ]}
                    onPress={handleCreateCustomer}
                    disabled={isCreatingCust}
                  >
                    {isCreatingCust ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={CreateWaybillStyles.submitBtnText}>
                        LƯU THÔNG TIN
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
