import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { API_BASE_URL } from '../constants/customerEndpoints';
import { apiClient } from '../context/UserContext';
import dayjs from 'dayjs';

export default function CustomerTrackingScreen({ navigation }) {
    const [trackingCode, setTrackingCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [trackingData, setTrackingData] = useState(null);

    const handleSearch = async () => {
        if (!trackingCode.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập mã vận đơn' });
            return;
        }

        setLoading(true);
        setTrackingData(null);
        try {
            const response = await apiClient.get(`${API_BASE_URL}/api/waybills/${trackingCode.trim()}/tracking`);
            setTrackingData(response.data);
        } catch (error) {
            console.error('Lỗi tra cứu:', error);
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy mã vận đơn hoặc có lỗi hệ thống.' });
        } finally {
            setLoading(false);
        }
    };

    const renderLogItem = ({ item, index }) => (
        <View style={styles.timelineItem}>
            <View style={styles.timelineColumn}>
                <View style={[styles.dot, index === 0 && styles.activeDot]} />
                {index < trackingData.logs.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.contentColumn}>
                <Text style={styles.logStatus}>{item.status_name || item.status_code}</Text>
                <Text style={styles.logTime}>{dayjs(item.system_time).format('DD/MM/YYYY HH:mm:ss')}</Text>
                {item.location && <Text style={styles.logLocation}><Ionicons name="location-outline" size={12} /> {item.location}</Text>}
                {item.note && <Text style={styles.logNote}>{item.note}</Text>}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tra cứu vận đơn</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nhập mã vận đơn (VD: SP123456789)"
                        value={trackingCode}
                        onChangeText={setTrackingCode}
                        autoCapitalize="characters"
                        onSubmitEditing={handleSearch}
                    />
                    {trackingCode.length > 0 && (
                        <TouchableOpacity onPress={() => setTrackingCode('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                    <Text style={styles.searchBtnText}>Tra cứu</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : trackingData ? (
                <ScrollView contentContainerStyle={styles.resultContainer}>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>THÔNG TIN VẬN ĐƠN</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Mã đơn:</Text>
                            <Text style={styles.valueBold}>{trackingData.waybill_code}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Trạng thái hiện tại:</Text>
                            <Text style={[styles.valueBold, { color: '#f59e0b' }]}>{trackingData.current_status}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Người gửi:</Text>
                            <Text style={styles.value}>{trackingData.sender_name}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Người nhận:</Text>
                            <Text style={styles.value}>{trackingData.receiver_name}</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { marginLeft: 15, marginTop: 10, marginBottom: 10 }]}>HÀNH TRÌNH ĐƠN HÀNG</Text>
                    {trackingData.logs && trackingData.logs.length > 0 ? (
                        <View style={styles.timelineCard}>
                            {/* Sort logs desc for timeline */}
                            <FlatList
                                data={[...trackingData.logs].reverse()}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={renderLogItem}
                                scrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View style={styles.centerContent}>
                            <Text style={{ color: '#666' }}>Chưa có hành trình nào được ghi nhận.</Text>
                        </View>
                    )}
                </ScrollView>
            ) : (
                <View style={styles.centerContent}>
                    <Ionicons name="cube-outline" size={60} color="#ccc" />
                    <Text style={styles.placeholderText}>Nhập mã vận đơn để bắt đầu tra cứu</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 90, paddingTop: 40, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    
    searchSection: { backgroundColor: 'white', padding: 15, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 3 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, height: 50, marginBottom: 10 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#333' },
    searchBtn: { backgroundColor: COLORS.primary, borderRadius: 8, height: 45, justifyContent: 'center', alignItems: 'center' },
    searchBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    placeholderText: { color: '#888', marginTop: 10, fontSize: 15 },
    
    resultContainer: { padding: 15, paddingBottom: 50 },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#666', fontSize: 14 },
    value: { color: '#333', fontSize: 14, flexShrink: 1, textAlign: 'right' },
    valueBold: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
    
    timelineCard: { backgroundColor: 'white', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    timelineItem: { flexDirection: 'row', marginBottom: 0 },
    timelineColumn: { width: 20, alignItems: 'center', marginRight: 15 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#cbd5e1', zIndex: 2, marginTop: 4 },
    activeDot: { backgroundColor: COLORS.primary },
    line: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginVertical: -4, zIndex: 1 },
    contentColumn: { flex: 1, paddingBottom: 25 },
    logStatus: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    logTime: { fontSize: 12, color: '#64748b', marginTop: 4 },
    logLocation: { fontSize: 13, color: '#475569', marginTop: 4 },
    logNote: { fontSize: 13, color: '#ef4444', marginTop: 4, fontStyle: 'italic' }
});
