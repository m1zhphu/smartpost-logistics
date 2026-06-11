import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Platform
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

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

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

    const HeaderButton = ({ icon, onPress }) => (
        <TouchableOpacity
          onPress={onPress}
          style={styles.headerButton}
          activeOpacity={0.78}
        >
          <View style={styles.headerButtonInner}>
            <Ionicons name={icon} size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
    );

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
                            <Ionicons name="checkbox" size={24} color={PRIMARY} />
                        ) : (
                            <Ionicons name="square-outline" size={24} color="#94A3B8" />
                        )}
                    </View>
                    <View style={styles.codeContainer}>
                        <Text style={styles.labelCode}>Mã đơn hàng</Text>
                        <Text style={styles.valueCode}>ID: {item.request_code}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#64748B" style={styles.icon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Người gửi</Text>
                            <Text style={styles.infoValue}>{item.sender_name}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#64748B" style={styles.icon} />
                        <Text style={styles.infoValue}>{item.sender_phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#64748B" style={styles.icon} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Địa chỉ nhận hàng</Text>
                            <Text style={styles.infoValue}>{item.pickup_address}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color="#64748B" style={styles.icon} />
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
                <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
                
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="white" />
                    <Text style={styles.searchPlaceholder}>Tìm yêu cầu lấy hàng</Text>
                    <Ionicons name="barcode-outline" size={20} color="white" style={styles.barcodeIcon} />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                </View>
            ) : pickups.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="list-outline" size={36} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyText}>Hiện không có đơn nào có thể điều phối.</Text>
                </View>
            ) : (
                <FlatList
                    data={pickups}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
                    }} activeOpacity={0.84}>
                        <Text style={styles.selectAllText}>
                            {selectedIds.length === pickups.length && pickups.length > 0 ? 'BỎ CHỌN' : 'CHỌN TẤT CẢ'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.assignBtn} onPress={handleAssign} activeOpacity={0.84}>
                        <Text style={styles.assignBtnText}>TỰ ĐIỀU PHỐI</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row',
        backgroundColor: PRIMARY,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        paddingHorizontal: 20,
        paddingBottom: 22,
        alignItems: 'center',
        borderBottomLeftRadius: 42,
        borderBottomRightRadius: 42,
        ...Platform.select({
            ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
            android: { elevation: 8 }
        }),
    },
    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    headerButtonInner: {
        justifyContent: "center",
        alignItems: "center",
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    searchPlaceholder: {
        color: 'white',
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600'
    },
    barcodeIcon: { marginLeft: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIconBox: {
        width: 76,
        height: 76,
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        ...Platform.select({
          ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
          android: { elevation: 2 }
        })
    },
    emptyText: { color: '#64748B', fontSize: 16, fontWeight: '700' },
    listContent: { padding: 16, paddingBottom: 140 },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    cardSelected: {
        borderColor: PRIMARY,
        backgroundColor: '#F0FDF4'
    },
    cardHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    checkboxContainer: { marginRight: 12 },
    codeContainer: { flex: 1 },
    labelCode: { fontSize: 12, color: '#64748B', fontWeight: '700' },
    valueCode: { fontSize: 15, fontWeight: '900', color: PRIMARY },
    cardBody: { padding: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    icon: { marginRight: 10, marginTop: 2 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#64748B', marginBottom: 2, fontWeight: '700' },
    infoValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        ...Platform.select({
            ios: { shadowColor: '#64748B', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 8 }
        })
    },
    selectionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    selectionText: { fontWeight: '900', color: PRIMARY },
    badge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    badgeText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    actionRow: { flexDirection: 'row', gap: 12 },
    selectAllBtn: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PRIMARY
    },
    selectAllText: { color: PRIMARY, fontWeight: '900' },
    assignBtn: {
        flex: 1,
        backgroundColor: PRIMARY,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    assignBtnText: { color: 'white', fontWeight: '900' }
});
