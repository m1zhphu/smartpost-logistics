import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, StatusBar, Linking, AppState, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { deliveryService } from '../../api/services/deliveryService';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import WaybillCard from '../../components/WaybillCard';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#254BE0',
  background: '#F8F9FA',
  card: '#FFFFFF',
  textMain: '#1E293B',
  textSub: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  expressText: '#D97706'
};

export default function TaskListScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Current' | 'Completed'>('Current');
  const [gpsBlocked, setGpsBlocked] = useState(true);

  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);
  const locationSub = useRef<any>(null);
  const user = useAuthStore((state: any) => state.user);

  const fetchTasks = async () => {
    try {
      const data = await deliveryService.getMyTasks();
      setTasks(data);
    } catch (error) {
      console.log('Lỗi tải danh sách:', error);
    }
  };

  const enforceGPSAndTrack = async () => {
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== 'granted') return setGpsBlocked(true);

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) return setGpsBlocked(true);

      setGpsBlocked(false);

      if (!locationSub.current) {
        locationSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 20 },
          (location) => { /* Xử lý bắn tọa độ lên backend nếu cần */ }
        );
      }
    } catch (error) {
      setGpsBlocked(true);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      enforceGPSAndTrack().then(() => fetchTasks()).finally(() => setLoading(false));
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        enforceGPSAndTrack();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (locationSub.current) locationSub.current.remove();
    };
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    enforceGPSAndTrack().then(() => fetchTasks()).finally(() => setRefreshing(false));
  }, []);

  // Lọc dữ liệu
  const pendingTasks = tasks.filter(t => t.status !== 'SUCCESS' && t.status !== 'FAILED' && t.status !== 'DELIVERED');
  const completedTasks = tasks.filter(t => t.status === 'SUCCESS' || t.status === 'FAILED' || t.status === 'DELIVERED');

  const expressTasksCount = pendingTasks.filter(t => t.service_type === 'EXPRESS').length;
  const displayedTasks = activeTab === 'Current' ? pendingTasks : completedTasks;

  // MÀN HÌNH KHÓA NẾU TẮT GPS
  if (gpsBlocked) {
    return (
      <View style={styles.blockContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.blockIconWrap}>
          <Ionicons name="location" size={60} color={COLORS.danger} />
        </View>
        <Text style={styles.blockTitle}>YÊU CẦU BẬT GPS</Text>
        <Text style={styles.blockDesc}>Ứng dụng bắt buộc phải bật Vị trí (GPS) liên tục để tối ưu lộ trình giao hàng.</Text>
        <TouchableOpacity style={styles.blockBtn} onPress={enforceGPSAndTrack}>
          <Text style={styles.blockBtnText}>TÔI ĐÃ BẬT, KIỂM TRA LẠI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => Linking.openSettings()}>
          <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>Mở cài đặt thiết bị</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER GỌN GÀNG */}
      <View style={styles.headerArea}>
        <View style={styles.headerCircleDecoration} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.name}>{user?.fullName || 'Tài xế'}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS bật</Text>
            </View>
            <TouchableOpacity style={styles.avatarWrap} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* THANH TABS NỔI */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'Current' && styles.tabButtonActive]} onPress={() => setActiveTab('Current')}>
            <Text style={[styles.tabText, activeTab === 'Current' && styles.tabTextActive]}>Chờ giao ({pendingTasks.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'Completed' && styles.tabButtonActive]} onPress={() => setActiveTab('Completed')}>
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.tabTextActive]}>Hoàn tất ({completedTasks.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DANH SÁCH ĐƠN HÀNG */}
      <FlatList
        data={displayedTasks}
        keyExtractor={(item) => item.waybill_id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 15, paddingTop: 30, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListHeaderComponent={
          activeTab === 'Current' && expressTasksCount > 0 ? (
            <View style={styles.warningBanner}>
              <Ionicons name="time-outline" size={20} color={COLORS.expressText} />
              <Text style={styles.warningText}>{expressTasksCount} đơn sắp quá hạn giao trong hôm nay</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          // 🚀 ĐÃ FIX: Truyền item và activeTab xuống component con
          <WaybillCard item={item} activeTab={activeTab} />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={80} color={COLORS.success} />
              <Text style={styles.emptyTitle}>Tuyệt vời!</Text>
              <Text style={styles.emptySub}>Không còn đơn hàng nào trong mục này.</Text>
            </View>
          ) : <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        }
      />

      {/* NÚT QUÉT MÃ NỔI (FAB) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => navigation.navigate('ScanTask')}>
        <Ionicons name="qr-code-outline" size={28} color="#FFF" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  headerArea: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 50, position: 'relative', overflow: 'hidden' },
  headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 10 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 },
  gpsText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

  // Tabs
  tabContainerWrapper: { alignItems: 'center', marginTop: -25, zIndex: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 5, borderRadius: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, width: '90%' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 25 },
  tabButtonActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 15, color: COLORS.textSub, fontWeight: '600' },
  tabTextActive: { color: '#FFF', fontWeight: 'bold' },

  // Warning Banner
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#FDE68A' },
  warningText: { color: COLORS.expressText, fontSize: 14, marginLeft: 10, fontWeight: '500' },

  // Empty & Blocked States
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textMain, marginTop: 10 },
  emptySub: { fontSize: 15, color: COLORS.textSub, marginTop: 5 },

  blockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 30 },
  blockIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  blockTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 10 },
  blockDesc: { textAlign: 'center', color: COLORS.textSub, fontSize: 15, lineHeight: 22, marginBottom: 30 },
  blockBtn: { backgroundColor: COLORS.danger, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 3 },
  blockBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Nút Scan Nổi (FAB)
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  }
});