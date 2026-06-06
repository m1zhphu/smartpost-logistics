import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, apiClient } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';

const SelectModal = ({ visible, title, data, onSelect, onClose }) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
                </View>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.code.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
                            <Text style={styles.modalItemText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    </Modal>
);

export default function CustomerUpdateProfileScreen({ navigation }) {
    const { user, refreshProfile } = useUser();
    const [loading, setLoading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone_number || '');
    
    // Address states
    const [provincesData, setProvincesData] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [addressDetail, setAddressDetail] = useState('');

    // Modal states
    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [showWardModal, setShowWardModal] = useState(false);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await fetch('https://provinces.open-api.vn/api/v2/?depth=2');
                const data = await response.json();
                setProvincesData(data);
                
                // Auto pre-fill if user already has province and ward
                if (user?.province) {
                    const matchedProv = data.find(p => p.name === user.province || p.code === user.province_id);
                    if (matchedProv) {
                        setSelectedProvince(matchedProv);
                        if (user?.ward && matchedProv.wards) {
                            const matchedWard = matchedProv.wards.find(w => w.name === user.ward || w.code === user.ward_id);
                            if (matchedWard) {
                                setSelectedWard(matchedWard);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách địa chỉ:", error);
                Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải danh sách Tỉnh/Thành' });
            }
        };
        fetchProvinces();
        
        if (user?.street_address) {
            setAddressDetail(user.street_address);
        } else if (user?.address && (!user?.province || !user?.ward)) {
            // Nếu người dùng cũ chưa từng tách Tỉnh/Xã thì fill tạm toàn bộ vào đây
            setAddressDetail(user.address);
        }
    }, [user]);

    const handleUpdate = async () => {
        if (!fullName.trim() || !phone.trim() || !addressDetail.trim() || !selectedProvince || !selectedWard) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng điền đầy đủ tất cả thông tin' });
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.patch(CUSTOMER_ENDPOINTS.UPDATE_PROFILE, {
                full_name: fullName.trim(),
                phone_number: phone.trim(),
                province_name: selectedProvince.name,
                province_id: selectedProvince.code,
                ward_name: selectedWard.name,
                ward_id: selectedWard.code,
                street_address: addressDetail.trim()
            });

            if (response.status === 200 || response.status === 201) {
                Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã cập nhật thông tin thành công' });
                await refreshProfile();
                navigation.goBack();
            }
        } catch (error) {
            console.error("Update profile error:", error);
            Toast.show({ type: 'error', text1: 'Cập nhật thất bại', text2: error?.response?.data?.detail || 'Vui lòng thử lại sau' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} disabled={loading}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Họ và tên <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Nhập họ và tên"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Nhập số điện thoại"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Địa chỉ <Text style={styles.required}>*</Text></Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tỉnh / Thành phố</Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setShowProvinceModal(true)}>
                            <Text style={{ color: selectedProvince ? '#1F2937' : '#9CA3AF' }}>
                                {selectedProvince ? selectedProvince.name : "Chọn Tỉnh / Thành phố"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quận / Huyện / Phường / Xã</Text>
                        <TouchableOpacity 
                            style={[styles.selectBox, !selectedProvince && { backgroundColor: '#F3F4F6' }]} 
                            onPress={() => {
                                if (!selectedProvince) {
                                    Toast.show({ type: 'info', text1: 'Lưu ý', text2: 'Vui lòng chọn Tỉnh / Thành phố trước' });
                                    return;
                                }
                                setShowWardModal(true);
                            }}
                        >
                            <Text style={{ color: selectedWard ? '#1F2937' : '#9CA3AF' }}>
                                {selectedWard ? selectedWard.name : "Chọn Quận / Huyện / Phường / Xã"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ cụ thể (Số nhà, đường...)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={addressDetail}
                            onChangeText={setAddressDetail}
                            placeholder="Ví dụ: Số nhà 12, Ngõ 10"
                            multiline
                            numberOfLines={2}
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <SelectModal 
                visible={showProvinceModal}
                title="Chọn Tỉnh / Thành phố"
                data={provincesData}
                onSelect={(prov) => {
                    setSelectedProvince(prov);
                    setSelectedWard(null); // reset ward when province changes
                }}
                onClose={() => setShowProvinceModal(false)}
            />

            <SelectModal 
                visible={showWardModal}
                title="Chọn Quận / Huyện / Phường / Xã"
                data={selectedProvince?.wards || []}
                onSelect={(ward) => setSelectedWard(ward)}
                onClose={() => setShowWardModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 15,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        zIndex: 10,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    content: { flex: 1, padding: 16 },
    formCard: {
        backgroundColor: '#FFF',
        padding: 16, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: '#4B5563', marginBottom: 8, fontWeight: '500' },
    required: { color: 'red' },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1, borderColor: '#D1D5DB',
        borderRadius: 8, padding: 12,
        fontSize: 14, color: '#1F2937',
    },
    selectBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1, borderColor: '#D1D5DB',
        borderRadius: 8, padding: 12,
    },
    textArea: { height: 60, textAlignVertical: 'top' },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 10,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    
    // Modal styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        maxHeight: '70%', padding: 16
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 10
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalItemText: { fontSize: 16, color: '#374151' }
});
