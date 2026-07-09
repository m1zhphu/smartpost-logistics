import React, { useEffect, useMemo, useRef, useState } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { Animated, Easing, Modal, Text, TextInput, TouchableOpacity, View, Switch } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { useUser } from "../context/UserContext";
import styles from "../styles/CustomerCreatePickupScreenStyles";
import {
  clearPickupDraft,
  createCustomerBulkMailPickup,
  getPickupDraft,
  getCustomerDepartments,
  removePickupDraft,
  savePickupDraft,
  upsertPickupDraft,
} from "../services/pickupService";

const PRIMARY = COLORS.primary || "#1B5E20";

const createEmptyDraftItem = (sequence) => ({
  sequence_no: sequence,
  receiver_name: "",
  receiver_phone: "",
  customer_reference_code: "",
  receiver_province: null,
  receiver_ward: null,
  receiver_address_detail: "",
  note: "",
});

const buildFullAddress = (detail, ward, province) =>
  [detail, ward?.name, province?.name].filter(Boolean).join(", ");

const toPositiveInt = (value, fallback = 1) => {
  const parsed = parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const SelectModal = ({ visible, title, data, onSelect, onClose, itemKey = "code" }) => {
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
  }, [slideAnim, visible]);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid={true} extraScrollHeight={100}>
            {data.map((item, index) => (
              <TouchableOpacity
                key={String(item[itemKey] ?? item.code ?? index)}
                style={[
                  styles.modalItem,
                  index === data.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemText}>
                  {item.hub_code ? `[${item.hub_code}] ` : ""}
                  {item.name || item.hub_name}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </KeyboardAwareScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function CustomerCreatePickupScreen({ navigation, route }) {
  const { user } = useUser();
  const routeDraft = route?.params?.draft || null;

  const [sName, setSName] = useState(user?.full_name || "");
  const [sPhone, setSPhone] = useState(user?.phone_number || "");
  const [sAddressDetail, setSAddressDetail] = useState(
    user?.street_address || user?.address || "",
  );
  const [sProvince, setSProvince] = useState(null);
  const [sWard, setSWard] = useState(null);
  const [sProvinceQuery, setSProvinceQuery] = useState("");
  const [sWardQuery, setSWardQuery] = useState("");
  const [sWardsData, setSWardsData] = useState([]);
  const [provincesData, setProvincesData] = useState([]);

  const [bulkProductType, setBulkProductType] = useState("DOCUMENT");
  const [estimatedQuantity, setEstimatedQuantity] = useState("1");
  const [draftItems, setDraftItems] = useState([createEmptyDraftItem(1)]);
  const [note, setNote] = useState("");

  const [serviceType, setServiceType] = useState("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState("SENDER_DEBT");
  const [isPacking, setIsPacking] = useState(false);
  const [codAmount, setCodAmount] = useState("0");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [departmentId, setDepartmentId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [wardsCache, setWardsCache] = useState({});

  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: "",
    data: [],
    itemKey: "code",
    onSelect: null,
  });

  const draftHydratedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const currentDraftIdRef = useRef(null);

  const fullSenderAddress = useMemo(
    () => buildFullAddress(sAddressDetail, sWard, sProvince),
    [sAddressDetail, sWard, sProvince],
  );

  const hasMeaningfulContent = useMemo(
    () =>
      Boolean(
        sAddressDetail ||
        sProvince ||
        draftItems.some(
          (item) =>
            item.receiver_name ||
            item.receiver_phone ||
            item.customer_reference_code ||
            item.receiver_address_detail ||
            item.receiver_province ||
            item.note,
        ),
      ),
    [draftItems, note, sAddressDetail, sProvince, sWard],
  );

  useEffect(() => {
    fetchProvinces();
    fetchDepartments();
    loadDraft();
  }, []);

  const fetchDepartments = async () => {
    const res = await getCustomerDepartments();
    if (res.success && Array.isArray(res.data)) {
      setDepartments(res.data);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (isSubmittingRef.current || !hasMeaningfulContent) return;
      e.preventDefault();
      CustomAlert.alert(
        "Lưu ý",
        "Bạn đang tạo yêu cầu lấy hàng. Nếu thoát bây giờ, dữ liệu chưa lưu sẽ mất.",
        [
          { text: "Ở lại", style: "cancel" },
          {
            text: "Thoát",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [hasMeaningfulContent, navigation]);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    if (!hasMeaningfulContent) {
      clearPickupDraft();
      return;
    }
    savePickupDraft(buildBulkDraftSnapshot(true));
  }, [
    bulkProductType,
    draftItems,
    estimatedQuantity,
    hasMeaningfulContent,
    note,
    sAddressDetail,
    sName,
    sPhone,
    sProvince,
    sWard,
    serviceType,
    paymentMethod,
  ]);

  const fetchProvinces = async () => {
    try {
      const response = await fetch("https://provinces.open-api.vn/api/v2/");
      const data = await response.json();
      setProvincesData(data);

      if (!routeDraft && (user?.province_id || user?.province)) {
        const matched = data.find(
          (item) => Number(item.code) === Number(user?.province_id) || item.name === user?.province,
        );
        if (matched) {
          await handleSelectSProvince(matched, false);
          if (user?.ward_id) {
            const ward = (await fetchWards(matched.code)).find(
              (item) => Number(item.code) === Number(user.ward_id),
            );
            if (ward) handleSelectSWard(ward);
          }
        }
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách tỉnh:", error);
    }
  };


  const fetchWards = async (provinceCode) => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`,
      );
      const data = await response.json();
      return data.wards || [];
    } catch (error) {
      console.error("Lỗi lấy danh sách xã:", error);
      return [];
    }
  };

  const handleSelectSProvince = async (prov, resetWard = true) => {
    setSProvince(prov);
    setSProvinceQuery(prov.name);
    if (resetWard) {
      setSWard(null);
      setSWardQuery("");
      setSWardsData([]);
    }
    const wards = await fetchWards(prov.code);
    setSWardsData(wards);
  };

  const handleSelectSWard = (ward) => {
    setSWard(ward);
    setSWardQuery(ward.name);
  };

  const syncDraftItems = (quantityValue) => {
    const total = Math.min(Math.max(toPositiveInt(quantityValue, 1), 1), 50);
    setEstimatedQuantity(String(total));
    setDraftItems((prev) => {
      const next = Array.from({ length: total }, (_, index) => ({
        ...(prev[index] || createEmptyDraftItem(index + 1)),
        sequence_no: index + 1,
      }));
      return next;
    });
  };

  const updateDraftItem = (index, key, value) => {
    setDraftItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addDraftRow = () => syncDraftItems(draftItems.length + 1);

  const removeDraftRow = (index) => {
    if (draftItems.length <= 1) return;
    const next = draftItems.filter((_, itemIndex) => itemIndex !== index);
    setDraftItems(next.map((item, itemIndex) => ({ ...item, sequence_no: itemIndex + 1 })));
    setEstimatedQuantity(String(next.length));
  };

  const buildBulkDraftSnapshot = (forAutosave = false) => ({
    pickup_mode: "BULK_MAIL",
    bulk_product_type: bulkProductType,
    bulk_estimated_quantity: toPositiveInt(estimatedQuantity, draftItems.length || 1),
    bulk_draft_items: draftItems.map((item, index) => ({
      sequence_no: index + 1,
      receiver_name: item.receiver_name || "",
      receiver_phone: item.receiver_phone || "",
      customer_reference_code: item.customer_reference_code || "",
      receiver_address_detail: item.receiver_address_detail || "",
      receiver_province: item.receiver_province || null,
      receiver_ward: item.receiver_ward || null,
      note: item.note || "",
    })),
    sender: {
      name: sName,
      phone: sPhone,
      address_detail: sAddressDetail,
      province_id: sProvince?.code || null,
      ward_id: sWard?.code || null,
      province_name: sProvince?.name || "",
      ward_name: sWard?.name || "",
    },
    service_type: serviceType,
    payment_method: paymentMethod,
    note,
    draft_id: currentDraftIdRef.current || undefined,
    draft_title: `Túi thư ${bulkProductType === "DOCUMENT" ? "tài liệu" : "bưu kiện"} (${toPositiveInt(estimatedQuantity, 1)} bưu gửi)`,
    created_at: new Date().toISOString(),
    is_packing: isPacking,
    cod_amount: codAmount,
    delivery_note: deliveryNote,
    department_id: departmentId,
    ...(forAutosave ? {} : { updated_at: new Date().toISOString() }),
  });

  const buildSubmitPayload = () => {
    const combinedNote = [
      isPacking ? "Đóng kiện" : "",
      codAmount && codAmount !== "0" ? `Thu hộ: ${codAmount}` : "",
      deliveryNote ? `Giao hàng: ${deliveryNote}` : "",
      note
    ].filter(Boolean).join(" - ");

    const quantity = toPositiveInt(estimatedQuantity, draftItems.length || 1);
    const firstItem = draftItems[0] || createEmptyDraftItem(1);
    const hasReceiver =
      quantity === 1 &&
      (firstItem.receiver_name || firstItem.receiver_phone || firstItem.receiver_address_detail || firstItem.receiver_province);

    return {
      product_type: bulkProductType,
      estimated_quantity: quantity,
      sender: {
        name: sName.trim(),
        phone: sPhone.trim(),
        address: fullSenderAddress,
        province_id: sProvince?.code || null,
        ward_id: sWard?.code || null,
        province_name: sProvince?.name || "",
        ward_name: sWard?.name || "",
      },
      receiver: hasReceiver
        ? {
          name: firstItem.receiver_name || null,
          phone: firstItem.receiver_phone || null,
          address: [
            firstItem.receiver_address_detail,
            firstItem.receiver_ward?.name,
            firstItem.receiver_province?.name,
          ].filter(Boolean).join(", "),
        }
        : null,
      draft_items: draftItems.map((item, index) => ({
        sequence_no: index + 1,
        customer_reference_code: item.customer_reference_code || null,
        receiver_name: item.receiver_name || null,
        receiver_phone: item.receiver_phone || null,
        receiver_address: [
          item.receiver_address_detail,
          item.receiver_ward?.name,
          item.receiver_province?.name,
        ].filter(Boolean).join(", ") || null,
        note: item.note || null,
      })),
      service_type: serviceType,
      payment_method: paymentMethod,
      customer_department_id: departmentId,
      note: combinedNote || null,
    };
  };

  const hydrateLegacyDraft = async (draft) => {
    currentDraftIdRef.current = draft.draft_id || null;
    setSName(draft.sName || user?.full_name || "");
    setSPhone(draft.sPhone || user?.phone_number || "");
    setSAddressDetail(draft.sAddressDetail || user?.street_address || user?.address || "");

    if (draft.sProvince) {
      await handleSelectSProvince(draft.sProvince, false);
      setSProvince(draft.sProvince);
      setSProvinceQuery(draft.sProvinceQuery || draft.sProvince.name);
    }

    if (draft.sWard) {
      setSWard(draft.sWard);
      setSWardQuery(draft.sWardQuery || draft.sWard.name);
    }

    const mappedProductType = draft.packageType === "goods" ? "PARCEL" : "DOCUMENT";
    const mappedItems = [
      {
        sequence_no: 1,
        receiver_name: draft.rName || "",
        receiver_phone: draft.rPhone || "",
        customer_reference_code: "",
        receiver_province: null,
        receiver_ward: null,
        receiver_address_detail: buildFullAddress(
          draft.rAddressDetail,
          draft.rWard,
          draft.rProvince,
        ),
        note: draft.note || "",
      },
    ];

    setBulkProductType(mappedProductType);
    setEstimatedQuantity("1");
    setDraftItems(mappedItems);
    setNote(draft.note || "");
    draftHydratedRef.current = true;
  };

  const hydrateBulkDraft = async (draft) => {
    currentDraftIdRef.current = draft.draft_id || null;
    const sender = draft.sender || {};

    setSName(sender.name || user?.full_name || "");
    setSPhone(sender.phone || user?.phone_number || "");
    setSAddressDetail(sender.address_detail || "");
    setBulkProductType(draft.bulk_product_type || "DOCUMENT");
    setNote(draft.note || "");
    setServiceType(draft.service_type || "STANDARD");
    setPaymentMethod(draft.payment_method || "SENDER_DEBT");
    setIsPacking(draft.is_packing || false);
    setCodAmount(draft.cod_amount || "0");
    setDeliveryNote(draft.delivery_note || "");
    setDepartmentId(draft.department_id || null);

    if (sender.province_id) {
      const province =
        provincesData.find((item) => Number(item.code) === Number(sender.province_id)) || {
          code: Number(sender.province_id),
          name: sender.province_name || "",
        };
      await handleSelectSProvince(province, false);
      setSProvince(province);
      setSProvinceQuery(province.name || sender.province_name || "");
    }

    if (sender.ward_id && sender.province_id) {
      const wards = await fetchWards(Number(sender.province_id));
      setSWardsData(wards);
      const ward =
        wards.find((item) => Number(item.code) === Number(sender.ward_id)) || {
          code: Number(sender.ward_id),
          name: sender.ward_name || "",
        };
      setSWard(ward);
      setSWardQuery(ward.name || sender.ward_name || "");
    }

    const nextItems = (draft.bulk_draft_items || [createEmptyDraftItem(1)]).map(
      (item, index) => ({
        sequence_no: index + 1,
        receiver_name: item.receiver_name || "",
        receiver_phone: item.receiver_phone || "",
        customer_reference_code: item.customer_reference_code || "",
        receiver_province: item.receiver_province || null,
        receiver_ward: item.receiver_ward || null,
        receiver_address_detail: item.receiver_address_detail || "",
        note: item.note || "",
      }),
    );
    setDraftItems(nextItems);
    setEstimatedQuantity(String(draft.bulk_estimated_quantity || nextItems.length || 1));
    draftHydratedRef.current = true;
  };

  const loadDraft = async () => {
    const autosaveDraft = routeDraft || (await getPickupDraft());
    if (!autosaveDraft) {
      draftHydratedRef.current = true;
      return;
    }

    const resume = async () => {
      if (autosaveDraft.pickup_mode === "BULK_MAIL" || autosaveDraft.bulk_draft_items) {
        await hydrateBulkDraft(autosaveDraft);
      } else {
        await hydrateLegacyDraft(autosaveDraft);
      }
    };

    if (routeDraft) {
      await resume();
      return;
    }

    CustomAlert.alert("Phục hồi nháp", "Bạn có một yêu cầu đang soạn dở. Tiếp tục không?", [
      {
        text: "Bỏ qua",
        style: "cancel",
        onPress: () => {
          clearPickupDraft();
          draftHydratedRef.current = true;
        },
      },
      { text: "Tiếp tục", onPress: resume },
    ]);
  };

  const openModal = async (type) => {
    if (type === "province") {
      setModalConfig({
        visible: true,
        title: "Chọn tỉnh/thành",
        data: provincesData,
        itemKey: "code",
        onSelect: handleSelectSProvince,
      });
      return;
    }

    if (type === "department") {
      if (departments.length === 0) {
        Toast.show({ type: "info", text1: "Không có phòng ban nào" });
        return;
      }
      setModalConfig({
        visible: true,
        title: "Chọn phòng ban",
        data: departments,
        itemKey: "id",
        onSelect: (dept) => setDepartmentId(dept.id),
      });
      return;
    }

    if (type === "ward") {
      if (!sProvince) return;
      setModalConfig({
        visible: true,
        title: "Chọn phường/xã",
        data: sWardsData,
        itemKey: "code",
        onSelect: handleSelectSWard,
      });
      return;
    }

    if (type.startsWith("receiver_province_")) {
      const index = parseInt(type.split("_")[2], 10);
      setModalConfig({
        visible: true,
        title: "Chọn tỉnh/thành nhận",
        data: provincesData,
        itemKey: "code",
        onSelect: (prov) => {
          updateDraftItem(index, "receiver_province", prov);
          updateDraftItem(index, "receiver_ward", null);
        },
      });
      return;
    }

    if (type.startsWith("receiver_ward_")) {
      const index = parseInt(type.split("_")[2], 10);
      const currentItem = draftItems[index];
      if (!currentItem?.receiver_province) {
        Toast.show({ type: "error", text1: "Vui lòng chọn tỉnh/thành trước" });
        return;
      }

      const provCode = currentItem.receiver_province.code;
      let wards = wardsCache[provCode];
      if (!wards) {
        wards = await fetchWards(provCode);
        setWardsCache(prev => ({ ...prev, [provCode]: wards }));
      }

      setModalConfig({
        visible: true,
        title: "Chọn phường/xã nhận",
        data: wards,
        itemKey: "code",
        onSelect: (w) => updateDraftItem(index, "receiver_ward", w),
      });
      return;
    }
  };

  const validateForm = () => {
    const quantity = toPositiveInt(estimatedQuantity, draftItems.length || 1);
    if (!sName.trim() || !sPhone.trim() || !sProvince || !sAddressDetail.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin người gửi",
        text2: "Vui lòng nhập đủ tên, SĐT, địa chỉ và khu vực lấy hàng.",
      });
      return false;
    }
    if (!fullSenderAddress) {
      Toast.show({
        type: "error",
        text1: "Địa chỉ chưa hợp lệ",
        text2: "Vui lòng hoàn thiện địa chỉ người gửi.",
      });
      return false;
    }
    if (quantity < 1) {
      Toast.show({
        type: "error",
        text1: "Số lượng chưa hợp lệ",
        text2: "Số lượng dự kiến phải lớn hơn 0.",
      });
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const saved = await upsertPickupDraft(buildBulkDraftSnapshot());
    setLoading(false);
    if (saved?.draft_id) {
      currentDraftIdRef.current = saved.draft_id;
      await clearPickupDraft();
      Toast.show({ type: "success", text1: "Đã đưa yêu cầu vào hàng chờ" });
      navigation.navigate("CustomerPickupDrafts");
      return;
    }
    Toast.show({
      type: "error",
      text1: "Không lưu được nháp",
      text2: saved?.message || "Vui lòng thử lại.",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    isSubmittingRef.current = true;
    const result = await createCustomerBulkMailPickup(buildSubmitPayload());
    setLoading(false);
    isSubmittingRef.current = false;

    if (!result.success) {
      Toast.show({
        type: "error",
        text1: "Gửi yêu cầu thất bại",
        text2: result.message,
      });
      return;
    }

    await clearPickupDraft();
    if (currentDraftIdRef.current) {
      await removePickupDraft(currentDraftIdRef.current);
    }
    Toast.show({
      type: "success",
      text1: "Đã tạo yêu cầu lấy hàng",
      text2: result.data?.bag_code || result.data?.request_code || "Yêu cầu đã được ghi nhận",
    });
    navigation.navigate("CustomerPickupList");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={PRIMARY} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tạo yêu cầu lấy hàng</Text>
          <Text style={styles.headerSubtitle}>Tạo túi thư hoặc danh sách bưu gửi cần lấy</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("CustomerPickupDrafts")}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="folder-open-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>1. THÔNG TIN LẤY HÀNG</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Họ tên người gửi</Text>
          <TextInput
            style={styles.input}
            value={sName}
            onChangeText={setSName}
            placeholder="Tên người gửi"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={sPhone}
            onChangeText={setSPhone}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Tỉnh/Thành</Text>
          <TouchableOpacity
            style={styles.selectionBox}
            onPress={() => openModal("province")}
            activeOpacity={0.8}
          >
            <Text style={styles.selectionText}>
              {sProvinceQuery || "Chọn tỉnh/thành"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Phường/Xã</Text>
          <TouchableOpacity
            style={[styles.selectionBox, !sProvince && styles.selectionBoxDisabled]}
            onPress={() => openModal("ward")}
            activeOpacity={0.8}
            disabled={!sProvince}
          >
            <Text style={styles.selectionText}>{sWardQuery || "Chọn phường/xã"}</Text>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Địa chỉ chi tiết</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={sAddressDetail}
            onChangeText={setSAddressDetail}
            placeholder="Số nhà, tên đường..."
            placeholderTextColor="#94A3B8"
            multiline
          />

          <View style={styles.addressPreview}>
            <Text style={styles.addressPreviewLabel}>Địa chỉ chuẩn hóa</Text>
            <Text style={styles.addressPreviewValue}>
              {fullSenderAddress || "Địa chỉ đầy đủ sẽ hiện ở đây"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>2. TÚI THƯ / BƯU GỬI</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Loại bưu gửi</Text>
          <View style={styles.segmentRow}>
            {[
              { value: "DOCUMENT", label: "Thư từ" },
              { value: "PARCEL", label: "Bưu kiện" },
            ].map((option) => {
              const active = bulkProductType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                  onPress={() => setBulkProductType(option.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.segmentText, active && styles.segmentTextActive]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Số lượng dự kiến</Text>
          <TextInput
            style={styles.input}
            value={estimatedQuantity}
            onChangeText={(value) => setEstimatedQuantity(value.replace(/[^0-9]/g, ""))}
            onBlur={() => syncDraftItems(estimatedQuantity)}
            placeholder="Nhập số lượng"
            keyboardType="number-pad"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Ghi chú chung</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú cho yêu cầu lấy hàng"
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>

        <Text style={styles.sectionTitle}>3. CẤU HÌNH VẬN CHUYỂN</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Loại dịch vụ</Text>
          <View style={styles.segmentRow}>
            {[
              { value: "STANDARD", label: "Tiêu chuẩn" },
              { value: "FAST", label: "Chuyển phát nhanh" },
            ].map((option) => {
              const active = serviceType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                  onPress={() => setServiceType(option.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Thanh toán cước</Text>
          <View style={styles.segmentRow}>
            {[
              { value: "SENDER_DEBT", label: "Ghi nợ" },
              { value: "SENDER_PAY", label: "Người gửi trả" },
              { value: "RECEIVER_PAY", label: "Người nhận trả" },
            ].map((option) => {
              const active = paymentMethod === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                  onPress={() => setPaymentMethod(option.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 12 }}>
            <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Đóng kiện</Text>
            <Switch
              trackColor={{ false: "#CBD5E1", true: "#81C784" }}
              thumbColor={isPacking ? PRIMARY : "#F8FAFC"}
              onValueChange={setIsPacking}
              value={isPacking}
            />
          </View>

          <Text style={styles.inputLabel}>Số tiền thu hộ</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={codAmount}
            onChangeText={setCodAmount}
          />

          <Text style={styles.inputLabel}>Phòng ban quản lý (Để theo dõi chi phí)</Text>
          <TouchableOpacity
            style={styles.selectionBox}
            onPress={() => openModal("department")}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectionText, !departmentId && { color: "#94A3B8" }]}>
              {departmentId
                ? departments.find(d => d.id === departmentId)?.name || "Chọn phòng ban"
                : "Chọn phòng ban"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Ghi chú khi giao</Text>
          <TextInput
            style={styles.input}
            placeholder="Ghi chú khi giao..."
            placeholderTextColor="#94A3B8"
            value={deliveryNote}
            onChangeText={setDeliveryNote}
          />

          <Text style={styles.inputLabel}>Ghi chú thêm</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ghi chú thêm cho bưu tá..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />
        </View>

        <Text style={styles.sectionTitle}>4. DANH SÁCH BƯU GỬI</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Text style={styles.helperText}>
              Có thể để trống người nhận nếu muốn OCR bổ sung sau khi lấy hàng.
            </Text>
            <TouchableOpacity style={styles.smallButton} onPress={addDraftRow} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color={PRIMARY} />
              <Text style={styles.smallButtonText}>Thêm dòng</Text>
            </TouchableOpacity>
          </View>

          {draftItems.map((item, index) => (
            <View key={`draft-item-${index}`} style={styles.draftRow}>
              <View style={styles.draftRowHeader}>
                <Text style={styles.draftRowTitle}>Bưu gửi #{index + 1}</Text>
                {draftItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeDraftRow(index)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                value={item.receiver_name}
                onChangeText={(value) => updateDraftItem(index, "receiver_name", value)}
                placeholder="Tên người nhận"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={styles.input}
                value={item.receiver_phone}
                onChangeText={(value) => updateDraftItem(index, "receiver_phone", value)}
                placeholder="Số điện thoại người nhận"
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={styles.input}
                value={item.customer_reference_code}
                onChangeText={(value) =>
                  updateDraftItem(index, "customer_reference_code", value)
                }
                placeholder="Mã tham chiếu của shop"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Tỉnh/Thành người nhận</Text>
              <TouchableOpacity
                style={styles.selectionBox}
                onPress={() => openModal(`receiver_province_${index}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectionText}>
                  {item.receiver_province?.name || "Chọn tỉnh/thành"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Phường/Xã người nhận</Text>
              <TouchableOpacity
                style={[styles.selectionBox, !item.receiver_province && styles.selectionBoxDisabled]}
                onPress={() => openModal(`receiver_ward_${index}`)}
                activeOpacity={0.8}
                disabled={!item.receiver_province}
              >
                <Text style={styles.selectionText}>
                  {item.receiver_ward?.name || "Chọn phường/xã"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Địa chỉ chi tiết người nhận</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={item.receiver_address_detail}
                onChangeText={(value) => updateDraftItem(index, "receiver_address_detail", value)}
                placeholder="Số nhà, đường..."
                placeholderTextColor="#94A3B8"
                multiline
              />

              <Text style={styles.inputLabel}>Ghi chú bưu gửi</Text>
              <TextInput
                style={[styles.input, styles.textArea, { marginBottom: 0 }]}
                value={item.note}
                onChangeText={(value) => updateDraftItem(index, "note", value)}
                placeholder="Ghi chú riêng cho bưu gửi"
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>
          ))}
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleSaveDraft}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Đưa vào hàng chờ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? "ĐANG XỬ LÝ..." : "GỬI YÊU CẦU"}
          </Text>
        </TouchableOpacity>
      </View>

      <SelectModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        data={modalConfig.data}
        itemKey={modalConfig.itemKey}
        onSelect={modalConfig.onSelect}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

// styles moved to ../styles/CustomerCreatePickupScreenStyles
