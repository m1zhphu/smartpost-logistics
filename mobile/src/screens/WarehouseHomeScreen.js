import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Platform, Alert, ActivityIndicator, RefreshControl, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';
import { useQueue } from '../context/QueueContext';
import { vehicleService } from '../services/vehicle';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService } from '../services/notification';
import GlobalChat from '../components/GlobalChat';
import NotificationModal from '../components/NotificationModal';
import { checkNetworkConnectionWithoutToast } from '../utils/networkUtils';

// Mảng định nghĩa các nghiệp vụ.
const ALL_ACTIONS = [
    { id: 'VIP_IMPORT_NEW', mode: 'VIP', perm: 'FUNC_VIP_NHAP_MOI', title: 'Nhập Hàng Mới', desc: 'Nhập thiết bị mới', icon: 'download-outline' },
    { id: 'VIP_EXPORT_NEW', mode: 'VIP', perm: 'FUNC_VIP_XUAT_MOI', title: 'Giao Hàng Mới', desc: 'Xuất kho giao cho khách', icon: 'push-outline' },
    { id: 'VIP_IMPORT_OLD', mode: 'VIP', perm: 'FUNC_VIP_NHAP_CU', title: 'Nhập Hàng Cũ', desc: 'Nhập lại hàng cũ', icon: 'refresh-outline' },
    { id: 'VIP_EXPORT_OLD', mode: 'VIP', perm: 'FUNC_VIP_XUAT_CU', title: 'Giao Hàng Cũ', desc: 'Xuất hàng cũ', icon: 'return-up-back-outline' },

    { id: 'THUONG_IMPORT', mode: 'THUONG', perm: 'FUNC_THUONG_NHAP', title: 'Nhập Theo Sản Phẩm', desc: 'Gửi hàng thường', icon: 'cube-outline' },
    { id: 'THUONG_EXPORT', mode: 'THUONG', perm: 'FUNC_THUONG_XUAT', title: 'Giao Hàng Thường', desc: 'Xuất hàng thường', icon: 'open-outline' },

    { id: 'NOIBO_EXPORT', mode: 'NỘI BỘ', perm: ['FUNC_VIP_XUAT_MOI', 'FUNC_THUONG_XUAT'], title: 'Xuất Nội Bộ', desc: 'Chuyển hàng nội bộ', icon: 'return-up-forward-outline' },
    { id: 'NOIBO_APPROVE', mode: 'NỘI BỘ', perm: null, title: 'Nhập Nội Bộ', desc: 'Tiếp nhận hàng luân chuyển', icon: 'checkmark-done-circle-outline' },
    { id: 'NOIBO_APPROVE_EXPORT', mode: 'NỘI BỘ', perm: null, title: 'Xuất Nội Bộ', desc: 'Duyệt xuất hàng luân chuyển', icon: 'checkmark-circle-outline' },
];

const MENU_TREE = [
    {
        id: 'CAT_NHAP_HANG',
        title: 'Nhập Hàng',
        icon: 'download-outline',
        color: '#0284C7',
        bgColor: '#E0F2FE',
        children: [
            {
                id: 'CAT_NHAP_HANG_VIP',
                title: 'Hàng TOSHIBA',
                icon: 'star-outline',
                color: '#D97706',
                bgColor: '#FEF3C7',
                children: ['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD']
            },
            'THUONG_IMPORT'
            // {
            //     id: 'CAT_NHAP_HANG_THUONG',
            //     title: 'Hàng Nội Bộ',
            //     icon: 'cube-outline',
            //     color: '#10B981',
            //     bgColor: '#D1FAE5',
            //     children: ['THUONG_IMPORT']
            // }
        ]
    },
    {
        id: 'CAT_XUAT_KHO',
        title: 'Xuất Kho',
        icon: 'push-outline',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        children: [
            'NOIBO_EXPORT',
            {
                id: 'CAT_XUAT_KHO_GIAOHANG',
                title: 'Giao Hàng',
                icon: 'paper-plane-outline',
                color: '#0284C7',
                bgColor: '#E0F2FE',
                children: [
                    {
                        id: 'CAT_XUAT_KHO_GIAOHANG_VIP',
                        title: 'Hàng TOSHIBA',
                        icon: 'star-outline',
                        color: '#D97706',
                        bgColor: '#FEF3C7',
                        children: ['VIP_EXPORT_NEW', 'VIP_EXPORT_OLD']
                    },
                    'THUONG_EXPORT'
                    // {
                    //     id: 'CAT_XUAT_KHO_GIAOHANG_THUONG',
                    //     title: 'Hàng Nội Bộ',
                    //     icon: 'cube-outline',
                    //     color: '#10B981',
                    //     bgColor: '#D1FAE5',
                    //     children: ['THUONG_EXPORT']
                    // }
                ]
            }
        ]
    },
    {
        id: 'CAT_DUYET_NOIBO',
        title: 'Nhập Xuất Nội Bộ',
        icon: 'checkmark-done-circle-outline',
        color: '#E11D48',
        bgColor: '#FFE4E6',
        children: ['NOIBO_APPROVE', 'NOIBO_APPROVE_EXPORT']
    }
];

