import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getCustomerPickups } from '../services/pickupService';
import {
    formatCurrency,
    formatDateTime,
    getPickupStatusColor,
    getPickupStatusLabel,
    getWaybillStatusLabel,
    hasFinalPrice
} from '../utils/pickupHelpers';

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
            setPickups(result.data || []);
        }
        setLoading(false);
    };

    const renderItem = ({ item }) => {
        const showFinal = hasFinalPrice(item.price_status, item.final_total_amount);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CustomerPickupDetail', { waybillCode: item.waybill_code })}
            >
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.waybillCode}>{item.waybill_code}</Text>
                        <Text style={styles.requestCode}>YC: {item.request_code}</Text>
                    </View>
                    <Text style={[styles.statusText, { color: getPickupStatusColor(item.pickup_status) }]}>
                        {getPickupStatusLabel(item.pickup_status)}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.infoText}>Trạng thái vận đơn: {getWaybillStatusLabel(item.waybill_status)}</Text>
                    <Text style={styles.infoText}>Văn phòng: {item.office_status || 'Đang xử lý'}</Text>
                    <Text style={styles.infoText}>Bưu tá: {item.assigned_shipper_name || 'Chưa phân công'}</Text>
                    <Text style={styles.infoText}>Ngày tạo: {formatDateTime(item.created_at)}</Text>

                    <View style={styles.priceSection}>
                        <Text style={styles.priceLine}>Cước dự kiến: {formatCurrency(item.estimated_total_amount)}</Text>
                        {showFinal ? (
                            <Text style={[styles.priceLine, styles.finalPrice]}>
                                Cước thật: {formatCurrency(item.final_total_amount)}
                            </Text>
                        ) : (
                            <Text style={styles.priceHint}>Đơn đang dùng cước dự kiến</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn lấy hàng của tôi</Text>
                <TouchableOpacity onPress={fetchPickups} style={styles.backButton}>
                    <Ionicons name="reload" size={22} color="white" />
                </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15,61,38,0.96)',
        height: 90,
        paddingTop: 40,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#666', fontSize: 16 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        marginBottom: 10
    },
    waybillCode: { fontWeight: 'bold', fontSize: 16, color: COLORS.secondary },
    requestCode: { marginTop: 4, fontSize: 12, color: '#64748b' },
    statusText: { fontWeight: 'bold', fontSize: 13, maxWidth: 120, textAlign: 'right' },
    cardBody: {},
    infoText: { fontSize: 14, color: '#444', marginBottom: 4 },
    priceSection: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10
    },
    priceLine: { fontSize: 14, color: '#334155', marginBottom: 4, fontWeight: '600' },
    finalPrice: { color: '#059669' },
    priceHint: { fontSize: 13, color: '#64748b' },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: 'rgba(15,61,38,0.92)',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    }
});
