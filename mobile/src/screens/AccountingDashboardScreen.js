import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { isRouteAllowed } from '../utils/roleUtils';
import { accountingService } from '../services/accountingService';
import { COLORS } from '../constants/colors';
import styles from '../styles/AccountingDashboardStyles';

export default function AccountingDashboardScreen({ navigation }) {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!isRouteAllowed(user, 'AccountingDashboard')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            return;
        }
        fetchAccountingData();
    }, [user.token]);

    const fetchAccountingData = async () => {
        setLoading(true);
        try {
            const cashConfirmList = await accountingService.getCashConfirmationList(user.token);
            setPendingCount(Array.isArray(cashConfirmList) ? cashConfirmList.length : 0);
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu kế toán.');
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { id: 'CashConfirm', label: 'Xác nhận COD', icon: 'cash' },
        { id: 'ShopStatement', label: 'Báo cáo cửa hàng', icon: 'document-text' },
        { id: 'PricingRules', label: 'Quy tắc giá', icon: 'pricetag' },
        { id: 'WaybillList', label: 'Danh sách vận đơn', icon: 'list' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Bảng điều khiển</Text>
                <Text style={styles.headerSubtitle}>Theo dõi COD và báo cáo tài chính</Text>
            </View>

            {loading ? (
                <ActivityIndicator color={COLORS.secondary} size="large" style={styles.loading} />
            ) : (
                <FlatList
                    data={quickActions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Đơn COD đang chờ</Text>
                            <Text style={styles.summaryValue}>{pendingCount}</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity activeOpacity={0.8} style={styles.actionCard} onPress={() => navigation.navigate(item.id)}>
                            <View style={styles.iconWrap}>
                                <Ionicons name={item.icon} size={22} color={COLORS.secondary} />
                            </View>
                            <Text style={styles.actionLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textGray} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}