import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axiosClient from '../../api/axiosClient';
import { useAuthStore } from '../../store/authStore';

const COLORS = {
    primary: '#254BE0', background: '#F8F9FA', card: '#FFFFFF', textMain: '#1E293B', textSub: '#64748B', border: '#E2E8F0', success: '#10B981', danger: '#EF4444', warning: '#F59E0B', inputBg: '#F8FAFC',
};

export default function StaffManagementScreen({ navigation }: any) {
    const user = useAuthStore((state: any) => state.user);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form, setForm] = useState({ username: '', full_name: '', password: '', role_id: 4, phone: '' });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/users');
            setStaffList(res.data);
        } catch (e) {
            console.log('Lỗi tải danh sách NV', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async () => {
        if (!form.username || !form.full_name || !form.password) return Alert.alert('Lỗi', 'Vui lòng nhập đủ thông tin bắt buộc');

        setSubmitLoading(true);
        try {
            await axiosClient.post('/users', form);
            Alert.alert('Thành công', 'Đã tạo tài khoản nhân viên mới!');
            setShowModal(false);
            setForm({ username: '', full_name: '', password: '', role_id: 4, phone: '' });
            fetchStaff();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể tạo nhân viên');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleStatus = async (item: any) => {
        Alert.alert('Xác nhận', `${item.is_active ? 'Khóa' : 'Mở khóa'} tài khoản ${item.username}?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đồng ý', style: item.is_active ? 'destructive' : 'default', onPress: async () => {
                    try {
                        await axiosClient.patch(`/users/${item.user_id}/status`, { is_active: !item.is_active });
                        fetchStaff();
                    } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật trạng thái'); }
                }
            }
        ]);
    };

    const getRoleName = (roleId: number) => {
        if (roleId === 3) return { name: 'Nhân viên Kho', color: COLORS.primary };
        if (roleId === 4) return { name: 'Tài xế (Shipper)', color: COLORS.warning };
        return { name: 'Quản trị viên', color: COLORS.danger };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* HEADER NỀN XANH OVERLAPPING */}
            <View style={styles.headerArea}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quản Lý Nhân Sự</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* DANH SÁCH NHÂN SỰ */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    data={staffList}
                    keyExtractor={(item) => item.user_id.toString()}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryIconWrap}>
                                <Ionicons name="people" size={24} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.summaryLabel}>Nhân sự thuộc bưu cục</Text>
                                <Text style={styles.summaryValue}>Hub {user?.hubId || 'HCM-01'}</Text>
                            </View>
                            <View style={styles.summaryBadge}>
                                <Text style={styles.summaryBadgeText}>{staffList.length} người</Text>
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const role = getRoleName(item.role_id);
                        return (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={styles.avatar}>
                                            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18 }}>{(item.full_name || item.username).charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.staffName} numberOfLines={1}>{item.full_name || item.username}</Text>
                                            <Text style={styles.staffUser}>@{item.username} • {item.phone || 'Chưa có SĐT'}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => toggleStatus(item)}>
                                        <Ionicons name={item.is_active ? "toggle" : "toggle-outline"} size={42} color={item.is_active ? COLORS.success : COLORS.border} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.cardFooter}>
                                    <View style={[styles.roleBadge, { backgroundColor: `${role.color}15` }]}>
                                        <Text style={{ color: role.color, fontWeight: 'bold', fontSize: 12 }}>{role.name}</Text>
                                    </View>
                                    <Text style={{ color: item.is_active ? COLORS.success : COLORS.danger, fontWeight: '600', fontSize: 13 }}>
                                        {item.is_active ? 'Đang hoạt động' : 'Đã bị khóa'}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            {/* FAB THÊM MỚI */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                <Ionicons name="person-add" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* 🚀 MODAL THÊM NHÂN VIÊN (CHUẨN KEYBOARD AVOIDING) */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
                        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Thêm Nhân Viên Mới</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={28} color={COLORS.textMain} /></TouchableOpacity>
                            </View>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Tên đăng nhập <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                <TextInput style={styles.input} placeholder="VD: nguyenvan_a" autoCapitalize="none" value={form.username} onChangeText={t => setForm({ ...form, username: t })} />

                                <Text style={styles.label}>Họ và tên thật <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                <TextInput style={styles.input} placeholder="VD: Nguyễn Văn A" value={form.full_name} onChangeText={t => setForm({ ...form, full_name: t })} />

                                <Text style={styles.label}>Số điện thoại</Text>
                                <TextInput style={styles.input} placeholder="Nhập 10 số" keyboardType="phone-pad" maxLength={10} value={form.phone} onChangeText={t => setForm({ ...form, phone: t.replace(/[^0-9]/g, '') })} />

                                <Text style={styles.label}>Mật khẩu khởi tạo <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                <TextInput style={styles.input} placeholder="Nhập mật khẩu..." secureTextEntry value={form.password} onChangeText={t => setForm({ ...form, password: t })} />

                                <Text style={styles.label}>Vị trí / Chức vụ</Text>
                                <View style={styles.pickerWrap}>
                                    <Picker selectedValue={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })} dropdownIconColor={COLORS.textSub}>
                                        <Picker.Item label="Nhân viên Kho (Quét mã, Đóng túi)" value={3} color={COLORS.textMain} />
                                        <Picker.Item label="Tài xế Shipper (Giao hàng)" value={4} color={COLORS.textMain} />
                                    </Picker>
                                </View>

                                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateStaff} disabled={submitLoading}>
                                    {submitLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>TẠO TÀI KHOẢN MỚI</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    headerArea: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 60, position: 'relative', overflow: 'hidden', zIndex: 1 },
    headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

    scrollView: { flex: 1, zIndex: 10, marginTop: -35 },
    scrollContent: { padding: 15, paddingBottom: 100 },

    summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    summaryIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    summaryLabel: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },
    summaryBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    summaryBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 15, elevation: 1, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    staffName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
    staffUser: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },

    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, zIndex: 9999 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },

    label: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, color: COLORS.textMain, marginBottom: 20 },
    pickerWrap: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, borderRadius: 12, marginBottom: 30 },

    submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2, marginBottom: 20 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }
});