import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { waybillService } from '../../api/services/waybillService';
import { accountingService } from '../../api/services/accountingService';
import { useAuthStore } from '../../store/authStore';

const COLORS = {
    primary: '#254BE0', background: '#F8F9FA', card: '#FFFFFF', textMain: '#1E293B', textSub: '#64748B', border: '#E2E8F0', success: '#10B981', danger: '#EF4444', warning: '#F59E0B'
};

export default function ShopStatementScreen({ navigation }: any) {
    const token = useAuthStore((state: any) => state.token); // Cần token để truyền vào URL tải Excel

    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCusts, setFilteredCusts] = useState<any[]>([]);
    const [searchTxt, setSearchTxt] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [selectedShop, setSelectedShop] = useState<any>(null);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Lịch sử bảng kê vừa tạo thành công (để hiện nút tải xuống)
    const [statementResult, setStatementResult] = useState<any>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await waybillService.getCustomers();
            setCustomers(res);
            setFilteredCusts(res);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchTxt(text);
        if (!text) return setFilteredCusts(customers);
        const low = text.toLowerCase();
        setFilteredCusts(customers.filter(c => (c.name || '').toLowerCase().includes(low) || (c.phone || '').includes(low)));
    };

    const handleCreateStatement = async () => {
        if (!selectedShop) return Alert.alert('Lỗi', 'Vui lòng chọn Shop để đối soát');

        setSubmitLoading(true);
        try {
            const res = await accountingService.createShopStatement(selectedShop.customer_id);
            setStatementResult(res);
            Alert.alert('Thành công', `Đã tạo bảng kê ${res.statement_code} với tổng tiền: ${res.total_amount.toLocaleString('vi-VN')} đ`);
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.detail || 'Không có đơn hàng nào chờ đối soát cho Shop này.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const downloadExcel = () => {
        if (!statementResult) return;
        const url = accountingService.getExportStatementUrl(statementResult.statement_id, token);
        Linking.openURL(url); // Mở trình duyệt tải file Excel
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* HEADER NỀN XANH OVERLAPPING */}
            <View style={styles.headerArea}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đối Soát Khách Hàng</Text>
                    <View style={{ width: 36 }} />
                </View>
            </View>

            <View style={styles.contentWrapper}>

                {/* KHỐI 1: CHỌN SHOP */}
                <View style={styles.card}>
                    <Text style={styles.label}>Chọn Shop (Khách hàng) <Text style={{ color: COLORS.danger }}>*</Text></Text>

                    <TouchableOpacity style={styles.mockInput} onPress={() => setShowSearchModal(true)} activeOpacity={0.8}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.textMain, !selectedShop && { color: COLORS.textSub, fontWeight: 'normal' }]} numberOfLines={1}>
                                {selectedShop ? selectedShop.name : 'Nhấn để tìm kiếm tên, SĐT...'}
                            </Text>
                            {selectedShop && <Text style={styles.textSub}>{selectedShop.phone} | {selectedShop.customer_code}</Text>}
                        </View>
                        <View style={styles.searchIconWrap}>
                            <Ionicons name="search" size={20} color={COLORS.primary} />
                        </View>
                    </TouchableOpacity>

                    {selectedShop && (
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="business" size={18} color={COLORS.textSub} style={{ marginRight: 10 }} />
                                <Text style={styles.infoText}>Ngân hàng: <Text style={{ color: COLORS.textMain, fontWeight: 'bold' }}>{selectedShop.bank_name || 'Chưa cập nhật'}</Text></Text>
                            </View>
                            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                                <Ionicons name="card" size={18} color={COLORS.textSub} style={{ marginRight: 10 }} />
                                <Text style={styles.infoText}>Số TK: <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{selectedShop.account_number || 'Chưa cập nhật'}</Text></Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, !selectedShop && { backgroundColor: '#94A3B8', elevation: 0 }]}
                        disabled={!selectedShop || submitLoading}
                        onPress={handleCreateStatement}
                        activeOpacity={0.8}
                    >
                        {submitLoading ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="calculator" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>TẠO BẢNG KÊ ĐỐI SOÁT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* KHỐI 2: KẾT QUẢ TẠO THÀNH CÔNG (TICKET STYLE) */}
                {statementResult && (
                    <View style={styles.resultTicket}>
                        <View style={styles.ticketTop}>
                            <View style={styles.successCircle}>
                                <Ionicons name="checkmark" size={32} color="#FFF" />
                            </View>
                            <Text style={styles.resTitle}>Tạo Bảng Kê Thành Công</Text>
                            <Text style={styles.resCode}>Mã phiếu: {statementResult.statement_code}</Text>
                        </View>

                        <View style={styles.ticketDivider}>
                            <View style={styles.ticketNotchLeft} />
                            <View style={styles.ticketNotchRight} />
                            <View style={styles.dashedLine} />
                        </View>

                        <View style={styles.ticketBottom}>
                            <Text style={styles.resAmountLabel}>TỔNG TIỀN ĐỐI SOÁT</Text>
                            <Text style={styles.resAmountValue}>{statementResult.total_amount.toLocaleString('vi-VN')} đ</Text>

                            <TouchableOpacity style={styles.downloadBtn} onPress={downloadExcel} activeOpacity={0.8}>
                                <Ionicons name="download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.downloadText}>TẢI FILE EXCEL CHI TIẾT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>

            {/* ==============================================================
          MODAL TÌM KIẾM SHOP (CHUẨN KEYBOARD AVOIDING)
      ============================================================== */}
            <Modal visible={showSearchModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSearchModal(false)}>
                        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Tìm Kiếm Shop (Khách hàng)</Text>
                                <TouchableOpacity onPress={() => setShowSearchModal(false)}><Ionicons name="close" size={28} color={COLORS.textMain} /></TouchableOpacity>
                            </View>

                            <View style={styles.searchWrap}>
                                <Ionicons name="search" size={20} color={COLORS.textSub} style={{ marginHorizontal: 10 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Nhập SĐT, Tên, Mã KH..."
                                    placeholderTextColor={COLORS.textSub}
                                    value={searchTxt}
                                    onChangeText={handleSearch}
                                    autoFocus
                                />
                                {searchTxt !== '' && (
                                    <TouchableOpacity onPress={() => handleSearch('')} style={{ paddingHorizontal: 10 }}>
                                        <Ionicons name="close-circle" size={20} color={COLORS.border} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {loading ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator color={COLORS.primary} size="large" />
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredCusts}
                                    keyExtractor={(item) => item.customer_id.toString()}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.searchItem} onPress={() => { setSelectedShop(item); setShowSearchModal(false); setStatementResult(null); }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={styles.custIcon}><Ionicons name="person" size={16} color={COLORS.primary} /></View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: 'bold', fontSize: 15, color: COLORS.textMain }}>{item.name}</Text>
                                                    <Text style={{ color: COLORS.textSub, fontSize: 13, marginTop: 2 }}>{item.phone} | {item.customer_code}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: COLORS.textSub, fontStyle: 'italic' }}>Không tìm thấy khách hàng nào.</Text>}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header Overlapping
    headerArea: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 60, position: 'relative', overflow: 'hidden', zIndex: 1 },
    headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    // Content Area
    contentWrapper: { flex: 1, zIndex: 10, marginTop: -35, paddingHorizontal: 15 },

    // Cards
    card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 12 },

    mockInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
    textMain: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
    textSub: { fontSize: 13, color: COLORS.textSub },
    searchIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },

    infoCard: { backgroundColor: '#F0FDF4', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#A7F3D0' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#D1FAE5', paddingBottom: 12 },
    infoText: { color: COLORS.textSub, fontSize: 14 },

    submitBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

    // Result Ticket
    resultTicket: { backgroundColor: COLORS.card, borderRadius: 20, marginTop: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, overflow: 'hidden' },
    ticketTop: { padding: 25, alignItems: 'center', backgroundColor: '#ECFDF5' },
    successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 2 },
    resTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.success, marginBottom: 5 },
    resCode: { fontSize: 14, color: COLORS.textSub, fontWeight: '500' },

    ticketDivider: { height: 30, backgroundColor: COLORS.card, position: 'relative', justifyContent: 'center' },
    ticketNotchLeft: { position: 'absolute', left: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.background },
    ticketNotchRight: { position: 'absolute', right: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.background },
    dashedLine: { height: 1, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', marginHorizontal: 20 },

    ticketBottom: { padding: 25, paddingTop: 10, alignItems: 'center', backgroundColor: COLORS.card },
    resAmountLabel: { fontSize: 13, color: COLORS.textSub, fontWeight: '600', letterSpacing: 1, marginBottom: 5 },
    resAmountValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.danger, marginBottom: 25 },
    downloadBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 25, borderRadius: 30, alignItems: 'center', elevation: 2, width: '100%', justifyContent: 'center' },
    downloadText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain },

    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, height: 54, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.textMain },

    searchItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    custIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 }
});