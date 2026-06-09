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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Báo cáo Sự cố</Text>
                <View style={{ width: 26 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Mã vận đơn:</Text>
                    <Text style={styles.infoValue}>{waybillCode || '---'}</Text>
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
                        >
                            <Ionicons 
                                name={selectedReason === item.code ? "radio-button-on" : "radio-button-off"} 
                                size={22} 
                                color={selectedReason === item.code ? COLORS.primary : "#999"} 
                            />
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
                    value={note}
                    onChangeText={setNote}
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Gửi Báo cáo</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        height: 90,
        paddingTop: 40,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    iconButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    infoLabel: { fontSize: 16, color: '#666', marginRight: 10 },
    infoValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.secondary },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    reasonList: { marginBottom: 20 },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    reasonItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#F3F4F6'
    },
    reasonText: { fontSize: 16, color: '#444', marginLeft: 10 },
    reasonTextSelected: { color: COLORS.primary, fontWeight: '600' },
    textArea: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 120,
        marginBottom: 30
    },
    submitBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
