import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getCustomerPickups } from '../services/pickupService';

export default function CustomerPickupListScreen({ navigation }) {
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPickups();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchPickups = async () => {
        setLoading(true);
        const result = await getCustomerPickups();
        if (result.success) {
            setPickups(result.data);
        }
        setLoading(false);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('CustomerPickupDetail', { waybillCode: item.waybill_code })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.waybillCode}>{item.waybill_code}</Text>
                <Text style={styles.statusText(item.pickup_status)}>{item.pickup_status}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.infoText}>Văn phòng: {item.office_status}</Text>
                <Text style={styles.infoText}>Bưu tá: {item.assigned_shipper_name || 'Chưa có'}</Text>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>
                        {item.price_status === 'ESTIMATED' ? 'Cước dự kiến:' : 'Cước thật:'}
                    </Text>
                    <Text style={styles.priceValue}>
                        {(item.final_shipping_fee || item.estimated_shipping_fee || 0).toLocaleString()} VNĐ
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn lấy hàng của tôi</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : pickups.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Bạn chưa có yêu cầu lấy hàng nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={pickups}
                    keyExtractor={(item) => item.waybill_code}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                />
            )}
            
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('CustomerCreatePickup')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 90, paddingTop: 40, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#666', fontSize: 16 },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
    waybillCode: { fontWeight: 'bold', fontSize: 16, color: COLORS.secondary },
    statusText: (status) => ({
        color: status === 'PENDING_CONFIRMATION' ? '#f59e0b' : status === 'RECEIVED' ? '#3b82f6' : status === 'PICKED' ? '#10b981' : '#6b7280',
        fontWeight: 'bold',
        fontSize: 14
    }),
    cardBody: { gap: 5 },
    infoText: { fontSize: 14, color: '#444' },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    priceLabel: { fontSize: 14, color: '#666' },
    priceValue: { fontSize: 16, fontWeight: 'bold', color: '#e11d48' },
    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});
