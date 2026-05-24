import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TaskDetailStyles from "../styles/TaskDetailStyles";
import { waybillService } from "../services/waybillService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import SkeletonLoader from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";
import Toast from "react-native-toast-message";

const TimelineSkeleton = () => (
  <View style={TaskDetailStyles.skeletonWrap}>
    {[1, 2, 3].map((item) => (
      <View key={item} style={TaskDetailStyles.card}>
        <SkeletonLoader height={16} width="45%" />
        <SkeletonLoader
          height={20}
          width="100%"
          style={TaskDetailStyles.skeletonLine}
        />
        <SkeletonLoader
          height={20}
          width="80%"
          style={TaskDetailStyles.skeletonLine}
        />
      </View>
    ))}
  </View>
);

export default function TaskDetailScreen({ route, navigation }) {
  const { user } = useUser();
  const { waybill } = route.params || {};
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferTargetType, setTransferTargetType] = useState("HUB");
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (!isRouteAllowed(user, "TaskDetail")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  useEffect(() => {
    if (!waybill || !user.token) {
      setLoading(false);
      return;
    }

    const loadTracking = async () => {
      setLoading(true);
      try {
        const data = await waybillService.getTracking(
          user.token,
          waybill.waybill_code,
        );
        setTracking(Array.isArray(data) ? data : []);
      } catch (error) {
        setTracking([]);
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [user.token, waybill]);

  const openMap = () => {
    const url = `http://maps.google.com/?q=${encodeURIComponent(waybill.receiver_address || "")}`;
    Linking.openURL(url);
  };

  const callCustomer = () => {
    Linking.openURL(`tel:${waybill.receiver_phone}`);
  };

  const handleOpenTransferModal = () => {
    setTransferTargetType("HUB");
    setTransferTargetId("");
    setTransferReason("");
    setTransferModalVisible(true);
  };

  const handleSubmitTransfer = async () => {
    if (!transferTargetId.trim() || !transferReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập đầy đủ thông tin.",
      });
      return;
    }

    if (!user.token) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không tìm th?y thông tin dang nh?p.",
      });
      return;
    }

    setTransferLoading(true);
    try {
      await waybillService.transferWaybill(
        user.token,
        waybill.waybill_code,
        transferTargetType,
        Number(transferTargetId),
        transferReason,
      );
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Ðã điều chuyển vận đơn thành công.",
      });
      setTransferModalVisible(false);
      setTransferTargetId("");
      setTransferReason("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể điều chuyển vận đơn.",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  if (!waybill) {
    return (
      <View style={TaskDetailStyles.center}>
        <Text>Không có dữ liệu</Text>
      </View>
    );
  }

  const handlePrint = () => {
    Toast.show({
      type: "info",
      text1: "Thông báo",
      text2: "Tính năng in đang phát triển.",
    });
  };

  const isExpress = waybill.service_type === "EXPRESS";
  const canUpdate = !["SUCCESS", "FAILED", "DELIVERED"].includes(
    waybill.status,
  );

  return (
    <View style={TaskDetailStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={TaskDetailStyles.headerArea}>
        <View style={TaskDetailStyles.headerTop}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
            style={TaskDetailStyles.iconBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </Pressable>
          <View style={TaskDetailStyles.headerTitleWrap}>
            <Text style={TaskDetailStyles.headerSub}>CHI TIẾT VẬN ĐƠN</Text>
            <Text style={TaskDetailStyles.headerTitle}>
              {waybill.waybill_code}
            </Text>
          </View>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={TaskDetailStyles.iconBtn}
            onPress={handlePrint}
          >
            <Ionicons name="print-outline" size={22} color={COLORS.white} />
          </Pressable>
        </View>

        <View style={TaskDetailStyles.badgeRow}>
          {isExpress ? (
            <View style={TaskDetailStyles.expressBadge}>
              <Text style={TaskDetailStyles.expressText}>Hỏa tốc</Text>
            </View>
          ) : null}
          <View style={TaskDetailStyles.statusBadge}>
            <Text style={TaskDetailStyles.statusText}>
              {canUpdate ? "Đang giao" : "Hoàn tất"}
            </Text>
          </View>
        </View>
      </View>

      <View style={TaskDetailStyles.customerBar}>
        <View style={TaskDetailStyles.customerHeader}>
          <Ionicons
            name="person-circle-outline"
            size={36}
            color={COLORS.primary}
          />
          <View style={TaskDetailStyles.custInfo}>
            <Text style={TaskDetailStyles.custName} numberOfLines={1}>
              {waybill.receiver_name}
            </Text>
            <Text style={TaskDetailStyles.custPhone}>
              {waybill.receiver_phone}
            </Text>
          </View>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={TaskDetailStyles.actionBtnCall}
            onPress={callCustomer}
          >
            <Ionicons name="call" size={18} color={COLORS.white} />
          </Pressable>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={TaskDetailStyles.actionBtnMap}
            onPress={openMap}
          >
            <Ionicons name="location" size={18} color={COLORS.primary} />
          </Pressable>
        </View>

        <View style={TaskDetailStyles.divider} />

        <View style={TaskDetailStyles.addressRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={COLORS.textMuted}
          />
          <Text style={TaskDetailStyles.addressText} numberOfLines={2}>
            {waybill.receiver_address}
          </Text>
        </View>
      </View>

      <ScrollView
        style={TaskDetailStyles.scrollView}
        contentContainerStyle={TaskDetailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={TaskDetailStyles.infoGrid}>
          <View style={TaskDetailStyles.codBox}>
            <Text style={TaskDetailStyles.codLabel}>Thu hộ COD</Text>
            <Text style={TaskDetailStyles.codValue}>
              {Number(waybill.cod_amount || 0).toLocaleString("vi-VN")}
            </Text>
            <Text style={TaskDetailStyles.codUnit}>d?ng</Text>
          </View>

          <View style={TaskDetailStyles.rightStats}>
            <View style={TaskDetailStyles.statBox}>
              <Text style={TaskDetailStyles.statLabel}>Khối lượng</Text>
              <Text style={TaskDetailStyles.statValue}>
                {waybill.actual_weight || 0} kg
              </Text>
            </View>
            <View style={TaskDetailStyles.statBox}>
              <Text style={TaskDetailStyles.statLabel}>Cước phí</Text>
              <Text style={TaskDetailStyles.statValue}>
                {Number(waybill.shipping_fee || 0).toLocaleString("vi-VN")} d
              </Text>
            </View>
          </View>
        </View>

        {waybill.note ? (
          <View style={TaskDetailStyles.card}>
            <Text style={TaskDetailStyles.noteLabel}>Ghi chú từ shop</Text>
            <Text style={TaskDetailStyles.noteText}>{waybill.note}</Text>
          </View>
        ) : null}

        <View style={TaskDetailStyles.card}>
          <View style={TaskDetailStyles.timelineHeaderRow}>
            <View style={TaskDetailStyles.dotPrimaryTitle} />
            <Text style={TaskDetailStyles.timelineTitle}>
              Lịch sử hành trình
            </Text>
          </View>

          {loading ? (
            <TimelineSkeleton />
          ) : tracking.length === 0 ? (
            <EmptyState
              icon="timeline-clock-outline"
              title="Chưa có hành trình"
              message="Chưa có thông tin hành trình cho vận đơn này."
            />
          ) : (
            <View>
              {tracking.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === tracking.length - 1;

                return (
                  <View
                    key={`${item.time || index}`}
                    style={TaskDetailStyles.trackItemContainer}
                  >
                    <View style={TaskDetailStyles.timeline}>
                      {isFirst ? (
                        <View style={TaskDetailStyles.timelineDotActiveWrap}>
                          <View style={TaskDetailStyles.timelineDotActive} />
                        </View>
                      ) : isLast ? (
                        <View style={TaskDetailStyles.timelineDotStart} />
                      ) : (
                        <View style={TaskDetailStyles.timelineDotPast} />
                      )}
                      {!isLast ? (
                        <View style={TaskDetailStyles.timelineLine} />
                      ) : null}
                    </View>
                    <View style={TaskDetailStyles.trackItem}>
                      <Text style={TaskDetailStyles.trackStatus}>
                        {item.note}
                      </Text>
                      <Text style={TaskDetailStyles.trackTime}>
                        {item.time
                          ? new Date(item.time).toLocaleString("vi-VN")
                          : ""}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {canUpdate ? (
        <SafeAreaView edges={["bottom"]} style={TaskDetailStyles.actionSection}>
          <View style={TaskDetailStyles.actionRow}>
            <CustomButton
              title="Điều chuyển"
              onPress={handleOpenTransferModal}
              variant="outline"
              style={TaskDetailStyles.actionBtn}
              leftIcon={
                <Ionicons
                  name="swap-horizontal-outline"
                  size={20}
                  color={COLORS.primary}
                />
              }
            />
            <CustomButton
              title="Hoàn thành nhiệm vụ"
              onPress={() => navigation.navigate("UpdateStatus", { waybill })}
              style={TaskDetailStyles.actionBtn}
              leftIcon={
                <Ionicons
                  name="checkbox-outline"
                  size={20}
                  color={COLORS.white}
                />
              }
            />
          </View>
        </SafeAreaView>
      ) : null}

      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={TaskDetailStyles.transferModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={TaskDetailStyles.transferModalContent}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={TaskDetailStyles.transferFormContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={TaskDetailStyles.transferModalTitle}>
                Điều chuyển vận đơn
              </Text>
              <View style={TaskDetailStyles.transferTypeRow}>
                {["HUB", "SHIPPER"].map((type) => (
                  <Pressable
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    key={type}
                    onPress={() => setTransferTargetType(type)}
                    style={[
                      TaskDetailStyles.transferTypeBtn,
                      transferTargetType === type &&
                        TaskDetailStyles.transferTypeBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        TaskDetailStyles.transferTypeText,
                        transferTargetType === type &&
                          TaskDetailStyles.transferTypeTextActive,
                      ]}
                    >
                      {type === "HUB" ? "Kho" : "Shipper"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <CustomInput
                label="ID đích đến"
                value={transferTargetId}
                onChangeText={setTransferTargetId}
                keyboardType="number-pad"
                placeholder={
                  transferTargetType === "HUB"
                    ? "Nhập Hub ID"
                    : "Nhập Shipper ID"
                }
              />

              <CustomInput
                label="Lý do"
                value={transferReason}
                onChangeText={setTransferReason}
                placeholder="Nhập lý do điều chuyển"
                multiline
                inputStyle={TaskDetailStyles.transferReasonInput}
              />

              <View style={TaskDetailStyles.transferActions}>
                <CustomButton
                  title="Hủy"
                  variant="outline"
                  onPress={() => setTransferModalVisible(false)}
                  style={TaskDetailStyles.transferActionBtn}
                />
                <CustomButton
                  title="Xác nhận"
                  onPress={handleSubmitTransfer}
                  loading={transferLoading}
                  style={TaskDetailStyles.transferActionBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
