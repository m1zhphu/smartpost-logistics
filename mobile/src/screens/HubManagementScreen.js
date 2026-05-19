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
import { Ionicons } from '@expo/vector-icons';
import HubManagementStyles from '../styles/HubManagementStyles';
import { hubService } from '../services/hubService';
import { useUser } from '../context/UserContext';
import { getRoleKey, isRouteAllowed } from '../utils/roleUtils';
import { COLORS } from '../constants/colors';

export default function HubManagementScreen({ navigation }) {
    const { user } = useUser();
    const roleKey = getRoleKey(user);
    const isAdmin = roleKey === 'admin';
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form, setForm] = useState({
        hub_code: '',
        hub_name: '',
        address: '',
    });

    useEffect(() => {
        if (!isRouteAllowed(user, 'HubManagement')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

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
            if (roleKey === 'hub_manager' && user.hub_id) {
                const assignedHub = normalizedHubs.filter((hub) => String(hub.hub_id || hub.id) === String(user.hub_id));
                setHubs(assignedHub.length > 0 ? assignedHub : normalizedHubs);
            } else {
                setHubs(normalizedHubs);
            }
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải danh sách bưu cục.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHub = async () => {
        if (!form.hub_code.trim() || !form.hub_name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã và tên bưu cục.');
            return;
        }

        setSubmitLoading(true);
        try {
            await hubService.createHub(user.token, {
                hub_code: form.hub_code.trim().toUpperCase(),
                hub_name: form.hub_name.trim(),
                address: form.address.trim(),
            });
            Alert.alert('Thành công', 'Đã tạo bưu cục mới.');
            setShowModal(false);
            setForm({ hub_code: '', hub_name: '', address: '' });
            fetchHubs();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tạo bưu cục.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const getHubStatusValue = (hub) => {
        if (typeof hub.status === 'boolean') {
            return hub.status;
        }

        if (typeof hub.status === 'string') {
            return ['ACTIVE', 'OPEN', 'TRUE', '1'].includes(hub.status.toUpperCase());
        }

        return !!hub.is_active;
    };

    const toggleHubStatus = (hub) => {
        const nextStatus = !getHubStatusValue(hub);

        Alert.alert(
            'Xác nhận',
            `${nextStatus ? 'Mở lại' : 'Tạm dừng'} hoạt động bưu cục ${hub.hub_name}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    onPress: async () => {
                        try {
                            await hubService.updateHubStatus(user.token, hub.hub_id, nextStatus);
                            fetchHubs();
                        } catch (error) {
                            Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái.');
                        }
                    },
                },
            ]
        );
    };

    const renderHubItem = ({ item }) => {
        const isActive = getHubStatusValue(item);

        return (
            <View style={HubManagementStyles.card}>
                <View style={HubManagementStyles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={HubManagementStyles.iconWrap}>
                            <Ionicons name="home-outline" size={22} color={COLORS.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={HubManagementStyles.hubName}>{item.hub_name}</Text>
                            <Text style={HubManagementStyles.hubCode}>Mã hub: {item.hub_code}</Text>
                        </View>
                    </View>
                    {isAdmin ? (
                        <TouchableOpacity onPress={() => toggleHubStatus(item)}>
                            <Ionicons
                                name={isActive ? 'toggle' : 'toggle-outline'}
                                size={42}
                                color={isActive ? COLORS.secondary : '#cfd8d3'}
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 42, alignItems: 'center' }}>
                            <Text style={{ color: '#7b867e', fontSize: 12, textAlign: 'right' }}>
                                Chỉ quản trị viên
                            </Text>
                        </View>
                    )}
                </View>

                <View style={HubManagementStyles.divider} />

                <View style={HubManagementStyles.infoRow}>
                    <Ionicons
                        name="location-outline"
                        size={18}
                        color="#7b867e"
                        style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <Text style={HubManagementStyles.addressText} numberOfLines={2}>
                        {item.address || 'Chưa cập nhật địa chỉ hệ thống'}
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={HubManagementStyles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={HubManagementStyles.headerTitle}>Quản Lý Bưu Cục</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
            ) : (
                <>
                    {roleKey === 'hub_manager' && (
                        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                            <Text style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>
                                Bạn đang xem bưu cục được phân công. Chỉ Quản trị viên mới có thể tạo hoặc bật/tắt bưu cục.
                            </Text>
                        </View>
                    )}
                    <FlatList
                        style={HubManagementStyles.scrollView}
                        contentContainerStyle={HubManagementStyles.scrollContent}
                        data={hubs}
                        keyExtractor={(item, index) => String(item.hub_id || index)}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={HubManagementStyles.summaryCard}>
                                <View style={HubManagementStyles.summaryIconWrap}>
                                    <Ionicons name="business" size={24} color={COLORS.secondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={HubManagementStyles.summaryLabel}>Tổng số bưu cục trên hệ thống</Text>
                                    <Text style={HubManagementStyles.summaryValue}>Toàn quốc</Text>
                                </View>
                                <View style={HubManagementStyles.summaryBadge}>
                                    <Text style={HubManagementStyles.summaryBadgeText}>{hubs.length} Hub</Text>
                                </View>
                            </View>
                        }
                        renderItem={renderHubItem}
                        ListEmptyComponent={
                            <Text style={{ textAlign: 'center', color: '#7b867e', marginTop: 30 }}>
                                Chưa có bưu cục nào.
                            </Text>
                        }
                    />
                </>
            )}

            {isAdmin && (
                <TouchableOpacity style={HubManagementStyles.fab} onPress={() => setShowModal(true)}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>
            )}

            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={HubManagementStyles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowModal(false)}
                    >
                        <View style={HubManagementStyles.modalContainer} onStartShouldSetResponder={() => true}>
                            <View style={HubManagementStyles.modalHeader}>
                                <Text style={HubManagementStyles.modalTitle}>Thêm Bưu Cục Mới</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={28} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <Text style={HubManagementStyles.label}>Mã bưu cục <Text style={{ color: COLORS.error }}>*</Text></Text>
                                <TextInput
                                    style={HubManagementStyles.input}
                                    placeholder="VD: HCM-01"
                                    autoCapitalize="characters"
                                    value={form.hub_code}
                                    onChangeText={(text) => setForm({ ...form, hub_code: text })}
                                />

                                <Text style={HubManagementStyles.label}>Tên bưu cục <Text style={{ color: COLORS.error }}>*</Text></Text>
                                <TextInput
                                    style={HubManagementStyles.input}
                                    placeholder="Nhập tên bưu cục..."
                                    value={form.hub_name}
                                    onChangeText={(text) => setForm({ ...form, hub_name: text })}
                                />

                                <Text style={HubManagementStyles.label}>Địa chỉ</Text>
                                <TextInput
                                    style={[HubManagementStyles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Nhập địa chỉ chi tiết..."
                                    multiline
                                    value={form.address}
                                    onChangeText={(text) => setForm({ ...form, address: text })}
                                />

                                <TouchableOpacity
                                    style={HubManagementStyles.submitBtn}
                                    onPress={handleCreateHub}
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={HubManagementStyles.submitBtnText}>TẠO BƯU CỤC MỚI</Text>
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
