import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
    KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
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

    const scrollViewRef = useRef(null);
    const [senderCardY, setSenderCardY] = useState(0);

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

        const payload = {
            username: username,
            sender: {
                name: sName?.trim(),
                phone: sPhone?.trim(),
                address: sAddress?.trim()
            },
            receiver: {
                name: rName.trim(),
                phone: rPhone.trim(),
                address: rAddress.trim()
            },
            tracking_number: trackingCode.trim(),
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
                    trackingNumber: payload.tracking_number,
                });
            } else {
                if (result.isDuplicate) {
                    Toast.show({
                        type: 'error',
                        text1: 'Trùng mã vận đơn!',
                        text2: `${payload.tracking_number} đã tồn tại trên hệ thống`,
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
        }, 100);
    };

    const handleFocusReceiverAddress = () => {
        setTimeout(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: true });
            }
        }, 100);
    };

    return (
        <View style={styles.container}>

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
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={sName}
                                    onChangeText={setSName}
                                    placeholder="Họ tên người gửi"
                                    placeholderTextColor="#666"
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
                                    onFocus={handleFocusSenderAddress}
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
                            <Ionicons name="arrow-down-circle" size={24} color={COLORS.secondary} />
                            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>NGƯỜI NHẬN</Text>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    value={rName}
                                    onChangeText={setRName}
                                    placeholder="Họ tên người nhận"
                                    placeholderTextColor="#666"
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
                                    onFocus={handleFocusReceiverAddress}
                                />
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
            <Toast />
        </View>
    );
}
