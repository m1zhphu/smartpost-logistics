import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { reportDeliveryFailure } from '../services/deliveryService';
import Toast from 'react-native-toast-message';

const PRIMARY = COLORS.primary || '#1B5E20';

const INCIDENT_REASONS = [
    { code: 'NOT_HOME', label: 'Không có người nhận' },
    { code: 'WRONG_ADDRESS', label: 'Sai địa chỉ' },
    { code: 'REFUSED', label: 'Khách từ chối nhận' },
    { code: 'DAMAGED', label: 'Hàng hóa bị hư hỏng' },
    { code: 'OTHER', label: 'Lý do khác' },
];

export default function ShipperReportIncidentScreen({ route, navigation }) {
    const { waybillCode } = route.params || {};
    const [selectedReason, setSelectedReason] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) {
            Toast.show({ type: 'error', text1: 'Vui lòng chọn lý do sự cố' });
            return;
        }

        if (selectedReason === 'OTHER' && !note.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập ghi chú cho lý do khác' });
            return;
        }

        setLoading(true);
        const result = await reportDeliveryFailure(waybillCode, selectedReason, note);
        setLoading(false);

        if (result.success) {
            Toast.show({ type: 'success', text1: 'Đã báo cáo sự cố thành công' });
            navigation.goBack();
        } else {
            Toast.show({ type: 'error', text1: 'Lỗi báo cáo sự cố', text2: result.message });
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />
            
            {/* ===== HEADER ===== */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Báo cáo Sự cố</Text>
                </View>

                <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <View style={styles.infoIconBox}>
                        <Ionicons name="barcode-outline" size={20} color={PRIMARY} />
                    </View>
                    <View>
                        <Text style={styles.infoLabel}>Mã vận đơn</Text>
                        <Text style={styles.infoValue}>{waybillCode || '---'}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Chọn lý do (*)</Text>
                <View style={styles.reasonList}>
                    {INCIDENT_REASONS.map((item) => (
                        <TouchableOpacity
                            key={item.code}
                            style={[
                                styles.reasonItem,
                                selectedReason === item.code && styles.reasonItemSelected
                            ]}
                            onPress={() => setSelectedReason(item.code)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.radioBtn,
                                selectedReason === item.code && styles.radioBtnSelected
                            ]}>
                                {selectedReason === item.code && <View style={styles.radioInner} />}
                            </View>
                            <Text style={[
                                styles.reasonText,
                                selectedReason === item.code && styles.reasonTextSelected
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Ghi chú thêm</Text>
                <TextInput
                    style={styles.textArea}
                    multiline={true}
                    numberOfLines={4}
                    placeholder="Mô tả chi tiết sự cố..."
                    placeholderTextColor="#94A3B8"
                    value={note}
                    onChangeText={setNote}
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>GỬI BÁO CÁO</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    
    /* ===== HEADER ===== */
    header: {
        flexDirection: 'row',
        backgroundColor: PRIMARY,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        paddingHorizontal: 20,
        paddingBottom: 22,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 42,
        borderBottomRightRadius: 42,
        ...Platform.select({
            ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
            android: { elevation: 8 },
        }),
    },
    headerBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    
    /* ===== CONTENT ===== */
    content: { padding: 16, backgroundColor: '#F3F4F6', flexGrow: 1 },
    
    /* ===== INFO BOX ===== */
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    infoIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    infoLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    
    /* ===== SECTION ===== */
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12, marginLeft: 4 },
    
    /* ===== REASON LIST ===== */
    reasonList: { marginBottom: 24 },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    reasonItemSelected: {
        borderColor: PRIMARY,
        backgroundColor: '#F0FDF4',
    },
    radioBtn: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#CBD5E1',
        justifyContent: 'center', alignItems: 'center',
    },
    radioBtnSelected: { borderColor: PRIMARY },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
    reasonText: { fontSize: 15, color: '#374151', marginLeft: 12, fontWeight: '600' },
    reasonTextSelected: { color: PRIMARY, fontWeight: '800' },
    
    /* ===== TEXT AREA ===== */
    textArea: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        minHeight: 120,
        marginBottom: 32,
        color: '#0F172A',
        fontWeight: '500',
    },
    
    /* ===== SUBMIT BTN ===== */
    submitBtn: {
        backgroundColor: '#EF4444',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});
