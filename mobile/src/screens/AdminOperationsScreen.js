import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { isRouteAllowed } from '../utils/roleUtils';
import { adminService } from '../services/adminService';
import AdminOperationsStyles from '../styles/AdminOperationsStyles';
import { COLORS } from '../constants/colors';

export default function AdminOperationsScreen({ navigation }) {
    const { user } = useUser();
    const [overrideForm, setOverrideForm] = useState({ waybill_code: '', new_status: 'SUCCESS', reason: '' });
    const [loadingOverride, setLoadingOverride] = useState(false);
    const [loadingScan, setLoadingScan] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        if (!isRouteAllowed(user, 'AdminOperations')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            return;
        }
        fetchAuditLogs();
    }, [user]);

    const fetchAuditLogs = async () => {
        setLoadingLogs(true);
        try {
            const data = await adminService.getAuditLogs(user.token);
            setLogs(Array.isArray(data) ? data : data.items || []);
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải nhật ký.');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleOverrideStatus = () => {
        if (!overrideForm.waybill_code || !overrideForm.reason) {
            return Alert.alert('Lỗi', 'Vui lòng nhập mã vận đơn và lý do ghi đè.');
        }

        Alert.alert(
            'Xác nhận ghi đè',
            `Ghi đè trạng thái vận đơn ${overrideForm.waybill_code} sẽ bỏ qua quy trình bình thường. Tiếp tục?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Tiếp tục',
                    style: 'destructive',
                    onPress: async () => {
                        setLoadingOverride(true);
                        try {
                            await adminService.overrideWaybillStatus(user.token, overrideForm);
                            Alert.alert('Thành công', 'Đã ghi đè trạng thái vận đơn.');
                            setOverrideForm({ waybill_code: '', new_status: 'SUCCESS', reason: '' });
                            fetchAuditLogs();
                        } catch (error) {
                            Alert.alert('Lỗi', error.message || 'Ghi đè thất bại.');
                        } finally {
                            setLoadingOverride(false);
                        }
                    },
                },
            ]
        );
    };

    const triggerScanOverdue = async () => {
        setLoadingScan(true);
        try {
            const response = await adminService.scanOverdue(user.token);
            Alert.alert('Hoàn tất', response?.message || 'Đã khởi chạy quét đơn quá hạn.');
            fetchAuditLogs();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể quét đơn quá hạn lúc này.');
        } finally {
            setLoadingScan(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <View style={AdminOperationsStyles.headerArea}>
                <View style={AdminOperationsStyles.headerCircleDecoration} />
                <View style={AdminOperationsStyles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={AdminOperationsStyles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={AdminOperationsStyles.headerTitle}>Hệ thống kỹ thuật</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={AdminOperationsStyles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[AdminOperationsStyles.card, { borderColor: '#FECACA', borderWidth: 1 }]}> 
                    <View style={AdminOperationsStyles.sectionHeader}>
                        <View style={[AdminOperationsStyles.iconCircle, { backgroundColor: COLORS.error }]}>
                            <Ionicons name="warning" size={18} color="#fff" />
                        </View>
                        <Text style={[AdminOperationsStyles.sectionTitle, { color: COLORS.error }]}>GHI ĐÈ TRẠNG THÁI</Text>
                    </View>

                    <Text style={AdminOperationsStyles.label}>Mã vận đơn <Text style={{ color: COLORS.error }}>*</Text></Text>
                    <TextInput
                        style={AdminOperationsStyles.input}
                        placeholder="VD: WB123456"
                        placeholderTextColor={COLORS.textGray}
                        value={overrideForm.waybill_code}
                        onChangeText={(text) => setOverrideForm({ ...overrideForm, waybill_code: text })}
                        autoCapitalize="characters"
                    />

                    <Text style={AdminOperationsStyles.label}>Trạng thái đích</Text>
                    <View style={AdminOperationsStyles.statusRow}>
                        {['SUCCESS', 'CANCELED', 'IN_HUB'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    AdminOperationsStyles.statusBtn,
                                    overrideForm.new_status === status && AdminOperationsStyles.statusBtnActive,
                                ]}
                                onPress={() => setOverrideForm({ ...overrideForm, new_status: status })}
                            >
                                <Text style={[
                                    AdminOperationsStyles.statusText,
                                    overrideForm.new_status === status && AdminOperationsStyles.statusTextActive,
                                ]}>
                                    {status === 'SUCCESS' ? 'Giao thành công' : status === 'CANCELED' ? 'Hủy' : 'Về kho'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={AdminOperationsStyles.label}>Lý do <Text style={{ color: COLORS.error }}>*</Text></Text>
                    <TextInput
                        style={[AdminOperationsStyles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Nhập lý do..."
                        placeholderTextColor={COLORS.textGray}
                        multiline
                        value={overrideForm.reason}
                        onChangeText={(text) => setOverrideForm({ ...overrideForm, reason: text })}
                    />

                    <TouchableOpacity style={[AdminOperationsStyles.actionBtn, { backgroundColor: COLORS.error }]} onPress={handleOverrideStatus} disabled={loadingOverride}>
                        {loadingOverride ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="alert-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={AdminOperationsStyles.btnText}>GHI ĐÈ TRẠNG THÁI</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={AdminOperationsStyles.card}>
                    <View style={AdminOperationsStyles.sectionHeader}>
                        <View style={[AdminOperationsStyles.iconCircle, { backgroundColor: COLORS.processScanOrange }]}>
                            <Ionicons name="scan" size={18} color="#fff" />
                        </View>
                        <Text style={AdminOperationsStyles.sectionTitle}>QUÉT ĐƠN QUÁ HẠN</Text>
                    </View>
                    <Text style={[AdminOperationsStyles.label, { color: COLORS.textGray, marginBottom: 18 }]}>Chạy quy trình quét đơn quá hạn và tạo cảnh báo cho hệ thống.</Text>
                    <TouchableOpacity style={[AdminOperationsStyles.actionBtn, { backgroundColor: COLORS.processScanOrange }]} onPress={triggerScanOverdue} disabled={loadingScan}>
                        {loadingScan ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="refresh-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={AdminOperationsStyles.btnText}>CHẠY QUÉT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={AdminOperationsStyles.card}>
                    <View style={AdminOperationsStyles.sectionHeader}>
                        <View style={[AdminOperationsStyles.iconCircle, { backgroundColor: COLORS.secondary }]}>
                            <Ionicons name="document-text" size={18} color="#fff" />
                        </View>
                        <Text style={AdminOperationsStyles.sectionTitle}>NHẬT KÝ HỆ THỐNG</Text>
                    </View>
                    {loadingLogs ? (
                        <ActivityIndicator color={COLORS.secondary} style={{ marginTop: 20 }} />
                    ) : logs.length === 0 ? (
                        <Text style={[AdminOperationsStyles.label, { color: COLORS.textGray }]}>Không có bản ghi nào.</Text>
                    ) : (
                        logs.slice(0, 10).map((log, index) => (
                            <View key={log.id || index} style={AdminOperationsStyles.logItem}>
                                <View style={AdminOperationsStyles.logHeader}>
                                    <Text style={AdminOperationsStyles.logTitle}>Admin #{log.admin_id || 'N/A'}</Text>
                                    <Text style={AdminOperationsStyles.logTime}>{new Date(log.timestamp).toLocaleString('vi-VN')}</Text>
                                </View>
                                <Text style={AdminOperationsStyles.logText}>Bảng: {log.target_table || 'N/A'}</Text>
                                <Text style={AdminOperationsStyles.logText}>Cột: {log.column_name || 'N/A'}</Text>
                                <Text style={AdminOperationsStyles.logText}>Giá trị: {log.old_value || '---'} → {log.new_value || '---'}</Text>
                                <Text style={AdminOperationsStyles.logReason}>Lý do: {log.reason || 'Không có'}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
