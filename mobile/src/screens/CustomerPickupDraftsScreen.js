import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import {
  closePickupBag,
  createCustomerPickup,
  getPickupDrafts,
  removePickupDraft,
  createCustomerBulkMailPickup,
  upsertPickupDraft,
} from "../services/pickupService";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { parseExcelFile, processExcelRows } from "../utils/excelParser";
import { useUser } from "../context/UserContext";

const PRIMARY = COLORS.primary || "#1B5E20";

const buildFullAddress = (detail, ward, district, province) =>
  [detail, ward?.name, district?.name, province?.name]
    .filter(Boolean)
    .join(", ");

const buildPickupPayload = (draft) => ({
  order_type: "DOMESTIC",
  pickup_time: new Date().toISOString(),
  sender: {
    name: draft.sName || "",
    phone: draft.sPhone || "",
    address: buildFullAddress(
      draft.sAddressDetail,
      draft.sWard,
      draft.sDistrict,
      draft.sProvince,
    ),
    province_id: draft.sProvince?.code || null,
    district_id: draft.sDistrict?.code || null,
    ward_id: draft.sWard?.code || null,
    province_name: draft.sProvince?.name || "",
    district_name: draft.sDistrict?.name || "",
    ward_name: draft.sWard?.name || "",
  },
  receiver: {
    name: draft.rName || "",
    phone: draft.rPhone || "",
    address: buildFullAddress(
      draft.rAddressDetail,
      draft.rWard,
      draft.rDistrict,
      draft.rProvince,
    ),
    province_id: draft.rProvince?.code || null,
    district_id: draft.rDistrict?.code || null,
    ward_id: draft.rWard?.code || null,
    province_name: draft.rProvince?.name || "",
    district_name: draft.rDistrict?.name || "",
    ward_name: draft.rWard?.name || "",
  },
  items: [
    {
      product_group: draft.packageType === "goods" ? "PARCEL" : "DOCUMENT",
      product_name:
        draft.packageType === "goods"
          ? draft.itemName || "Hàng hóa"
          : "Thư từ / Tài liệu",
      description: draft.note || draft.itemName || "Hàng hóa",
      weight:
        parseFloat(draft.itemWeight) ||
        (draft.packageType === "letter" ? 0.1 : 0.5),
      length: draft.packageType === "goods" ? parseFloat(draft.length) || 0 : 0,
      width: draft.packageType === "goods" ? parseFloat(draft.width) || 0 : 0,
      height: draft.packageType === "goods" ? parseFloat(draft.height) || 0 : 0,
      quantity: parseInt(draft.itemQuantity, 10) || 1,
      declared_value: 0,
    },
  ],
  documents: [],
  cod_amount: parseFloat(draft.codAmount) || 0,
  cod_receiver_pays_fee: false,
  service_type: draft.serviceType || "STANDARD",
  extra_services: (draft.extraServices || []).map((code) => ({
    service_code: code,
  })),
  delivery_note_option: "CHO_XEM_HANG",
  note: draft.note || "",
  payment_method: draft.paymentMethod || "SENDER_DEBT",
  pickup_method: "OUR_STAFF_PICKUP",
  delivery_method: "OUR_STAFF_DELIVERY",
  save_as_draft: false,
});

