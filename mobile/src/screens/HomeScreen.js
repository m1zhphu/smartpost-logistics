import React, { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Platform
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { useQueue } from "../context/QueueContext";
import { useUser } from "../context/UserContext";
import GlobalChat from "../components/GlobalChat";
import NotificationModal from "../components/NotificationModal";

export default function HomeScreen({ navigation }) {
    const { user, roles, logout, isWarehouseStaff, unreadCount, toggleUserOnlineStatus } = useUser();
    const { clearQueue } = useQueue();
    const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const roleId = user?.role_id || roles?.[0]?.role_id;
    const isShipperRole = roleId === 4;
    const isPickupOperator = [1, 2, 3, 7].includes(roleId);

    const handleLogout = () => {
        Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: () => {
                    clearQueue();
                    logout();
                },
            },
        ]);
    };

    const handleFeaturePress = async (screenName) => {
        const userType = await AsyncStorage.getItem("user_type");
        if (userType === "employee") {
            Alert.alert(
                "Tính năng chưa phát triển",
                "Tính năng này đang được phát triển cho hệ thống Kho và sẽ sớm ra mắt."
            );
            return;
        }
        navigation.navigate(screenName);
    };

    const handleToggleOnline = () => {
        if (!isShipperRole) {
            return;
        }

        const nextStatus = !user?.is_online;
        const note = nextStatus ? "Bắt đầu ca làm" : "Kết thúc ca làm";

        Alert.alert("Trạng thái hoạt động", `Bạn có muốn ${nextStatus ? "bật" : "tắt"} online?`, [
            { text: "Hủy", style: "cancel" },
            {
                text: "Đồng ý",
                onPress: async () => {
                    try {
                        const { shipperService } = require("../services/shipper");
                        await shipperService.toggleAvailability(nextStatus, note);
                        toggleUserOnlineStatus(nextStatus);
                        Toast.show({ type: "success", text1: "Đã cập nhật trạng thái" });
                    } catch (error) {
                        Toast.show({ type: "error", text1: "Không thể cập nhật trạng thái" });
                    }
                },
            },
        ]);
    };

    // UI Component: Giống gridCard của màn Warehouse
    const MenuItem = ({ title, desc, icon, color, bgColor, badgeText, onPress }) => (
        <TouchableOpacity
            style={styles.gridCard}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={isMenuVisible || isNotifModalVisible}
        >
            <View style={[styles.cardBadge, { backgroundColor: bgColor }]}>
                <Text style={[styles.cardBadgeText, { color: color }]}>{badgeText}</Text>
            </View>
            <View style={[styles.gridIconBox, { backgroundColor: bgColor }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.gridCardTitle} numberOfLines={2}>
                {title}
            </Text>
            <Text style={styles.gridCardDesc} numberOfLines={1}>
                {desc}
            </Text>
        </TouchableOpacity>
    );

    const renderRoleMenus = () => {
        if (isPickupOperator && !isShipperRole) {
            return (
                <>
                    <View style={styles.rowWrapper}>
                        <MenuItem
                            title="Chờ điều phối" desc="Yêu cầu cần gán"
                            icon="git-network-outline" color="#0284C7" bgColor="#E0F2FE" badgeText="ĐIỀU PHỐI"
                            onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "pending" })}
                        />
                        <MenuItem
                            title="Hub xác nhận" desc="Xác nhận chuyến"
                            icon="business-outline" color="#10B981" bgColor="#D1FAE5" badgeText="ĐIỀU PHỐI"
                            onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "dispatch" })}
                        />
                    </View>
                    <View style={styles.rowWrapper}>
                        <MenuItem
                            title="Chờ gán bưu tá" desc="Phân bổ nhân sự"
                            icon="person-add-outline" color="#D97706" bgColor="#FEF3C7" badgeText="ĐIỀU PHỐI"
                            onPress={() => navigation.navigate("AdminPickupFlow", { initialTab: "assign" })}
                        />
                        <MenuItem
                            title="Tracking" desc="Tra cứu đơn hàng"
                            icon="search-outline" color="#8B5CF6" bgColor="#EDE9FE" badgeText="CÔNG CỤ"
                            onPress={() => handleFeaturePress("ShipperTracking")}
                        />
                    </View>
                </>
            );
        }

        return (
            <>
                <View style={styles.rowWrapper}>
                    <MenuItem
                        title="Đơn lấy hàng" desc="Danh sách cần lấy"
                        icon="cube-outline" color="#0284C7" bgColor="#E0F2FE" badgeText="NGHIỆP VỤ"
                        onPress={() => handleFeaturePress("ShipperPickupList")}
                    />
                    <MenuItem
                        title="Tự điều phối" desc="Nhận đơn quét mã"
                        icon="git-pull-request-outline" color="#10B981" bgColor="#D1FAE5" badgeText="NGHIỆP VỤ"
                        onPress={() => handleFeaturePress("ShipperSelfAssignPickup")}
                    />
                </View>
                <View style={styles.rowWrapper}>
                    <MenuItem
                        title="Giao hàng" desc="Danh sách cần giao"
                        icon="paper-plane-outline" color="#D97706" bgColor="#FEF3C7" badgeText="NGHIỆP VỤ"
                        onPress={() => handleFeaturePress("ShipperDeliveryList")}
                    />
                    <MenuItem
                        title="Tracking" desc="Tra cứu hành trình"
                        icon="search-outline" color="#8B5CF6" bgColor="#EDE9FE" badgeText="CÔNG CỤ"
                        onPress={() => handleFeaturePress("ShipperTracking")}
                    />
                </View>
            </>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header đồng bộ Warehouse UI */}
            <View style={styles.header}>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName}>{user?.full_name || user?.username || "Nhân viên"}</Text>

                    <TouchableOpacity onPress={handleToggleOnline} activeOpacity={isShipperRole ? 0.7 : 1} style={styles.roleBadge}>
                        <View
                            style={[
                                styles.roleDot,
                                {
                                    backgroundColor: isShipperRole
                                        ? user?.is_online
                                            ? "#10B981"
                                            : "#9CA3AF"
                                        : "#38BDF8",
                                },
                            ]}
                        />
                        <Text style={styles.roleText}>
                            {isShipperRole
                                ? user?.is_online
                                    ? "Đang Online"
                                    : "Đang Offline"
                                : "Điều phối pickup online"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 2 NÚT HEADER TÁCH RỜI CHUẨN MÀN WAREHOUSE */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setIsNotifModalVisible(true)}
                        style={styles.appleCircleBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications" size={20} color="#FFF" />
                        {unreadCount > 0 && (
                            <View style={styles.appleBadge}>
                                <Text style={styles.appleBadgeText}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setIsMenuVisible(true)}
                        style={[styles.appleCircleBtn, { marginLeft: 12 }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="options-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content & FlatList */}
            <View style={styles.content}>
                {renderRoleMenus()}
            </View>

            {/* FAB - Nút Camera cho Shipper */}
            {isShipperRole && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("ShipperCamera")} activeOpacity={0.8}>
                    <Ionicons name="camera" size={26} color="#FFF" />
                </TouchableOpacity>
            )}

            {/* KHU VỰC CHỨA CÁC MODAL */}
            <NotificationModal visible={isNotifModalVisible} onClose={() => setIsNotifModalVisible(false)} />

            {/* MODAL MENU CHỨC NĂNG */}
            <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
                <Pressable
                    style={styles.menuOverlay}
                    onPress={(e) => {
                        e.stopPropagation();
                        setIsMenuVisible(false);
                    }}
                >
                    <Pressable style={styles.dropdownMenu} onPress={(e) => e.stopPropagation()}>
                        {isWarehouseStaff() && (
                            <>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setIsMenuVisible(false);
                                        navigation.replace("WarehouseHome");
                                    }}
                                >
                                    <View style={styles.menuIconBox}>
                                        <Ionicons name="swap-horizontal-outline" size={20} color="#4B5563" />
                                    </View>
                                    <Text style={styles.menuText}>Giao diện Kho</Text>
                                </TouchableOpacity>
                                <View style={styles.menuDivider} />
                            </>
                        )}

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

// ----------------------------------------------------
// BỘ STYLE ĐƯỢC LẤY CHUẨN TỪ MÀN WAREHOUSEHomeScreen
// ----------------------------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 25,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: COLORS.primary || '#1B5E20',
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
    roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    roleText: { fontSize: Platform.OS === 'ios' ? 13 : 10, color: '#FFFFFF', fontWeight: '600' },

    appleCircleBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    appleBadge: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#EF4444',
        minWidth: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: COLORS.primary || '#1B5E20',
        paddingHorizontal: 4,
    },
    appleBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

    content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    rowWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },

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
        paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
    },
    cardBadgeText: { fontSize: Platform.OS === 'ios' ? 10 : 6, fontWeight: '800', letterSpacing: 0.5 },
    gridIconBox: {
        width: 52, height: 52, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12, marginTop: 8,
    },
    gridCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 4, lineHeight: 20, minHeight: 36 },
    gridCardDesc: { fontSize: Platform.OS === 'ios' ? 12 : 9, color: '#94A3B8', textAlign: 'center' },

    fab: {
        position: "absolute", bottom: 30, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: COLORS.primary || '#1B5E20',
        justifyContent: "center", alignItems: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 6,
        zIndex: 999,
    },

    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
});