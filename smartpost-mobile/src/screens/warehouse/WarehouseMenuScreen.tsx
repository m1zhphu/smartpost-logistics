import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { waybillService } from '../../api/services/waybillService';
import { accountingService } from '../../api/services/accountingService';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function WarehouseMenuScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const [activeTab, setActiveTab] = useState('Nghiệp vụ');
  const user = useAuthStore((state: any) => state.user);
  const userRole = user?.roleId || 3;
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ todayOrders: 0, inHubInventory: 0, pendingCodTotal: 0, pendingShippersCount: 0 });

  // 🚀 Đưa danh sách Menu vào trong Component để nhận diện theme
  const mainFunctions = [
    { id: 'CreateWaybill', title: 'Tạo vận đơn', sub: 'Tạo mới đơn hàng', icon: 'add', color: '#3B82F6', isPrimary: false, allowedRoles: [1, 2] },
    { id: 'ScanInHub', title: 'Nhập kho', sub: 'Quét nhận hàng vào', icon: 'log-in', color: '#FFF', bg: theme.primary, isPrimary: true, allowedRoles: [1, 2, 3] },
    { id: 'ScanBagging', title: 'Đóng túi', sub: 'Đóng gói vận chuyển', icon: 'briefcase-outline', color: theme.warning, isPrimary: false, allowedRoles: [1, 2, 3] },
    { id: 'ScanManifestLoad', title: 'Bốc lên xe', sub: 'Load manifest xuất', icon: 'swap-horizontal', color: theme.success, isPrimary: false, allowedRoles: [1, 2, 3] },
  ];

  const otherFunctions = [
    { id: 'ScanManifestUnload', title: 'Gỡ xuống xe', sub: 'Nhận hàng từ tài xế', icon: 'arrow-down', color: '#3B82F6', allowedRoles: [1, 2, 3] },
    { id: 'AssignShipper', title: 'Giao shipper', sub: 'Phân công giao hàng', icon: 'people-outline', color: theme.success, allowedRoles: [1, 2] },
    { id: 'CashConfirm', title: 'Thu tiền COD', sub: 'Xác nhận thanh toán', icon: 'card-outline', color: theme.warning, allowedRoles: [1, 2, 5] },
    { id: 'WaybillList', title: 'DS vận đơn', sub: 'Tra cứu & Chỉnh sửa', icon: 'list', color: theme.textSecondary, allowedRoles: [1, 2, 3] },
    { id: 'PricingRules', title: 'Cấu hình giá', sub: 'Quản lý bảng giá', icon: 'calculator', color: '#8B5CF6', allowedRoles: [1, 2] },
    { id: 'StaffManagement', title: 'Quản lý nhân sự', sub: 'Nhân viên & Tài xế', icon: 'people-circle-outline', color: '#8B5CF6', allowedRoles: [1, 2] },
    { id: 'HubManagement', title: 'Hệ thống bưu cục', sub: 'Quản trị mạng lưới', icon: 'business-outline', color: theme.danger, allowedRoles: [1] },
    { id: 'AdminOperations', title: 'Quản trị hệ thống', sub: 'Quản trị hệ thống', icon: 'settings-outline', color: theme.textSecondary, allowedRoles: [1] },
  ];

  // Load Dữ liệu Thống kê Realtime
  const fetchDashboardData = async () => {
    try {
      const hubIdFilter = userRole === 1 ? undefined : user?.primary_hub_id;
      const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(); endToday.setHours(23, 59, 59, 999);

      const [resToday, resInHub, resCod] = await Promise.all([
        waybillService.searchWaybills({ origin_hub_id: hubIdFilter, start_date: startToday.toISOString(), end_date: endToday.toISOString(), page: 1, size: 1 }),
        waybillService.searchWaybills({ status: 'IN_HUB', dest_hub_id: hubIdFilter, page: 1, size: 1 }),
        userRole in [1, 2, 5] ? accountingService.getCashConfirmationList() : Promise.resolve([])
      ]);

      let totalCod = 0;
      if (resCod && Array.isArray(resCod)) {
        resCod.forEach((item: any) => { totalCod += Number(item.expected_cod) || 0; });
      }

      setStats({
        todayOrders: resToday.total || resToday.items?.length || 0,
        inHubInventory: resInHub.total || resInHub.items?.length || 0,
        pendingCodTotal: totalCod,
        pendingShippersCount: resCod?.length || 0
      });
    } catch (error) { console.log("Lỗi load Dashboard:", error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (isFocused) fetchDashboardData(); }, [isFocused]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboardData(); }, []);

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
  };

  // Lọc quyền hiển thị
  const visibleMainFuncs = mainFunctions.filter(item => item.allowedRoles.includes(userRole));
  const visibleOtherFuncs = otherFunctions.filter(item => item.allowedRoles.includes(userRole));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}>

        {/* HEADER & THỐNG KÊ */}
        <View style={styles.mainHeader}>
          <View style={styles.headerCircleDecoration} />

          <View style={styles.headerTopRow}>
            <View style={styles.hubInfo}>
              <View style={styles.hubIconWrap}><Ionicons name={userRole === 1 ? "globe" : "home"} size={16} color={theme.primary} /></View>
              <Text style={styles.hubName}>{userRole === 1 ? 'Trung Tâm Toàn Quốc' : `Bưu Cục ${user?.hubId || 'N/A'}`}</Text>
            </View>
            <TouchableOpacity style={styles.profileAvatar} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSubTitle}>VẬN HÀNH</Text>
          <Text style={styles.headerTitle}>{userRole === 1 ? 'Quản Trị Hệ Thống' : userRole === 2 ? 'Quản Lý Bưu Cục' : 'Nhân Viên Kho'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>HÔM NAY</Text>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.statValue}>{stats.todayOrders}</Text>}
              <Text style={styles.statUnit}>vận đơn</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TỒN KHO</Text>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.statValue}>{stats.inHubInventory}</Text>}
              <Text style={styles.statUnit}>kiện</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>COD CHỜ</Text>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.statValue}>{formatMoney(stats.pendingCodTotal)}</Text>}
              <Text style={styles.statUnit}>VNĐ</Text>
            </View>
          </View>
        </View>

        {/* THANH TABS */}
        <View style={styles.tabContainerWrapper}>
          <View style={styles.tabContainer}>
            {['Nghiệp vụ', 'Báo cáo', 'Cài đặt'].map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {activeTab === 'Nghiệp vụ' && (
          <>
            {/* CHỨC NĂNG CHÍNH (GRID 2x2) */}
            {visibleMainFuncs.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>CHỨC NĂNG CHÍNH</Text>
                <View style={styles.grid}>
                  {visibleMainFuncs.map((item) => (
                    <TouchableOpacity key={item.id} style={[styles.mainCard, item.isPrimary && styles.mainCardPrimary]} activeOpacity={0.7} onPress={() => navigation.navigate(item.id)}>
                      <View style={[styles.cardCircleDecoration, item.isPrimary ? { backgroundColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: 'rgba(0,0,0,0.02)' }]} />
                      <View style={[styles.mainCardIconWrap, item.isPrimary ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon as any} size={24} color={item.color} />
                      </View>
                      <View style={styles.mainCardTextWrap}>
                        <Text style={[styles.mainCardTitle, item.isPrimary && { color: '#FFF' }]}>{item.title}</Text>
                        <Text style={[styles.mainCardSub, item.isPrimary && { color: 'rgba(255,255,255,0.8)' }]}>{item.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* THAO TÁC KHÁC (LIST 1 CỘT) */}
            {visibleOtherFuncs.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>THAO TÁC KHÁC</Text>
                <View style={styles.listContainer}>
                  {visibleOtherFuncs.map((item, index) => (
                    <TouchableOpacity key={item.id} style={[styles.listItem, index === visibleOtherFuncs.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => navigation.navigate(item.id)}>
                      <View style={[styles.listIconWrap, { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <View style={styles.listTextWrap}>
                        <Text style={styles.listTitle}>{item.title}</Text>
                        <Text style={styles.listSub}>{item.sub}</Text>
                      </View>
                      {item.id === 'CashConfirm' && stats.pendingShippersCount > 0 && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{stats.pendingShippersCount} ca</Text></View>
                      )}
                      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {activeTab !== 'Nghiệp vụ' && (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="construct-outline" size={60} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, marginTop: 10, fontSize: 16 }}>Tính năng đang phát triển</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  mainHeader: { backgroundColor: theme.primary, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, position: 'relative', overflow: 'hidden' },
  headerCircleDecoration: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  hubInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  hubIconWrap: { backgroundColor: '#FFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  hubName: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  headerSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  headerTitle: { color: '#FFF', fontSize: 32, fontWeight: '300', marginBottom: 25 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12, marginHorizontal: 4 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  statUnit: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  tabContainerWrapper: { alignItems: 'center', marginTop: -25, marginBottom: 20, zIndex: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: theme.card, padding: 5, borderRadius: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, width: '90%' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 25 },
  tabButtonActive: { backgroundColor: theme.primary },
  tabText: { fontSize: 15, color: theme.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#FFF', fontWeight: 'bold' },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: theme.textSecondary, letterSpacing: 1, marginBottom: 15 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mainCard: { width: '48%', backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 15, minHeight: 140, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, overflow: 'hidden' },
  mainCardPrimary: { backgroundColor: theme.primary },
  cardCircleDecoration: { position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: 40 },
  mainCardIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mainCardTextWrap: { flex: 1, justifyContent: 'flex-end' },
  mainCardTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
  mainCardSub: { fontSize: 12, color: theme.textMuted },

  listContainer: { backgroundColor: theme.card, borderRadius: 20, paddingHorizontal: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  listIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  listTextWrap: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 3 },
  listSub: { fontSize: 13, color: theme.textMuted },
  badge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  badgeText: { color: theme.warning, fontSize: 12, fontWeight: 'bold' } // updated to warning color
});