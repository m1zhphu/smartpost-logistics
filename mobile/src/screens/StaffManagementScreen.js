import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { getRoleKey, isRouteAllowed } from '../utils/roleUtils';
import { userService } from '../services/userService';
import StaffManagementStyles from '../styles/StaffManagementStyles';

export default function StaffManagementScreen({ navigation }) {
    const { user } = useUser();
    const roleKey = getRoleKey(user);
    const isAdmin = roleKey === 'admin';
    const styles = StaffManagementStyles;
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form, setForm] = useState({ username: '', full_name: '', password: '', role_id: 4, phone: '' });

    useEffect(() => {
        if (!isRouteAllowed(user, 'StaffManagement')) {
            Alert.alert('Không có quyền', 'Chỉ Quản trị viên mới truy cập được trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            return;
        }
        fetchStaff();
    }, [user]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const data = await userService.getUsers(user.token);
            setStaffList(Array.isArray(data) ? data : data.items || []);
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải danh sách nhân sự.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async () => {
        if (!form.username || !form.full_name || !form.password) {
            return Alert.alert('Lỗi', 'Vui lòng điền đủ tên đăng nhập, họ tên và mật khẩu.');
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
            Alert.alert('Thành công', 'Đã tạo tài khoản nhân viên mới.');
            setForm({ username: '', full_name: '', password: '', role_id: 4, phone: '' });
            setShowModal(false);
            fetchStaff();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tạo nhân viên lúc này.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleStatus = async (item) => {
        Alert.alert(
            'Xác nhận',
            `${item.is_active ? 'Khóa' : 'Mở khóa'} tài khoản ${item.username}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    style: item.is_active ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await userService.toggleUserStatus(user.token, item.user_id, !item.is_active);
                            fetchStaff();
                        } catch (error) {
                            Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái.');
                        }
                    },
                },
            ]
        );
    };

    const getRoleName = (roleId) => {
        if (roleId === 3) return { name: 'Nhân viên kho', color: '#0f3d26' };
        if (roleId === 4) return { name: 'Shipper', color: '#f59e0b' };
        return { name: 'Quản trị viên', color: '#ef4444' };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f3d26" />

            <View style={styles.headerArea}>
                <View style={styles.headerCircle} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quản lý nhân sự</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryText}>Tổng số tài khoản</Text>
                    <Text style={styles.summaryValue}>{staffList.length}</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color="#0f3d26" size="large" style={{ marginTop: 30 }} />
                ) : (
                    <FlatList
                        data={staffList}
                        keyExtractor={(item) => String(item.user_id || item.id || item.username)}
                        contentContainerStyle={{ paddingBottom: 140 }}
                        renderItem={({ item }) => {
                            const role = getRoleName(item.role_id);
                            return (
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text style={styles.staffName}>{item.full_name || item.username}</Text>
                                            <Text style={styles.staffMeta}>@{item.username} • {item.phone || 'Không có SĐT'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => toggleStatus(item)}>
                                            <Ionicons name={item.is_active ? 'toggle' : 'toggle-outline'} size={40} color={item.is_active ? '#16a34a' : '#6b7280'} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.row}>
                                        <View style={[styles.statusBadge, { backgroundColor: `${role.color}15` }]}>
                                            <Text style={[styles.statusText, { color: role.color }]}>{role.name}</Text>
                                        </View>
                                        <Text style={{ color: item.is_active ? '#16a34a' : '#ef4444', fontWeight: '700' }}>
                                            {item.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </View>

            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
                <Ionicons name="person-add" size={24} color="#fff" />
            </TouchableOpacity>

            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
                        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Thêm nhân sự mới</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={26} color="#0f172a" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Tên đăng nhập</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.username}
                                    onChangeText={(text) => setForm({ ...form, username: text })}
                                    placeholder="VD: nguyenvan"
                                    autoCapitalize="none"
                                />
                                <Text style={styles.label}>Họ và tên</Text>
                                <TextInput style={styles.input} value={form.full_name} onChangeText={(text) => setForm({ ...form, full_name: text })} placeholder="VD: Nguyễn Văn A" />
                                <Text style={styles.label}>Số điện thoại</Text>
                                <TextInput style={styles.input} value={form.phone} keyboardType="phone-pad" onChangeText={(text) => setForm({ ...form, phone: text.replace(/[^0-9]/g, '') })} placeholder="Nhập số điện thoại" />
                                <Text style={styles.label}>Mật khẩu</Text>
                                <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={(text) => setForm({ ...form, password: text })} placeholder="Mật khẩu khởi tạo" />
                                <Text style={styles.label}>Vai trò</Text>
                                <View style={styles.pickerWrap}>
                                    <Picker selectedValue={form.role_id} onValueChange={(value) => setForm({ ...form, role_id: value })}>
                                        <Picker.Item label="Nhân viên kho" value={3} />
                                        <Picker.Item label="Shipper" value={4} />
                                    </Picker>
                                </View>
                                <TouchableOpacity style={styles.modalButton} onPress={handleCreateStaff} disabled={submitLoading}>
                                    {submitLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.modalButtonText}>Tạo nhân sự</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
