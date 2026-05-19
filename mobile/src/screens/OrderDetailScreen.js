import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getShipment } from '../services/shipmentService';
import styles from '../styles/OrderDetailStyles';
import { useQueue } from '../context/QueueContext';
import { checkNetworkConnection } from '../utils/networkUtils';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';

export default function OrderDetailScreen({ route, navigation }) {
    const { trackingNumber, queueId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);

    const { removeQueueItem } = useQueue();
    const { user } = useUser();



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
            setLoading(false);
            setError("Không có kết nối Internet");
            return;
        };
        try {
            const result = await getShipment(user?.token, trackingNumber);

            if (result.success) {
                setOrder(result.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={{ color: 'white', marginTop: 10 }}>Đang tải dữ liệu...</Text>
        </View>
    );

    if (error) return (
        <View style={styles.centerBox}>
            <Ionicons name="alert-circle" size={50} color="#ff5252" />
            <Text style={{ color: 'white', marginTop: 10 }}>{error}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
                <Text style={{ color: 'white' }}>Quay lại</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết vận đơn</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>MÃ VẬN ĐƠN</Text>
                    <Text style={styles.trackingNumber}>{order?.tracking_number}</Text>
                    <Text style={styles.date}>{new Date(order?.created_at).toLocaleString('vi-VN')}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Đã tạo thành công</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="arrow-up-circle" size={20} color={COLORS.secondary} />
                        {/* <Text style={styles.sectionTitle}>NGƯỜI GỬI</Text> */}
                        <Text style={styles.sectionTitle}>NGƯỜI GỬI</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tên:</Text>
                        <Text style={styles.infoValue}>{order?.sender_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>SĐT:</Text>
                        <Text style={styles.infoValue}>{order?.sender_phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Địa chỉ:</Text>
                        <Text style={styles.infoValue}>{order?.sender_address}</Text>
                    </View>
                </View>

                <View style={{ alignItems: 'center', marginVertical: -10, zIndex: 10 }}>
                    <Ionicons name="arrow-down" size={24} color="#666" />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="arrow-down-circle" size={20} color={COLORS.processScanOrange} />
                        <Text style={[styles.sectionTitle, { color: COLORS.processScanOrange }]}>NGƯỜI NHẬN</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tên:</Text>
                        <Text style={styles.infoValue}>{order?.receiver_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>SĐT:</Text>
                        <Text style={styles.infoValue}>{order?.receiver_phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Địa chỉ:</Text>
                        <Text style={styles.infoValue}>{order?.receiver_address}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.homeBtn}
                    onPress={() => {
                        navigation.navigate('Home');
                    }}
                >
                    <Text style={styles.homeBtnText}>Về trang chủ</Text>
                </TouchableOpacity>
                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}
