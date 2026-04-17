import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../../api/axiosClient';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function AdminOperationsScreen({ navigation }: any) {
    const theme = useAppTheme();
    const styles = getStyles(theme);
    const [overrideForm, setOverrideForm] = useState({ waybill_code: '', new_status: 'SUCCESS', reason: '' });
    const [loadingOverride, setLoadingOverride] = useState(false);
    const [loadingScan, setLoadingScan] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const res = await axiosClient.get('/admin/audit-logs');
            setLogs(res.data.slice(0, 10)); // Lấy 10 log gần nhất
        } catch (e) {
            console.log('Lỗi tải Logs', e);
        }
    };

    const handleOverrideStatus = async () => {
        if (!overrideForm.waybill_code || !overrideForm.reason) {
            return Alert.alert('Lỗi', 'Vui lòng nhập mã vận đơn và lý do ghi đè!');
        }

        Alert.alert('CẢNH BÁO NGUY HIỂM', `Thao tác này sẽ ép đổi trạng thái đơn hàng ${overrideForm.waybill_code} bỏ qua mọi quy tắc luồng. Tiếp tục?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Thực thi', style: 'destructive', onPress: async () => {
                    setLoadingOverride(true);
                    try {
                        await axiosClient.post('/admin/override-waybill-status', overrideForm);
                        Alert.alert('Thành công', 'Đã ghi đè trạng thái vận đơn!');
                        setOverrideForm({ waybill_code: '', new_status: 'SUCCESS', reason: '' });
                        fetchAuditLogs();
                    } catch (e: any) {
                        Alert.alert('Lỗi', e.response?.data?.detail || 'Thao tác thất bại');
                    } finally {
                        setLoadingOverride(false);
                    }
                }
            }
        ]);
    };

    const triggerScanOverdue = async () => {
        setLoadingScan(true);
        try {
            const res = await axiosClient.post('/admin/scan-overdue');
            Alert.alert('Hoàn tất quét', res.data.message);
        } catch (e: any) {
            Alert.alert('Lỗi', 'Không thể quét đơn quá hạn lúc này');
        } finally {
            setLoadingScan(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

            {/* HEADER NỀN XANH OVERLAPPING */}
            <View style={styles.headerArea}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hệ Thống Kỹ Thuật</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* KHỐI 1: OVERRIDE STATUS (ĐÈ LÊN HEADER) */}
                <View style={[styles.card, { borderColor: '#FECACA', borderWidth: 1, elevation: 4 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.dangerBackground }]}><Ionicons name="warning" size={18} color={theme.danger} /></View>
                        <Text style={[styles.sectionTitle, { color: theme.danger }]}>CỨU HỘ VẬN ĐƠN (OVERRIDE)</Text>
                    </View>

                    <Text style={styles.label}>Mã vận đơn cần xử lý <Text style={{ color: theme.danger }}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: WB123456..."
                        placeholderTextColor={theme.textSecondary}
                        value={overrideForm.waybill_code}
                        onChangeText={t => setOverrideForm({ ...overrideForm, waybill_code: t })}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>Trạng thái ép đổi sang <Text style={{ color: theme.danger }}>*</Text></Text>
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={overrideForm.new_status} onValueChange={(v) => setOverrideForm({ ...overrideForm, new_status: v })} dropdownIconColor={theme.textSecondary}>
                            <Picker.Item label="Giao thành công (SUCCESS)" value="SUCCESS" color={theme.text} />
                            <Picker.Item label="Đã hủy (CANCELED)" value="CANCELED" color={theme.text} />
                            <Picker.Item label="Về lại kho (IN_HUB)" value="IN_HUB" color={theme.text} />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Lý do ghi đè (Bắt buộc để lưu Audit) <Text style={{ color: theme.danger }}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Ghi rõ lý do tại sao phải dùng chức năng này..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={overrideForm.reason}
                        onChangeText={t => setOverrideForm({ ...overrideForm, reason: t })}
                    />

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.danger }]} onPress={handleOverrideStatus} disabled={loadingOverride}>
                        {loadingOverride ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="alert-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>THỰC THI GHI ĐÈ TRẠNG THÁI</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* KHỐI 2: SCAN OVERDUE */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.warningBackground }]}><Ionicons name="scan" size={18} color={theme.warning} /></View>
                        <Text style={styles.sectionTitle}>QUÉT ĐƠN QUÁ HẠN</Text>
                    </View>
                    <Text style={{ color: theme.textSecondary, marginBottom: 20, lineHeight: 22, fontSize: 14 }}>Kích hoạt bộ quét hệ thống để rà soát các đơn hàng đang giao bị treo quá 24 giờ và tự động cập nhật cờ cảnh báo.</Text>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.warning, paddingVertical: 14 }]} onPress={triggerScanOverdue} disabled={loadingScan}>
                        {loadingScan ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="refresh-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>CHẠY TRÌNH QUÉT NGAY</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* KHỐI 3: LỊCH SỬ AUDIT LOGS */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.primaryBackground }]}><Ionicons name="server" size={18} color={theme.primary} /></View>
                        <Text style={[styles.sectionTitle, { color: theme.primary }]}>NHẬT KÝ HỆ THỐNG (AUDIT LOGS)</Text>
                    </View>

                    {logs.length === 0 ? (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <Ionicons name="document-text-outline" size={40} color={theme.border} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10, fontStyle: 'italic' }}>Chưa có lịch sử hệ thống.</Text>
                        </View>
                    ) : null}

                    {logs.map((log, index) => (
                        <View key={log.id || index} style={styles.logItem}>
                            <View style={styles.logHeader}>
                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 }}>
                                    <Ionicons name="person" size={12} color={theme.textSecondary} /> Admin #{log.admin_id}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '500' }}>{new Date(log.timestamp).toLocaleString('vi-VN')}</Text>
                            </View>

                            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 22 }}>
                                Bảng: <Text style={{ fontWeight: 'bold', color: theme.text }}>{log.target_table}</Text>
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2, lineHeight: 22 }}>
                                Đổi <Text style={{ fontWeight: 'bold', color: theme.text }}>{log.column_name}</Text>: {log.old_value} ➔ <Text style={{ color: theme.danger, fontWeight: 'bold' }}>{log.new_value}</Text>
                            </Text>

                            <View style={{ backgroundColor: theme.background, padding: 8, borderRadius: 8, marginTop: 8, borderLeftWidth: 3, borderColor: theme.primary }}>
                                <Text style={{ color: theme.primary, fontSize: 13, fontStyle: 'italic' }}>Lý do: {log.reason}</Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    // Header Overlapping
    headerArea: { backgroundColor: theme.primary, paddingTop: 50, paddingBottom: 60, position: 'relative', overflow: 'hidden', zIndex: 1 },
    headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

    // Scroll Area
    scrollView: { flex: 1, zIndex: 10, marginTop: -35 },
    scrollContent: { padding: 15, paddingBottom: 50 },

    // Cards
    card: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: theme.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },

    // Form
    label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, color: theme.text, marginBottom: 20 },
    pickerContainer: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, borderRadius: 12, marginBottom: 20 },

    actionBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },

    // Logs
    logItem: { padding: 15, backgroundColor: theme.card, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: theme.border, elevation: 1 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 10 }
});