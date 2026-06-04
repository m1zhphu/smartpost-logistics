import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryService } from '../services/inventory';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { checkNetworkConnectionWithoutToast } from '../utils/networkUtils'; // Đổi sang dùng hàm không có Toast tự động

export default function NoiBoApproveList({ navigation, currentAction }) {
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedBillId, setExpandedBillId] = useState(null);

    // 1. THÊM STATE ĐỂ THEO DÕI LỖI MẠNG LÚC LOAD LIST
    const [isNetworkError, setIsNetworkError] = useState(false);

    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [actionType, setActionType] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // KHÓA VUỐT CẠNH TRÁI TRÊN IOS
    useEffect(() => {
        navigation.setOptions({
            gestureEnabled: false,
        });
    }, [navigation]);

    const loadPendingBills = async () => {
        setLoading(true);
        // Kiểm tra mạng trước
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsNetworkError(true);
            setPendingList([]); // Xóa list để hiện màn hình báo lỗi
            setLoading(false);
            setRefreshing(false);
            return;
        }

        setIsNetworkError(false); // Có mạng thì tắt cờ lỗi
        try {
            const res = await inventoryService.getPendingNoiBo();
            let allData = res.data.data || [];

            if (currentAction === 'NOIBO_APPROVE_EXPORT') {
                allData = allData.filter(item => item.trang_thai === 'PENDING_SOURCE');
            } else if (currentAction === 'NOIBO_APPROVE') {
                allData = allData.filter(item => item.trang_thai === 'PENDING_DESTINATION');
            }

            setPendingList(allData);
        } catch (error) {
            // Lỗi server cũng cho hiện báo lỗi mạng (hoặc bạn có thể tạo 1 state lỗi Server riêng)
            setIsNetworkError(true);
            setPendingList([]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPendingBills();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPendingBills();
        setRefreshing(false);
    };

    const toggleExpand = (id) => {
        setExpandedBillId(prev => prev === id ? null : id);
    };

    // 2. CHẶN MỞ MODAL NẾU ĐANG MẤT MẠNG BẰNG ALERT
    const openActionModal = async (bill, type) => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            return Alert.alert("Mất kết nối WiFi hoặc 4G/5G", "Vui lòng kiểm tra lại mạng trước khi thao tác!");
        }

        setSelectedBill(bill);
        setActionType(type);
        setActionNote('');
        setActionModalVisible(true);
    };

    // 3. XỬ LÝ SUBMIT TOÀN BỘ BẰNG ALERT ĐỂ CHỐNG BỊ MODAL ĐÈ
    const submitAction = async () => {
        // Lỗi Validation -> Dùng Alert
        if (actionType === 'REJECT' && !actionNote.trim()) {
            return Alert.alert("Yêu cầu bắt buộc", "Vui lòng nhập lý do từ chối");
        }

        // Kiểm tra mạng lần cuối trước khi gọi API -> Dùng Alert
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            return Alert.alert("Mất kết nối WiFi hoặc 4G/5G", "Không thể gửi yêu cầu do rớt mạng. Vui lòng thử lại!");
        }

        setIsSubmitting(true);
        try {
            await inventoryService.actionNoiBo(selectedBill.id, {
                action_type: actionType,
                ghi_chu_duyet: actionNote.trim()
            });

            // THÀNH CÔNG: Đóng Modal
            setActionModalVisible(false);

            // Chờ Modal đóng xong (350ms) rồi mới nảy Toast ở màn hình gốc
            setTimeout(() => {
                Toast.show({
                    type: 'success',
                    text1: 'Thành công',
                    text2: actionType === 'APPROVE' ? 'Đã duyệt phiếu luân chuyển!' : 'Đã từ chối phiếu luân chuyển!'
                });
                loadPendingBills();
            }, 350);

        } catch (error) {
            // LỖI SERVER -> DÙNG ALERT NGAY LẬP TỨC (Không dùng Toast vì sẽ bị Modal đè)
            Alert.alert(
                "Lỗi xử lý",
                error.response?.data?.detail || 'Có lỗi xảy ra từ máy chủ, vui lòng thử lại sau.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderBillItem = ({ item }) => {
        const isExpanded = expandedBillId === item.id;
        const isSource = item.trang_thai === 'PENDING_SOURCE';

        return (
            <View style={styles.card}>
                <TouchableOpacity style={styles.cardHeader} activeOpacity={0.7} onPress={() => toggleExpand(item.id)}>
                    <View style={styles.headerTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="document-text" size={20} color="#0284C7" />
                            <Text style={styles.billId}>{item.ma_bill}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isSource ? '#FEF3C7' : '#E0F2FE' }]}>
                            <Text style={[styles.statusText, { color: isSource ? '#D97706' : '#0284C7' }]}>
                                {isSource ? 'Chờ Xuất' : 'Chờ Nhận'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.routeContainer}>
                        <View style={styles.routeBox}>
                            <Text style={styles.routeLabel}>KHO XUẤT</Text>
                            <Text style={styles.routeValue}>{item.kho_xuat}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                        <View style={styles.routeBox}>
                            <Text style={styles.routeLabel}>KHO ĐÍCH</Text>
                            <Text style={styles.routeValue}>{item.kho_nhan}</Text>
                        </View>
                    </View>

                    <View style={styles.driverInfo}>
                        <Ionicons name="car-sport-outline" size={16} color="#6B7280" />
                        <Text style={styles.driverText}>{item.tai_xe} • {item.bien_so_xe} • {item.ngay_tao}</Text>
                    </View>

                    <View style={styles.expandToggle}>
                        <Text style={styles.itemCountText}>{item.so_mon_hang} mặt hàng</Text>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.divider} />
                        <Text style={styles.detailTitle}>Danh sách mặt hàng:</Text>

                        {item.items?.map((prod, idx) => (
                            <View key={idx} style={styles.productCard}>
                                <View style={styles.productHeader}>
                                    <View style={styles.productHeaderLeft}>
                                        <Ionicons name="cube-outline" size={18} color="#0284C7" style={{ marginRight: 6, marginTop: 1 }} />
                                        <Text style={styles.productName} numberOfLines={2}>
                                            {prod.loai_khach === 'THUONG' ? prod.ten_san_pham : prod.ma_may}
                                        </Text>
                                    </View>
                                    <View style={[styles.typeBadge, { backgroundColor: prod.loai_khach === 'VIP' ? '#FDF2F8' : '#ECFDF5' }]}>
                                        <Text style={[styles.typeBadgeText, { color: prod.loai_khach === 'VIP' ? '#DB2777' : '#059669' }]}>
                                            {prod.loai_khach}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.productDetailsGrid}>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>MÃ BILL</Text>
                                        <Text style={styles.detailValue} numberOfLines={1}>{prod.ma_bill_item}</Text>
                                    </View>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>SỐ LƯỢNG</Text>
                                        <Text style={styles.detailValue}>{prod.so_luong}</Text>
                                    </View>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>SỐ KIỆN</Text>
                                        <Text style={styles.detailValue}>{prod.so_kien || '-'}</Text>
                                    </View>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>SERIAL (SN)</Text>
                                        <Text style={styles.detailValue} numberOfLines={1}>{prod.serial || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnReject]}
                                onPress={() => openActionModal(item, 'REJECT')}
                            >
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                                <Text style={styles.textReject}>Từ chối</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, styles.btnApprove]}
                                onPress={() => openActionModal(item, 'APPROVE')}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={styles.textApprove}>Duyệt {isSource ? 'Xuất' : 'Nhận'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
                }
            </View >
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#0284C7" /></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={pendingList}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    // 4. HIỂN THỊ UI TRỐNG DỰA TRÊN CỜ MẠNG
                    isNetworkError ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="wifi-outline" size={60} color="#9CA3AF" />
                            <Text style={styles.emptyText}>Mất kết nối mạng!</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={loadPendingBills}>
                                <Text style={styles.retryText}>Tải lại</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-done-circle" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Không có phiếu nào đang chờ duyệt.</Text>
                        </View>
                    )
                }
                renderItem={renderBillItem}
            />

            <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {actionType === 'APPROVE' ? 'Xác nhận Duyệt' : 'Từ chối Phiếu'}
                        </Text>
                        <Text style={styles.modalSub}>Phiếu: {selectedBill?.ma_bill}</Text>

                        <TextInput
                            style={styles.noteInput}
                            placeholder={actionType === 'REJECT' ? "Nhập lý do từ chối (Bắt buộc)..." : "Ghi chú thêm (Không bắt buộc)..."}
                            multiline
                            numberOfLines={3}
                            value={actionNote}
                            onChangeText={setActionNote}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setActionModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtnSubmit, { backgroundColor: actionType === 'APPROVE' ? '#10B981' : '#EF4444' }]}
                                onPress={submitAction}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                                    <Text style={styles.modalBtnSubmitText}>{actionType === 'APPROVE' ? 'Xác Nhận' : 'Từ Chối'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, overflow: 'hidden' },
    cardHeader: { padding: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    billId: { fontSize: 16, fontWeight: '800', color: '#111827', marginLeft: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    routeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12 },
    routeBox: { flex: 1 },
    routeLabel: { fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 2 },
    routeValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    driverInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    driverText: { fontSize: 13, color: '#4B5563', marginLeft: 6, fontWeight: '500' },
    expandToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
    itemCountText: { fontSize: 13, color: '#64748B', fontWeight: '600' },

    expandedContent: { backgroundColor: '#FAFAF9', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
    detailTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
    productCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    productHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 8 },
    productName: { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1, lineHeight: 20 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    typeBadgeText: { fontSize: 10, fontWeight: 'bold' },
    productDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 },
    detailBox: { width: '45%' },
    detailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginBottom: 4 },
    detailValue: { fontSize: 13, color: '#374151', fontWeight: '800' },

    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
    btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
    btnReject: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    textReject: { color: '#EF4444', fontWeight: '700', marginLeft: 6 },
    btnApprove: { backgroundColor: '#10B981' },
    textApprove: { color: '#FFF', fontWeight: '700', marginLeft: 6 },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#9CA3AF', marginTop: 12, fontSize: 15, fontWeight: '500' },
    retryBtn: { marginTop: 16, backgroundColor: '#E0F2FE', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    retryText: { color: '#0284C7', fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
    modalSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
    noteInput: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, height: 80, textAlignVertical: 'top', fontSize: 14, color: '#1F2937' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
    modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
    modalBtnCancelText: { color: '#4B5563', fontWeight: 'bold' },
    modalBtnSubmit: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalBtnSubmitText: { color: '#FFF', fontWeight: 'bold' }
});