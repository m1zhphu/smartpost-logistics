import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PricingRulesStyles from "../styles/PricingRulesStyles";
import { pricingService } from "../services/pricingService";
import { useUser } from "../context/UserContext";
import { getRoleKey } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import Toast from "react-native-toast-message";
import ConfirmModal from "../components/ConfirmModal";

const SERVICE_TYPE_OPTIONS = ["STANDARD", "EXPRESS", "ECONOMY"];
const FEE_TYPE_OPTIONS = ["FIXED", "PERCENT"];

export default function PricingRulesScreen({ navigation }) {
  const { user } = useUser();
  const roleKey = getRoleKey(user);
  const canEditPricing = ["admin", "accountant"].includes(roleKey);
  const [activeTab, setActiveTab] = useState("MAIN");
  const [rules, setRules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    rule_id: null,
    from_province_id: "",
    to_province_id: "",
    service_type: "STANDARD",
    min_weight: "",
    max_weight: "",
    price: "",
    is_active: true,
  });
  const [serviceForm, setServiceForm] = useState({
    id: null,
    service_code: "",
    service_name: "",
    fee_type: "FIXED",
    fee_value: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, [user.token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRules, resServices] = await Promise.all([
        pricingService.getRules(user.token),
        pricingService.getExtraServices(user.token),
      ]);
      setRules(Array.isArray(resRules) ? resRules : []);
      setServices(Array.isArray(resServices) ? resServices : []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải bảng giá.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!canEditPricing) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Bạn không có quyền chỉnh sửa quy tắc giá.",
      });
      return;
    }
    if (
      !ruleForm.from_province_id ||
      !ruleForm.to_province_id ||
      !ruleForm.min_weight ||
      !ruleForm.max_weight ||
      !ruleForm.price
    ) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập đầy đủ các trường bắt buộc.",
      });
      return;
    }
    if (Number(ruleForm.min_weight) >= Number(ruleForm.max_weight)) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Khối lượng tối thiểu phải nhỏ hơn tối đa.",
      });
      return;
    }

    setSubmitLoading(true);
    const payload = {
      from_province_id: Number(ruleForm.from_province_id),
      to_province_id: Number(ruleForm.to_province_id),
      service_type: ruleForm.service_type,
      min_weight: Number(ruleForm.min_weight),
      max_weight: Number(ruleForm.max_weight),
      price: Number(ruleForm.price),
      is_active: ruleForm.is_active,
    };

    try {
      if (modalMode === "CREATE")
        await pricingService.createRule(user.token, payload);
      else
        await pricingService.updateRule(user.token, ruleForm.rule_id, payload);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã lưu quy tắc giá.",
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể lưu quy tắc giá.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteRule = (ruleId) => {
    setDeleteRuleId(ruleId);
  };

  const executeDeleteRule = async () => {
    if (!deleteRuleId) return;
    const ruleId = deleteRuleId;
    setDeleteRuleId(null);

    try {
      await pricingService.deleteRule(user.token, ruleId);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã xoá quy tắc giá.",
      });
      fetchData();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể xóa quy tắc này.",
      });
    }
  };

  const handleSaveService = async () => {
    if (!canEditPricing) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Bạn không có quyền chỉnh sửa quy tắc giá.",
      });
      return;
    }
    if (
      !serviceForm.service_code ||
      !serviceForm.service_name ||
      !serviceForm.fee_value
    ) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập đầy đủ thông tin dịch vụ.",
      });
      return;
    }

    setSubmitLoading(true);
    const payload = {
      service_code: serviceForm.service_code,
      service_name: serviceForm.service_name,
      fee_type: serviceForm.fee_type,
      fee_value: Number(serviceForm.fee_value),
      is_active: serviceForm.is_active,
    };

    try {
      if (modalMode === "CREATE")
        await pricingService.createExtraService(user.token, payload);
      else
        await pricingService.updateExtraService(
          user.token,
          serviceForm.id,
          payload,
        );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã lưu dịch vụ.",
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể lưu dịch vụ.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const openModalCreate = () => {
    setModalMode("CREATE");
    if (activeTab === "MAIN") {
      setRuleForm({
        rule_id: null,
        from_province_id: "",
        to_province_id: "",
        service_type: "STANDARD",
        min_weight: "",
        max_weight: "",
        price: "",
        is_active: true,
      });
    } else {
      setServiceForm({
        id: null,
        service_code: "",
        service_name: "",
        fee_type: "FIXED",
        fee_value: "",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const openModalEditRule = (item) => {
    setModalMode("EDIT");
    setRuleForm({
      rule_id: item.rule_id,
      from_province_id: String(item.from_province_id),
      to_province_id: String(item.to_province_id),
      service_type: item.service_type,
      min_weight: String(item.min_weight),
      max_weight: String(item.max_weight),
      price: String(item.price),
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const openModalEditService = (item) => {
    setModalMode("EDIT");
    setServiceForm({
      id: item.id,
      service_code: item.service_code,
      service_name: item.service_name,
      fee_type: item.fee_type,
      fee_value: String(item.fee_value),
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const renderRuleCard = ({ item }) => (
    <View
      style={[PricingRulesStyles.card, !item.is_active && { opacity: 0.6 }]}
    >
      <View style={PricingRulesStyles.cardHeader}>
        <View style={PricingRulesStyles.serviceBadge}>
          <Text style={PricingRulesStyles.serviceBadgeText}>
            {item.service_type}
          </Text>
        </View>
        <Text style={PricingRulesStyles.priceText}>
          {Number(item.price).toLocaleString()} đ
        </Text>
      </View>

      <View style={PricingRulesStyles.divider} />

      <View style={PricingRulesStyles.infoRow}>
        <View style={PricingRulesStyles.iconCircle}>
          <Ionicons name="map" size={16} color={COLORS.secondary} />
        </View>
        <Text style={PricingRulesStyles.infoText}>
          Từ ID {item.from_province_id} - Đến ID {item.to_province_id}
        </Text>
      </View>
      <View style={PricingRulesStyles.infoRow}>
        <View
          style={[
            PricingRulesStyles.iconCircle,
            { backgroundColor: "#fff3e0" },
          ]}
        >
          <Ionicons name="scale" size={16} color={COLORS.processScanOrange} />
        </View>
        <Text style={PricingRulesStyles.infoText}>
          Mức cân: {item.min_weight} kg - {item.max_weight} kg
        </Text>
      </View>

      <View style={PricingRulesStyles.actionRow}>
        <View
          style={[
            PricingRulesStyles.statusBadge,
            { backgroundColor: item.is_active ? "#edf8ef" : "#fee2e2" },
          ]}
        >
          <View
            style={[
              PricingRulesStyles.statusDot,
              {
                backgroundColor: item.is_active
                  ? COLORS.secondary
                  : COLORS.error,
              },
            ]}
          />
          <Text
            style={{
              color: item.is_active ? COLORS.secondary : COLORS.error,
              fontSize: 11,
              fontWeight: "bold",
            }}
          >
            {item.is_active ? "ĐANG KÍCH HOẠT" : "TẠM DỪNG"}
          </Text>
        </View>
        {canEditPricing ? (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={PricingRulesStyles.actionBtnEdit}
              onPress={() => openModalEditRule(item)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.secondary} />
              <Text
                style={{
                  color: COLORS.secondary,
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 4,
                }}
              >
                Sửa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={PricingRulesStyles.actionBtnDelete}
              onPress={() => handleDeleteRule(item.rule_id)}
            >
              <Ionicons name="trash" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderServiceCard = ({ item }) => (
    <View
      style={[PricingRulesStyles.card, !item.is_active && { opacity: 0.6 }]}
    >
      <View style={PricingRulesStyles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={PricingRulesStyles.cardTitle} numberOfLines={1}>
            {item.service_name}
          </Text>
          <Text style={PricingRulesStyles.serviceCode}>
            Mã dịch vụ: {item.service_code}
          </Text>
        </View>
        <View
          style={[
            PricingRulesStyles.statusBadge,
            { backgroundColor: item.is_active ? "#edf8ef" : "#fee2e2" },
          ]}
        >
          <View
            style={[
              PricingRulesStyles.statusDot,
              {
                backgroundColor: item.is_active
                  ? COLORS.secondary
                  : COLORS.error,
              },
            ]}
          />
          <Text
            style={{
              color: item.is_active ? COLORS.secondary : COLORS.error,
              fontSize: 11,
              fontWeight: "bold",
            }}
          >
            {item.is_active ? "KÍCH HOẠT" : "TẠM DỪNG"}
          </Text>
        </View>
      </View>

      <View style={PricingRulesStyles.divider} />

      <View style={PricingRulesStyles.rowBetween}>
        <Text style={PricingRulesStyles.infoText}>
          Tính phí: {item.fee_type === "FIXED" ? "Cố định" : "% Thu hộ"}
        </Text>
        <Text style={PricingRulesStyles.priceText}>
          {item.fee_type === "FIXED"
            ? `${Number(item.fee_value).toLocaleString()} đ`
            : `${item.fee_value}%`}
        </Text>
      </View>

      <View
        style={[
          PricingRulesStyles.divider,
          { marginTop: 15, marginBottom: 10 },
        ]}
      />
      {canEditPricing ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={PricingRulesStyles.actionBtnEdit}
            onPress={() => openModalEditService(item)}
          >
            <Ionicons name="pencil" size={16} color={COLORS.secondary} />
            <Text
              style={{
                color: COLORS.secondary,
                fontSize: 13,
                fontWeight: "bold",
                marginLeft: 4,
              }}
            >
              Sửa Dịch Vụ
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={PricingRulesStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
      <View style={PricingRulesStyles.headerArea}>
        <View style={PricingRulesStyles.headerCircleDecoration} />
        <View style={PricingRulesStyles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={PricingRulesStyles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={PricingRulesStyles.headerTitle}>Cấu Hình Bảng Giá</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>
      <View style={PricingRulesStyles.scrollViewWrapper}>
        <FlatList
          data={activeTab === "MAIN" ? rules : services}
          keyExtractor={(item, idx) =>
            activeTab === "MAIN"
              ? item.rule_id?.toString() || String(idx)
              : item.id?.toString() || String(idx)
          }
          contentContainerStyle={PricingRulesStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {!canEditPricing ? (
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: 12,
                    borderRadius: 14,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{ color: "#334155", fontSize: 13, lineHeight: 20 }}
                  >
                    Bạn chỉ có quyền xem bảng giá. Chỉ Quản trị viên hoặc Kế
                    toán mới có thể tạo/sửa/xóa.
                  </Text>
                </View>
              ) : null}
              <View style={PricingRulesStyles.tabContainer}>
                <TouchableOpacity
                  style={[
                    PricingRulesStyles.tab,
                    activeTab === "MAIN" && PricingRulesStyles.tabActive,
                  ]}
                  onPress={() => setActiveTab("MAIN")}
                >
                  <Text
                    style={[
                      PricingRulesStyles.tabText,
                      activeTab === "MAIN" && PricingRulesStyles.tabTextActive,
                    ]}
                  >
                    Cước Phí Chính
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    PricingRulesStyles.tab,
                    activeTab === "EXTRA" && PricingRulesStyles.tabActive,
                  ]}
                  onPress={() => setActiveTab("EXTRA")}
                >
                  <Text
                    style={[
                      PricingRulesStyles.tabText,
                      activeTab === "EXTRA" && PricingRulesStyles.tabTextActive,
                    ]}
                  >
                    Phụ Phí Dịch Vụ
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Ionicons
                  name="document-text-outline"
                  size={60}
                  color="#d1d8d3"
                />
                <Text
                  style={{
                    textAlign: "center",
                    color: "#7b867e",
                    marginTop: 10,
                    fontStyle: "italic",
                  }}
                >
                  Chưa có cấu hình bảng giá nào.
                </Text>
              </View>
            ) : null
          }
          renderItem={activeTab === "MAIN" ? renderRuleCard : renderServiceCard}
        />
        {loading ? (
          <View style={PricingRulesStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : null}
      </View>
      {canEditPricing && (
        <TouchableOpacity
          style={PricingRulesStyles.fab}
          onPress={openModalCreate}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      )}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={PricingRulesStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <View
              style={PricingRulesStyles.modalContainer}
              onStartShouldSetResponder={() => true}
            >
              <View style={PricingRulesStyles.modalHeader}>
                <Text style={PricingRulesStyles.modalTitle}>
                  {modalMode === "CREATE" ? "Thêm Mới " : "Cập Nhật "}
                  {activeTab === "MAIN" ? "Bảng Giá" : "Dịch Vụ"}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {activeTab === "MAIN" ? (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 5 }}>
                        <Text style={PricingRulesStyles.label}>
                          Tỉnh gửi (ID){" "}
                          <Text style={{ color: COLORS.error }}>*</Text>
                        </Text>
                        <TextInput
                          style={PricingRulesStyles.input}
                          keyboardType="numeric"
                          placeholder="VD: 1"
                          value={ruleForm.from_province_id}
                          onChangeText={(text) =>
                            setRuleForm({ ...ruleForm, from_province_id: text })
                          }
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={PricingRulesStyles.label}>
                          Tỉnh nhận (ID){" "}
                          <Text style={{ color: COLORS.error }}>*</Text>
                        </Text>
                        <TextInput
                          style={PricingRulesStyles.input}
                          keyboardType="numeric"
                          placeholder="VD: 79"
                          value={ruleForm.to_province_id}
                          onChangeText={(text) =>
                            setRuleForm({ ...ruleForm, to_province_id: text })
                          }
                        />
                      </View>
                    </View>

                    <Text style={PricingRulesStyles.label}>
                      Loại Dịch vụ{" "}
                      <Text style={{ color: COLORS.error }}>*</Text>
                    </Text>
                    <View style={PricingRulesStyles.optionRow}>
                      {SERVICE_TYPE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            PricingRulesStyles.optionBtn,
                            ruleForm.service_type === option &&
                              PricingRulesStyles.optionBtnActive,
                          ]}
                          onPress={() =>
                            setRuleForm({ ...ruleForm, service_type: option })
                          }
                        >
                          <Text
                            style={[
                              PricingRulesStyles.optionBtnText,
                              ruleForm.service_type === option &&
                                PricingRulesStyles.optionBtnTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 5 }}>
                        <Text style={PricingRulesStyles.label}>
                          Từ số kg{" "}
                          <Text style={{ color: COLORS.error }}>*</Text>
                        </Text>
                        <TextInput
                          style={PricingRulesStyles.input}
                          keyboardType="numeric"
                          placeholder="0"
                          value={ruleForm.min_weight}
                          onChangeText={(text) =>
                            setRuleForm({ ...ruleForm, min_weight: text })
                          }
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={PricingRulesStyles.label}>
                          Đến số kg{" "}
                          <Text style={{ color: COLORS.error }}>*</Text>
                        </Text>
                        <TextInput
                          style={PricingRulesStyles.input}
                          keyboardType="numeric"
                          placeholder="5"
                          value={ruleForm.max_weight}
                          onChangeText={(text) =>
                            setRuleForm({ ...ruleForm, max_weight: text })
                          }
                        />
                      </View>
                    </View>

                    <Text style={PricingRulesStyles.label}>
                      Cước phí (VNĐ){" "}
                      <Text style={{ color: COLORS.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        PricingRulesStyles.input,
                        {
                          fontSize: 18,
                          fontWeight: "bold",
                          color: COLORS.secondary,
                        },
                      ]}
                      keyboardType="numeric"
                      placeholder="15000"
                      value={ruleForm.price}
                      onChangeText={(text) =>
                        setRuleForm({ ...ruleForm, price: text })
                      }
                    />

                    <View style={PricingRulesStyles.switchRow}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: COLORS.primary,
                        }}
                      >
                        Kích hoạt áp dụng ngay
                      </Text>
                      <Switch
                        value={ruleForm.is_active}
                        onValueChange={(value) =>
                          setRuleForm({ ...ruleForm, is_active: value })
                        }
                        trackColor={{ true: COLORS.secondary }}
                      />
                    </View>

                    <TouchableOpacity
                      style={PricingRulesStyles.submitBtn}
                      onPress={handleSaveRule}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text
                          style={{
                            color: "#FFF",
                            fontWeight: "bold",
                            fontSize: 16,
                          }}
                        >
                          LƯU BẢNG GIÁ
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={PricingRulesStyles.label}>
                      Mã dịch vụ <Text style={{ color: COLORS.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={PricingRulesStyles.input}
                      placeholder="VD: KHAI_GIA"
                      autoCapitalize="characters"
                      value={serviceForm.service_code}
                      onChangeText={(text) =>
                        setServiceForm({ ...serviceForm, service_code: text })
                      }
                      editable={modalMode === "CREATE"}
                    />
                    <Text style={PricingRulesStyles.label}>
                      Tên hiển thị{" "}
                      <Text style={{ color: COLORS.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={PricingRulesStyles.input}
                      placeholder="VD: Phí khai giá hàng hóa"
                      value={serviceForm.service_name}
                      onChangeText={(text) =>
                        setServiceForm({ ...serviceForm, service_name: text })
                      }
                    />

                    <Text style={PricingRulesStyles.label}>
                      Loại tính phí{" "}
                      <Text style={{ color: COLORS.error }}>*</Text>
                    </Text>
                    <View style={PricingRulesStyles.optionRow}>
                      {FEE_TYPE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            PricingRulesStyles.optionBtn,
                            serviceForm.fee_type === option &&
                              PricingRulesStyles.optionBtnActive,
                          ]}
                          onPress={() =>
                            setServiceForm({ ...serviceForm, fee_type: option })
                          }
                        >
                          <Text
                            style={[
                              PricingRulesStyles.optionBtnText,
                              serviceForm.fee_type === option &&
                                PricingRulesStyles.optionBtnTextActive,
                            ]}
                          >
                            {option === "FIXED" ? "CỐ ĐỊNH" : "PERCENT"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={PricingRulesStyles.label}>
                      Giá trị phí <Text style={{ color: COLORS.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={PricingRulesStyles.input}
                      keyboardType="numeric"
                      placeholder="10000 hoặc 1.5"
                      value={serviceForm.fee_value}
                      onChangeText={(text) =>
                        setServiceForm({ ...serviceForm, fee_value: text })
                      }
                    />

                    <View style={PricingRulesStyles.switchRow}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: COLORS.primary,
                        }}
                      >
                        Kích hoạt trên App cho User
                      </Text>
                      <Switch
                        value={serviceForm.is_active}
                        onValueChange={(value) =>
                          setServiceForm({ ...serviceForm, is_active: value })
                        }
                        trackColor={{ true: COLORS.secondary }}
                      />
                    </View>

                    <TouchableOpacity
                      style={PricingRulesStyles.submitBtn}
                      onPress={handleSaveService}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text
                          style={{
                            color: "#FFF",
                            fontWeight: "bold",
                            fontSize: 16,
                          }}
                        >
                          LƯU DỊCH VỤ
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmModal
        visible={!!deleteRuleId}
        title="Xác nhận xoá"
        description="Bạn có chắc chắn muốn xoá quy tắc giá này không?"
        cancelText="Hủy"
        confirmText="Xóa"
        tone="danger"
        iconName="trash"
        onCancel={() => setDeleteRuleId(null)}
        onConfirm={executeDeleteRule}
      />
    </View>
  );
}
