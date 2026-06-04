import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";
import EmptyState from "../components/EmptyState";
import CashConfirmStyles from "../styles/CashConfirmStyles";
import { accountingService } from "../services/accountingService";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import Toast from "react-native-toast-message";
import ConfirmModal from "../components/ConfirmModal";

const getShipperId = (item, index) => String(item?.shipper_id || index);

const getCashTone = (item) => {
  const confirmed = Boolean(item?.is_confirmed || item?.confirmed_at);
  return {
    color: confirmed ? COLORS.successAccent : COLORS.amberAccentText,
    label: confirmed ? "Đã thu tiền" : "Chờ xác nhận",
    badgeBg: confirmed ? COLORS.successBg : COLORS.amberAccentBg,
  };
};

export default function CashConfirmScreen({ navigation }) {
  const { user } = useUser();
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingShipperId, setProcessingShipperId] = useState(null);
  const [confirmingCash, setConfirmingCash] = useState(null);

  const fetchData = async () => {
    if (!user.token) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Phiên đăng nhập hết hạn",
        text2: "Vui lòng đăng nhập lại để tiếp tục.",
      });
      navigation.navigate("Login");
      return;
    }

    setLoading(true);
    try {
      const data = await accountingService.getCashConfirmationList(user.token);
      setShippers(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tải danh sách chốt ca.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRouteAllowed(user, "CashConfirm")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
    fetchData();
  }, [navigation, user.token]);

  const executeConfirm = async (shipper, shipperId) => {
    setProcessingShipperId(shipperId);
    try {
      await accountingService.confirmShipperCash(
        user.token,
        shipper.waybill_codes || [],
      );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Đã chốt ca nộp tiền cho shipper ${shipper.shipper_name || "shipper"}.`,
      });
      fetchData();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Lỗi hệ thống khi chốt tiền.",
      });
    } finally {
      setProcessingShipperId(null);
    }
  };

  const handleConfirmCash = (shipper, shipperId) => {
    if (
      !shipper ||
      !shipper.waybill_codes ||
      shipper.waybill_codes.length === 0
    ) {
      return;
    }

    setConfirmingCash({ shipper, shipperId });
  };

  const renderItem = ({ item, index }) => {
    const shipperId = getShipperId(item, index);
    const isLoading = processingShipperId === shipperId;
    const cashTone = getCashTone(item);
    const expectedCod = Number(item.expected_cod) || 0;

    return (
      <View style={CashConfirmStyles.card}>
        <View style={CashConfirmStyles.cardHeader}>
          <View style={CashConfirmStyles.cardHeaderLeft}>
            <View style={CashConfirmStyles.avatar}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={CashConfirmStyles.shipperInfo}>
              <Text style={CashConfirmStyles.shipperName}>
                {item.shipper_name || "Shipper"}
              </Text>
              <Text style={CashConfirmStyles.shipperSub}>{cashTone.label}</Text>
            </View>
          </View>

          <View
            style={[
              CashConfirmStyles.badgeCount,
              { backgroundColor: cashTone.badgeBg },
            ]}
          >
            <Text style={CashConfirmStyles.badgeText}>
              {item.delivered_count || 0} đơn
            </Text>
          </View>
        </View>

        <View style={CashConfirmStyles.cardBody}>
          <Text style={CashConfirmStyles.label}>
            Tổng tiền mặt cần nộp
          </Text>
          <View style={CashConfirmStyles.codAmountRow}>
            <Text
              style={[CashConfirmStyles.codAmount, { color: cashTone.color }]}
            >
              {expectedCod.toLocaleString("vi-VN")}
            </Text>
            <Text
              style={[CashConfirmStyles.codCurrency, { color: cashTone.color }]}
            >
              đ
            </Text>
          </View>
        </View>

        <View style={CashConfirmStyles.actionsRow}>
          <CustomButton
            title="Báo lỗi / Từ chối"
            variant="outline"
            onPress={() =>
              Toast.show({
                type: "info",
                text1: "Chức năng đang phát triển",
                text2:
                  "Vui lòng liên hệ quản trị để xử lý trường hợp này.",
              })
            }
            disabled={isLoading}
            style={CashConfirmStyles.outlineButton}
          />
          <CustomButton
            title="Xác nhận thu tiền"
            variant="secondary"
            onPress={() => handleConfirmCash(item, shipperId)}
            loading={isLoading}
            disabled={isLoading}
            style={CashConfirmStyles.confirmButton}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={CashConfirmStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={CashConfirmStyles.headerArea}>
        <View style={CashConfirmStyles.headerCircleDecoration} />

        <TouchableOpacity
          style={CashConfirmStyles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={CashConfirmStyles.headerTitle}>Chốt Ca Nộp Tiền</Text>
        <View style={CashConfirmStyles.headerSpacer} />
      </View>

      {loading ? (
        <View style={CashConfirmStyles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <View style={CashConfirmStyles.listContainer}>
          <FlatList
            data={shippers}
            keyExtractor={getShipperId}
            contentContainerStyle={CashConfirmStyles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            ListEmptyComponent={
              <EmptyState
                icon="wallet-outline"
                title="Chưa có đơn nào cần xác nhận"
                message="Tất cả shipper đã nộp đủ tiền COD hoặc chưa phát sinh giao dịch cần thu."
              />
            }
          />
        </View>
      )}

      <ConfirmModal
        visible={!!confirmingCash}
        title="Xác nhận thu tiền COD"
        description={
          confirmingCash
            ? `Bạn đã nhận đủ số tiền mặt: ${(Number(confirmingCash.shipper.expected_cod) || 0).toLocaleString("vi-VN")} đ từ shipper ${confirmingCash.shipper.shipper_name || "shipper"}?`
            : ""
        }
        cancelText="Hủy bỏ"
        confirmText="Xác nhận thu đủ"
        tone="danger"
        iconName="cash"
        onCancel={() => setConfirmingCash(null)}
        onConfirm={() => {
          if (!confirmingCash) return;
          const { shipper, shipperId } = confirmingCash;
          setConfirmingCash(null);
          executeConfirm(shipper, shipperId);
        }}
      />
    </View>
  );
}
