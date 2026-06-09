import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';

// Mock data for the pickups
const MOCK_PICKUPS = [
    {
        id: '1',
        request_code: '28',
        sender_name: 'KHACH HANG ITVINA',
        sender_phone: '123456789',
        pickup_address: '346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh',
        time: '14:18 09.01',
    },
    {
        id: '2',
        request_code: '27',
        sender_name: 'AN KHANG',
        sender_phone: '09745896321',
        pickup_address: '346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh',
        time: '18:34 30.12',
    },
    {
        id: '3',
        request_code: '16',
        sender_name: 'AN KHANG',
        sender_phone: '09745896321',
        pickup_address: '346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh',
        time: '18:34 30.12',
    }
];

export default function ShipperSelfAssignPickupScreen({ navigation }) {
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchAvailablePickups();
    }, []);

    const fetchAvailablePickups = async () => {
        setLoading(true);
        // MOCK: Giả lập gọi API lấy danh sách đơn có thể tự điều phối
        setTimeout(() => {
            setPickups(MOCK_PICKUPS);
            setLoading(false);
        }, 800);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleAssign = () => {
        if (selectedIds.length === 0) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng chọn ít nhất 1 đơn hàng' });
            return;
        }

        Alert.alert(
            "Tự điều phối nhận hàng",
            "Bạn muốn điều phối nhận hàng?",
            [
                { text: "Huỷ", style: "cancel" },
                { 
                    text: "Đồng ý", 
                    onPress: () => {
                        // MOCK: Thực hiện gọi API Tự điều phối
                        Toast.show({ 
                            type: 'info', 
                            text1: 'Đang chờ phát triển', 
                            text2: 'Chức năng tự điều phối nhận hàng đang được phát triển.' 
                        });
                        // Xóa các đơn đã chọn khỏi danh sách giả lập
                        setPickups(prev => prev.filter(p => !selectedIds.includes(p.id)));
                        setSelectedIds([]);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isSelected = selectedIds.includes(item.id);

        return (
            <TouchableOpacity 
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.checkboxContainer}>
                        {isSelected ? (
                            <Ionicons name="checkbox" size={24} color={COLORS.primary} />
                        ) : (
                            <Ionicons name="square-outline" size={24} color="#ccc" />
                        )}
                    </View>
                    <View style={styles.codeContainer}>
                        <Text style={styles.labelCode}>Mã đơn hàng</Text>
                        <Text style={styles.valueCode}>ID: {item.request_code}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#666" style={styles.icon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Người gửi</Text>
                            <Text style={styles.infoValue}>{item.sender_name}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#666" style={styles.icon} />
                        <Text style={styles.infoValue}>{item.sender_phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#666" style={styles.icon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Địa chỉ nhận hàng</Text>
                            <Text style={styles.infoValue}>{item.pickup_address}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color="#666" style={styles.icon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Tiếp nhận</Text>
                            <Text style={styles.infoValue}>{item.time}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={26} color="white" />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="white" />
                    <Text style={styles.searchPlaceholder}>Tìm yêu cầu lấy hàng</Text>
                    <Ionicons name="barcode-outline" size={20} color="white" style={styles.barcodeIcon} />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : pickups.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Hiện không có đơn nào có thể điều phối.</Text>
                </View>
            ) : (
                <FlatList
                    data={pickups}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.selectionInfo}>
                    <Text style={styles.selectionText}>ĐÃ CHỌN:</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{selectedIds.length} yêu cầu</Text>
                    </View>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.selectAllBtn} onPress={() => {
                        if (selectedIds.length === pickups.length) {
                            setSelectedIds([]);
                        } else {
                            setSelectedIds(pickups.map(p => p.id));
                        }
                    }}>
                        <Text style={styles.selectAllText}>
                            {selectedIds.length === pickups.length && pickups.length > 0 ? 'BỎ CHỌN' : 'CHỌN TẤT CẢ'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.assignBtn} onPress={handleAssign}>
                        <Text style={styles.assignBtnText}>TỰ ĐIỀU PHỐI</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
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
    },
    iconButton: { padding: 5, marginRight: 10 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center'
    },
    searchPlaceholder: {
        color: 'white',
        flex: 1,
        marginLeft: 10,
        fontSize: 15
    },
    barcodeIcon: { marginLeft: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#666', fontSize: 16 },
    listContent: { padding: 15, paddingBottom: 120 },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    cardSelected: {
        borderColor: COLORS.primary,
    },
    cardHeader: {
        flexDirection: 'row',
        backgroundColor: '#e0f2fe',
        padding: 10,
        alignItems: 'center'
    },
    checkboxContainer: { marginRight: 10 },
    codeContainer: { flex: 1 },
    labelCode: { fontSize: 12, color: '#64748b' },
    valueCode: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
    cardBody: { padding: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    icon: { marginRight: 10, marginTop: 2 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
    infoValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        padding: 15,
    },
    selectionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    selectionText: { fontWeight: 'bold', color: COLORS.primary },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    badgeText: { fontSize: 14, fontWeight: '500' },
    actionRow: { flexDirection: 'row', gap: 10 },
    selectAllBtn: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    selectAllText: { color: 'white', fontWeight: 'bold' },
    assignBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    assignBtnText: { color: 'white', fontWeight: 'bold' }
});
