import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, StatusBar, Modal, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axiosClient from '../../api/axiosClient';

const COLORS = {
    primary: '#254BE0', background: '#F8F9FA', card: '#FFFFFF', textMain: '#1E293B', textSub: '#64748B', border: '#E2E8F0', success: '#10B981', danger: '#EF4444', warning: '#F59E0B', inputBg: '#F8FAFC'
};

export default function PricingRulesScreen({ navigation }: any) {
    const [activeTab, setActiveTab] = useState<'MAIN' | 'EXTRA'>('MAIN');
    const [rules, setRules] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- MODAL STATE ---
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [submitLoading, setSubmitLoading] = useState(false);

    // --- FORM STATES ---
    const [ruleForm, setRuleForm] = useState({
        rule_id: null, from_province_id: '', to_province_id: '', service_type: 'STANDARD', min_weight: '', max_weight: '', price: '', is_active: true
    });

    const [serviceForm, setServiceForm] = useState({
        id: null, service_code: '', service_name: '', fee_type: 'FIXED', fee_value: '', is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Giả định axiosClient đã có base URL trỏ tới /api
            const [resRules, resServices] = await Promise.all([
                axiosClient.get('/pricing/rules'),
                axiosClient.get('/pricing/extra-services')
            ]);
            setRules(resRules.data || []);
            setServices(resServices.data || []);
        } catch (e) {
            console.log('Lỗi tải bảng giá', e);
        } finally {
            setLoading(false);
        }
    };

    // ===================== XỬ LÝ: CƯỚC PHÍ CHÍNH (RULES) =====================
    const handleSaveRule = async () => {
        if (!ruleForm.from_province_id || !ruleForm.to_province_id || !ruleForm.min_weight || !ruleForm.max_weight || !ruleForm.price) {
            return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc!');
        }
        if (Number(ruleForm.min_weight) >= Number(ruleForm.max_weight)) {
            return Alert.alert('Lỗi', 'Khối lượng tối thiểu phải nhỏ hơn tối đa!');
        }

        setSubmitLoading(true);
        const payload = {
            from_province_id: Number(ruleForm.from_province_id),
            to_province_id: Number(ruleForm.to_province_id),
            service_type: ruleForm.service_type,
            min_weight: Number(ruleForm.min_weight),
            max_weight: Number(ruleForm.max_weight),
            price: Number(ruleForm.price),
            is_active: ruleForm.is_active
        };

        try {
            if (modalMode === 'CREATE') {
                await axiosClient.post('/pricing/rules', payload);
                Alert.alert('Thành công', 'Đã thêm quy tắc giá mới');
            } else {
                await axiosClient.put(`/pricing/rules/${ruleForm.rule_id}`, payload);
                Alert.alert('Thành công', 'Đã cập nhật quy tắc giá');
            }
            setShowModal(false);
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể lưu quy tắc giá');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteRule = (ruleId: number) => {
        Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa quy tắc giá này không?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    try {
                        await axiosClient.delete(`/pricing/rules/${ruleId}`);
                        fetchData();
                    } catch (e: any) { Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể xóa quy tắc này'); }
                }
            }
        ]);
    };

    // ===================== XỬ LÝ: PHỤ PHÍ DỊCH VỤ (EXTRA SERVICES) =====================
    const handleSaveService = async () => {
        if (!serviceForm.service_code || !serviceForm.service_name || !serviceForm.fee_value) {
            return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin dịch vụ!');
        }

        setSubmitLoading(true);
        const payload = {
            service_code: serviceForm.service_code,
            service_name: serviceForm.service_name,
            fee_type: serviceForm.fee_type,
            fee_value: Number(serviceForm.fee_value),
            is_active: serviceForm.is_active
        };

        try {
            if (modalMode === 'CREATE') {
                await axiosClient.post('/pricing/extra-services', payload);
                Alert.alert('Thành công', 'Đã thêm dịch vụ mới');
            } else {
                await axiosClient.put(`/pricing/extra-services/${serviceForm.id}`, payload);
                Alert.alert('Thành công', 'Đã cập nhật dịch vụ');
            }
            setShowModal(false);
            fetchData();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể lưu dịch vụ');
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- HÀM MỞ MODAL ---
    const openModalCreate = () => {
        setModalMode('CREATE');
        if (activeTab === 'MAIN') {
            setRuleForm({ rule_id: null, from_province_id: '', to_province_id: '', service_type: 'STANDARD', min_weight: '', max_weight: '', price: '', is_active: true });
        } else {
            setServiceForm({ id: null, service_code: '', service_name: '', fee_type: 'FIXED', fee_value: '', is_active: true });
        }
        setShowModal(true);
    };

    const openModalEditRule = (item: any) => {
        setModalMode('EDIT');
        setRuleForm({
            rule_id: item.rule_id, from_province_id: String(item.from_province_id), to_province_id: String(item.to_province_id),
            service_type: item.service_type, min_weight: String(item.min_weight), max_weight: String(item.max_weight),
            price: String(item.price), is_active: item.is_active
        });
        setShowModal(true);
    };

    const openModalEditService = (item: any) => {
        setModalMode('EDIT');
        setServiceForm({
            id: item.id, service_code: item.service_code, service_name: item.service_name,
            fee_type: item.fee_type, fee_value: String(item.fee_value), is_active: item.is_active
        });
        setShowModal(true);
    };


    // ===================== UI RENDER =====================
    const renderRuleCard = ({ item }: any) => (
        <View style={[styles.card, !item.is_active && { opacity: 0.6 }]}>
            <View style={styles.cardHeader}>
                <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{item.service_type}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.priceText}>{Number(item.price).toLocaleString()} đ</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <View style={styles.iconCircle}><Ionicons name="map" size={16} color={COLORS.primary} /></View>
                <Text style={styles.infoText}>Từ ID <Text style={{ fontWeight: 'bold', color: COLORS.textMain }}>{item.from_province_id}</Text> ➔ Đến ID <Text style={{ fontWeight: 'bold', color: COLORS.textMain }}>{item.to_province_id}</Text></Text>
            </View>
            <View style={styles.infoRow}>
                <View style={styles.iconCircle}><Ionicons name="scale" size={16} color={COLORS.warning} /></View>
                <Text style={styles.infoText}>Mức cân: <Text style={{ fontWeight: 'bold', color: COLORS.textMain }}>{item.min_weight} kg - {item.max_weight} kg</Text></Text>
            </View>

            <View style={styles.actionRow}>
                <SwitchStatus isActive={item.is_active} />
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.actionBtnEdit} onPress={() => openModalEditRule(item)}>
                        <Ionicons name="pencil" size={16} color={COLORS.primary} />
                        <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: 'bold', marginLeft: 4 }}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDeleteRule(item.rule_id)}>
                        <Ionicons name="trash" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderServiceCard = ({ item }: any) => (
        <View style={[styles.card, !item.is_active && { opacity: 0.6 }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.service_name}</Text>
                    <Text style={styles.serviceCode}>Mã dịch vụ: {item.service_code}</Text>
                </View>
                <SwitchStatus isActive={item.is_active} />
            </View>

            <View style={styles.divider} />

            <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="pricetag-outline" size={18} color={COLORS.textSub} style={{ marginRight: 6 }} />
                    <Text style={styles.infoText}>Tính phí: <Text style={{ fontWeight: 'bold', color: COLORS.textMain }}>{item.fee_type === 'FIXED' ? 'Cố định' : '% Thu hộ'}</Text></Text>
                </View>
                <Text style={styles.priceText}>{item.fee_type === 'FIXED' ? `${Number(item.fee_value).toLocaleString()} đ` : `${item.fee_value}%`}</Text>
            </View>

            <View style={[styles.divider, { marginTop: 15, marginBottom: 10 }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={styles.actionBtnEdit} onPress={() => openModalEditService(item)}>
                    <Ionicons name="pencil" size={16} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: 'bold', marginLeft: 4 }}>Sửa Dịch Vụ</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* HEADER NỀN XANH */}
            <View style={styles.headerArea}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cấu Hình Bảng Giá</Text>
                    <View style={{ width: 36 }} />
                </View>
            </View>

            {/* NỘI DUNG CUỘN */}
            <View style={styles.scrollViewWrapper}>
                <FlatList
                    data={activeTab === 'MAIN' ? rules : services}
                    keyExtractor={(item, idx) => (activeTab === 'MAIN' ? item.rule_id?.toString() || idx.toString() : item.id?.toString() || idx.toString())}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.tabContainer}>
                            <TouchableOpacity style={[styles.tab, activeTab === 'MAIN' && styles.tabActive]} onPress={() => setActiveTab('MAIN')} activeOpacity={0.8}>
                                <Text style={[styles.tabText, activeTab === 'MAIN' && styles.tabTextActive]}>Cước Phí Chính</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, activeTab === 'EXTRA' && styles.tabActive]} onPress={() => setActiveTab('EXTRA')} activeOpacity={0.8}>
                                <Text style={[styles.tabText, activeTab === 'EXTRA' && styles.tabTextActive]}>Phụ Phí Dịch Vụ</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Ionicons name="document-text-outline" size={60} color={COLORS.border} />
                                <Text style={{ textAlign: 'center', color: COLORS.textSub, marginTop: 10, fontStyle: 'italic' }}>Chưa có cấu hình bảng giá nào.</Text>
                            </View>
                        ) : null
                    }
                    renderItem={activeTab === 'MAIN' ? renderRuleCard : renderServiceCard}
                />
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}
            </View>

            {/* FAB THÊM MỚI */}
            <TouchableOpacity style={styles.fab} onPress={openModalCreate} activeOpacity={0.8}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* ==============================================================
          MODAL FORM: TỰ ĐỘNG CHUYỂN ĐỔI THEO TAB (BỌC KEYBOARD AVOIDING)
      ============================================================== */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
                        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {modalMode === 'CREATE' ? 'Thêm Mới ' : 'Cập Nhật '}
                                    {activeTab === 'MAIN' ? 'Bảng Giá' : 'Dịch Vụ'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={28} color={COLORS.textMain} /></TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                                {/* --- FORM CƯỚC CHÍNH --- */}
                                {activeTab === 'MAIN' && (
                                    <>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1, marginRight: 5 }}>
                                                <Text style={styles.label}>Tỉnh gửi (ID) <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                                <TextInput style={styles.input} keyboardType="numeric" placeholder="VD: 1" value={ruleForm.from_province_id} onChangeText={t => setRuleForm({ ...ruleForm, from_province_id: t })} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 5 }}>
                                                <Text style={styles.label}>Tỉnh nhận (ID) <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                                <TextInput style={styles.input} keyboardType="numeric" placeholder="VD: 79" value={ruleForm.to_province_id} onChangeText={t => setRuleForm({ ...ruleForm, to_province_id: t })} />
                                            </View>
                                        </View>

                                        <Text style={styles.label}>Loại Dịch vụ <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                        <View style={styles.pickerWrap}>
                                            <Picker selectedValue={ruleForm.service_type} onValueChange={(v) => setRuleForm({ ...ruleForm, service_type: v })}>
                                                <Picker.Item label="Tiêu chuẩn (STANDARD)" value="STANDARD" />
                                                <Picker.Item label="Hỏa tốc (EXPRESS)" value="EXPRESS" />
                                                <Picker.Item label="Tiết kiệm (ECONOMY)" value="ECONOMY" />
                                            </Picker>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1, marginRight: 5 }}>
                                                <Text style={styles.label}>Từ số kg <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={ruleForm.min_weight} onChangeText={t => setRuleForm({ ...ruleForm, min_weight: t })} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 5 }}>
                                                <Text style={styles.label}>Đến số kg <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                                <TextInput style={styles.input} keyboardType="numeric" placeholder="5" value={ruleForm.max_weight} onChangeText={t => setRuleForm({ ...ruleForm, max_weight: t })} />
                                            </View>
                                        </View>

                                        <Text style={styles.label}>Cước phí (VNĐ) <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                        <TextInput style={[styles.input, { fontSize: 18, fontWeight: 'bold', color: COLORS.primary }]} keyboardType="numeric" placeholder="15000" value={ruleForm.price} onChangeText={t => setRuleForm({ ...ruleForm, price: t })} />

                                        <View style={styles.switchRow}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textMain }}>Kích hoạt áp dụng ngay</Text>
                                            <Switch value={ruleForm.is_active} onValueChange={v => setRuleForm({ ...ruleForm, is_active: v })} trackColor={{ true: COLORS.primary }} />
                                        </View>

                                        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveRule} disabled={submitLoading}>
                                            {submitLoading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>LƯU BẢNG GIÁ</Text>}
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* --- FORM DỊCH VỤ --- */}
                                {activeTab === 'EXTRA' && (
                                    <>
                                        <Text style={styles.label}>Mã dịch vụ <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                        <TextInput
                                            style={[styles.input, modalMode === 'EDIT' && { backgroundColor: '#E2E8F0', color: COLORS.textSub }]}
                                            placeholder="VD: KHAI_GIA"
                                            autoCapitalize="characters"
                                            value={serviceForm.service_code}
                                            onChangeText={t => setServiceForm({ ...serviceForm, service_code: t })}
                                            editable={modalMode === 'CREATE'} // Chỉ cho sửa khi Tạo mới
                                        />

                                        <Text style={styles.label}>Tên hiển thị <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                        <TextInput style={styles.input} placeholder="VD: Phí khai giá hàng hóa" value={serviceForm.service_name} onChangeText={t => setServiceForm({ ...serviceForm, service_name: t })} />

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1, marginRight: 5 }}>
                                                <Text style={styles.label}>Loại tính phí <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                                <View style={[styles.pickerWrap, { marginBottom: 15 }]}>
                                                    <Picker selectedValue={serviceForm.fee_type} onValueChange={(v) => setServiceForm({ ...serviceForm, fee_type: v })}>
                                                        <Picker.Item label="Giá Cố Định" value="FIXED" />
                                                        <Picker.Item label="Theo % Thu hộ" value="PERCENT" />
                                                    </Picker>
                                                </View>
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 5 }}>
                                                <Text style={styles.label}>Giá trị phí <Text style={{ color: COLORS.danger }}>*</Text></Text>
                                                <TextInput style={styles.input} keyboardType="numeric" placeholder="10000 hoặc 1.5" value={serviceForm.fee_value} onChangeText={t => setServiceForm({ ...serviceForm, fee_value: t })} />
                                            </View>
                                        </View>

                                        <View style={styles.switchRow}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.textMain }}>Kích hoạt trên App cho User</Text>
                                            <Switch value={serviceForm.is_active} onValueChange={v => setServiceForm({ ...serviceForm, is_active: v })} trackColor={{ true: COLORS.primary }} />
                                        </View>

                                        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveService} disabled={submitLoading}>
                                            {submitLoading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>LƯU DỊCH VỤ</Text>}
                                        </TouchableOpacity>
                                    </>
                                )}

                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

