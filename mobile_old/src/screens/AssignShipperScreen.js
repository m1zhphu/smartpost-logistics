import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import EmptyState from "../components/EmptyState";
import UniversalScanner from "../components/UniversalScanner";
import AssignShipperStyles from "../styles/AssignShipperStyles";
import { deliveryService } from "../services/deliveryService";
import { hubService } from "../services/hubService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { SPACING } from "../constants/theme";
import { isRouteAllowed } from "../utils/roleUtils";
import Toast from "react-native-toast-message";

const ASSIGN_TYPE = {
  SHIPPER: "SHIPPER",
  HUB: "HUB",
};

const getPickupCode = (item) =>
  item.waybill_code || item.bill_code || item.pickup_code || item.code || "";
const getCustomerName = (item) =>
  item.customer_name ||
  item.recipient_name ||
  item.name ||
  "Khách hàng chưa rõ";
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
  const [shipperSearch, setShipperSearch] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isRouteAllowed(user, "AssignShipper")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [user]);

  useEffect(() => {
    if (!user.token) return;
    fetchPendingPickups();
    fetchShippers();
    fetchHubs();
  }, [user.token]);

  const fetchPendingPickups = async () => {
    setLoadingData(true);
    try {
      const data = await deliveryService.getPendingPickups(user.token);
      setPendingPickups(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: error.message || "Không thể tải danh sách đơn cho nhận.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchShippers = async () => {
    try {
      const data = await deliveryService.getShippers(user.token);
      setShippers(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: error.message || "Không thể tải danh sách bưu tá.",
      });
    }
  };

  const fetchHubs = async () => {
    try {
      const data = await hubService.getHubs(user.token);
      setHubs(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: error.message || "Không thể tải danh sách kho/bưu cục.",
      });
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
      Toast.show({
        type: "error",
        text1: "Đơn không hợp lệ",
        text2: "Mã quét không khớp với danh sách đơn cho nhận.",
      });
      return;
    }

    handleTogglePickup(normalized);
  };

  const assigneeList = useMemo(
    () => (assignType === ASSIGN_TYPE.SHIPPER ? shippers : hubs),
    [assignType, shippers, hubs],
  );

  const filteredShippers = useMemo(() => {
    const keyword = shipperSearch.trim().toLowerCase();
    if (!keyword) return shippers;

    return shippers.filter((item) => {
      const fullName = String(item.full_name || "").toLowerCase();
      const username = String(item.username || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      return (
        fullName.includes(keyword) ||
        username.includes(keyword) ||
        phone.includes(keyword)
      );
    });
  }, [shipperSearch, shippers]);

  const selectedAssigneeId = selectedAssignee
    ? String(selectedAssignee.id)
    : "";

  const handleSelectHub = (value) => {
    if (!value) {
      setSelectedAssignee(null);
      return;
    }

    const selected = hubs.find((item) => String(item.hub_id) === String(value));
    if (selected) {
      setSelectedAssignee({ ...selected, id: value });
    }
  };

  const handleSelectShipper = (item) => {
    setSelectedAssignee({ ...item, id: String(item.user_id) });
  };

  const handleAssignPickup = async () => {
    if (selectedPickupCodes.length === 0) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng chọn ít nhất một đơn.",
      });
      return;
    }

    if (!selectedAssignee) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2:
          "Vui lòng chọn " +
          (assignType === ASSIGN_TYPE.SHIPPER ? "bưu tá" : "kho/bưu cục") +
          ".",
      });
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

    setAssigning(true);
    try {
      await deliveryService.assignPickup(user.token, payload);
      setPendingPickups((prev) =>
        prev.filter(
          (item) => !selectedPickupCodes.includes(getPickupCode(item)),
        ),
      );
      setSelectedPickupCodes([]);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2:
          "Đã điều phối " + selectedPickupCodes.length + " đơn thành công.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi điều phối",
        text2: error.message || "Không thể điều phối đơn.",
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={AssignShipperStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.neutralDark}
      />

      <View style={AssignShipperStyles.scannerWrapper}>
        <UniversalScanner
          title="Điều phối đơn nhận hàng"
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
        <Text style={AssignShipperStyles.headerTitle}>
          Điều phối đơn nhận hàng
        </Text>
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
            <Text style={AssignShipperStyles.radioLabel}>Bưu tá</Text>
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

        {assignType === ASSIGN_TYPE.SHIPPER ? (
          <>
            <CustomInput
              label="Tìm kiếm bưu tá"
              value={shipperSearch}
              onChangeText={setShipperSearch}
              placeholder="Nhập tên, username hoặc số điện thoại"
              leftIcon={({ color }) => (
                <Ionicons
                  name="search"
                  size={SPACING.md_sm}
                  color={color || COLORS.textMuted}
                />
              )}
              containerStyle={AssignShipperStyles.searchInputContainer}
            />

            <FlatList
              data={filteredShippers}
              keyExtractor={(item, index) => String(item.user_id || index)}
              contentContainerStyle={AssignShipperStyles.shipperListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isActive =
                  String(selectedAssignee?.id || "") === String(item.user_id);
                return (
                  <TouchableOpacity
                    style={[
                      AssignShipperStyles.shipperItem,
                      isActive && AssignShipperStyles.shipperItemActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleSelectShipper(item)}
                  >
                    <View style={AssignShipperStyles.shipperAvatar}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={COLORS.secondary}
                      />
                    </View>
                    <View style={AssignShipperStyles.shipperInfo}>
                      <Text style={AssignShipperStyles.shipperName}>
                        {item.full_name || item.username || "---"}
                      </Text>
                      <Text style={AssignShipperStyles.shipperPhone}>
                        {item.phone ||
                          item.username ||
                          "Khong co so dien thoai"}
                      </Text>
                    </View>
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={SPACING.lg}
                        color={COLORS.secondary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  icon="clipboard-text-outline"
                  title="Không tìm thấy shipper phù hợp"
                  message="Thử tìm kiếm lại tên, username hoặc số điện thoại."
                />
              }
            />
          </>
        ) : (
          <View style={AssignShipperStyles.pickerWrap}>
            <Picker
              selectedValue={selectedAssigneeId}
              onValueChange={handleSelectHub}
            >
              <Picker.Item label="Chọn kho/bưu cục..." value="" />
              {assigneeList.map((item) => {
                const itemId = String(item.hub_id);
                const label = item.hub_name || item.hub_code || "---";
                return (
                  <Picker.Item key={itemId} label={label} value={itemId} />
                );
              })}
            </Picker>
          </View>
        )}

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
            loadingData ? (
              <View style={AssignShipperStyles.emptyWrap}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
              </View>
            ) : (
              <View style={AssignShipperStyles.emptyWrap}>
                <Text style={AssignShipperStyles.emptyText}>
                  Không có đơn chờ nhận. Vui lòng kiểm tra lại kết nối.
                </Text>
              </View>
            )
          }
        />

        <SafeAreaView edges={["bottom"]} style={AssignShipperStyles.footerSafe}>
          <View style={AssignShipperStyles.footer}>
            <CustomButton
              title={`Gán / Điều phối (${selectedPickupCodes.length})`}
              onPress={handleAssignPickup}
              loading={assigning}
              disabled={assigning || selectedPickupCodes.length === 0}
              variant="secondary"
            />
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}
