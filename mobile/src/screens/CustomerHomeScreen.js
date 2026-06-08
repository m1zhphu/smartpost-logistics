import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function CustomerHomeScreen({ navigation }) {
    const { user, logout } = useUser();

    const handleLogout = () => {
        Alert.alert(
            "Xác nhận đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: () => logout()
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
                    <Text style={styles.userName}>{user?.full_name || user?.username || 'Khách hàng'}</Text>
                    <View style={styles.roleBadge}>
                        <View style={styles.roleDot} />
                        <Text style={styles.roleText}>Khách hàng thành viên</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CustomerProfile')}
                        style={[styles.appleCircleBtn, { marginRight: 12 }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-outline" size={20} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {}}
                        style={styles.appleCircleBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications" size={20} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogout}
                        style={[styles.appleCircleBtn, { marginLeft: 12, backgroundColor: 'rgba(239, 68, 68, 0.8)' }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.quickActions}>
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('CustomerCreatePickup')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="add-circle" size={32} color="#0284c7" />
                        </View>
                        <Text style={styles.actionTitle}>Tạo Lấy Hàng</Text>
                        <Text style={styles.actionDesc}>Lên đơn, gọi shipper tới lấy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('CustomerPickupList')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="list" size={32} color="#d97706" />
                        </View>
                        <Text style={styles.actionTitle}>Đơn Lấy Hàng</Text>
                        <Text style={styles.actionDesc}>Quản lý trạng thái, lịch sử</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity 
                        style={[styles.actionCard, { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 20 }]}
                        onPress={() => navigation.navigate('CustomerTracking')}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#f3e8ff', marginBottom: 0, marginRight: 15 }]}>
                            <Ionicons name="search" size={32} color="#9333ea" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionTitle, { fontSize: 16 }]}>Tra cứu vận đơn</Text>
                            <Text style={[styles.actionDesc, { textAlign: 'left', fontSize: 13 }]}>Kiểm tra hành trình đơn hàng</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#ccc" />
                    </TouchableOpacity>
                </View>
                
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Dịch vụ khác</Text>
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="construct-outline" size={40} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyTitle}>Đang phát triển</Text>
                        <Text style={styles.emptyText}>Các tính năng khác sẽ sớm ra mắt.</Text>
                    </View>
                </View>
            </View>

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
    roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginRight: 6 },
    roleText: { fontSize: Platform.OS === 'ios' ? 13 : 10, color: '#FFFFFF', fontWeight: '600' },

    appleCircleBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },

    content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

    quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    actionCard: { 
        backgroundColor: 'white', width: '48%', padding: 15, borderRadius: 16, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
        alignItems: 'center'
    },
    iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    actionDesc: { fontSize: 12, color: '#666', textAlign: 'center' },

    emptyState: { justifyContent: 'center', alignItems: 'center', marginTop: 10, padding: 30, backgroundColor: 'white', borderRadius: 16 },
    emptyIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    emptyText: { textAlign: 'center', color: '#6B7280', fontSize: 13, lineHeight: 20 },
});
