import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
    KeyboardAvoidingView, Platform, Alert, Modal, FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';
import { createCustomerPickup, savePickupDraft, getPickupDraft, clearPickupDraft } from '../services/pickupService';

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

export default function CustomerCreatePickupScreen({ navigation }) {
    const { user } = useUser();
    
    // Form States
    const [sName, setSName] = useState(user?.full_name || '');
    const [sPhone, setSPhone] = useState(user?.phone_number || '');
    const [sAddressDetail, setSAddressDetail] = useState(user?.street_address || user?.address || '');
    const [sProvince, setSProvince] = useState(null);
    const [sDistrict, setSDistrict] = useState(null);
    
    const [rName, setRName] = useState('');
    const [rPhone, setRPhone] = useState('');
    const [rAddressDetail, setRAddressDetail] = useState('');
    const [rProvince, setRProvince] = useState(null);
    const [rDistrict, setRDistrict] = useState(null);
    
    const [itemName, setItemName] = useState('');
    const [itemWeight, setItemWeight] = useState('');
    const [codAmount, setCodAmount] = useState('');
    const [note, setNote] = useState('');
    
    // New fields mapped from CreateWaybill
    const [packageType, setPackageType] = useState('goods');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('SENDER_PAY');
    const [serviceType, setServiceType] = useState('CPN');

    const [provincesData, setProvincesData] = useState([]);
    
    // Modal states
    const [modalConfig, setModalConfig] = useState({ visible: false, type: '', data: [], onSelect: null });

    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        fetchProvinces();
        loadDraft();
    }, []);

    const fetchProvinces = async () => {
        try {
            const response = await fetch('https://provinces.open-api.vn/api/v2/?depth=2');
            const data = await response.json();
            setProvincesData(data);
            
            // Auto pre-fill for sender if user has province
            if (user?.province_id || user?.province) {
                const matchedProv = data.find(p => p.code === user.province_id || p.name === user.province);
                if (matchedProv) {
                    setSProvince(matchedProv);
                    if (user?.ward_id || user?.ward) {
                        // The API returns 'districts' array, but the profile code called it 'wards'. 
                        // We map it properly here.
                        const districts = matchedProv.districts || matchedProv.wards || [];
                        const matchedDist = districts.find(d => d.code === user.ward_id || d.name === user.ward);
                        if (matchedDist) setSDistrict(matchedDist);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách địa chỉ:", error);
        }
    };

    const loadDraft = async () => {
        const draft = await getPickupDraft();
        if (draft) {
            Alert.alert(
                "Phục hồi nháp",
                "Bạn có một đơn hàng đang tạo dở, bạn có muốn tiếp tục?",
                [
                    { text: "Bỏ qua", style: "cancel", onPress: () => clearPickupDraft() },
                    { text: "Tiếp tục", onPress: () => {
                        if (draft.rName) setRName(draft.rName);
                        if (draft.rPhone) setRPhone(draft.rPhone);
                        if (draft.rAddressDetail) setRAddressDetail(draft.rAddressDetail);
                        if (draft.itemName) setItemName(draft.itemName);
                        if (draft.itemWeight) setItemWeight(draft.itemWeight.toString());
                        if (draft.codAmount) setCodAmount(draft.codAmount.toString());
                        if (draft.note) setNote(draft.note);
                        if (draft.rProvince) setRProvince(draft.rProvince);
                        if (draft.rDistrict) setRDistrict(draft.rDistrict);
                        if (draft.packageType) setPackageType(draft.packageType);
                        if (draft.length) setLength(draft.length.toString());
                        if (draft.width) setWidth(draft.width.toString());
                        if (draft.height) setHeight(draft.height.toString());
                        if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
                        if (draft.serviceType) setServiceType(draft.serviceType);
                    }}
                ]
            );
        }
    };

    const handleSaveDraft = async () => {
        const draftData = { rName, rPhone, rAddressDetail, rProvince, rDistrict, itemName, itemWeight, codAmount, note, packageType, length, width, height, paymentMethod, serviceType };
        await savePickupDraft(draftData);
        Toast.show({ type: 'success', text1: 'Lưu nháp thành công' });
    };

    const handleConfirm = async () => {
        if (!rName || !rPhone || !rAddressDetail || !itemWeight || !rProvince || !rDistrict || !sProvince || !sDistrict || !sAddressDetail) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đầy đủ các trường và địa chỉ' });
            return;
        }
        if (packageType === 'goods' && !itemName) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập tên hàng hoá' });
            return;
        }

        setLoading(true);
        const payload = {
            order_type: "DOMESTIC",
            pickup_time: new Date().toISOString(),
            sender: {
                name: sName,
                phone: sPhone,
                address: sAddressDetail,
                province_id: sProvince.code,
                district_id: sDistrict.code,
                ward_id: 0,
                province_name: sProvince.name,
                district_name: sDistrict.name
            },
            receiver: {
                name: rName,
                phone: rPhone,
                address: rAddressDetail,
                province_id: rProvince.code,
                district_id: rDistrict.code,
                ward_id: 0,
                province_name: rProvince.name,
                district_name: rDistrict.name
            },
            items: [
                {
                    product_group: packageType === 'goods' ? 'PARCEL' : 'DOCUMENT',
                    product_name: packageType === 'goods' ? itemName : 'Thư từ / Tài liệu',
                    weight: parseFloat(itemWeight) || (packageType === 'letter' ? 0.1 : 1),
                    quantity: 1,
                }
            ],
            length: packageType === 'goods' ? (parseFloat(length) || 0) : 0,
            width: packageType === 'goods' ? (parseFloat(width) || 0) : 0,
            height: packageType === 'goods' ? (parseFloat(height) || 0) : 0,
            cod_amount: parseFloat(codAmount) || 0,
            service_type: serviceType,
            note: note,
            payment_method: paymentMethod,
            save_as_draft: false
        };

        const result = await createCustomerPickup(payload);
        setLoading(false);

        if (result.success) {
            await clearPickupDraft();
            Toast.show({ type: 'success', text1: 'Tạo yêu cầu thành công!' });
            navigation.goBack();
        } else {
            Toast.show({ type: 'error', text1: 'Lỗi tạo đơn', text2: result.message });
        }
    };

    const openModal = (type) => {
        if (type === 'sProvince') {
            setModalConfig({ visible: true, title: 'Chọn Tỉnh / Thành (Gửi)', data: provincesData, onSelect: (val) => { setSProvince(val); setSDistrict(null); } });
        } else if (type === 'sDistrict') {
            if (!sProvince) return Toast.show({ type: 'info', text1: 'Vui lòng chọn tỉnh gửi trước' });
            setModalConfig({ visible: true, title: 'Chọn Quận / Huyện (Gửi)', data: sProvince.districts || sProvince.wards || [], onSelect: setSDistrict });
        } else if (type === 'rProvince') {
            setModalConfig({ visible: true, title: 'Chọn Tỉnh / Thành (Nhận)', data: provincesData, onSelect: (val) => { setRProvince(val); setRDistrict(null); } });
        } else if (type === 'rDistrict') {
            if (!rProvince) return Toast.show({ type: 'info', text1: 'Vui lòng chọn tỉnh nhận trước' });
            setModalConfig({ visible: true, title: 'Chọn Quận / Huyện (Nhận)', data: rProvince.districts || rProvince.wards || [], onSelect: setRDistrict });
        } else if (type === 'serviceType') {
            const services = [
                { code: 'CPN', name: 'Chuyển phát nhanh (CPN)' },
                { code: 'TK', name: 'Tiết kiệm (TK)' },
                { code: 'HT', name: 'Hỏa tốc (HT)' },
                { code: 'PT9H', name: 'Phát trước 9h (PT9H)' },
                { code: 'QT', name: 'Quốc tế (QT)' }
            ];
            setModalConfig({ visible: true, title: 'Chọn dịch vụ', data: services, onSelect: (val) => setServiceType(val.code) });
        } else if (type === 'paymentMethod') {
            const payments = [
                { code: 'SENDER_PAY', name: 'Người gửi trả' },
                { code: 'RECEIVER_PAY', name: 'Người nhận trả' }
            ];
            setModalConfig({ visible: true, title: 'Người trả phí', data: payments, onSelect: (val) => setPaymentMethod(val.code) });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo lấy hàng</Text>
                <TouchableOpacity onPress={handleSaveDraft} style={styles.draftButton}>
                    <Text style={styles.draftText}>Lưu nháp</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
                    
                    {/* Người gửi */}
                    <Text style={styles.sectionTitle}>1. NGƯỜI GỬI (LẤY HÀNG)</Text>
                    <View style={styles.inputCard}>
                        <TextInput style={styles.input} value={sName} onChangeText={setSName} placeholder="Họ tên người gửi" />
                        <TextInput style={styles.input} value={sPhone} onChangeText={setSPhone} placeholder="Số điện thoại" keyboardType="phone-pad" />
                        
                        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('sProvince')}>
                            <Text style={{ color: sProvince ? '#333' : '#999' }}>{sProvince ? sProvince.name : "Chọn Tỉnh / Thành phố"}</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('sDistrict')}>
                            <Text style={{ color: sDistrict ? '#333' : '#999' }}>{sDistrict ? sDistrict.name : "Chọn Quận / Huyện"}</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>

                        <TextInput style={styles.input} value={sAddressDetail} onChangeText={setSAddressDetail} placeholder="Số nhà, tên đường..." multiline />
                    </View>

                    {/* Người nhận */}
                    <Text style={styles.sectionTitle}>2. NGƯỜI NHẬN (GIAO HÀNG)</Text>
                    <View style={styles.inputCard}>
                        <TextInput style={styles.input} value={rName} onChangeText={setRName} placeholder="Họ tên người nhận *" />
                        <TextInput style={styles.input} value={rPhone} onChangeText={setRPhone} placeholder="Số điện thoại *" keyboardType="phone-pad" />
                        
                        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('rProvince')}>
                            <Text style={{ color: rProvince ? '#333' : '#999' }}>{rProvince ? rProvince.name : "Chọn Tỉnh / Thành phố *"}</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('rDistrict')}>
                            <Text style={{ color: rDistrict ? '#333' : '#999' }}>{rDistrict ? rDistrict.name : "Chọn Quận / Huyện *"}</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>

                        <TextInput style={styles.input} value={rAddressDetail} onChangeText={setRAddressDetail} placeholder="Số nhà, tên đường... *" multiline />
                    </View>

                    {/* Hàng hoá */}
                    <Text style={styles.sectionTitle}>3. THÔNG TIN HÀNG HOÁ & THANH TOÁN</Text>
                    <View style={styles.inputCard}>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity style={[styles.radioBtn, packageType === 'goods' && styles.radioBtnActive]} onPress={() => setPackageType('goods')}>
                                <Text style={[styles.radioText, packageType === 'goods' && styles.radioTextActive]}>Hàng hoá</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.radioBtn, packageType === 'letter' && styles.radioBtnActive]} onPress={() => setPackageType('letter')}>
                                <Text style={[styles.radioText, packageType === 'letter' && styles.radioTextActive]}>Thư từ / Tài liệu</Text>
                            </TouchableOpacity>
                        </View>

                        {packageType === 'goods' && (
                            <>
                                <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="Tên hàng hoá *" />
                                <TextInput style={styles.input} value={itemWeight} onChangeText={setItemWeight} placeholder="Trọng lượng ước tính (kg) *" keyboardType="decimal-pad" />
                                
                                <View style={styles.row}>
                                    <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} value={length} onChangeText={setLength} placeholder="Dài (cm)" keyboardType="number-pad" />
                                    <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} value={width} onChangeText={setWidth} placeholder="Rộng (cm)" keyboardType="number-pad" />
                                    <TextInput style={[styles.input, { flex: 1 }]} value={height} onChangeText={setHeight} placeholder="Cao (cm)" keyboardType="number-pad" />
                                </View>
                            </>
                        )}
                        {packageType === 'letter' && (
                            <TextInput style={styles.input} value={itemWeight} onChangeText={setItemWeight} placeholder="Trọng lượng ước tính (kg) *" keyboardType="decimal-pad" />
                        )}

                        <TextInput style={styles.input} value={codAmount} onChangeText={setCodAmount} placeholder="Tiền thu hộ COD (nếu có)" keyboardType="number-pad" />
                        
                        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('serviceType')}>
                            <Text style={{ color: '#333' }}>
                                Dịch vụ: {serviceType === 'CPN' ? 'Chuyển phát nhanh (CPN)' : serviceType === 'TK' ? 'Tiết kiệm (TK)' : serviceType === 'HT' ? 'Hoả tốc' : serviceType === 'PT9H' ? 'Phát trước 9h' : 'Quốc tế'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.selectBox} onPress={() => openModal('paymentMethod')}>
                            <Text style={{ color: '#333' }}>Người trả phí: {paymentMethod === 'SENDER_PAY' ? 'Người gửi trả' : 'Người nhận trả'}</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </TouchableOpacity>

                        <TextInput style={[styles.input, { borderBottomWidth: 0 }]} value={note} onChangeText={setNote} placeholder="Ghi chú lấy hàng" multiline />
                    </View>

                </ScrollView>

                <View style={styles.bottomDock}>
                    <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} disabled={loading}>
                        <Text style={styles.confirmBtnText}>{loading ? 'ĐANG XỬ LÝ...' : 'TẠO ĐƠN HÀNG'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            
            <SelectModal 
                visible={modalConfig.visible}
                title={modalConfig.title}
                data={modalConfig.data}
                onSelect={modalConfig.onSelect}
                onClose={() => setModalConfig({ ...modalConfig, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 90, paddingTop: 40, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    draftButton: { padding: 5 },
    draftText: { color: 'white', fontSize: 14, fontWeight: '600' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10, marginTop: 10, marginLeft: 5 },
    inputCard: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    input: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, marginBottom: 10, fontSize: 15 },
    selectBox: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    radioGroup: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
    radioBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    radioBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    radioText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
    radioTextActive: { color: COLORS.primary, fontWeight: 'bold' },
    bottomDock: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    confirmBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
    confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalItemText: { fontSize: 16, color: '#374151' }
});
