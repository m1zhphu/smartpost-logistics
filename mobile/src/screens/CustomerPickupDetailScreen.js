import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getCustomerPickupDetail } from '../services/pickupService';

export default function CustomerPickupDetailScreen({ route, navigation }) {
    const { waybillCode } = route.params;
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetail();
    }, []);

    const fetchDetail = async () => {
        setLoading(true);
        const result = await getCustomerPickupDetail(waybillCode);
        if (result.success) {
            setDetail(result.data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!detail) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>Không thể tải chi tiết đơn hàng.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết {waybillCode}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 15 }}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>TRẠNG THÁI</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái lấy hàng:</Text>
                        <Text style={styles.valueBold}>{detail.pickup_status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái vận đơn:</Text>
                        <Text style={styles.value}>{detail.waybill_status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Văn phòng nhận:</Text>
                        <Text style={styles.value}>{detail.office_status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bưu tá:</Text>
                        <Text style={styles.value}>{detail.assigned_shipper_name || 'Chưa phân công'}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>CƯỚC PHÍ</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái giá:</Text>
                        <Text style={styles.value}>{detail.price_status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cước dự kiến:</Text>
                        <Text style={styles.value}>{(detail.estimated_total_amount || 0).toLocaleString()} đ</Text>
                    </View>
                    {detail.price_status !== 'ESTIMATED' && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Cước thực tế:</Text>
                            <Text style={[styles.value, { color: '#e11d48', fontWeight: 'bold' }]}>
                                {(detail.final_total_amount || 0).toLocaleString()} đ
                            </Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 90, paddingTop: 40, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16, marginBottom: 20 },
    backBtn: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 },
    backBtnText: { color: 'white', fontWeight: 'bold' },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    label: { color: '#666', fontSize: 15 },
    value: { color: '#333', fontSize: 15, flexShrink: 1, textAlign: 'right' },
    valueBold: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold' }
});
