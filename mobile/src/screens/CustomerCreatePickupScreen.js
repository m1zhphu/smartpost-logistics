import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import styles from "../styles/CustomerCreatePickupScreenStyles";
import {
  clearPickupDraft,
  createCustomerPickup,
  getPickupDraft,
  savePickupDraft,
  upsertPickupDraft,
  fetchExtraServices,
  simulatePrice,
  saveToRecipientBook,
} from "../services/pickupService";

const PRIMARY = COLORS.primary || "#1B5E20";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const buildFullAddress = (detail, ward, district, province) =>
  [detail, ward?.name, district?.name, province?.name]
    .filter(Boolean)
    .join(", ");

// ─── Autocomplete Input Component ──────────────────────────────────────────
const AutocompleteInput = ({
  value,
  onChangeText,
  placeholder,
  data,
  onSelect,
  disabled,
  zIndex,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = data.filter((item) =>
    normalizeText(item.name).includes(normalizeText(value))
  );

  return (
    <View style={{ position: "relative", zIndex, marginBottom: 16 }}>
      <TextInput
        style={[styles.input, { marginBottom: 0 }, disabled && { opacity: 0.5, backgroundColor: COLORS.surfaceMuted }]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (!disabled) setShowDropdown(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={!disabled}
      />
      {showDropdown && filtered.length > 0 && !disabled && (
        <View style={styles.dropdownContainer}>
          {filtered.slice(0, 5).map((item, index) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.dropdownItem,
                index === filtered.slice(0, 5).length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
              onPress={() => {
                onSelect(item);
                setShowDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── SelectModal for Services and Payment ────────────────────────────────
const SelectModal = ({ visible, title, data, onSelect, onClose }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.code)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.modalItem, index === data.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={styles.headerButton}
        activeOpacity={0.78}
    >
        <View style={styles.headerButtonInner}>
            <Ionicons name={icon} size={24} color={COLORS.white} />
        </View>
    </TouchableOpacity>
);

// ─── Main Component ────────────────────────────────────────────────────────
export default function CustomerCreatePickupScreen({ navigation }) {
  const { user } = useUser();

  // Basic Sender
  const [sName, setSName] = useState(user?.full_name || "");
  const [sPhone, setSPhone] = useState(user?.phone_number || "");
  const [sAddressDetail, setSAddressDetail] = useState(
    user?.street_address || user?.address || ""
  );

  // Sender Location Objects
  const [sProvince, setSProvince] = useState(null);
  const [sDistrict, setSDistrict] = useState(null);
  const [sWard, setSWard] = useState(null);

  // Sender Text Queries
  const [sProvinceQuery, setSProvinceQuery] = useState("");
  const [sDistrictQuery, setSDistrictQuery] = useState("");
  const [sWardQuery, setSWardQuery] = useState("");

  // Sender Data Lists
  const [sDistrictsData, setSDistrictsData] = useState([]);
  const [sWardsData, setSWardsData] = useState([]);

  // Basic Receiver
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rAddressDetail, setRAddressDetail] = useState("");

  // Receiver Location Objects
  const [rProvince, setRProvince] = useState(null);
  const [rDistrict, setRDistrict] = useState(null);
  const [rWard, setRWard] = useState(null);

  // Receiver Text Queries
  const [rProvinceQuery, setRProvinceQuery] = useState("");
  const [rDistrictQuery, setRDistrictQuery] = useState("");
  const [rWardQuery, setRWardQuery] = useState("");

  // Receiver Data Lists
  const [rDistrictsData, setRDistrictsData] = useState([]);
  const [rWardsData, setRWardsData] = useState([]);

  // Other Fields
  const [itemName, setItemName] = useState("");
  const [itemWeight, setItemWeight] = useState("0.5");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [codAmount, setCodAmount] = useState("");
  const [note, setNote] = useState("");
  const [packageType, setPackageType] = useState("goods");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("SENDER_DEBT");
  const [serviceType, setServiceType] = useState("STANDARD");
  const [extraServices, setExtraServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [simulateResult, setSimulateResult] = useState(null);
  const [simulateError, setSimulateError] = useState("");
  const [simulateLoading, setSimulateLoading] = useState(false);

  const [provincesData, setProvincesData] = useState([]);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: "", data: [], onSelect: null });
  const [loading, setLoading] = useState(false);
  const draftHydratedRef = useRef(false);

  useEffect(() => {
    fetchProvinces();
    loadDraft();
    loadExtraServices();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const hasMeaningfulContent = rName || rPhone || rAddressDetail || itemName;
      if (!hasMeaningfulContent) {
        return;
      }
      
      e.preventDefault();

      Alert.alert(
        "Cảnh báo thoát",
        "Bạn đang tạo đơn hàng. Bạn có chắc chắn muốn thoát? Các dữ liệu chưa lưu sẽ bị mất.",
        [
          { text: "Hủy", style: "cancel", onPress: () => {} },
          {
            text: "Thoát",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, rName, rPhone, rAddressDetail, itemName]);

  const loadExtraServices = async () => {
    const res = await fetchExtraServices();
    if (res.success) {
      setAvailableServices(res.data);
    }
  };

  // Sync state for local storage draft
  useEffect(() => {
    if (!draftHydratedRef.current) return;
    const hasContent =
      sName || sPhone || sAddressDetail || sProvince || sDistrict || sWard ||
      rName || rPhone || rAddressDetail || rProvince || rDistrict || rWard ||
      itemName || itemWeight || itemQuantity || codAmount || note || length || width || height;

    if (!hasContent) {
      clearPickupDraft();
      return;
    }

    savePickupDraft({
      sName, sPhone, sAddressDetail,
      sProvince, sDistrict, sWard,
      sProvinceQuery, sDistrictQuery, sWardQuery,
      rName, rPhone, rAddressDetail,
      rProvince, rDistrict, rWard,
      rProvinceQuery, rDistrictQuery, rWardQuery,
      itemName, itemWeight, itemQuantity, codAmount, note, packageType,
      length, width, height, paymentMethod, serviceType,
    });
  }, [
    sName, sPhone, sAddressDetail, sProvince, sDistrict, sWard, sProvinceQuery, sDistrictQuery, sWardQuery,
    rName, rPhone, rAddressDetail, rProvince, rDistrict, rWard, rProvinceQuery, rDistrictQuery, rWardQuery,
    itemName, itemWeight, itemQuantity, codAmount, note, packageType, length, width, height, paymentMethod, serviceType,
  ]);

  const fetchProvinces = async () => {
    try {
      const response = await fetch("https://provinces.open-api.vn/api/");
      const data = await response.json();
      setProvincesData(data);

      if (user?.province_id || user?.province) {
        const matchedProv = data.find(
          (p) => p.code == user.province_id || p.name === user.province
        );
        if (matchedProv) {
          handleSelectSProvince(matchedProv);
        }
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách tỉnh:", error);
    }
  };

  const fetchDistricts = async (provinceCode) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await response.json();
      return data.districts || [];
    } catch (error) {
      console.error("Lỗi lấy danh sách huyện:", error);
      return [];
    }
  };

  const fetchWards = async (districtCode) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await response.json();
      return data.wards || [];
    } catch (error) {
      console.error("Lỗi lấy danh sách xã:", error);
      return [];
    }
  };

  // ─── Selection Handlers ──────────────────────────────────────────────────
  const handleSelectSProvince = async (prov) => {
    setSProvince(prov);
    setSProvinceQuery(prov.name);
    setSDistrict(null);
    setSDistrictQuery("");
    setSWard(null);
    setSWardQuery("");
    setSDistrictsData([]);
    setSWardsData([]);
    const dists = await fetchDistricts(prov.code);
    setSDistrictsData(dists);
  };

  const handleSelectSDistrict = async (dist) => {
    setSDistrict(dist);
    setSDistrictQuery(dist.name);
    setSWard(null);
    setSWardQuery("");
    setSWardsData([]);
    const wards = await fetchWards(dist.code);
    setSWardsData(wards);
  };

  const handleSelectSWard = (ward) => {
    setSWard(ward);
    setSWardQuery(ward.name);
  };

  const handleSelectRProvince = async (prov) => {
    setRProvince(prov);
    setRProvinceQuery(prov.name);
    setRDistrict(null);
    setRDistrictQuery("");
    setRWard(null);
    setRWardQuery("");
    setRDistrictsData([]);
    setRWardsData([]);
    const dists = await fetchDistricts(prov.code);
    setRDistrictsData(dists);
  };

  const handleSelectRDistrict = async (dist) => {
    setRDistrict(dist);
    setRDistrictQuery(dist.name);
    setRWard(null);
    setRWardQuery("");
    setRWardsData([]);
    const wards = await fetchWards(dist.code);
    setRWardsData(wards);
  };

  const handleSelectRWard = (ward) => {
    setRWard(ward);
    setRWardQuery(ward.name);
  };

  const loadDraft = async () => {
    const draft = await getPickupDraft();
    if (!draft) {
      draftHydratedRef.current = true;
      return;
    }
    Alert.alert(
      "Phục hồi nháp",
      "Bạn có một đơn hàng đang tạo dở, bạn có muốn tiếp tục?",
      [
        {
          text: "Bỏ qua",
          style: "cancel",
          onPress: () => {
            clearPickupDraft();
            draftHydratedRef.current = true;
          },
        },
        {
          text: "Tiếp tục",
          onPress: async () => {
            setSName(draft.sName || user?.full_name || "");
            setSPhone(draft.sPhone || user?.phone_number || "");
            setSAddressDetail(draft.sAddressDetail || user?.street_address || user?.address || "");
            
            if (draft.sProvince) {
                setSProvince(draft.sProvince);
                setSProvinceQuery(draft.sProvinceQuery || draft.sProvince.name);
                const dists = await fetchDistricts(draft.sProvince.code);
                setSDistrictsData(dists);
            }
            if (draft.sDistrict) {
                setSDistrict(draft.sDistrict);
                setSDistrictQuery(draft.sDistrictQuery || draft.sDistrict.name);
                const wards = await fetchWards(draft.sDistrict.code);
                setSWardsData(wards);
            }
            if (draft.sWard) {
                setSWard(draft.sWard);
                setSWardQuery(draft.sWardQuery || draft.sWard.name);
            }

            setRName(draft.rName || "");
            setRPhone(draft.rPhone || "");
            setRAddressDetail(draft.rAddressDetail || "");
            
            if (draft.rProvince) {
                setRProvince(draft.rProvince);
                setRProvinceQuery(draft.rProvinceQuery || draft.rProvince.name);
                const dists = await fetchDistricts(draft.rProvince.code);
                setRDistrictsData(dists);
            }
            if (draft.rDistrict) {
                setRDistrict(draft.rDistrict);
                setRDistrictQuery(draft.rDistrictQuery || draft.rDistrict.name);
                const wards = await fetchWards(draft.rDistrict.code);
                setRWardsData(wards);
            }
            if (draft.rWard) {
                setRWard(draft.rWard);
                setRWardQuery(draft.rWardQuery || draft.rWard.name);
            }

            setItemName(draft.itemName || "");
            setItemWeight(draft.itemWeight ? String(draft.itemWeight) : "0.5");
            setItemQuantity(draft.itemQuantity ? String(draft.itemQuantity) : "1");
            setCodAmount(draft.codAmount ? String(draft.codAmount) : "");
            setNote(draft.note || "");
            setPackageType(draft.packageType || "goods");
            setLength(draft.length ? String(draft.length) : "");
            setWidth(draft.width ? String(draft.width) : "");
            setHeight(draft.height ? String(draft.height) : "");
            setPaymentMethod(draft.paymentMethod || "SENDER_DEBT");
            setServiceType(draft.serviceType || "STANDARD");
            setExtraServices(draft.extraServices || []);

            draftHydratedRef.current = true;
          },
        },
      ]
    );
  };

  const buildPayload = (saveAsDraft = false) => ({
    order_type: "DOMESTIC",
    pickup_time: new Date().toISOString(),
    sender: {
      name: sName,
      phone: sPhone,
      address: buildFullAddress(sAddressDetail, sWard, sDistrict, sProvince),
      province_id: sProvince?.code || null,
      district_id: sDistrict?.code || null,
      ward_id: sWard?.code || null,
      province_name: sProvince?.name || "",
      district_name: sDistrict?.name || "",
      ward_name: sWard?.name || "",
    },
    receiver: {
      name: rName,
      phone: rPhone,
      address: buildFullAddress(rAddressDetail, rWard, rDistrict, rProvince),
      province_id: rProvince?.code || null,
      district_id: rDistrict?.code || null,
      ward_id: rWard?.code || null,
      province_name: rProvince?.name || "",
      district_name: rDistrict?.name || "",
      ward_name: rWard?.name || "",
    },
    items: [
      {
        product_group: packageType === "goods" ? "PARCEL" : "DOCUMENT",
        product_name: packageType === "goods" ? itemName || "Hàng hóa" : "Thư từ / Tài liệu",
        description: note || (packageType === "goods" ? itemName || "Hàng hóa" : "Tài liệu"),
        weight: parseFloat(itemWeight) || (packageType === "letter" ? 0.1 : 0.5),
        length: packageType === "goods" ? parseFloat(length) || 0 : 0,
        width: packageType === "goods" ? parseFloat(width) || 0 : 0,
        height: packageType === "goods" ? parseFloat(height) || 0 : 0,
        quantity: parseInt(itemQuantity, 10) || 1,
        declared_value: 0,
      },
    ],
    documents: [],
    cod_amount: parseFloat(codAmount) || 0,
    cod_receiver_pays_fee: false,
    service_type: serviceType,
    extra_services: extraServices.map(code => {
      const svc = availableServices.find(s => s.service_code === code);
      return {
        service_code: code,
        service_name: svc ? svc.service_name : "",
        service_fee: svc ? (svc.fee_type === 'FIXED' ? svc.fee_value : 0) : 0
      };
    }),
    delivery_note_option: "CHO_XEM_HANG",
    note,
    payment_method: paymentMethod,
    pickup_method: "OUR_STAFF_PICKUP",
    delivery_method: "OUR_STAFF_DELIVERY",
    save_as_draft: saveAsDraft,
  });

  const buildDraftSnapshot = () => ({
    sName, sPhone, sAddressDetail,
    sProvince, sDistrict, sWard,
    sProvinceQuery, sDistrictQuery, sWardQuery,
    rName, rPhone, rAddressDetail,
    rProvince, rDistrict, rWard,
    rProvinceQuery, rDistrictQuery, rWardQuery,
    itemName, itemWeight, itemQuantity, codAmount, note, packageType,
    length, width, height, paymentMethod, serviceType, extraServices,
    created_at: new Date().toISOString(),
    draft_title: rName || itemName || "Nháp pickup",
  });

  const handleSaveDraft = async () => {
    setLoading(true);
    const result = await upsertPickupDraft(buildDraftSnapshot());
    setLoading(false);
    if (result.success) {
      await clearPickupDraft();
      Toast.show({ type: "success", text1: "Đã lưu nháp trên thiết bị" });
      navigation.navigate("CustomerPickupDrafts");
    } else {
      Toast.show({
        type: "error",
        text1: "Không lưu được nháp",
        text2: result.message,
      });
    }
  };

  const handleConfirm = async () => {
    if (!rName || !rPhone || !rAddressDetail || !sPhone || !sProvince || !sDistrict || !sAddressDetail || !rProvince || !rDistrict) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ Tỉnh/Huyện và thông tin bắt buộc.",
      });
      return;
    }
    setLoading(true);
    const payload = buildPayload(false);
    const result = await createCustomerPickup(payload);
    setLoading(false);
    if (result.success) {
      // Save recipient to book automatically
      if (user?.user_id) {
        saveToRecipientBook(user.user_id, {
          name: rName,
          phone: rPhone,
          province_id: rProvince?.code,
          district_id: rDistrict?.code,
          ward_id: rWard?.code,
          province_name: rProvince?.name,
          district_name: rDistrict?.name,
          ward_name: rWard?.name,
          address_detail: rAddressDetail
        });
      }

      await clearPickupDraft();
      Toast.show({
        type: "success",
        text1: "Tạo yêu cầu thành công",
        text2: `Mã vận đơn: ${result.data?.waybill_code || "Đã tạo"}`,
      });
      navigation.goBack();
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi tạo đơn",
        text2: result.message,
      });
    }
  };

  const handleSelectRecipient = async (item) => {
    setRName(item.name || "");
    setRPhone(item.phone || "");
    setRAddressDetail(item.address_detail || "");
    
    // Attempt to match the saved location names to current provincesData
    if (item.province_name) {
      const matchProv = provincesData.find(p => p.name === item.province_name || p.code == item.province_id);
      if (matchProv) {
        setRProvince(matchProv);
        setRProvinceQuery(matchProv.name);
        const dists = await fetchDistricts(matchProv.code);
        setRDistrictsData(dists);

        if (item.district_name) {
          const matchDist = dists.find(d => d.name === item.district_name || d.code == item.district_id);
          if (matchDist) {
            setRDistrict(matchDist);
            setRDistrictQuery(matchDist.name);
            const wards = await fetchWards(matchDist.code);
            setRWardsData(wards);

            if (item.ward_name) {
              const matchWard = wards.find(w => w.name === item.ward_name || w.code == item.ward_id);
              if (matchWard) {
                setRWard(matchWard);
                setRWardQuery(matchWard.name);
              }
            }
          }
        }
      }
    }
  };

  // ─── Simulate Price ────────────────────────────────────────────────────────
  let simulateTimeout = useRef(null);

  const debouncedSimulate = () => {
    if (simulateTimeout.current) clearTimeout(simulateTimeout.current);
    simulateTimeout.current = setTimeout(triggerSimulation, 500);
  };

  const triggerSimulation = async () => {
    if (!sProvince || !rProvince) {
      setSimulateResult(null);
      return;
    }
    const weightVal = parseFloat(itemWeight) || (packageType === "letter" ? 0.1 : 0);
    if (!weightVal) {
      setSimulateResult(null);
      setSimulateError("");
      return;
    }

    setSimulateLoading(true);
    setSimulateError("");
    const payload = {
      origin_province_id: Number(sProvince.code),
      dest_province_id: Number(rProvince.code),
      weight: weightVal,
      length: packageType === "goods" ? parseFloat(length) || 0 : 0,
      width: packageType === "goods" ? parseFloat(width) || 0 : 0,
      height: packageType === "goods" ? parseFloat(height) || 0 : 0,
      service_type: serviceType,
      cod_amount: parseFloat(codAmount) || 0,
      extra_services: extraServices,
    };

    const res = await simulatePrice(payload);
    setSimulateLoading(false);
    if (res.success && res.data?.status === 'SUCCESS') {
      setSimulateResult(res.data);
    } else {
      setSimulateResult(null);
      setSimulateError(res.message || "Tuyến đường này chưa được cấu hình giá cước.");
    }
  };

  useEffect(() => {
    if (draftHydratedRef.current) {
      debouncedSimulate();
    }
  }, [sProvince, rProvince, itemWeight, packageType, length, width, height, serviceType, codAmount, extraServices]);

  const toggleExtraService = (code) => {
    if (extraServices.includes(code)) {
      setExtraServices(extraServices.filter(s => s !== code));
    } else {
      setExtraServices([...extraServices, code]);
    }
  };

  const openModal = (type) => {
    const SERVICE_OPTIONS = [
      { code: "STANDARD", name: "Tiêu chuẩn (STANDARD)" },
      { code: "CPN", name: "Chuyển phát nhanh (CPN)" },
      { code: "HT", name: "Hỏa tốc (HT)" },
    ];
    const PAYMENT_OPTIONS = [
      { code: "SENDER_DEBT", name: "Shop trả cước cuối tháng" },
      { code: "SENDER_PAY", name: "Shop trả ngay khi gửi" },
      { code: "RECEIVER_PAY", name: "Người nhận trả cước" },
    ];

    if (type === "serviceType") {
      setModalConfig({
        visible: true,
        title: "Chọn dịch vụ",
        data: SERVICE_OPTIONS,
        onSelect: (v) => setServiceType(v.code),
      });
    } else if (type === "paymentMethod") {
      setModalConfig({
        visible: true,
        title: "Hình thức thanh toán",
        data: PAYMENT_OPTIONS,
        onSelect: (v) => setPaymentMethod(v.code),
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tạo lấy hàng</Text>
          <Text style={styles.headerSubtitle}>Điền thông tin đơn mới</Text>
        </View>
        <TouchableOpacity onPress={handleSaveDraft} style={styles.draftPill}>
          <Ionicons name="save-outline" size={16} color="white" style={{ marginRight: 4 }} />
          <Text style={styles.draftText}>Lưu nháp</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={120}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>1. NGƯỜI GỬI</Text>
        <View style={[styles.card, { zIndex: 30 }]}>
          <Text style={styles.inputLabel}>Họ tên người gửi</Text>
          <TextInput
            style={styles.input}
            value={sName}
            onChangeText={setSName}
            placeholder="Nhập họ tên"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={sPhone}
            onChangeText={setSPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.inputLabel}>Tỉnh / Thành phố</Text>
          <AutocompleteInput
            value={sProvinceQuery}
            onChangeText={(t) => { setSProvinceQuery(t); setSProvince(null); }}
            placeholder="Chọn Tỉnh / Thành phố"
            data={provincesData}
            onSelect={handleSelectSProvince}
            zIndex={30}
          />
          <Text style={styles.inputLabel}>Quận / Huyện</Text>
          <AutocompleteInput
            value={sDistrictQuery}
            onChangeText={(t) => { setSDistrictQuery(t); setSDistrict(null); }}
            placeholder="Chọn Quận / Huyện"
            data={sDistrictsData}
            onSelect={handleSelectSDistrict}
            disabled={!sProvince}
            zIndex={20}
          />
          <Text style={styles.inputLabel}>Phường / Xã</Text>
          <AutocompleteInput
            value={sWardQuery}
            onChangeText={(t) => { setSWardQuery(t); setSWard(null); }}
            placeholder="Chọn Phường / Xã"
            data={sWardsData}
            onSelect={handleSelectSWard}
            disabled={!sDistrict}
            zIndex={10}
          />
          <Text style={styles.inputLabel}>Địa chỉ chi tiết (Số nhà, đường...)</Text>
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: "top", marginBottom: 0 }]}
            value={sAddressDetail}
            onChangeText={setSAddressDetail}
            placeholder="Nhập địa chỉ chi tiết"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, { color: COLORS.primary, marginBottom: 0 }]}>2. NGƯỜI NHẬN</Text>
          <TouchableOpacity onPress={() => navigation.navigate("CustomerRecipients", { isSelectMode: true, onSelect: handleSelectRecipient })}>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+ Sổ địa chỉ</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { zIndex: 20 }]}>
          <Text style={styles.inputLabel}>Họ tên người nhận *</Text>
          <TextInput
            style={styles.input}
            value={rName}
            onChangeText={setRName}
            placeholder="Nhập họ tên"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.inputLabel}>Số điện thoại *</Text>
          <TextInput
            style={styles.input}
            value={rPhone}
            onChangeText={setRPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.inputLabel}>Tỉnh / Thành phố *</Text>
          <AutocompleteInput
            value={rProvinceQuery}
            onChangeText={(t) => { setRProvinceQuery(t); setRProvince(null); }}
            placeholder="Chọn Tỉnh / Thành phố"
            data={provincesData}
            onSelect={handleSelectRProvince}
            zIndex={30}
          />
          <Text style={styles.inputLabel}>Quận / Huyện *</Text>
          <AutocompleteInput
            value={rDistrictQuery}
            onChangeText={(t) => { setRDistrictQuery(t); setRDistrict(null); }}
            placeholder="Chọn Quận / Huyện"
            data={rDistrictsData}
            onSelect={handleSelectRDistrict}
            disabled={!rProvince}
            zIndex={20}
          />
          <Text style={styles.inputLabel}>Phường / Xã</Text>
          <AutocompleteInput
            value={rWardQuery}
            onChangeText={(t) => { setRWardQuery(t); setRWard(null); }}
            placeholder="Chọn Phường / Xã"
            data={rWardsData}
            onSelect={handleSelectRWard}
            disabled={!rDistrict}
            zIndex={10}
          />
          <Text style={styles.inputLabel}>Địa chỉ chi tiết *</Text>
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: "top", marginBottom: 0 }]}
            value={rAddressDetail}
            onChangeText={setRAddressDetail}
            placeholder="Nhập địa chỉ chi tiết"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>3. HÀNG HÓA & THANH TOÁN</Text>
        <View style={[styles.card, { zIndex: 10 }]}>
          <Text style={styles.inputLabel}>Loại hàng hóa</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioBtn, packageType === "goods" && styles.radioBtnActive]}
              onPress={() => setPackageType("goods")}
            >
              <Text style={[styles.radioText, packageType === "goods" && styles.radioTextActive]}>Hàng hóa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioBtn, packageType === "letter" && styles.radioBtnActive]}
              onPress={() => setPackageType("letter")}
            >
              <Text style={[styles.radioText, packageType === "letter" && styles.radioTextActive]}>Tài liệu</Text>
            </TouchableOpacity>
          </View>

          {packageType === "goods" ? (
            <>
              <Text style={styles.inputLabel}>Tên hàng hóa</Text>
              <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="Ví dụ: Quần áo, sách..." placeholderTextColor="#94A3B8" />
              <Text style={styles.inputLabel}>Trọng lượng (kg)</Text>
              <TextInput style={styles.input} value={itemWeight} onChangeText={setItemWeight} placeholder="Ví dụ: 0.5" keyboardType="decimal-pad" placeholderTextColor="#94A3B8" />
              <Text style={styles.inputLabel}>Số lượng</Text>
              <TextInput style={styles.input} value={itemQuantity} onChangeText={setItemQuantity} placeholder="Ví dụ: 1" keyboardType="number-pad" placeholderTextColor="#94A3B8" />
              <Text style={styles.inputLabel}>Kích thước (cm)</Text>
              <View style={styles.rowInputs}>
                <TextInput style={[styles.input, styles.flexInput, styles.spacedInput]} value={length} onChangeText={setLength} placeholder="Dài" keyboardType="number-pad" placeholderTextColor="#94A3B8" />
                <TextInput style={[styles.input, styles.flexInput, styles.spacedInput]} value={width} onChangeText={setWidth} placeholder="Rộng" keyboardType="number-pad" placeholderTextColor="#94A3B8" />
                <TextInput style={[styles.input, styles.flexInput]} value={height} onChangeText={setHeight} placeholder="Cao" keyboardType="number-pad" placeholderTextColor="#94A3B8" />
              </View>
            </>
          ) : (
            <Text style={{ fontSize: 13, color: "#94A3B8", marginBottom: 15, fontStyle: "italic" }}>
              Tài liệu mặc định là 0.1kg và không cần kích thước.
            </Text>
          )}

          <Text style={styles.inputLabel}>Dịch vụ vận chuyển</Text>
          <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("serviceType")}>
            <Text style={styles.selectionText}>
              {serviceType === "STANDARD" ? "Tiêu chuẩn (STANDARD)" : serviceType === "CPN" ? "Chuyển phát nhanh (CPN)" : "Hỏa tốc (HT)"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Tiền thu hộ (COD)</Text>
          <TextInput style={styles.input} value={codAmount} onChangeText={setCodAmount} placeholder="Nhập số tiền (VNĐ)" keyboardType="number-pad" placeholderTextColor="#94A3B8" />

          <Text style={styles.inputLabel}>Thanh toán cước phí</Text>
          <TouchableOpacity style={styles.selectionBox} onPress={() => openModal("paymentMethod")}>
            <Text style={styles.selectionText}>
              {paymentMethod === "SENDER_DEBT" ? "Shop trả cước cuối tháng" : paymentMethod === "SENDER_PAY" ? "Shop trả ngay khi gửi" : "Người nhận trả cước"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <Text style={styles.inputLabel}>Ghi chú</Text>
          <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: "top", marginBottom: 0 }]} value={note} onChangeText={setNote} placeholder="Ghi chú thêm..." placeholderTextColor="#94A3B8" multiline numberOfLines={3} />
          
          {availableServices.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <Text style={styles.inputLabel}>Dịch vụ gia tăng</Text>
              {availableServices.map(svc => {
                const isSelected = extraServices.includes(svc.service_code);
                const priceText = svc.fee_type === "FIXED" ? `+${svc.fee_value.toLocaleString("vi-VN")}đ` : `+${svc.fee_value}%`;
                return (
                  <TouchableOpacity 
                    key={svc.service_code} 
                    style={styles.checkboxRow}
                    onPress={() => toggleExtraService(svc.service_code)}
                  >
                    <Ionicons 
                      name={isSelected ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={isSelected ? COLORS.primary : "#94A3B8"} 
                    />
                    <Text style={[styles.checkboxLabel, isSelected && { color: COLORS.primary }]}>
                      {svc.service_name} <Text style={{ color: isSelected ? COLORS.primary : "#64748B", fontWeight: "bold" }}>({priceText})</Text>
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        {/* Cước phí dự kiến */}
        <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>4. ƯỚC TÍNH CƯỚC PHÍ</Text>
        <View style={[styles.card, { zIndex: 5 }]}>
          {simulateLoading ? (
            <Text style={{ textAlign: "center", color: "#64748B", padding: 15, fontWeight: "700" }}>Đang tính cước phí...</Text>
          ) : simulateError ? (
            <View style={{ padding: 10, alignItems: "center" }}>
              <Ionicons name="warning" size={28} color="#EAB308" style={{ marginBottom: 5 }} />
              <Text style={{ color: "#EAB308", fontWeight: "700", textAlign: "center", fontSize: 14 }}>{simulateError}</Text>
            </View>
          ) : simulateResult ? (
            <View>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Cước chính:</Text>
                <Text style={styles.billingValue}>{simulateResult.main_fee?.toLocaleString()} đ</Text>
              </View>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Phí DV gia tăng:</Text>
                <Text style={styles.billingValue}>{simulateResult.extra_fee?.toLocaleString()} đ</Text>
              </View>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>Thuế VAT (8%):</Text>
                <Text style={styles.billingValue}>{simulateResult.vat_8?.toLocaleString()} đ</Text>
              </View>
              <View style={{ height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 }} />
              <View style={styles.billingRow}>
                <Text style={[styles.billingLabel, { fontWeight: "900", color: COLORS.textPrimary }]}>TỔNG CỘNG TẠM TÍNH:</Text>
                <Text style={[styles.billingValue, { fontWeight: "900", color: COLORS.primary, fontSize: 16 }]}>{simulateResult.grand_total?.toLocaleString()} đ</Text>
              </View>
              <Text style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 12, fontWeight: "700" }}>* Cước phí thực tế sẽ được cập nhật sau khi bưu cục cân đo hàng hóa.</Text>
            </View>
          ) : (
            <View style={{ padding: 10, alignItems: "center" }}>
              <Ionicons name="information-circle-outline" size={28} color="#94A3B8" style={{ marginBottom: 5 }} />
              <Text style={{ color: "#64748B", textAlign: "center", fontSize: 13, fontWeight: "700" }}>Vui lòng điền địa chỉ người gửi, người nhận và khối lượng để xem cước phí dự kiến.</Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.confirmBtnText}>{loading ? "ĐANG XỬ LÝ..." : "TẠO ĐƠN HÀNG"}</Text>
        </TouchableOpacity>
      </View>

      <SelectModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        data={modalConfig.data}
        onSelect={modalConfig.onSelect}
        onClose={() => setModalConfig({ ...modalConfig, visible: false })}
      />
    </View>
  );
}

/*
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
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
    ...Platform.select({
        ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
        android: { elevation: 8 }
    }),
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1, paddingHorizontal: 10 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, fontWeight: "700" },
  draftPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  draftText: { color: "white", fontSize: 13, fontWeight: "800" },
  scrollContent: { padding: 16, paddingBottom: 140 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 12,
    marginTop: 20,
    marginLeft: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
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
    marginBottom: 16,
  },
  selectionText: { color: "#0F172A", fontSize: 15, fontWeight: "600" },
  dropdownContainer: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 4 }
    }),
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: { fontSize: 15, color: "#0F172A", fontWeight: "600" },
  rowInputs: { flexDirection: "row", justifyContent: "space-between" },
  flexInput: { flex: 1 },
  spacedInput: { marginRight: 12 },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
  },
  radioBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  radioBtnActive: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  },
  radioText: { color: "#64748B", fontSize: 14, fontWeight: "700" },
  radioTextActive: { color: PRIMARY, fontWeight: "900" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600"
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  billingLabel: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700"
  },
  billingValue: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 8 }
    })
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 }
    })
  },
  modalHandle: {
    width: 42,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemText: { fontSize: 16, color: "#0F172A", fontWeight: "600" },
});
*/