const SwitchStatus = ({ isActive }: { isActive: boolean }) => (
    <View style={[styles.statusBadge, { backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2' }]}>
        <View style={[styles.statusDot, { backgroundColor: isActive ? COLORS.success : COLORS.danger }]} />
        <Text style={{ color: isActive ? COLORS.success : COLORS.danger, fontSize: 11, fontWeight: 'bold' }}>
            {isActive ? 'ĐANG KÍCH HOẠT' : 'ĐANG TẠM DỪNG'}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header Overlapping
    headerArea: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 60, position: 'relative', overflow: 'hidden', zIndex: 1 },
    headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    // Scroll Content
    scrollViewWrapper: { flex: 1, zIndex: 10, marginTop: -35 },
    scrollContent: { padding: 15, paddingBottom: 100 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 249, 250, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },

    // Floating Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, padding: 6, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 25 },
    tabActive: { backgroundColor: COLORS.primary, elevation: 2 },
    tabText: { fontSize: 14, color: COLORS.textSub, fontWeight: '600' },
    tabTextActive: { color: '#FFF', fontWeight: 'bold' },

    // Cards
    card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    serviceBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    serviceBadgeText: { color: COLORS.textMain, fontSize: 13, fontWeight: 'bold' },
    priceText: { fontSize: 18, fontWeight: 'bold', color: COLORS.danger },

    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
    serviceCode: { fontSize: 13, color: COLORS.textSub },

    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    infoText: { color: COLORS.textSub, fontSize: 14, flex: 1 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

    // Actions (Edit/Delete)
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border },
    actionBtnEdit: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    actionBtnDelete: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 10 },

    // FAB
    fab: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, zIndex: 9999 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },

    label: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, color: COLORS.textMain, marginBottom: 15 },
    pickerWrap: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, borderRadius: 12, marginBottom: 15 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },

    submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 2, marginBottom: 20 }
});