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
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { getRoleKey, isRouteAllowed } from "../utils/roleUtils";
import { userService } from "../services/userService";
import StaffManagementStyles from "../styles/StaffManagementStyles";
import { COLORS } from "../constants/colors";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "react-native-toast-message";

export default function StaffManagementScreen({ navigation }) {
  const { user } = useUser();
  const roleKey = getRoleKey(user);
  const isAdmin = roleKey === "admin";
  const styles = StaffManagementStyles;

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusConfirmStaff, setStatusConfirmStaff] = useState(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    password: "",
    role_id: 4,
    phone: "",
  });

  useEffect(() => {
    if (!isRouteAllowed(user, "StaffManagement")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
      return;
    }
    fetchStaff();
  }, [navigation, user]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(user.token);
      setStaffList(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tải danh sách nhân viên.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return staffList;

    return staffList.filter(
      (item) =>
        (item.full_name || item.username || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.username || "").toLowerCase().includes(keyword) ||
        (item.phone || "").includes(keyword),
    );
  }, [staffList, query]);

  const handleCreateStaff = async () => {
    if (!form.username || !form.full_name || !form.password) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền tên đăng nhập, họ tên và mật khẩu.",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      await userService.createUser(user.token, {
        username: form.username,
        full_name: form.full_name,
        password: form.password,
        role_id: form.role_id,
        phone: form.phone,
      });
      Toast.show({
        type: "success",
        text1: "Hoàn thành",
        text2: "Đã tạo tài khoản nhân viên mới.",
      });
      setForm({
        username: "",
        full_name: "",
        password: "",
        role_id: 4,
        phone: "",
      });
      setShowModal(false);
      fetchStaff();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tạo tài khoản nhân viên mới.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleStatus = (item) => {
    setStatusConfirmStaff(item);
  };

  const executeToggleStatus = async () => {
    if (!statusConfirmStaff) return;

    const item = statusConfirmStaff;
    setStatusConfirmStaff(null);

    try {
      await userService.toggleUserStatus(
        user.token,
        item.user_id,
        !item.is_active,
      );
      fetchStaff();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể cập nhật trạng thái.",
      });
    }
  };

  const getRoleName = (roleId) => {
    if (roleId === 3) return "Nhân viên kho";
    if (roleId === 4) return "Shipper";
    return "Quản trị viên";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Quản lý nhân sự</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.toolbar}>
          <CustomInput
            containerStyle={styles.searchInput}
            placeholder="Tìm tên, username, số điện thoại..."
            value={query}
            onChangeText={setQuery}
            leftIcon={
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
            }
          />
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.filterBtn}
          >
            <Ionicons name="funnel-outline" size={18} color={COLORS.primary} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Tổng số tài khoản</Text>
          <Text style={styles.summaryValue}>{filteredStaff.length}</Text>
        </View>

        <FlatList
          data={filteredStaff}
          keyExtractor={(item) =>
            String(item.user_id || item.id || item.username)
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {item.full_name || item.username}
                  </Text>
                  <Text style={styles.staffMeta}>
                    @{item.username} • {item.phone || "Không có SĐT"}
                  </Text>
                </View>
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.toggleBtn}
                  onPress={() => toggleStatus(item)}
                >
                  <Ionicons
                    name={item.is_active ? "toggle" : "toggle-outline"}
                    size={40}
                    color={
                      item.is_active ? COLORS.successAccent : COLORS.textMuted
                    }
                  />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {getRoleName(item.role_id)}
                  </Text>
                </View>
                <Text
                  style={
                    item.is_active ? styles.statusActive : styles.statusInactive
                  }
                >
                  {item.is_active ? "Đang hoạt động" : "Đã khóa"}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="account-off-outline"
                title="Không có nhân sự phù hợp"
                message="Hãy thử từ khóa khác hoặc làm mới danh sách."
              />
            ) : null
          }
        />
      </View>

      {isAdmin ? (
        <SafeAreaView edges={["bottom"]} style={styles.addFooterSafe}>
          <View style={styles.addFooter}>
            <CustomButton
              title="Thêm nhân sự mới"
              onPress={() => setShowModal(true)}
              style={styles.addBtn}
              leftIcon={
                <Ionicons name="person-add" size={20} color={COLORS.white} />
              }
            />
          </View>
        </SafeAreaView>
      ) : null}

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex1}
        >
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}
          >
            <View
              style={styles.modalContainer}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thêm nhân sự mới</Text>
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setShowModal(false)}
                >
                  <Ionicons name="close" size={26} color={COLORS.neutralDark} />
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                <CustomInput
                  label="Tên đăng nhập"
                  value={form.username}
                  onChangeText={(text) => setForm({ ...form, username: text })}
                  placeholder="VD: nguyenvan"
                  autoCapitalize="none"
                />
                <CustomInput
                  label="Họ và tên"
                  value={form.full_name}
                  onChangeText={(text) => setForm({ ...form, full_name: text })}
                  placeholder="VD: Nguyễn Văn A"
                />
                <CustomInput
                  label="Số điện thoại"
                  value={form.phone}
                  keyboardType="phone-pad"
                  onChangeText={(text) =>
                    setForm({ ...form, phone: text.replace(/[^0-9]/g, "") })
                  }
                  placeholder="Nhập số điện thoại"
                />
                <CustomInput
                  label="Mật khẩu"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  placeholder="Mật khẩu khởi tạo"
                />
                <Text style={styles.summaryText}>Vai trò</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={form.role_id}
                    onValueChange={(value) =>
                      setForm({ ...form, role_id: value })
                    }
                  >
                    <Picker.Item label="Nhân viên kho" value={3} />
                    <Picker.Item label="Shipper" value={4} />
                  </Picker>
                </View>
                <CustomButton
                  title="Tạo nhân sự"
                  onPress={handleCreateStaff}
                  loading={submitLoading}
                  style={styles.modalButton}
                />
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={!!statusConfirmStaff}
        title="Xác nhận"
        description={
          statusConfirmStaff
            ? `${statusConfirmStaff.is_active ? "Khóa" : "Mở khóa"} tài khoản ${statusConfirmStaff.username}?`
            : ""
        }
        cancelText="Hủy"
        confirmText="Đồng ý"
        tone={statusConfirmStaff?.is_active ? "danger" : "info"}
        iconName={statusConfirmStaff?.is_active ? "lock-closed" : "lock-open"}
        onCancel={() => setStatusConfirmStaff(null)}
        onConfirm={executeToggleStatus}
      />
    </KeyboardAvoidingView>
  );
}