export default function CustomerPickupDraftsScreen({ navigation }) {
  const { user } = useUser();
  const [drafts, setDrafts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedDrafts = useMemo(
    () => drafts.filter((draft) => selectedIds.includes(draft.draft_id)),
    [drafts, selectedIds],
  );

  const loadDrafts = async () => {
    setLoading(true);
    const data = await getPickupDrafts();
    setDrafts(data);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadDrafts);
    return unsubscribe;
  }, [navigation]);

  const toggleDraft = (draftId) => {
    setSelectedIds((prev) =>
      prev.includes(draftId)
        ? prev.filter((id) => id !== draftId)
        : [...prev, draftId],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === drafts.length && drafts.length > 0) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(drafts.map((item) => item.draft_id));
  };

  const deleteDraft = async (draftId) => {
    await removePickupDraft(draftId);
    setSelectedIds((prev) => prev.filter((id) => id !== draftId));
    loadDrafts();
  };

  const handleExcelUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const fileUri = res.assets[0].uri;
      Toast.show({ type: "info", text1: "Đang đọc file Excel..." });

      const b64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const rawRows = await parseExcelFile(b64);

      if (rawRows.length === 0) {
        Toast.show({ type: "error", text1: "File Excel rỗng" });
        return;
      }

      Toast.show({
        type: "info",
        text1: `Đang phân tích ${rawRows.length} dòng...`,
      });

      const provincesRes = await fetch("https://provinces.open-api.vn/api/");
      const provinces = await provincesRes.json();

      const districtsCache = {};
      const wardsCache = {};

      const fetchDistrictsForProvince = async (pId) => {
        const dRes = await fetch(
          `https://provinces.open-api.vn/api/p/${pId}?depth=2`,
        );
        const data = await dRes.json();
        return (data.districts || []).map((d) => ({
          id: d.code,
          name: d.name,
        }));
      };

      const fetchWardsForDistrict = async (dId) => {
        const wRes = await fetch(
          `https://provinces.open-api.vn/api/d/${dId}?depth=2`,
        );
        const data = await wRes.json();
        return (data.wards || []).map((w) => ({ id: w.code, name: w.name }));
      };

      const defaultSender = {
        name: user?.full_name || "",
        phone: user?.phone_number || "",
        province_id: user?.province_id || null,
        district_id: user?.district_id || null,
        ward_id: user?.ward_id || null,
        address_detail: user?.street_address || user?.address || "",
      };

      const importedDrafts = await processExcelRows({
        rawRows,
        provincesList: provinces.map((p) => ({ id: p.code, name: p.name })),
        fetchDistricts: fetchDistrictsForProvince,
        fetchWards: fetchWardsForDistrict,
        districtsCache,
        wardsCache,
        defaultSender,
      });

      if (importedDrafts.length === 0) {
        Toast.show({ type: "error", text1: "Không phân tích được đơn nào" });
        return;
      }

      const firstRow = importedDrafts[0];
      const bulkDraft = {
        pickup_mode: "BULK_MAIL",
        bulk_draft_items: importedDrafts.map((d, index) => ({
          sequence_no: index + 1,
          customer_reference_code: d.shop_order_code || null,
          receiver_name: d.receiver?.name || null,
          receiver_phone: d.receiver?.phone || null,
          receiver_address: d.receiver?.address_detail || null,
          note: d.note || null,
        })),
        bulk_product_type: firstRow.items[0]?.product_group || "PARCEL",
        bulk_estimated_quantity: importedDrafts.length,
        sender: firstRow.sender,
        draft_id: "excel_" + Date.now().toString(),
        created_at: new Date().toISOString(),
        draft_title: `Lên đơn từ Excel (${importedDrafts.length} bưu gửi)`,
      };

      await upsertPickupDraft(bulkDraft);
      Toast.show({
        type: "success",
        text1: `Đã đưa ${importedDrafts.length} đơn vào hàng chờ`,
      });
      loadDrafts();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi đọc file",
        text2: error.message,
      });
    }
  };

  const submitSelected = async () => {
    if (selectedDrafts.length === 0) {
      Toast.show({
        type: "error",
        text1: "Chưa chọn nháp nào",
      });
      return;
    }

    setSubmitting(true);

    try {
      const createdCodes = [];
      let bagCode = "";

      for (const draft of selectedDrafts) {
        if (draft.pickup_mode === "BULK_MAIL") {
          const bulkPayload = {
            product_type: draft.bulk_product_type,
            estimated_quantity: draft.bulk_estimated_quantity,
            sender: {
              name: draft.sender.name,
              phone: draft.sender.phone,
              address: draft.sender.address_detail,
              province_id: Number(draft.sender.province_id),
              district_id: Number(draft.sender.district_id),
              ward_id: draft.sender.ward_id
                ? Number(draft.sender.ward_id)
                : null,
              province_name: draft.sender.province_name,
              district_name: draft.sender.district_name,
              ward_name: draft.sender.ward_name,
            },
            draft_items: draft.bulk_draft_items,
          };

          const res = await createCustomerBulkMailPickup(bulkPayload);
          if (!res.success) {
            throw new Error(res.message || "Không tạo được đơn hàng loạt");
          }
          bagCode = res.data?.bag_code || bagCode;
        } else {
          const res = await createCustomerPickup(buildPickupPayload(draft));
          if (!res.success) {
            throw new Error(res.message || "Không tạo được đơn");
          }
          createdCodes.push(res.data?.waybill_code);
          bagCode = res.data?.bag_code || bagCode;
        }
      }

      if (bagCode) {
        const closeRes = await closePickupBag(bagCode);
        if (!closeRes.success) {
          throw new Error(closeRes.message || "Không chốt được túi");
        }
      }

      for (const draft of selectedDrafts) {
        await removePickupDraft(draft.draft_id);
      }

      setSelectedIds([]);
      await loadDrafts();

      Toast.show({
        type: "success",
        text1: "Đã tạo túi thư/túi hàng",
        text2: bagCode || "Đã gửi lên hệ thống",
      });

      navigation.navigate("CustomerPickupList");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi gửi yêu cầu",
        text2: error.message,
      });
    } finally {
      setSubmitting(false);
    }
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

  const renderItem = ({ item }) => {
    const checked = selectedIds.includes(item.draft_id);
    const isBulk = item.pickup_mode === "BULK_MAIL";

    return (
      <TouchableOpacity
        style={[styles.card, checked && styles.cardChecked]}
        onPress={() => toggleDraft(item.draft_id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.checkBox}>
            <Ionicons
              name={checked ? "checkbox" : "square-outline"}
              size={24}
              color={checked ? PRIMARY : "#94A3B8"}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.draft_title ||
                item.rName ||
                item.itemName ||
                "Nháp chưa đặt tên"}
            </Text>

            <Text style={styles.subText}>
              {isBulk
                ? item.bulk_product_type === "DOCUMENT"
                  ? "Thư từ/Tài liệu"
                  : "Bưu kiện/Bưu phẩm"
                : item.rPhone || "---"}{" "}
              ·{" "}
              {isBulk
                ? `${item.bulk_estimated_quantity} bưu gửi`
                : item.serviceType || "STANDARD"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => deleteDraft(item.draft_id)}
            style={styles.deleteBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.meta} numberOfLines={1}>
          Người gửi:{" "}
          <Text style={{ fontWeight: "600", color: "#0F172A" }}>
            {isBulk ? item.sender?.name : item.sName || "---"}
          </Text>
        </Text>
        {!isBulk && (
          <Text style={styles.meta} numberOfLines={1}>
            Người nhận:{" "}
            <Text style={{ fontWeight: "600", color: "#0F172A" }}>
              {item.rName || "---"}
            </Text>
          </Text>
        )}
        <Text style={styles.meta}>
          Ngày lưu:{" "}
          <Text style={{ fontWeight: "600", color: "#0F172A" }}>
            {item.created_at
              ? new Date(item.created_at).toLocaleString("vi-VN")
              : "---"}
          </Text>
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM MỚI */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hàng chờ (Drafts)</Text>
          <Text style={styles.headerSubtitle}>
            {selectedIds.length}/{drafts.length} đã chọn
          </Text>
        </View>
        <HeaderButton icon="checkmark-done-outline" onPress={toggleAll} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : drafts.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="folder-open-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có nháp nào</Text>
          <Text style={styles.emptyText}>
            Tạo nháp mới hoặc tải lên từ Excel
          </Text>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={handleExcelUpload}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={PRIMARY}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.outlineBtnText}>Nhập từ Excel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.draft_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <TouchableOpacity
              style={styles.outlineBtnHeader}
              onPress={handleExcelUpload}
              activeOpacity={0.8}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={PRIMARY}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.outlineBtnText}>Nhập dữ liệu từ Excel</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* BOTTOM DOCK CHUẨN FORM */}
      <View style={styles.bottomDock}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("CustomerCreatePickup")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Tạo đơn mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
            onPress={submitSelected}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Chốt túi hàng</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

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
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  listContent: { padding: 16, paddingBottom: 120 },

  // Empty State chuẩn Form
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  // Card Phẳng Chuẩn DNA
  card: {
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
  cardChecked: {
    borderColor: PRIMARY,
    backgroundColor: "#F0FDF4", // Màu xanh lá siêu nhạt để nhận biết đã chọn
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkBox: { marginRight: 12 },
  title: { fontSize: 15, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  subText: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  deleteBtn: {
    padding: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    marginLeft: 10,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 12 },
  meta: { fontSize: 13, color: "#64748B", marginBottom: 4 },

  outlineBtn: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#FFFFFF",
  },
  outlineBtnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  outlineBtnText: { color: PRIMARY, fontSize: 14, fontWeight: "800" },

  // Bottom Dock Chuẩn Form
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  primaryBtnText: { color: "white", fontSize: 15, fontWeight: "900" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: { color: "#475569", fontSize: 15, fontWeight: "800" },
});
