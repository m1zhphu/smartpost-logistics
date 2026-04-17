import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { deliveryService } from '../../api/services/deliveryService';
import { useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout);
  const isFocused = useIsFocused();

  const [codData, setCodData] = useState({ expected_cod: 0, delivered_count: 0 });
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (isFocused && user?.roleId === 4) {
      setLoading(true);
      deliveryService.getPendingCOD()
        .then((data) => {
          const currentData = Array.isArray(data) ? data[0] : data;
          if (currentData) setCodData(currentData);
        })
        .catch(console.log)
        .finally(() => setLoading(false));
    }
  }, [isFocused]);

  const getRoleName = () => {
    if (user?.roleId === 1) return 'Quản trị viên hệ thống (Admin)';
    if (user?.roleId === 2) return 'Quản lý Bưu cục';
    if (user?.roleId === 3) return 'Nhân viên Kho / Vận hành';
    if (user?.roleId === 4) return 'Nhân viên Giao hàng (Shipper)';
    if (user?.roleId === 5) return 'Kế toán (Accountant)';
    return 'Chưa xác định';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* HEADER NỀN XANH */}
      <View style={styles.blueHeader}>
        <View style={styles.headerCircleDecoration1} />
        <View style={styles.headerCircleDecoration2} />
        <Text style={styles.headerTitle}>Hồ Sơ Cá Nhân</Text>
      </View>

      {/* 🚀 FIX ANDROID: ScrollView bọc ngoài được đẩy lên trên bằng zIndex và marginTop âm */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD THÔNG TIN CÁ NHÂN (Bỏ margin âm ở đây) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.nameText}>{user?.fullName || user?.username || 'Người dùng'}</Text>
          <Text style={styles.roleText}>{getRoleName()}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang hoạt động</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.iconWrap}><Ionicons name="call" size={18} color={theme.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Điện thoại</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconWrap}><Ionicons name="mail" size={18} color={theme.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Tài khoản (Email/Username)</Text>
                <Text style={styles.infoValue}>@{user?.username || 'unknown'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.iconWrap}><Ionicons name="business" size={18} color={theme.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Bưu cục trực thuộc (Hub)</Text>
                <Text style={styles.infoValue}>Hub ID: #{user?.hubId || 'Toàn hệ thống'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CARD THỐNG KÊ COD (Chỉ dành cho Shipper) */}
        {user?.roleId === 4 && (
          <View style={styles.menuCard}>
            <View style={styles.codHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.codIconWrap}><Ionicons name="wallet" size={20} color={theme.warning} /></View>
                <Text style={styles.codTitle}>Tiền COD đang giữ</Text>
              </View>
              <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
            </View>

            {loading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.codContent}>
                <Text style={styles.codAmount}>{(Number(codData.expected_cod) || 0).toLocaleString('vi-VN')} <Text style={{ fontSize: 20 }}>đ</Text></Text>
                <Text style={styles.codDesc}>Chưa bàn giao kế toán • Từ {codData.delivered_count || 0} đơn hàng</Text>
              </View>
            )}
          </View>
        )}

        {/* NÚT ĐĂNG XUẤT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={22} color={theme.danger} />
          <Text style={styles.logoutText}>Đăng Xuất Khỏi Thiết Bị</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SmartPost App - Phiên bản 2.0.1</Text>
      </ScrollView>

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalWarningIcon}>
              <Ionicons name="log-out" size={32} color={theme.danger} />
            </View>
            <Text style={styles.modalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.modalDesc}>Bạn sẽ cần đăng nhập lại vào lần sau để tiếp tục sử dụng ứng dụng.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalBtnCancelText}>Hủy Bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={logout}>
                <Text style={styles.modalBtnConfirmText}>Đăng Xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header Xanh
  blueHeader: {
    backgroundColor: theme.primary,
    height: 180,
    alignItems: 'center',
    paddingTop: 50,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1 // Đảm bảo Header nằm dưới ScrollView
  },
  headerCircleDecoration1: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerCircleDecoration2: { position: 'absolute', bottom: -30, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },

  // Kéo ScrollView đè lên Header thay vì kéo từng Card
  scrollView: {
    flex: 1,
    marginTop: -60, // Kéo toàn bộ vùng cuộn lên
    zIndex: 10,     // Nổi trên Header
  },
  scrollContent: { paddingBottom: 40 },

  // Card Thông tin cá nhân
  profileCard: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 }
  },

  avatarContainer: { position: 'relative', marginTop: 10, marginBottom: 15 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: theme.primaryBackground, borderWidth: 4, borderColor: theme.card, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: theme.primary },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: theme.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.card, elevation: 3 },

  nameText: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  roleText: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.successBackground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 10, marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success, marginRight: 6 },
  statusText: { color: theme.success, fontSize: 12, fontWeight: 'bold' },

  infoList: { width: '100%', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.background, paddingBottom: 15 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryBackground, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 15, color: theme.text, fontWeight: '600' },

  // Card COD
  menuCard: { backgroundColor: theme.card, marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20, elevation: 2, borderWidth: 1, borderColor: theme.border },
  codHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  codIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.warningBackground, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  codTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text },
  codContent: { backgroundColor: theme.background, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  codAmount: { fontSize: 32, fontWeight: 'bold', color: theme.danger, marginBottom: 5 },
  codDesc: { color: theme.textSecondary, fontSize: 13 },

  // Nút Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.dangerBackground, marginHorizontal: 20, marginTop: 30, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.dangerBackground },
  logoutText: { color: theme.danger, fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

  versionText: { textAlign: 'center', marginTop: 20, color: theme.border, fontSize: 12, fontWeight: '500' },

  // Modal Custom
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.card, width: '85%', padding: 25, borderRadius: 24, alignItems: 'center', elevation: 5 },
  modalWarningIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.dangerBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10 },
  modalDesc: { textAlign: 'center', color: theme.textSecondary, marginBottom: 25, fontSize: 14, lineHeight: 22 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.background, marginRight: 8, alignItems: 'center' },
  modalBtnCancelText: { color: theme.text, fontWeight: 'bold', fontSize: 15 },
  modalBtnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.danger, marginLeft: 8, alignItems: 'center', elevation: 2 },
  modalBtnConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});