import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TaskDetailStyles from "../styles/TaskDetailStyles";
import { waybillService } from "../services/waybillService";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { isRouteAllowed } from "../utils/roleUtils";

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
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    }
  }, [user]);

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
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ đích đến và lý do.");
      return;
    }

    if (!user.token) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin đăng nhập.");
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
      Alert.alert("Thành công", "Đã điều chuyển vận đơn thành công.");
      setTransferModalVisible(false);
      setTransferTargetId("");
      setTransferReason("");
    } catch (error) {
      Alert.alert(
        "Lỗi điều chuyển",
        error.message || "Không thể điều chuyển vận đơn.",
      );
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
    Alert.alert(
      "Thông báo",
      "Tính năng in vận đơn chưa được bật trong dự án hiện tại.",
    );
  };

  const isExpress = waybill.service_type === "EXPRESS";
  const canUpdate = !["SUCCESS", "FAILED", "DELIVERED"].includes(
    waybill.status,
  );

  return (
    <View style={TaskDetailStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={TaskDetailStyles.headerArea}>
        <View style={TaskDetailStyles.headerCircleDecoration} />
        <View style={TaskDetailStyles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={TaskDetailStyles.iconBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={TaskDetailStyles.headerSub}>CHI TIẾT ĐƠN</Text>
            <Text style={TaskDetailStyles.headerTitle}>
              {waybill.waybill_code}
            </Text>
          </View>
          <TouchableOpacity
            style={TaskDetailStyles.iconBtn}
            onPress={handlePrint}
          >
            <Ionicons name="print-outline" size={22} color="#fff" />
          </TouchableOpacity>
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
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={TaskDetailStyles.custName} numberOfLines={1}>
              {waybill.receiver_name}
            </Text>
            <Text style={TaskDetailStyles.custPhone}>
              {waybill.receiver_phone}
            </Text>
          </View>
          <TouchableOpacity
            style={TaskDetailStyles.actionBtnCall}
            onPress={callCustomer}
          >
            <Ionicons name="call" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={TaskDetailStyles.actionBtnMap}
            onPress={openMap}
          >
            <Ionicons name="location" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={TaskDetailStyles.divider} />

        <View style={TaskDetailStyles.addressRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color="#7b867e"
            style={{ marginTop: 2, marginRight: 8 }}
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
            <Text style={TaskDetailStyles.codLabel}>THU HỘ COD</Text>
            <Text style={TaskDetailStyles.codValue}>
              {Number(waybill.cod_amount || 0).toLocaleString("vi-VN")}
            </Text>
            <Text style={TaskDetailStyles.codUnit}>đồng</Text>
          </View>

          <View style={TaskDetailStyles.rightStats}>
            <View style={TaskDetailStyles.statBox}>
              <Text style={TaskDetailStyles.statLabel}>KHỐI LƯỢNG</Text>
              <Text style={TaskDetailStyles.statValue}>
                {waybill.actual_weight || 0}{" "}
                <Text style={TaskDetailStyles.statUnitInline}>kg</Text>
              </Text>
            </View>
            <View style={[TaskDetailStyles.statBox, { marginTop: 10 }]}>
              <Text style={TaskDetailStyles.statLabel}>CƯỚC PHÍ</Text>
              <Text style={TaskDetailStyles.statValue}>
                {Number(waybill.shipping_fee || 0).toLocaleString("vi-VN")}{" "}
                <Text style={TaskDetailStyles.statUnitInline}>đ</Text>
              </Text>
            </View>
          </View>
        </View>

        {waybill.note ? (
          <View style={TaskDetailStyles.card}>
            <Text style={TaskDetailStyles.noteLabel}>GHI CHÚ TỪ SHOP</Text>
            <Text style={TaskDetailStyles.noteText}>{waybill.note}</Text>
          </View>
        ) : null}

        <View style={TaskDetailStyles.card}>
          <View style={TaskDetailStyles.timelineHeaderRow}>
            <View style={TaskDetailStyles.dotPrimaryTitle} />
            <Text style={TaskDetailStyles.timelineTitle}>
              LỊCH SỬ HÀNH TRÌNH
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator
              color={COLORS.secondary}
              style={{ marginVertical: 20 }}
            />
          ) : tracking.length === 0 ? (
            <Text style={TaskDetailStyles.emptyText}>
              Chưa có thông tin hành trình
            </Text>
          ) : (
            <View style={{ marginTop: 15 }}>
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
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: COLORS.white,
          }}
        >
          <TouchableOpacity
            style={[
              TaskDetailStyles.updateBtn,
              { marginBottom: 10, backgroundColor: COLORS.secondary },
            ]}
            onPress={handleOpenTransferModal}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={TaskDetailStyles.updateBtnText}>Điều chuyển</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{ backgroundColor: "#fff", borderRadius: 18, padding: 20 }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              Điều chuyển vận đơn
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["HUB", "SHIPPER"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setTransferTargetType(type)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor:
                      transferTargetType === type ? COLORS.primary : "#d1d5db",
                    backgroundColor:
                      transferTargetType === type ? COLORS.primary : "#fff",
                    marginRight: type === "HUB" ? 8 : 0,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color:
                        transferTargetType === type ? "#fff" : COLORS.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    {type === "HUB" ? "Kho" : "Shipper"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={{ marginBottom: 6, color: "#374151", fontWeight: "600" }}
            >
              ID đích đến
            </Text>
            <TextInput
              value={transferTargetId}
              onChangeText={setTransferTargetId}
              keyboardType="number-pad"
              placeholder={
                transferTargetType === "HUB" ? "Nhập Hub ID" : "Nhập Shipper ID"
              }
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            />

            <Text
              style={{ marginBottom: 6, color: "#374151", fontWeight: "600" }}
            >
              Lý do
            </Text>
            <TextInput
              value={transferReason}
              onChangeText={setTransferReason}
              placeholder="Nhập lý do điều chuyển"
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 12,
                minHeight: 90,
                textAlignVertical: "top",
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setTransferModalVisible(false)}
                style={{
                  marginRight: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: COLORS.textMuted }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitTransfer}
                disabled={transferLoading}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary,
                  opacity: transferLoading ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {transferLoading ? "Đang chuyển..." : "Xác nhận"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {canUpdate ? (
        <View style={TaskDetailStyles.bottomBar}>
          <TouchableOpacity
            style={TaskDetailStyles.printerBtn}
            onPress={handlePrint}
          >
            <Ionicons name="print-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={TaskDetailStyles.updateBtn}
            onPress={() => navigation.navigate("UpdateStatus", { waybill })}
          >
            <Ionicons
              name="checkbox-outline"
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={TaskDetailStyles.updateBtnText}>
              Cập nhật trạng thái giao
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