const filterMenuTree = (nodes, availableIds) => {
    const result = [];
    for (const node of nodes) {
        if (typeof node === 'string') {
            if (availableIds.includes(node)) {
                result.push(node);
            }
        } else {
            const filteredChildren = filterMenuTree(node.children, availableIds);
            if (filteredChildren.length > 0) {
                result.push({ ...node, children: filteredChildren });
            }
        }
    }
    return result;
};

export default function WarehouseHomeScreen({ navigation }) {
    const { user, permissions, logout, clearUserVehicle, refreshProfile, unreadCount } = useUser();
    const { clearQueue } = useQueue();

    const [isReturning, setIsReturning] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const [navigationStack, setNavigationStack] = useState([]);

    useEffect(() => {
        setNavigationStack([]);
    }, [permissions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshProfile();
        setRefreshing(false);
    }, []);

    const availableActions = useMemo(() => {
        if (permissions.includes('FUNC_ADMIN_ALL')) return ALL_ACTIONS;

        return ALL_ACTIONS.filter(action => {
            if (action.id === 'NOIBO_APPROVE' || action.id === 'NOIBO_APPROVE_EXPORT') {
                return permissions.some(p => ['FUNC_TRUONG_KHO', 'FUNC_CUSTOMER_MGR'].includes(p));
            }
            if (action.id === 'NOIBO_EXPORT') {
                return Array.isArray(action.perm)
                    ? action.perm.some(p => permissions.includes(p))
                    : permissions.includes(action.perm);
            }
            return permissions.includes(action.perm);
        });
    }, [permissions]);

    const handleActionPress = (action) => {
        navigation.navigate('WarehouseAction', { actionConfig: action });
    };

    const filteredMenu = useMemo(() => {
        const availableActionIds = availableActions.map(a => a.id);
        return filterMenuTree(MENU_TREE, availableActionIds);
    }, [availableActions]);

    const currentNodes = navigationStack.length === 0 ? filteredMenu : navigationStack[navigationStack.length - 1].children;

    const handleNodePress = (node) => {
        if (typeof node === 'string') {
            const action = availableActions.find(a => a.id === node);
            handleActionPress(action);
        } else {
            setNavigationStack([...navigationStack, node]);
        }
    };

    const handleBreadcrumbPress = (index) => {
        if (index === -1) {
            setNavigationStack([]);
        } else {
            setNavigationStack(navigationStack.slice(0, index + 1));
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Xác nhận đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: () => { clearQueue(); logout() }
                }
            ]
        );
    };

    const handleReturnVehicle = () => {
        Alert.alert(
            "Xác nhận Trả Xe",
            `Bạn đã hoàn tất giao hàng và muốn trả xe [${user.bien_so_xe}] về kho?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Trả Xe",
                    style: "destructive",
                    onPress: async () => {
                        setIsReturning(true);
                        try {
                            await vehicleService.returnVehicle();
                            clearUserVehicle();
                            Toast.show({ type: 'success', text1: 'Chốt ca thành công', text2: 'Xe đã được trả về bãi.' });
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Lỗi', text2: error.response?.data?.detail || 'Không thể trả xe lúc này.' });
                        } finally {
                            setIsReturning(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName}>{user?.username || user?.full_name || 'Nhân viên Kho'}</Text>
                    <View style={styles.roleBadge}>
                        <View style={styles.roleDot} />
                        <Text style={styles.roleText}>Bộ phận Kho & Điều phối</Text>
                    </View>
                </View>

                {/* === 2 NÚT HEADER TÁCH RỜI CHUẨN HIỆN ĐẠI === */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    {/* 1. Nút Thông Báo */}
                    <TouchableOpacity
                        onPress={() => setIsNotifModalVisible(true)}
                        style={styles.appleCircleBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications" size={20} color="#FFF" />
                        {unreadCount > 0 && (
                            <View style={styles.appleBadge}>
                                <Text style={styles.appleBadgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 2. Nút Chức năng / Menu */}
                    <TouchableOpacity
                        onPress={() => setIsMenuVisible(true)}
                        style={[styles.appleCircleBtn, { marginLeft: 12 }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="options-outline" size={20} color="#FFF" />
                    </TouchableOpacity>

                </View>
            </View>

            {/* SMART BANNER */}
            {user?.bien_so_xe && (
                <View style={styles.activeShiftBanner}>
                    <View style={styles.shiftInfo}>
                        <Ionicons name="car-sport" size={26} color="#D97706" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.shiftTitle}>Đang mượn xe giao hàng</Text>
                            <Text style={styles.shiftPlate}>
                                Biển số: <Text style={{ fontWeight: '900', fontSize: 16 }}>{user.bien_so_xe}</Text>
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.returnBtn}
                        onPress={handleReturnVehicle}
                        disabled={isReturning}
                        activeOpacity={0.7}
                    >
                        {isReturning ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.returnBtnText}>TRẢ XE</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Content & FlatList */}
            <View style={styles.content}>
                {availableActions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="shield-half-outline" size={40} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyTitle}>Chưa được cấp quyền</Text>
                        <Text style={styles.emptyText}>Tài khoản của bạn hiện chưa được phân quyền thực hiện nghiệp vụ nào. Vui lòng liên hệ Quản lý.</Text>
                    </View>
                ) : (
                    <>
                        {navigationStack.length > 0 && (
                            <View style={styles.breadcrumbContainer}>
                                <View style={styles.breadcrumbPathWrapper}>
                                    <TouchableOpacity onPress={() => handleBreadcrumbPress(-1)} activeOpacity={0.6}>
                                        <Ionicons name="home-outline" size={16} color="#94A3B8" />
                                    </TouchableOpacity>
                                    <Ionicons name="chevron-forward-outline" size={14} color="#CBD5E1" style={styles.chevron} />
                                    {navigationStack.map((n, index) => {
                                        const isLast = index === navigationStack.length - 1;
                                        return (
                                            <React.Fragment key={n.id}>
                                                <TouchableOpacity
                                                    onPress={() => !isLast && handleBreadcrumbPress(index)}
                                                    disabled={isLast}
                                                    activeOpacity={0.6}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.breadcrumbTextItem,
                                                            isLast && styles.breadcrumbTextActive
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {n.title}
                                                    </Text>
                                                </TouchableOpacity>
                                                {!isLast && (
                                                    <Ionicons name="chevron-forward-outline" size={14} color="#CBD5E1" style={styles.chevron} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                        <FlatList
                            data={currentNodes}
                            keyExtractor={(item) => typeof item === 'string' ? item : item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContainer}
                            numColumns={2}
                            columnWrapperStyle={styles.rowWrapper}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7', '#10B981']} tintColor="#0284C7" />
                            }
                            renderItem={({ item }) => {
                                if (typeof item === 'string') {
                                    const action = availableActions.find(a => a.id === item);
                                    let primaryColor, lightBgColor;
                                    if (action.mode === 'VIP') {
                                        primaryColor = '#0284C7'; lightBgColor = '#E0F2FE';
                                    } else if (action.mode === 'THUONG') {
                                        if (action.id === 'THUONG_IMPORT') { primaryColor = '#10B981'; lightBgColor = '#D1FAE5'; }
                                        else if (action.id === 'THUONG_EXPORT') { primaryColor = '#059669'; lightBgColor = '#ECFDF5'; }
                                    } else if (action.mode === 'NỘI BỘ') {
                                        primaryColor = '#8B5CF6'; lightBgColor = '#EDE9FE';
                                    }

                                    return (
                                        <TouchableOpacity
                                            style={styles.gridCard}
                                            activeOpacity={0.7}
                                            disabled={isMenuVisible || isNotifModalVisible}
                                            onPress={() => handleNodePress(item)}
                                        >
                                            <View style={[styles.cardBadge, { backgroundColor: lightBgColor }]}>
                                                <Text style={[styles.cardBadgeText, { color: primaryColor }]}>{action.mode}</Text>
                                            </View>
                                            <View style={[styles.gridIconBox, { backgroundColor: lightBgColor }]}>
                                                <Ionicons name={action.icon} size={28} color={primaryColor} />
                                            </View>
                                            <Text style={styles.gridCardTitle} numberOfLines={2}>{action.title}</Text>
                                            <Text style={styles.gridCardDesc} numberOfLines={1}>{action.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        style={styles.gridCard}
                                        activeOpacity={0.7}
                                        disabled={isMenuVisible || isNotifModalVisible}
                                        onPress={() => handleNodePress(item)}
                                    >
                                        <View style={[styles.cardBadge, { backgroundColor: item.bgColor }]}>
                                            <Text style={[styles.cardBadgeText, { color: item.color }]}>Thư mục</Text>
                                        </View>
                                        <View style={[styles.gridIconBox, { backgroundColor: item.bgColor }]}>
                                            <Ionicons name={item.icon} size={28} color={item.color} />
                                        </View>
                                        <Text style={styles.gridCardTitle} numberOfLines={2}>{item.title}</Text>
                                        <Text style={styles.gridCardDesc} numberOfLines={1}>Nhấn để xem chi tiết</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </>
                )}
            </View>

            {/* ========================================================= */}
            {/* KHU VỰC CHỨA CÁC MODAL (POP-UP)                           */}
            {/* ========================================================= */}

            {/* MODAL 1: THÔNG BÁO */}
            <NotificationModal
                visible={isNotifModalVisible}
                onClose={() => setIsNotifModalVisible(false)}
            // onUpdateCount={(count) => setUnreadCount(count)}
            />

            {/* MODAL 2: MENU CHỨC NĂNG (GÓC PHẢI TRÊN) */}
            <Modal
                visible={isMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsMenuVisible(false)}
            >
                {/* Lớp nền mờ - Bấm vào sẽ tắt menu - StopPropagation chống click xuyên */}
                <Pressable
                    style={styles.menuOverlay}
                    onPress={(e) => {
                        e.stopPropagation();
                        setIsMenuVisible(false);
                    }}
                >
                    <Pressable style={styles.dropdownMenu} onPress={(e) => e.stopPropagation()}>

                        {/* Mục 1: Đổi giao diện */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setIsMenuVisible(false);
                                navigation.replace('ShipperCamera');
                            }}
                        >
                            <View style={styles.menuIconBox}>
                                <Ionicons name="swap-horizontal-outline" size={20} color="#4B5563" />
                            </View>
                            <Text style={styles.menuText}>Giao diện Tài xế</Text>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        {/* Mục 2: Đăng xuất */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setIsMenuVisible(false);
                                handleLogout();
                            }}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.menuText, { color: '#EF4444', fontWeight: '700' }]}>Đăng xuất</Text>
                        </TouchableOpacity>

                    </Pressable>
                </Pressable>
            </Modal>

            <GlobalChat />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 25,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 42, borderBottomRightRadius: 42,
        shadowColor: '#ebebeb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5,
        zIndex: 10
    },
    headerTextGroup: { flex: 1 },
    greeting: { fontSize: Platform.OS === 'ios' ? 14 : 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
    userName: { fontSize: Platform.OS === 'ios' ? 18 : 12, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 8 },

    roleBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
    roleText: { fontSize: Platform.OS === 'ios' ? 13 : 10, color: '#FFFFFF', fontWeight: '600' },

    // --- STYLES NÚT HEADER MỚI TÁCH RỜI ---
    appleCircleBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Kính mờ
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    appleBadge: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#EF4444',
        minWidth: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: COLORS.primary,
        paddingHorizontal: 4,
    },
    appleBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    // --- STYLES CHO MENU THẢ XUỐNG ---
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Nền mờ để chống bấm xuyên thấu
    },
    dropdownMenu: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 115 : 75,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: 220,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 16,
    },
    menuIconBox: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
    menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

    // --- CÁC THÀNH PHẦN KHÁC GIỮ NGUYÊN ---
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

    // --- BREADCRUMB STYLES ---
    breadcrumbContainer: {
        marginBottom: 16,
        paddingHorizontal: 2
    },
    breadcrumbPathWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    chevron: {
        marginHorizontal: 6,
    },
    breadcrumbTextItem: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500'
    },
    breadcrumbTextActive: {
        color: '#0F172A',
        fontWeight: '700'
    },
    listContainer: { paddingBottom: 40 },
    rowWrapper: { justifyContent: 'space-between', marginBottom: 16 },

    gridCard: {
        backgroundColor: '#FFFFFF',
        width: '48%',
        paddingVertical: 16, paddingHorizontal: 8,
        borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
        alignItems: 'center',
        shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardBadge: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
    },
    cardBadgeText: { fontSize: Platform.OS === 'ios' ? 10 : 6, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
    gridIconBox: {
        width: 52, height: 52, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12, marginTop: 8,
    },
    gridCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 4, lineHeight: 20, minHeight: 36 },
    gridCardDesc: { fontSize: Platform.OS === 'ios' ? 12 : 9, color: '#94A3B8', textAlign: 'center' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
    emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    emptyText: { textAlign: 'center', color: '#6B7280', paddingHorizontal: 30, lineHeight: 20 },

    activeShiftBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FEF3C7', marginHorizontal: 16, marginTop: 15, marginBottom: 5, padding: 14,
        borderRadius: 14, borderWidth: 1, borderColor: '#FDE68A',
        shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4, zIndex: 20,
    },
    shiftInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    shiftTitle: { fontSize: 12, color: '#D97706', fontWeight: '600', marginBottom: 2 },
    shiftPlate: { fontSize: 14, color: '#92400E' },
    returnBtn: {
        backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 10, minWidth: 85, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
    },
    returnBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
});