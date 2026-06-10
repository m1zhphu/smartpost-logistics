import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { submitShipment } from '../services/shipmentService';
import styles from '../styles/CreateOrderStyles';
import { checkNetworkConnection } from '../utils/networkUtils';
import { COLORS } from '../constants/colors';
import { useQueue } from '../context/QueueContext';

export default function CreateOrderScreen({ route, navigation }) {
    const { senderData, receiverData, username, trackingNumber, queueId, bankBranch, unitCode } = route.params || {};

    const [rName, setRName] = useState(receiverData?.name || '');
    const [rPhone, setRPhone] = useState(receiverData?.phone || '');
    const [rAddress, setRAddress] = useState(receiverData?.address || '');


    const [sName, setSName] = useState(senderData?.name || '');
    const [sPhone, setSPhone] = useState(senderData?.phone || '');
    const [sAddress, setSAddress] = useState(senderData?.address || '');

    const [loading, setLoading] = useState(false);
    const [bank_branch, setBank_Branch] = useState(bankBranch || '');
    const [unit_code, setUnit_Code] = useState(unitCode || '');

    const [trackingCode, setTrackingCode] = useState(trackingNumber || '');
    const [actualWeight, setActualWeight] = useState('');
    const [codAmount, setCodAmount] = useState('0');
    const [shippingFee, setShippingFee] = useState('');
    const [serviceType, setServiceType] = useState('STANDARD');
    const [productName, setProductName] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');

    const scrollViewRef = useRef(null);
    const [senderCardY, setSenderCardY] = useState(0);
    const [receiverCardY, setReceiverCardY] = useState(0);

    const { removeQueueItem } = useQueue();

    // const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;

    const handleConfirm = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        if (!trackingCode || trackingCode.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Mã vận đơn không được để trống' });
            return;
        }

        if (!rName || rName.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Tên người nhận' });
            return;
        }

        if (!rPhone || rPhone.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập SĐT người nhận' });
            return;
        }

        if (!rAddress || rAddress.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Địa chỉ người nhận' });
            return;
        }

        if (!sName || sName.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Tên người gửi' });
            return;
        }

        if (!sPhone || sPhone.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập SĐT người gửi' });
            return;
        }

        if (!sAddress || sAddress.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Địa chỉ người gửi' });
            return;
        }

        if (!productName || productName.trim() === "") {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Tên hàng hóa' });
            return;
        }

        if (!actualWeight || parseFloat(actualWeight) <= 0) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Trọng lượng (kg) > 0' });
            return;
        }

        if (!shippingFee || parseFloat(shippingFee) <= 0) {
            Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng nhập Phí vận chuyển (VNĐ) > 0' });
            return;
        }

        const payload = {
            waybill_code: trackingCode.trim(),
            sender_name: sName?.trim(),
            sender_phone: sPhone?.trim(),
            sender_address: sAddress?.trim(),
            receiver_name: rName.trim(),
            receiver_phone: rPhone.trim(),
            receiver_address: rAddress.trim(),
            actual_weight: parseFloat(actualWeight),
            cod_amount: parseFloat(codAmount) || 0,
            shipping_fee: parseFloat(shippingFee),
            service_type: serviceType,
            product_name: productName.trim(),
            length: length ? parseFloat(length) : null,
            width: width ? parseFloat(width) : null,
            height: height ? parseFloat(height) : null,
            payment_method: "SENDER_PAY",
            bank_branch: bank_branch.trim(),
            unit_code: unit_code.trim()
        };

        setLoading(true);
        try {
            const result = await submitShipment(payload);

            if (result.success) {
                if (queueId) {
                    removeQueueItem(queueId);
                }
                navigation.navigate('Success', {
                    trackingNumber: result.data?.waybill_code || payload.waybill_code,
                });
            } else {
                if (result.isDuplicate) {
                    Toast.show({
                        type: 'error',
                        text1: 'Trùng mã vận đơn!',
                        text2: `${payload.waybill_code} đã tồn tại trên hệ thống`,
                        visibilityTime: 4000
                    });
                } else {
                    Toast.show({ type: 'error', text1: 'Gửi thất bại', text2: result.message || 'Lỗi không xác định. Vui lòng thử lại' });
                }
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi tạo đơn',
                text2: error.message
            });
        } finally {
            setLoading(false);
        }
    }


    const handleFocusSenderAddress = () => {
        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: senderCardY - 20, animated: true });
            }
        }, 250);
    };


    const handleFocusSenderName = () => {
        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: senderCardY - 20, animated: true });
            }
        }, 250);
    };

    const handleFocusReceiverName = () => {
        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                    y: receiverCardY - 20,
                    animated: true
                });
            }
        }, 250);
    };


    const handleFocusReceiverAddress = () => {
        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                    y: receiverCardY - 20,
                    animated: true
                });
            }
        }, 250);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xác nhận đơn hàng</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false} ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 150 }} >

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="qr-code-outline" size={24} color={COLORS.secondary} />
                            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>MÃ VẬN ĐƠN</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, { fontWeight: 'bold', fontSize: 16, color: '#333' }]}
                                    value={trackingCode}
                                    onChangeText={setTrackingCode}
                                    placeholder="Nhập mã đơn hàng"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.connectorContainer}>
                        <View style={styles.dottedLine} />
                        <Ionicons name="chevron-down-circle" size={20} color={COLORS.secondary} style={styles.connectorIcon} />
                    </View>


                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="business-outline" size={24} color={COLORS.secondary} />
                            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>THÔNG TIN ĐƠN VỊ</Text>
                        </View>
                        <View style={styles.cardBody}>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="briefcase-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={bank_branch}
                                    onChangeText={setBank_Branch}
                                    placeholder="Ngân hàng / Chi nhánh"
                                    placeholderTextColor="#666"
                                    multiline
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="pricetag-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={unit_code}
                                    onChangeText={setUnit_Code}
                                    placeholder="Mã đơn vị"
                                    placeholderTextColor="#666"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.connectorContainer}>
                        <View style={styles.dottedLine} />
                        <Ionicons name="chevron-down-circle" size={20} color={COLORS.secondary} style={styles.connectorIcon} />
                    </View>


                    <View style={[styles.card, styles.activeCard]} onLayout={(event) => {
                        const layout = event.nativeEvent.layout;
                        setSenderCardY(layout.y);
                    }}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="arrow-up-circle" size={24} color={COLORS.secondary} />
                            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>NGƯỜI GỬI</Text>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={[styles.inputWrapper, { height: 'auto', paddingVertical: 10, alignItems: 'flex-start' }]}>
                                <Ionicons name="person-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10, marginTop: 2 }} />
                                <TextInput
                                    style={[styles.input, { minHeight: 20 }]}
                                    value={sName}
                                    onChangeText={setSName}
                                    placeholder="Họ tên người gửi"
                                    placeholderTextColor="#666"
                                    multiline
                                    onFocus={Platform.OS === 'ios' ? handleFocusSenderName : undefined}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={sPhone}
                                    onChangeText={setSPhone}
                                    placeholder="Số điện thoại"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={[styles.inputWrapper, { height: 'auto', paddingVertical: 10, alignItems: 'flex-start' }]}>
                                <Ionicons name="location-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10, marginTop: 2 }} />
                                <TextInput
                                    style={[styles.input, { minHeight: 50 }]}
                                    value={sAddress}
                                    onChangeText={setSAddress}
                                    placeholder="Địa chỉ gửi hàng"
                                    placeholderTextColor="#666"
                                    multiline
                                    onFocus={Platform.OS === 'ios' ? handleFocusSenderAddress : undefined}

                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.connectorContainer}>
                        <View style={styles.dottedLine} />
                        <Ionicons name="chevron-down-circle" size={20} color={COLORS.secondary} style={styles.connectorIcon} />
                    </View>

                    <View
                        style={[styles.card, styles.activeCard]}
                        onLayout={(event) => {
                            const layout = event.nativeEvent.layout;
                            setReceiverCardY(layout.y);
                        }}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="arrow-down-circle" size={24} color={COLORS.secondary} />
                            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>NGƯỜI NHẬN</Text>
                        </View>



                        <View style={styles.cardBody}>
                            <View style={[styles.inputWrapper, { height: 'auto', paddingVertical: 10, alignItems: 'flex-start' }]}>
                                <Ionicons name="person-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10, marginTop: 2 }} />
                                <TextInput
                                    style={[styles.input, { minHeight: 20 }]}
                                    value={rName}
                                    onChangeText={setRName}
                                    placeholder="Họ tên người nhận"
                                    placeholderTextColor="#666"
                                    multiline
                                    onFocus={Platform.OS === 'ios' ? handleFocusReceiverName : undefined}

                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={rPhone}
                                    onChangeText={setRPhone}
                                    placeholder="Số điện thoại"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={[styles.inputWrapper, { height: 'auto', paddingVertical: 10, alignItems: 'flex-start' }]}>
                                <Ionicons name="location-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10, marginTop: 2 }} />
                                <TextInput
                                    style={[styles.input, { minHeight: 50 }]}
                                    value={rAddress}
                                    onChangeText={setRAddress}
                                    placeholder="Địa chỉ giao hàng"
                                    placeholderTextColor="#666"
                                    multiline
                                    onFocus={Platform.OS === 'ios' ? handleFocusReceiverAddress : undefined}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.connectorContainer}>
                        <View style={styles.dottedLine} />
                        <Ionicons name="chevron-down-circle" size={20} color={COLORS.secondary} style={styles.connectorIcon} />
                    </View>

                    <View style={[styles.card, styles.activeCard]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="cube-outline" size={24} color={COLORS.secondary} />
                            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>THÔNG TIN HÀNG HÓA</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="pricetag-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={productName}
                                    onChangeText={setProductName}
                                    placeholder="Tên hàng hóa (*)"
                                    placeholderTextColor="#666"
                                />
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={[styles.inputWrapper, { flex: 1, marginRight: 5 }]}>
                                    <Ionicons name="scale-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.input}
                                        value={actualWeight}
                                        onChangeText={setActualWeight}
                                        placeholder="Trọng lượng (kg) (*)"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.inputWrapper, { flex: 1, marginLeft: 5 }]}>
                                    <Ionicons name="cash-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.input}
                                        value={codAmount}
                                        onChangeText={setCodAmount}
                                        placeholder="Thu hộ COD (VNĐ)"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="card-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={shippingFee}
                                    onChangeText={setShippingFee}
                                    placeholder="Phí vận chuyển (VNĐ) (*)"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <View style={[styles.inputWrapper, { flex: 1, marginRight: 5 }]}>
                                    <TextInput style={styles.input} value={length} onChangeText={setLength} placeholder="Dài (cm)" placeholderTextColor="#666" keyboardType="numeric" />
                                </View>
                                <View style={[styles.inputWrapper, { flex: 1, marginHorizontal: 5 }]}>
                                    <TextInput style={styles.input} value={width} onChangeText={setWidth} placeholder="Rộng (cm)" placeholderTextColor="#666" keyboardType="numeric" />
                                </View>
                                <View style={[styles.inputWrapper, { flex: 1, marginLeft: 5 }]}>
                                    <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="Cao (cm)" placeholderTextColor="#666" keyboardType="numeric" />
                                </View>
                            </View>
                        </View>
                    </View>


                    <View style={{ height: 100 }} />
                </ScrollView>

                <View style={styles.bottomDock}>
                    <TouchableOpacity
                        style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                        onPress={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.confirmBtnText}>ĐANG XỬ LÝ...</Text>
                        ) : (
                            <>
                                <Text style={styles.confirmBtnText}>XÁC NHẬN TẠO ĐƠN</Text>
                                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
