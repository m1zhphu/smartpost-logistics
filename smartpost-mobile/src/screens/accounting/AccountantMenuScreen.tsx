import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function AccountantMenuScreen({ navigation }: any) {
    const theme = useAppTheme();
    const styles = getStyles(theme);
    const user = useAuthStore((state: any) => state.user);

    const accFunctions = [
        { id: 'AccCash', title: 'Chốt ca Shipper', sub: 'Thu tiền COD & Phí', icon: 'wallet', color: theme.success, bg: theme.successBackground },
        { id: 'AccStatement', title: 'Đối soát Shop', sub: 'Tạo bảng kê, Excel', icon: 'document-text', color: theme.warning, bg: theme.warningBackground },
        { id: 'PricingRules', title: 'Cấu hình giá', sub: 'Quản lý bảng giá', icon: 'calculator', color: theme.secondary, bg: theme.secondaryBackground },
        { id: 'Customers', title: 'Công nợ Shop', sub: 'Lịch sử thanh toán', icon: 'business', color: theme.info, bg: theme.infoBackground },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

            {/* =========================================
          1. HEADER NỀN XANH (Chỉ chứa Avatar & Title)
      ========================================= */}
            <View style={styles.blueHeader}>
                <View style={styles.headerCircleDecoration} />
                <View style={styles.headerTopRow}>
                    <View>
                        <Text style={styles.headerSubTitle}>PHÒNG KẾ TOÁN</Text>
                        <Text style={styles.headerTitle}>Kế Toán Viên</Text>
                    </View>
                    <View style={styles.profileAvatar}>
                        <Text style={styles.avatarText}>
                            {(user?.fullName || user?.username || 'K').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* =========================================
          2. VÙNG CUỘN CHỨA CARD NỔI
      ========================================= */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* THẺ THỐNG KÊ (Nổi đè lên Header) */}
                <View style={styles.statsFloatingCard}>
                    <View style={styles.statBox}>
                        <View style={styles.statIconWrapSuccess}>
                            <Ionicons name="cash" size={20} color={theme.success} />
                        </View>
                        <Text style={styles.statLabel}>COD CHỜ THU</Text>
                        <Text style={styles.statValue}>12.5M</Text>
                        <Text style={styles.statUnit}>VNĐ</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statBox}>
                        <View style={styles.statIconWrapWarning}>
                            <Ionicons name="documents" size={20} color={theme.warning} />
                        </View>
                        <Text style={styles.statLabel}>BẢNG KÊ CHỜ</Text>
                        <Text style={styles.statValue}>45</Text>
                        <Text style={styles.statUnit}>Shop</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>NGHIỆP VỤ TÀI CHÍNH</Text>

                {/* LƯỚI MENU TÍNH NĂNG */}
                <View style={styles.grid}>
                    {accFunctions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.mainCard}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (item.id === 'AccCash' || item.id === 'AccStatement') {
                                    navigation.navigate(item.id);
                                } else {
                                    navigation.navigate(item.id);
                                }
                            }}
                        >
                            <View style={[styles.mainCardIconWrap, { backgroundColor: item.bg }]}>
                                <Ionicons name={item.icon as any} size={26} color={item.color} />
                            </View>
                            <Text style={styles.mainCardTitle}>{item.title}</Text>
                            <Text style={styles.mainCardSub}>{item.sub}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // Header
    blueHeader: {
        backgroundColor: theme.primary,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 70, // Để khoảng trống cho Card nổi đè lên
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1
    },
    headerCircleDecoration: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },

    profileAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    // ScrollView và Layout Card nổi
    scrollView: {
        flex: 1,
        marginTop: -40, // Kéo phần cuộn lên đè vào nền xanh
        zIndex: 10
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    statsFloatingCard: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 5 },
        borderWidth: 1,
        borderColor: theme.border
    },
    divider: { width: 1, backgroundColor: theme.border, marginHorizontal: 15 },
    statBox: { flex: 1, alignItems: 'center' },
    statIconWrapSuccess: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.successBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statIconWrapWarning: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.warningBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
    statValue: { color: theme.text, fontSize: 24, fontWeight: 'bold' },
    statUnit: { color: theme.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },

    // Grid Menu
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: theme.textSecondary, letterSpacing: 1, marginBottom: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    mainCard: {
        width: '48%',
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: theme.border
    },
    mainCardIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    mainCardTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 6 },
    mainCardSub: { fontSize: 12, color: theme.textSecondary, lineHeight: 18 },
});