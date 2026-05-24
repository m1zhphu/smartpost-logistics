import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HubManagementStyles from "../styles/HubManagementStyles";
import { hubService } from "../services/hubService";
import { useUser } from "../context/UserContext";
import { getRoleKey, isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import SkeletonLoader from "../components/SkeletonLoader";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import ConfirmModal from "../components/ConfirmModal";
import { BORDER_RADIUS, TYPOGRAPHY } from "../constants/theme";
import Toast from "react-native-toast-message";

export default function HubManagementScreen({ navigation }) {
  const { user } = useUser();
  const roleKey = getRoleKey(user);
  const isAdmin = roleKey === "admin";
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusConfirmHub, setStatusConfirmHub] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({
    hub_code: "",
    hub_name: "",
    address: "",
  });

  useEffect(() => {
    if (!isRouteAllowed(user, "HubManagement")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  useEffect(() => {
    if (user.token) {
      fetchHubs();
    }
  }, [user.token]);

  const fetchHubs = async () => {
    setLoading(true);
    try {
      const data = await hubService.getHubs(user.token);
      const normalizedHubs = Array.isArray(data) ? data : [];

      if (roleKey === "hub_manager" && user.hub_id) {
        const assignedHub = normalizedHubs.filter(
          (hub) => String(hub.hub_id || hub.id) === String(user.hub_id),
        );
        setHubs(assignedHub.length > 0 ? assignedHub : normalizedHubs);
      } else {
        setHubs(normalizedHubs);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tải danh sách bưu cục.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHub = async () => {
    if (!form.hub_code.trim() || !form.hub_name.trim()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng nhập mã và tên bưu cục.",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      await hubService.createHub(user.token, {
        hub_code: form.hub_code.trim().toUpperCase(),
        hub_name: form.hub_name.trim(),
        address: form.address.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã tạo bưu cục mới.",
      });
      setShowModal(false);
      setForm({ hub_code: "", hub_name: "", address: "" });
      fetchHubs();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tạo bưu cục.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getHubStatusValue = (hub) => {
    if (typeof hub.status === "boolean") {
      return hub.status;
    }

    if (typeof hub.status === "string") {
      return ["ACTIVE", "OPEN", "TRUE", "1"].includes(hub.status.toUpperCase());
    }

    return !!hub.is_active;
  };

  const toggleHubStatus = (hub) => {
    setStatusConfirmHub(hub);
  };

  const executeToggleHubStatus = async () => {
    if (!statusConfirmHub) return;
    const hub = statusConfirmHub;
    const nextStatus = !getHubStatusValue(hub);
    setStatusConfirmHub(null);

    try {
      await hubService.updateHubStatus(user.token, hub.hub_id, nextStatus);
      fetchHubs();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể cập nhật trạng thái bưu cục.",
      });
    }
  };
  const stats = useMemo(() => {
    const getCount = (hub, keys) => {
      for (const key of keys) {
        const value = Number(hub?.[key]);
        if (Number.isFinite(value)) {
          return value;
        }
      }
      return 0;
    };

    return hubs.reduce(
      (acc, hub) => ({
        pending:
          acc.pending +
          getCount(hub, ["pending_orders", "order_pending", "orders_pending"]),
        incoming:
          acc.incoming +
          getCount(hub, [
            "incoming_orders",
            "orders_incoming",
            "arriving_orders",
          ]),
        outgoing:
          acc.outgoing +
          getCount(hub, [
            "outgoing_orders",
            "orders_outgoing",
            "dispatch_orders",
          ]),
      }),
      { pending: 0, incoming: 0, outgoing: 0 },
    );
  }, [hubs]);

  const renderStatCards = () => {
    if (loading) {
      return (
        <View style={HubManagementStyles.statsGrid}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={HubManagementStyles.statsCard}>
              <SkeletonLoader
                height={TYPOGRAPHY.lineHeight.caption}
                width="70%"
                borderRadius={BORDER_RADIUS.sm}
              />
              <SkeletonLoader
                height={TYPOGRAPHY.lineHeight.heading}
                width="55%"
                borderRadius={BORDER_RADIUS.sm}
              />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={HubManagementStyles.statsGrid}>
        <View style={HubManagementStyles.statsCard}>
          <Text style={HubManagementStyles.statsLabel}>Đơn chờ xử lý</Text>
          <Text style={HubManagementStyles.statsValue}>{stats.pending}</Text>
        </View>
        <View style={HubManagementStyles.statsCard}>
          <Text style={HubManagementStyles.statsLabel}>Đơn đang xử lý</Text>
          <Text style={HubManagementStyles.statsValue}>{stats.incoming}</Text>
        </View>
        <View style={HubManagementStyles.statsCard}>
          <Text style={HubManagementStyles.statsLabel}>Đơn đã xử lý</Text>
          <Text style={HubManagementStyles.statsValue}>{stats.outgoing}</Text>
        </View>
      </View>
    );
  };

  const renderHubItem = ({ item }) => {
    const isActive = getHubStatusValue(item);

    return (
      <View style={HubManagementStyles.card}>
        <View style={HubManagementStyles.cardHeader}>
          <View style={HubManagementStyles.cardHeaderLeft}>
            <View style={HubManagementStyles.iconWrap}>
              <Ionicons
                name="business-outline"
                size={22}
                color={COLORS.secondary}
              />
            </View>
            <View style={HubManagementStyles.flex1}>
              <Text style={HubManagementStyles.hubName}>{item.hub_name}</Text>
              <Text style={HubManagementStyles.hubCode}>
                Mã hub: {item.hub_code}
              </Text>
            </View>
          </View>
          {isAdmin ? (
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => toggleHubStatus(item)}
            >
              <Ionicons
                name={isActive ? "toggle" : "toggle-outline"}
                size={42}
                color={isActive ? COLORS.secondary : COLORS.borderLight}
              />
            </Pressable>
          ) : (
            <View style={HubManagementStyles.adminHintWrap}>
              <Text style={HubManagementStyles.adminHintText}>
                Chỉ quản trị viên mới có thể thay đổi trạng thái hoạt động của
                bưu cục.
              </Text>
            </View>
          )}
        </View>

        <View style={HubManagementStyles.divider} />

        <View style={HubManagementStyles.infoRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={COLORS.textMuted}
            style={HubManagementStyles.addressIcon}
          />
          <Text style={HubManagementStyles.addressText} numberOfLines={2}>
            {item.address || "Chưa cập nhật địa chỉ hệ thống"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={HubManagementStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={HubManagementStyles.headerArea}>
        <View style={HubManagementStyles.headerCircleDecoration} />
        <View style={HubManagementStyles.headerTop}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
            style={HubManagementStyles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={HubManagementStyles.headerTitle}>Quản Lý Bưu Cục</Text>
          <View style={HubManagementStyles.headerRightPlaceholder} />
        </View>
      </View>

      <FlatList
        style={HubManagementStyles.scrollView}
        contentContainerStyle={HubManagementStyles.scrollContent}
        data={loading ? [] : hubs}
        keyExtractor={(item, index) => String(item.hub_id || index)}
        showsVerticalScrollIndicator={false}
        renderItem={renderHubItem}
        ListHeaderComponent={
          <View style={HubManagementStyles.listSection}>
            {roleKey === "hub_manager" ? (
              <View style={HubManagementStyles.roleHintWrap}>
                <Text style={HubManagementStyles.roleHintText}>
                  Bạn đang xem bưu cục được giao quản lý. Liên hệ quản trị viên
                  để được phân quyền thêm hoặc chỉnh sửa thông tin bưu cục khác.
                </Text>
              </View>
            ) : null}

            <View style={HubManagementStyles.statsSection}>
              {renderStatCards()}
            </View>

            <View style={HubManagementStyles.actionsSection}>
              <CustomButton
                title="Quét nhập kho"
                variant="primary"
                style={HubManagementStyles.blockButton}
                onPress={() => navigation.navigate("ScanInHub")}
                leftIcon={
                  <Ionicons
                    name="archive-outline"
                    size={20}
                    color={COLORS.white}
                  />
                }
              />
              <CustomButton
                title="Quét xuất kho"
                variant="secondary"
                style={HubManagementStyles.blockButton}
                onPress={() => navigation.navigate("ScanManifestLoad")}
                leftIcon={
                  <Ionicons
                    name="paper-plane-outline"
                    size={20}
                    color={COLORS.white}
                  />
                }
              />
            </View>

            <View style={HubManagementStyles.summaryCard}>
              <View style={HubManagementStyles.summaryIconWrap}>
                <Ionicons name="business" size={24} color={COLORS.secondary} />
              </View>
              <View style={HubManagementStyles.flex1}>
                <Text style={HubManagementStyles.summaryLabel}>
                  Tổng số bưu cục trên hệ thống
                </Text>
                <Text style={HubManagementStyles.summaryValue}>Toàn quốc</Text>
              </View>
              <View style={HubManagementStyles.summaryBadge}>
                <Text style={HubManagementStyles.summaryBadgeText}>
                  {hubs.length} Hub
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <Text style={HubManagementStyles.emptyText}>
              Chưa có bưu cục nào được tạo.{" "}
              {isAdmin ? "Hãy thêm bưu cục mới để bắt đầu." : ""}
            </Text>
          )
        }
      />

      {isAdmin ? (
        <Pressable
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={HubManagementStyles.fab}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={32} color={COLORS.white} />
        </Pressable>
      ) : null}

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={HubManagementStyles.flex1}
        >
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={HubManagementStyles.modalOverlay}
            onPress={() => setShowModal(false)}
          >
            <View
              style={HubManagementStyles.modalContainer}
              onStartShouldSetResponder={() => true}
            >
              <View style={HubManagementStyles.modalHeader}>
                <Text style={HubManagementStyles.modalTitle}>
                  Thêm Bưu Cục Mới
                </Text>
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setShowModal(false)}
                >
                  <Ionicons name="close" size={28} color={COLORS.primary} />
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={HubManagementStyles.formSection}>
                  <Text style={HubManagementStyles.label}>
                    Mã bưu cục{" "}
                    <Text style={HubManagementStyles.required}>*</Text>
                  </Text>
                  <CustomInput
                    value={form.hub_code}
                    onChangeText={(text) =>
                      setForm({ ...form, hub_code: text })
                    }
                    placeholder="VD: HCM-01"
                    autoCapitalize="characters"
                    inputStyle={HubManagementStyles.input}
                  />

                  <Text style={HubManagementStyles.label}>
                    Tên bưu cục{" "}
                    <Text style={HubManagementStyles.required}>*</Text>
                  </Text>
                  <CustomInput
                    value={form.hub_name}
                    onChangeText={(text) =>
                      setForm({ ...form, hub_name: text })
                    }
                    placeholder="Nhập tên bưu cục..."
                    inputStyle={HubManagementStyles.input}
                  />

                  <Text style={HubManagementStyles.label}>Địa chỉ</Text>
                  <CustomInput
                    value={form.address}
                    onChangeText={(text) => setForm({ ...form, address: text })}
                    placeholder="Nhập địa chỉ chi tiết..."
                    multiline
                    inputStyle={[
                      HubManagementStyles.input,
                      HubManagementStyles.multilineInput,
                    ]}
                  />

                  <CustomButton
                    title="Tạo Bưu Cục Mới"
                    onPress={handleCreateHub}
                    loading={submitLoading}
                    style={HubManagementStyles.submitBtn}
                  />
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={!!statusConfirmHub}
        title="Xác nhận"
        description={
          statusConfirmHub
            ? `${getHubStatusValue(statusConfirmHub) ? "Tạm dừng" : "Mở"} hoạt động bưu cục ${statusConfirmHub.hub_name}?`
            : ""
        }
        cancelText="Hủy"
        confirmText="Đồng ý"
        tone={statusConfirmHub && getHubStatusValue(statusConfirmHub) ? "warning" : "info"}
        iconName="business"
        onCancel={() => setStatusConfirmHub(null)}
        onConfirm={executeToggleHubStatus}
      />
    </View>
  );
}


