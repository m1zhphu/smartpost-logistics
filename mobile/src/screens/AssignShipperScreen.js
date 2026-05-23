import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import UniversalScanner from "../components/UniversalScanner";
import AssignShipperStyles from "../styles/AssignShipperStyles";
import { deliveryService } from "../services/deliveryService";
import { hubService } from "../services/hubService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";

const ASSIGN_TYPE = {
  SHIPPER: "SHIPPER",
  HUB: "HUB",
};

const getPickupCode = (item) =>
  item.waybill_code || item.bill_code || item.pickup_code || item.code || "";
const getCustomerName = (item) =>
  item.customer_name || item.recipient_name || item.name || "Khách hàng";
const getCustomerPhone = (item) =>
  item.customer_phone || item.phone || item.recipient_phone || "";
const getPickupAddress = (item) =>
  item.pickup_address || item.address || item.address_from || "Địa chỉ chưa rõ";
const getEstimatedCount = (item) =>
  Number(item.estimated_count ?? item.quantity ?? item.count ?? 0);

export default function AssignShipperScreen({ navigation }) {
  const { user } = useUser();
  const [pendingPickups, setPendingPickups] = useState([]);
  const [selectedPickupCodes, setSelectedPickupCodes] = useState([]);
  const [assignType, setAssignType] = useState(ASSIGN_TYPE.SHIPPER);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [shippers, setShippers] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRouteAllowed(user, "AssignShipper")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return;
    }
  }, [user]);

  useEffect(() => {
    if (!user.token) return;
    fetchPendingPickups();
    fetchShippers();
    fetchHubs();
  }, [user.token]);

  const fetchPendingPickups = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getPendingPickups(user.token);
      setPendingPickups(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải danh sách đơn chờ nhận.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchShippers = async () => {
    try {
      const data = await deliveryService.getShippers(user.token);
      setShippers(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể tải danh sách bưu tá.");
    }
  };

  const fetchHubs = async () => {
    try {
      const data = await hubService.getHubs(user.token);
      setHubs(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải danh sách kho/bưu cục.",
      );
    }
  };

  const handleTogglePickup = (pickupCode) => {
    if (!pickupCode) return;
    setSelectedPickupCodes((prev) =>
      prev.includes(pickupCode)
        ? prev.filter((code) => code !== pickupCode)
        : [...prev, pickupCode],
    );
  };

  const handleScan = async (code) => {
    const normalized = String(code || "")
      .trim()
      .toUpperCase();
    if (!normalized) return;

    const exists = pendingPickups.some(
      (item) => getPickupCode(item).trim().toUpperCase() === normalized,
    );

    if (!exists) {
      Alert.alert(
        "Không tìm thấy đơn",
        "Mã quét không khớp với danh sách đơn nhận hàng đang chờ.",
      );
      return;
    }

    handleTogglePickup(normalized);
  };

  const assigneeList = useMemo(
    () => (assignType === ASSIGN_TYPE.SHIPPER ? shippers : hubs),
    [assignType, shippers, hubs],
  );

  const selectedAssigneeId = selectedAssignee
    ? String(selectedAssignee.id)
    : "";

  const handleSelectAssignee = (value) => {
    if (!value) {
      setSelectedAssignee(null);
      return;
    }

    const selected = assigneeList.find(
      (item) =>
        String(
          item[assignType === ASSIGN_TYPE.SHIPPER ? "user_id" : "hub_id"],
        ) === String(value),
    );

    if (selected) {
      setSelectedAssignee({
        ...selected,
        id: value,
      });
    }
  };

  const handleAssignPickup = async () => {
    if (selectedPickupCodes.length === 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn ít nhất một đơn.");
      return;
    }

    if (!selectedAssignee) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn " +
          (assignType === ASSIGN_TYPE.SHIPPER ? "bưu tá" : "kho/bưu cục") +
          ".",
      );
      return;
    }

    const payload = {
      waybill_codes: selectedPickupCodes,
      assignee_type: assignType,
    };

    if (assignType === ASSIGN_TYPE.SHIPPER) {
      payload.shipper_id = selectedAssignee.user_id;
    } else {
      payload.hub_id = selectedAssignee.hub_id;
    }

    setLoading(true);
    try {
      await deliveryService.assignPickup(user.token, payload);
      setPendingPickups((prev) =>
        prev.filter(
          (item) => !selectedPickupCodes.includes(getPickupCode(item)),
        ),
      );
      setSelectedPickupCodes([]);
      Alert.alert(
        "Thành công",
        "Đã điều phối " + selectedPickupCodes.length + " đơn thành công.",
      );
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể điều phối nhận hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={AssignShipperStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={AssignShipperStyles.scannerWrapper}>
        <UniversalScanner
          title="Điều phối nhận hàng"
          instruction={
            selectedPickupCodes.length > 0
              ? "Đã chọn " +
                selectedPickupCodes.length +
                " đơn. Quét mã để chọn/hủy."
              : "Quét mã để chọn đơn nhận hàng."
          }
          onScan={handleScan}
        />

        <View style={AssignShipperStyles.camHeader}>
          <TouchableOpacity
            style={AssignShipperStyles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={AssignShipperStyles.liveBadge}>
            <Text style={AssignShipperStyles.liveBadgeText}>
              CHỌN ĐƠN NHẬN HÀNG
            </Text>
          </View>
        </View>
      </View>

      <View style={AssignShipperStyles.bottomSheet}>
        <Text style={AssignShipperStyles.headerTitle}>Điều phối nhận hàng</Text>
        <Text style={AssignShipperStyles.subTitle}>
          Chọn đơn đang chờ nhận, sau đó gán cho bưu tá hoặc kho/bưu cục.
        </Text>

        <View style={AssignShipperStyles.radioGroup}>
          <TouchableOpacity
            style={[
              AssignShipperStyles.radioOption,
              assignType === ASSIGN_TYPE.SHIPPER &&
                AssignShipperStyles.radioOptionActive,
            ]}
            onPress={() => {
              setAssignType(ASSIGN_TYPE.SHIPPER);
              setSelectedAssignee(null);
            }}
          >
            <View
              style={[
                AssignShipperStyles.radioCircle,
                assignType === ASSIGN_TYPE.SHIPPER &&
                  AssignShipperStyles.radioCircleSelected,
              ]}
            >
              {assignType === ASSIGN_TYPE.SHIPPER && (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              )}
            </View>
            <Text style={AssignShipperStyles.radioLabel}>Bưu Tá</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              AssignShipperStyles.radioOption,
              assignType === ASSIGN_TYPE.HUB &&
                AssignShipperStyles.radioOptionActive,
            ]}
            onPress={() => {
              setAssignType(ASSIGN_TYPE.HUB);
              setSelectedAssignee(null);
            }}
          >
            <View
              style={[
                AssignShipperStyles.radioCircle,
                assignType === ASSIGN_TYPE.HUB &&
                  AssignShipperStyles.radioCircleSelected,
              ]}
            >
              {assignType === ASSIGN_TYPE.HUB && (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              )}
            </View>
            <Text style={AssignShipperStyles.radioLabel}>Kho/Bưu cục</Text>
          </TouchableOpacity>
        </View>

        <View style={AssignShipperStyles.pickerWrap}>
          <Picker
            selectedValue={selectedAssigneeId}
            onValueChange={handleSelectAssignee}
          >
            <Picker.Item
              label={
                assignType === ASSIGN_TYPE.SHIPPER
                  ? "Chọn bưu tá..."
                  : "Chọn kho/bưu cục..."
              }
              value=""
            />
            {assigneeList.map((item) => {
              const itemId =
                assignType === ASSIGN_TYPE.SHIPPER
                  ? String(item.user_id)
                  : String(item.hub_id);
              const label =
                assignType === ASSIGN_TYPE.SHIPPER
                  ? item.full_name || item.username || "---"
                  : item.hub_name || item.hub_code || "---";
              return <Picker.Item key={itemId} label={label} value={itemId} />;
            })}
          </Picker>
        </View>

        <View style={AssignShipperStyles.listHeaderRow}>
          <Text style={AssignShipperStyles.listTitle}>
            Danh sách đơn chờ nhận
          </Text>
          <View style={AssignShipperStyles.badgeCount}>
            <Text style={AssignShipperStyles.badgeCountText}>
              {selectedPickupCodes.length} đã chọn
            </Text>
          </View>
        </View>

        <FlatList
          data={pendingPickups}
          keyExtractor={(item, index) =>
            getPickupCode(item) || item.pickup_id || String(index)
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={AssignShipperStyles.listContent}
          renderItem={({ item }) => {
            const code = getPickupCode(item);
            const isSelected = selectedPickupCodes.includes(code);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  AssignShipperStyles.pickupCard,
                  isSelected && AssignShipperStyles.pickupCardSelected,
                ]}
                onPress={() => handleTogglePickup(code)}
              >
                <View style={AssignShipperStyles.pickupCardLeft}>
                  <View style={AssignShipperStyles.checkbox}>
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={22}
                      color={isSelected ? COLORS.secondary : COLORS.textGray}
                    />
                  </View>
                  <View style={AssignShipperStyles.pickupCardContent}>
                    <Text style={AssignShipperStyles.pickupTitle}>{code}</Text>
                    <Text
                      style={AssignShipperStyles.pickupMeta}
                      numberOfLines={1}
                    >
                      {getCustomerName(item)} • {getCustomerPhone(item)}
                    </Text>
                    <Text
                      style={AssignShipperStyles.pickupMeta}
                      numberOfLines={2}
                    >
                      {getPickupAddress(item)}
                    </Text>
                    <View style={AssignShipperStyles.pickupInfoRow}>
                      <Text style={AssignShipperStyles.pickupInfoLabel}>
                        Số lượng ước tính
                      </Text>
                      <Text style={AssignShipperStyles.pickupInfoValue}>
                        {getEstimatedCount(item)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View style={AssignShipperStyles.emptyWrap}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
              </View>
            ) : (
              <View style={AssignShipperStyles.emptyWrap}>
                <View style={AssignShipperStyles.emptyIconCircle}>
                  <Ionicons
                    name="clipboard-outline"
                    size={48}
                    color={COLORS.textGray}
                  />
                </View>
                <Text style={AssignShipperStyles.emptyText}>
                  Không có đơn chờ nhận. Vui lòng làm mới hoặc kiểm tra lại kết
                  nối.
                </Text>
              </View>
            )
          }
        />

        <View style={AssignShipperStyles.footer}>
          <TouchableOpacity
            style={AssignShipperStyles.confirmBtn}
            onPress={handleAssignPickup}
            disabled={loading || selectedPickupCodes.length === 0}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={AssignShipperStyles.btnText}>
                Gán / Điều phối ({selectedPickupCodes.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
