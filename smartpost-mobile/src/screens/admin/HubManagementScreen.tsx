import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../../api/axiosClient';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function HubManagementScreen({ navigation }: any) {
    const theme = useAppTheme();
    const styles = getStyles(theme);
    const [hubs, setHubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form, setForm] = useState({ hub_code: '', hub_name: '', address: '' });

    useEffect(() => {
        fetchHubs();
    }, []);

    const fetchHubs = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/hubs');
            setHubs(res.data.items || res.data);
        } catch (e) {
            console.log('Lỗi tải danh sách bưu cục', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHub = async () => {
        if (!form.hub_code || !form.hub_name) return Alert.alert('Lỗi', 'Vui lòng nhập Mã và Tên bưu cục');

        setSubmitLoading(true);
        try {
            await axiosClient.post('/hubs', form);
            Alert.alert('Thành công', 'Đã tạo bưu cục mới!');
            setShowModal(false);
            setForm({ hub_code: '', hub_name: '', address: '' });
            fetchHubs();
        } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể tạo bưu cục');
        } finally {
            setSubmitLoading(false);
        }
    };

    const toggleHubStatus = (hub: any) => {
        Alert.alert('Xác nhận', `${hub.status ? 'Tạm ngưng' : 'Mở cửa'} hoạt động bưu cục ${hub.hub_name}?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đồng ý', style: hub.status ? 'destructive' : 'default', onPress: async () => {
                    try {
                        await axiosClient.patch(`/hubs/${hub.hub_id}/status`, { status: !hub.status });
                        fetchHubs();
                    } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật trạng thái'); }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

            {/* HEADER NỀN XANH OVERLAPPING */}
            <View style={styles.headerArea}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quản Lý Bưu Cục (Hubs)</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* DANH SÁCH BƯU CỤC */}
            {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    data={hubs}
                    keyExtractor={(item) => item.hub_id.toString()}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryIconWrap}>
                                <Ionicons name="business" size={24} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.summaryLabel}>Tổng số bưu cục trên hệ thống</Text>
                                <Text style={styles.summaryValue}>Toàn quốc</Text>
                            </View>
                            <View style={styles.summaryBadge}>
                                <Text style={styles.summaryBadgeText}>{hubs.length} Hub</Text>
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={styles.iconWrap}><Ionicons name="home-outline" size={22} color={theme.primary} /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.hubName}>{item.hub_name}</Text>
                                        <Text style={styles.hubCode}>Mã Hub: {item.hub_code}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => toggleHubStatus(item)}>
                                    <Ionicons name={item.status ? "toggle" : "toggle-outline"} size={42} color={item.status ? theme.success : theme.border} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                                <Text style={styles.addressText} numberOfLines={2}>{item.address || 'Chưa cập nhật địa chỉ hệ thống'}</Text>
                            </View>
                        </View>
                    )}
                />
            )}

            {/* FAB THÊM MỚI (Luôn nổi ở góc phải) */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* 🚀 MODAL TẠO BƯU CỤC MỚI (CHUẨN KEYBOARD AVOIDING) */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
                        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Thêm Bưu Cục Mới</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
                            </View>

                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Mã bưu cục (VD: HCM-01) <Text style={{ color: theme.danger }}>*</Text></Text>
                                <TextInput style={styles.input} placeholder="Nhập mã..." autoCapitalize="characters" value={form.hub_code} onChangeText={t => setForm({ ...form, hub_code: t })} />

                                <Text style={styles.label}>Tên bưu cục (VD: Tổng kho Tân Bình) <Text style={{ color: theme.danger }}>*</Text></Text>
                                <TextInput style={styles.input} placeholder="Nhập tên bưu cục..." value={form.hub_name} onChangeText={t => setForm({ ...form, hub_name: t })} />

                                <Text style={styles.label}>Địa chỉ</Text>
                                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Nhập địa chỉ chi tiết..." multiline value={form.address} onChangeText={t => setForm({ ...form, address: t })} />

                                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateHub} disabled={submitLoading}>
                                    {submitLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>TẠO BƯU CỤC MỚI</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // Header Overlapping
    headerArea: { backgroundColor: theme.primary, paddingTop: 50, paddingBottom: 60, position: 'relative', overflow: 'hidden', zIndex: 1 },
    headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

    // Scroll Area
    scrollView: { flex: 1, zIndex: 10, marginTop: -35 },
    scrollContent: { padding: 15, paddingBottom: 100 },

    // Summary Card
    summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    summaryIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryBackground, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    summaryLabel: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    summaryBadge: { backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    summaryBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    // Hub Card
    card: { backgroundColor: theme.card, borderRadius: 16, padding: 18, marginBottom: 15, elevation: 1, borderWidth: 1, borderColor: theme.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconWrap: { width: 46, height: 46, borderRadius: 12, backgroundColor: theme.primaryBackground, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    hubName: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
    hubCode: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },

    divider: { height: 1, backgroundColor: theme.border, marginVertical: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    addressText: { color: theme.textSecondary, fontSize: 14, flex: 1, lineHeight: 22 },

    // FAB
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, zIndex: 9999 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },

    label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, color: theme.text, marginBottom: 20 },

    submitBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2, marginBottom: 20 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }
});