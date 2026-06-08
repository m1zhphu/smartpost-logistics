import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { getShipperPickupDetail, confirmPickup, sendGpsLocation } from '../services/pickupService';
import * as Location from 'expo-location';

export default function ShipperPickupDetailScreen({ route, navigation }) {
    const { requestCode } = route.params;
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, []);

    const fetchDetail = async () => {
        setLoading(true);
        const result = await getShipperPickupDetail(requestCode);
        if (result.success) {
            setDetail(result.data);
        }
        setLoading(false);
    };

    const handleCall = () => {
        if (detail && detail.sender_phone) {
            Linking.openURL(`tel:${detail.sender_phone}`);
        }
    };

    const handleOpenMap = () => {
        if (detail && detail.sender_address) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.sender_address)}`;
            Linking.openURL(url);
        }
    };

    const handleSendLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập vị trí để gửi GPS.');
            return;
        }

        Toast.show({ type: 'info', text1: 'Đang lấy vị trí...' });
        let location = await Location.getCurrentPositionAsync({});
        
        const result = await sendGpsLocation(location.coords.latitude, location.coords.longitude, location.coords.accuracy, "Gửi thủ công");
        if (result.success) {
            Toast.show({ type: 'success', text1: 'Gửi vị trí thành công' });
        } else {
            Toast.show({ type: 'error', text1: 'Gửi vị trí thất bại', text2: result.message });
        }
    };

    const handleConfirmPicked = async () => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc chắn đã lấy hàng thành công?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Đồng ý", 
                    onPress: async () => {
                        setSubmitting(true);
                        // Mock imageUrl for now. In real app, we'd upload photo and get URL.
                        const imageUrl = "https://example.com/mock-pickup-image.jpg";
                        const result = await confirmPickup(requestCode, imageUrl, "Đã lấy đủ hàng");
                        setSubmitting(false);

                        if (result.success) {
                            Toast.show({ type: 'success', text1: 'Xác nhận lấy hàng thành công!' });
                            navigation.goBack();
                        } else {
                            Toast.show({ type: 'error', text1: 'Lỗi', text2: result.message });
                        }
                    }
                }
            ]
        );
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
                <Text style={styles.errorText}>Không thể tải chi tiết lấy hàng.</Text>
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
                <Text style={styles.headerTitle}>Lấy hàng: {requestCode}</Text>
                <TouchableOpacity onPress={handleSendLocation} style={styles.backButton}>
                    <Ionicons name="location-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>THÔNG TIN LẤY HÀNG</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Trạng thái:</Text>
                        <Text style={[styles.valueBold, { color: '#f59e0b' }]}>{detail.status}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Số lượng kiện:</Text>
                        <Text style={styles.valueBold}>{detail.total_waybills}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>NGƯỜI GỬI</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tên:</Text>
                        <Text style={styles.value}>{detail.sender_name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>SĐT:</Text>
                        <Text style={styles.valueBold}>{detail.sender_phone}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Địa chỉ:</Text>
                        <Text style={styles.value}>{detail.sender_address}</Text>
                    </View>
                    
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                            <Ionicons name="call" size={20} color="white" />
                            <Text style={styles.actionBtnText}>Gọi điện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={handleOpenMap}>
                            <Ionicons name="map" size={20} color="white" />
                            <Text style={styles.actionBtnText}>Bản đồ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomDock}>
                <TouchableOpacity 
                    style={[styles.confirmBtn, submitting && { opacity: 0.7 }]} 
                    onPress={handleConfirmPicked} 
                    disabled={submitting}
                >
                    <Text style={styles.confirmBtnText}>{submitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐÃ LẤY'}</Text>
                </TouchableOpacity>
            </View>
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
    valueBold: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    actionBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, flex: 0.48, justifyContent: 'center', alignItems: 'center', gap: 5 },
    actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    bottomDock: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    confirmBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
    confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
