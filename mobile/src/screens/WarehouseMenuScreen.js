import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { getRoleKey, getRoleLabel, roleRouteGroups, isRouteAllowed } from '../utils/roleUtils';
import { waybillService } from '../services/waybillService';
import { accountingService } from '../services/accountingService';
import { COLORS } from '../constants/colors';
import styles from '../styles/WarehouseMenuStyles';

export default function WarehouseMenuScreen({ navigation }) {
    const { user } = useUser();
    const isFocused = useIsFocused();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ todayOrders: 0, inHubInventory: 0, pendingCodTotal: 0, pendingShippers: 0 });
    const roleKey = getRoleKey(user);
    const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;

    const mainFunctions = [
        { id: 'CreateWaybill', title: 'Tạo vận đơn', sub: 'Tạo mới đơn hàng', icon: 'add', color: COLORS.blueAccent, bg: COLORS.blueAccentBg },
        { id: 'ScanInHub', title: 'Nhập kho', sub: 'Quét nhận hàng vào', icon: 'log-in', color: COLORS.white, bg: COLORS.primary },
        { id: 'ScanBagging', title: 'Đóng túi', sub: 'Đóng gói vận chuyển', icon: 'briefcase-outline', color: COLORS.amberAccent, bg: COLORS.amberAccentBg },
        { id: 'ScanManifestLoad', title: 'Bốc lên xe', sub: 'Load manifest xuất', icon: 'swap-horizontal', color: COLORS.successAccent, bg: COLORS.successBg },
    ];

    const otherFunctions = [
        { id: 'ScanManifestUnload', title: 'Gỡ xuống xe', sub: 'Nhận hàng từ tài xế', icon: 'arrow-down', color: COLORS.blueAccent },
        { id: 'AssignShipper', title: 'Giao shipper', sub: 'Phân công giao hàng', icon: 'people-outline', color: COLORS.successAccent },
        { id: 'CashConfirm', title: 'Thu tiền COD', sub: 'Xác nhận thanh toán', icon: 'card-outline', color: COLORS.amberAccent },
        { id: 'WaybillList', title: 'DS vận đơn', sub: 'Tra cứu & Chỉnh sửa', icon: 'list', color: COLORS.slateText },
        { id: 'PricingRules', title: 'Cấu hình giá', sub: 'Quản lý bảng giá', icon: 'calculator', color: COLORS.purpleAccent },
        { id: 'StaffManagement', title: 'Quản lý nhân sự', sub: 'Nhân viên & Tài xế', icon: 'people-circle-outline', color: COLORS.purpleAccent },
        { id: 'HubManagement', title: 'Hệ thống bưu cục', sub: 'Quản trị mạng lưới', icon: 'business-outline', color: COLORS.dangerAccent },
        { id: 'AdminOperations', title: 'Quản trị hệ thống', sub: 'Quản trị hệ thống', icon: 'settings-outline', color: COLORS.slateText },
    ];

    const visibleMainFunctions = mainFunctions.filter((item) => allowedRoutes.includes(item.id));
    const visibleOtherFunctions = otherFunctions.filter((item) => allowedRoutes.includes(item.id));

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const hubIdFilter = user.role_id === 1 ? undefined : user.primary_hub_id;
            const startToday = new Date();
            startToday.setHours(0, 0, 0, 0);
            const endToday = new Date();
            endToday.setHours(23, 59, 59, 999);

            const [todayRes, inHubRes, cashList] = await Promise.all([
                waybillService.searchWaybills(user.token, { origin_hub_id: hubIdFilter, start_date: startToday.toISOString(), end_date: endToday.toISOString(), page: 1, size: 1 }),
                waybillService.searchWaybills(user.token, { status: 'IN_HUB', dest_hub_id: hubIdFilter, page: 1, size: 1 }),
                accountingService.getCashConfirmationList(user.token).catch(() => []),
            ]);

            const pendingCodTotal = Array.isArray(cashList)
                ? cashList.reduce((sum, item) => sum + Number(item.expected_cod || 0), 0)
                : 0;

            setStats({
                todayOrders: todayRes?.total || todayRes?.items?.length || 0,
                inHubInventory: inHubRes?.total || inHubRes?.items?.length || 0,
                pendingCodTotal,
                pendingShippers: Array.isArray(cashList) ? cashList.length : 0,
            });
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu bảng điều khiển.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isRouteAllowed(user, 'WarehouseMenu')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            return;
        }
        if (isFocused) {
            fetchDashboardData();
        }
    }, [isFocused, user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
            <View style={styles.mainHeader}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTopRow}>
                    <View style={styles.hubInfo}>
                        <View style={styles.hubIconWrap}>
                            <Ionicons name={roleKey === 'admin' ? 'globe' : 'home'} size={16} color={COLORS.primary} />
                        </View>
                        <Text style={styles.hubName}>
                            {roleKey === 'admin' ? 'Trung tâm toàn quốc' : `Bưu cục ${user.primary_hub_id || user.hub_id || 'N/A'}`}
                        </Text>
                    </View>
                </View>
                <Text style={styles.headerSubTitle}>VẬN HÀNH</Text>
                <Text style={styles.headerTitle}>{getRoleLabel(user)}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>HÔM NAY</Text>
                        {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.statValue}>{stats.todayOrders}</Text>}
                        <Text style={styles.statUnit}>vận đơn</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>TỒN KHO</Text>
                        {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.statValue}>{stats.inHubInventory}</Text>}
                        <Text style={styles.statUnit}>kiện</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>COD CHỜ</Text>
                        {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.statValue}>{stats.pendingShippers}</Text>}
                        <Text style={styles.statUnit}>shipper</Text>
                    </View>
                </View>
            </View>
            <FlatList
                data={visibleMainFunctions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                ListHeaderComponent={() => <Text style={styles.sectionTitle}>CHỨC NĂNG CHÍNH</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.mainCard, item.id === 'ScanInHub' && styles.mainCardPrimary]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(item.id)}
                    >
                        <View style={[styles.mainCardIconWrap, { backgroundColor: item.id === 'ScanInHub' ? 'rgba(255,255,255,0.2)' : item.bg }]}>
                            <Ionicons name={item.icon} size={24} color={item.color} />
                        </View>
                        <View style={styles.mainCardTextWrap}>
                            <Text style={[styles.mainCardTitle, item.id === 'ScanInHub' && { color: COLORS.white }]}>{item.title}</Text>
                            <Text style={[styles.mainCardSub, item.id === 'ScanInHub' && { color: 'rgba(255,255,255,0.8)' }]}>{item.sub}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={() => (
                    <View>
                        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>THAO TÁC KHÁC</Text>
                        {visibleOtherFunctions.length > 0 ? visibleOtherFunctions.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.listItem, index === visibleOtherFunctions.length - 1 && { borderBottomWidth: 0 }]}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(item.id)}
                            >
                                <View style={[styles.listIconWrap, { backgroundColor: `${item.color}18` }]}>
                                    <Ionicons name={item.icon} size={20} color={item.color} />
                                </View>
                                <View style={styles.listTextWrap}>
                                    <Text style={styles.listTitle}>{item.title}</Text>
                                    <Text style={styles.listSub}>{item.sub}</Text>
                                </View>
                                {item.id === 'CashConfirm' && stats.pendingShippers > 0 && (
                                    <View style={styles.badge}><Text style={styles.badgeText}>{stats.pendingShippers} ca</Text></View>
                                )}
                                <Ionicons name="chevron-forward" size={20} color={COLORS.neutralMuted} />
                            </TouchableOpacity>
                        )) : (
                            <Text style={{ color: COLORS.neutralMuted, marginVertical: 12, paddingHorizontal: 16 }}>
                                Không có chức năng bổ sung cho vai trò hiện tại.
                            </Text>
                        )}
                    </View>
                )}
            />
        </View>
    );
}
