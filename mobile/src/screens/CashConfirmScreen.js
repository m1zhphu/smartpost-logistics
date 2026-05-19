import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CashConfirmStyles from '../styles/CashConfirmStyles';
import { accountingService } from '../services/accountingService';
import { useUser } from '../context/UserContext';
import { isRouteAllowed } from '../utils/roleUtils';
import { COLORS } from '../constants/colors';

export default function CashConfirmScreen({ navigation }) {
    const { user } = useUser();
    const [shippers, setShippers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        if (!user.token) {
            setLoading(false);
            Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
        }

        setLoading(true);
        try {
            const data = await accountingService.getCashConfirmationList(user.token);
            setShippers(Array.isArray(data) ? data : []);
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải danh sách chốt ca.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isRouteAllowed(user, 'CashConfirm')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            return;
        }
        fetchData();
    }, [user.token]);

    const executeConfirm = async (shipper) => {
        setSubmitting(true);
        try {
            await accountingService.confirmShipperCash(user.token, shipper.waybill_codes || []);
            Alert.alert('Thành công', `Đã chốt ca nộp tiền cho ${shipper.shipper_name || 'shipper'}.`);
            fetchData();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Lỗi hệ thống khi chốt tiền.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmCash = (shipper) => {
        if (!shipper || !shipper.waybill_codes || shipper.waybill_codes.length === 0) {
            return;
        }

        Alert.alert(
            'Xác nhận thu tiền',
            `Bạn đã nhận đủ số tiền mặt ${(Number(shipper.expected_cod) || 0).toLocaleString('vi-VN')} đ từ ${shipper.shipper_name}?`,
            [
                { text: 'Hủy bỏ', style: 'cancel' },
                {
                    text: 'Xác nhận thu đủ',
                    style: 'destructive',
                    onPress: () => executeConfirm(shipper),
                },
            ]
        );
    };

    return (
        <View style={CashConfirmStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

            <View style={CashConfirmStyles.headerArea}>
                <View style={CashConfirmStyles.headerCircleDecoration} />

                <TouchableOpacity style={CashConfirmStyles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={CashConfirmStyles.headerTitle}>Chốt Ca Nộp Tiền</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
            ) : (
                <View style={CashConfirmStyles.listContainer}>
                    <FlatList
                        data={shippers}
                        keyExtractor={(item, index) => {
                            return item && item.shipper_id ? String(item.shipper_id) : String(index);
                        }}
                        contentContainerStyle={CashConfirmStyles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={CashConfirmStyles.card}>
                                <View style={CashConfirmStyles.cardHeader}>
                                    <View style={CashConfirmStyles.cardHeaderLeft}>
                                        <View style={CashConfirmStyles.avatar}>
                                            <Ionicons name="person" size={20} color={COLORS.primary} />
                                        </View>
                                        <Text style={CashConfirmStyles.shipperName}>{item.shipper_name}</Text>
                                    </View>

                                    <View style={CashConfirmStyles.badgeCount}>
                                        <Text style={CashConfirmStyles.badgeText}>
                                            {item.delivered_count || 0} đơn
                                        </Text>
                                    </View>
                                </View>

                                <View style={CashConfirmStyles.cardBody}>
                                    <Text style={CashConfirmStyles.label}>Tổng tiền mặt cần nộp</Text>
                                    <View style={CashConfirmStyles.codAmountRow}>
                                        <Text style={CashConfirmStyles.codAmount}>
                                            {(Number(item.expected_cod) || 0).toLocaleString('vi-VN')}
                                        </Text>
                                        <Text style={CashConfirmStyles.codCurrency}>đ</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        CashConfirmStyles.confirmBtn,
                                        submitting && CashConfirmStyles.confirmBtnDisabled,
                                    ]}
                                    disabled={submitting}
                                    onPress={() => handleConfirmCash(item)}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                                    <Text style={CashConfirmStyles.btnText}>XÁC NHẬN ĐÃ THU</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={CashConfirmStyles.emptyContainer}>
                                <Ionicons name="checkmark-done-circle" size={76} color={COLORS.secondary} />
                                <Text style={CashConfirmStyles.emptyText}>
                                    Tất cả shipper đã nộp đủ tiền COD.
                                </Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
}
