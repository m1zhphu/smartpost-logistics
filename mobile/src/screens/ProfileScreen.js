import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { deliveryService } from '../services/deliveryService';
import { COLORS } from '../constants/colors';
import { getRoleKey, getRoleLabel } from '../utils/roleUtils';
import styles from '../styles/ProfileStyles';

const isShipperRole = (user) => getRoleKey(user) === 'shipper';

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useUser();
    const isFocused = useIsFocused();
    const [codData, setCodData] = useState({ expected_cod: 0, delivered_count: 0 });
    const [loading, setLoading] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (!isFocused) return;

        if (!isShipperRole(user)) return;

        setLoading(true);
        deliveryService.getPendingCOD(user?.token)
            .then((data) => {
                const currentData = Array.isArray(data) ? data[0] : data;
                if (currentData) {
                    setCodData(currentData);
                }
            })
            .catch(() => null)
            .finally(() => setLoading(false));
    }, [isFocused, user]);

    const userName = user?.full_name || user?.username || 'Người dùng';
    const userCode = user?.username ? `@${user.username}` : 'unknown';
    const hubId = user?.hub_id || user?.primary_hub_id || 'Toàn hệ thống';
    const phone = user?.phone || user?.phone_number || 'Chưa cập nhật';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <View style={styles.blueHeader}>
                <View style={styles.headerCircleDecoration1} />
                <View style={styles.headerCircleDecoration2} />
                <Text style={styles.headerTitle}>Hồ Sơ Cá Nhân</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.nameText}>{userName}</Text>
                    <Text style={styles.roleText}>{getRoleLabel(user)}</Text>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Đang hoạt động</Text>
                    </View>

                    <View style={styles.infoList}>
                        <View style={styles.infoRow}>
                            <View style={styles.iconWrap}>
                                <Ionicons name="call" size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Điện thoại</Text>
                                <Text style={styles.infoValue}>{phone}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.iconWrap}>
                                <Ionicons name="mail" size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Tài khoản (Email/Username)</Text>
                                <Text style={styles.infoValue}>{userCode}</Text>
                            </View>
                        </View>

                        <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}> 
                            <View style={styles.iconWrap}>
                                <Ionicons name="business" size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Bưu cục trực thuộc (Hub)</Text>
                                <Text style={styles.infoValue}>Hub ID: #{hubId}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {isShipperRole(user) && (
                    <View style={styles.menuCard}>
                        <View style={styles.codHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.codIconWrap}>
                                    <Ionicons name="wallet" size={20} color={COLORS.error} />
                                </View>
                                <Text style={styles.codTitle}>Tiền COD đang giữ</Text>
                            </View>
                            <Ionicons name="information-circle-outline" size={20} color="#999" />
                        </View>

                        {loading ? (
                            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.codContent}>
                                <Text style={styles.codAmount}>{(Number(codData.expected_cod) || 0).toLocaleString('vi-VN')} <Text style={{ fontSize: 20 }}>đ</Text></Text>
                                <Text style={styles.codDesc}>Chưa bàn giao kế toán • Từ {codData.delivered_count || 0} đơn hàng</Text>
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.logOut} />
                    <Text style={styles.logoutText}>Đăng Xuất Khỏi Thiết Bị</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>SmartPost App - Phiên bản 2.0.1</Text>
            </ScrollView>

            <Modal visible={showLogoutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalWarningIcon}>
                            <Ionicons name="log-out" size={32} color={COLORS.logOut} />
                        </View>
                        <Text style={styles.modalTitle}>Xác nhận đăng xuất</Text>
                        <Text style={styles.modalDesc}>Bạn sẽ cần đăng nhập lại vào lần sau để tiếp tục sử dụng ứng dụng.</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowLogoutModal(false)}>
                                <Text style={styles.modalBtnCancelText}>Hủy Bỏ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalBtnConfirm} 
                                onPress={() => {
                                    logout();
                                    setShowLogoutModal(false);
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }],
                                    });
                                }}
                            >
                                <Text style={styles.modalBtnConfirmText}>Đăng Xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
