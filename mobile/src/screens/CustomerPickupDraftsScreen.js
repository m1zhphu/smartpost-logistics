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
import styles from "../styles/CustomerPickupDraftsScreenStyles";
import {
  closePickupBag,
  createCustomerPickup,
  getPickupDrafts,
  removePickupDraft,
} from "../services/pickupService";

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
    if (selectedIds.length === drafts.length) {
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
        const res = await createCustomerPickup(buildPickupPayload(draft));

        if (!res.success) {
          throw new Error(res.message || "Không tạo được đơn");
        }

        createdCodes.push(res.data?.waybill_code);
        bagCode = res.data?.bag_code || bagCode;
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
        text1: "Không tạo được túi",
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
      activeOpacity={0.78}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const checked = selectedIds.includes(item.draft_id);

    return (
      <TouchableOpacity
        style={[styles.card, checked && styles.cardChecked]}
        onPress={() => toggleDraft(item.draft_id)}
        activeOpacity={0.84}
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
            <Text style={styles.title}>
              {item.draft_title ||
                item.rName ||
                item.itemName ||
                "Nháp chưa đặt tên"}
            </Text>

            <Text style={styles.subText}>
              {item.rPhone || "---"} · {item.serviceType || "STANDARD"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => deleteDraft(item.draft_id)}
            style={styles.deleteBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.meta}>Người gửi: {item.sName || "---"}</Text>
        <Text style={styles.meta}>Người nhận: {item.rName || "---"}</Text>
        <Text style={styles.meta}>
          Ngày lưu:{" "}
          {item.created_at
            ? new Date(item.created_at).toLocaleString("vi-VN")
            : "---"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Danh sách nháp</Text>
          <Text style={styles.headerSub}>
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

          <Text style={styles.emptyText}>Chưa có nháp nào.</Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.draft_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("CustomerCreatePickup")}
          activeOpacity={0.84}
        >
          <Text style={styles.secondaryBtnText}>Tạo nháp mới</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
          onPress={submitSelected}
          disabled={submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Tạo túi từ nháp</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
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

  headerCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  emptyText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },

  listContent: {
    padding: 16,
    paddingBottom: 130,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  cardChecked: {
    borderColor: PRIMARY,
    backgroundColor: "#F0FDF4",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  checkBox: {
    marginTop: 2,
    marginRight: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  subText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "700",
  },

  deleteBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  meta: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    fontWeight: "700",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: PRIMARY,
    marginRight: 12,
  },

  secondaryBtnText: {
    color: PRIMARY,
    fontWeight: "900",
    fontSize: 15,
  },

  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },

  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 15,
  },
});
*/
