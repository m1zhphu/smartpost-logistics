import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { waybillService } from '../../api/services/waybillService';
import { useIsFocused } from '@react-navigation/native';
import WaybillCard from '../../components/WaybillCard';
import { exportExcel } from '../../api/services/exportExcel';

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
};

const getStartOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const getEndOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.toISOString(); };

export default function WaybillListScreen({ navigation }: any) {
  const [waybills, setWaybills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const [filters, setFilters] = useState({
    waybill_code: '',
    status: '',
    start_date: getStartOfToday(),
    end_date: getEndOfToday(),
    page: 1,
    size: 50 // Tăng size để xem được nhiều hơn
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [actionItem, setActionItem] = useState<any>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFocused) loadWaybills();
  }, [isFocused, filters.page, filters.status, filters.start_date]);

  const loadWaybills = async () => {
    setLoading(true);
    try {
      const res = await waybillService.searchWaybills(filters);
      setWaybills(res.items || []);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải danh sách vận đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTextChange = (text: string) => {
    setFilters(prev => ({ ...prev, waybill_code: text, page: 1 }));
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { loadWaybills(); }, 500);
  };

  const handleExportExcel = async () => {
    Alert.alert('Xuất Excel', 'Bạn đang yêu cầu xuất dữ liệu theo bộ lọc hiện tại...', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Tiến hành', onPress: async () => {
          try {
            await exportExcel.exportWaybills(filters);
            Alert.alert('Thành công', 'Đã xuất file Excel.');
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xuất file lúc này.');
          }
        }
      }
    ]);
  };

  const handleUpdateWeight = async () => {
    if (!newWeight || isNaN(Number(newWeight))) return Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ');
    try {
      await waybillService.updateWeight(actionItem.waybill_code, Number(newWeight));
      Alert.alert('Thành công', 'Đã cập nhật trọng lượng!');
      setShowWeightModal(false);
      setActionItem(null);
      loadWaybills();
    } catch (e: any) { Alert.alert('Lỗi', e.response?.data?.detail || 'Thất bại'); }
  };

  const handleCancelWaybill = () => {
    Alert.alert('CẢNH BÁO NGUY HIỂM', `Hủy vận đơn ${actionItem.waybill_code}?\nHành động này không thể hoàn tác!`, [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Hủy đơn', style: 'destructive', onPress: async () => {
          try {
            await waybillService.cancelWaybill(actionItem.waybill_code);
            Alert.alert('Thành công', 'Đã hủy đơn hàng!');
            setActionItem(null);
            loadWaybills();
          } catch (e: any) { Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể hủy đơn này'); }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER NỀN XANH SÂU */}
      <View style={styles.headerArea}>
        <View style={styles.headerCircleDecoration} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DANH SÁCH ĐƠN HÀNG</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportExcel}>
            <Ionicons name="download-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR NỔI TRÊN NỀN XANH */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSub} style={{ marginLeft: 15 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập mã vận đơn để tìm kiếm..."
            placeholderTextColor={COLORS.textSub}
            value={filters.waybill_code}
            onChangeText={handleSearchTextChange}
          />
          {filters.waybill_code !== '' && (
            <TouchableOpacity style={{ padding: 5 }} onPress={() => handleSearchTextChange('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.border} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('ScanTask')}>
            <Ionicons name="barcode-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.searchDivider} />
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
            <Ionicons name="options-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* DANH SÁCH THẺ (Dùng chung component WaybillCard) */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={waybills}
          keyExtractor={(item) => item.waybill_code}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              {/* Truyền vào thẻ Component tái sử dụng */}
              <WaybillCard item={item} activeTab="Current" />

              {/* Nút 3 chấm nằm đè lên góc phải của thẻ */}
              <TouchableOpacity style={styles.actionMenuBtn} onPress={() => setActionItem(item)}>
                <View style={styles.actionMenuBg}>
                  <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textSub} />
                </View>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyStateText}>Không tìm thấy đơn hàng nào phù hợp bộ lọc.</Text>
            </View>
          }
        />
      )}

      {/* NÚT TẠO MỚI FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateWaybill')} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* MODAL BỘ LỌC DỮ LIỆU */}
      <Modal visible={showFilterModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ Lọc Dữ Liệu</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Trạng thái đơn hàng</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <Picker.Item label="Tất cả trạng thái" value="" />
                <Picker.Item label="Mới tạo (CREATED)" value="CREATED" />
                <Picker.Item label="Đã nhập kho (IN_HUB)" value="IN_HUB" />
                <Picker.Item label="Đang giao (DELIVERING)" value="DELIVERING" />
                <Picker.Item label="Thành công (SUCCESS)" value="SUCCESS" />
                <Picker.Item label="Đã hủy (CANCELED)" value="CANCELED" />
              </Picker>
            </View>

            <Text style={styles.label}>Thời gian tạo</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.dateChip, filters.start_date === getStartOfToday() && styles.dateChipActive]}
                onPress={() => setFilters({ ...filters, start_date: getStartOfToday(), end_date: getEndOfToday() })}
              >
                <Text style={filters.start_date === getStartOfToday() ? styles.dateChipTextActive : styles.dateChipText}>Hôm nay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateChip, filters.start_date === '' && styles.dateChipActive]}
                onPress={() => setFilters({ ...filters, start_date: '', end_date: '' })}
              >
                <Text style={filters.start_date === '' ? styles.dateChipTextActive : styles.dateChipText}>Tất cả</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={() => { setShowFilterModal(false); loadWaybills(); }}>
              <Text style={styles.btnText}>ÁP DỤNG LỌC</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL ACTION QUICK MENU (Ba chấm) */}
      <Modal visible={!!actionItem && !showWeightModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActionItem(null)}>
          <View style={styles.actionSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.actionTitle}>Thao tác mã: {actionItem?.waybill_code}</Text>

            <TouchableOpacity style={styles.actionBtnRow} onPress={() => { setActionItem(null); navigation.navigate('TaskDetail', { waybill: actionItem }); }}>
              <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}><Ionicons name="eye" size={20} color={COLORS.primary} /></View>
              <Text style={styles.actionBtnText}>Xem chi tiết vận đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnRow} onPress={() => { setActionItem(null); setShowWeightModal(true); }}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}><Ionicons name="scale" size={20} color={COLORS.warning} /></View>
              <Text style={styles.actionBtnText}>Cập nhật trọng lượng thực tế</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionBtnRow} onPress={handleCancelWaybill}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}><Ionicons name="trash" size={20} color={COLORS.danger} /></View>
              <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Hủy bỏ vận đơn này</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL CẬP NHẬT TRỌNG LƯỢNG */}
      <Modal visible={showWeightModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>Trọng lượng thực tế (kg)</Text>
            <Text style={{ marginBottom: 20, color: COLORS.textSub, fontSize: 13 }}>Mã đơn: <Text style={{ fontWeight: 'bold', color: COLORS.textMain }}>{actionItem?.waybill_code}</Text></Text>

            <TextInput
              style={styles.weightInput}
              keyboardType="numeric"
              placeholder="Nhập số kg (VD: 2.5)..."
              placeholderTextColor={COLORS.textSub}
              value={newWeight}
              onChangeText={setNewWeight}
              autoFocus
            />

            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowWeightModal(false); setActionItem(null); setNewWeight(''); }}>
                <Text style={{ fontWeight: 'bold', color: COLORS.textSub }}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateWeight}>
                <Text style={{ fontWeight: 'bold', color: '#fff' }}>LƯU THAY ĐỔI</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  headerArea: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 30, paddingHorizontal: 15, position: 'relative', overflow: 'hidden' },
  headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)' },

  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  exportBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },

  // Search Bar
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, height: 56, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, color: COLORS.textMain },
  scanBtn: { padding: 10 },
  searchDivider: { width: 1, height: 25, backgroundColor: COLORS.border },
  filterBtn: { padding: 10, paddingRight: 15 },

  // List & Cards
  cardWrapper: { position: 'relative' },
  actionMenuBtn: { position: 'absolute', top: 15, right: 10, zIndex: 10 },
  actionMenuBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyStateText: { color: COLORS.textSub, marginTop: 10, fontSize: 14, fontStyle: 'italic' },

  // FAB
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },

  // Modals Overlay & Content
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textMain },

  // Filter Modal
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 10 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: 25, backgroundColor: '#F8FAFC' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  dateChip: { flex: 1, padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateChipText: { color: COLORS.textMain, fontWeight: '500' },
  dateChipTextActive: { color: '#fff', fontWeight: 'bold' },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Action Menu (Ba chấm) Modal
  actionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, paddingBottom: 40 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 20, textAlign: 'center', letterSpacing: 0.5 },
  actionBtnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  actionIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.textMain },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },

  // Weight Modal
  weightInput: { borderWidth: 2, borderColor: COLORS.primary, borderRadius: 16, padding: 20, fontSize: 32, textAlign: 'center', fontWeight: 'bold', color: COLORS.primary, marginBottom: 10, backgroundColor: '#EFF6FF' },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: '#F8FAFC' },
  saveBtn: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.primary, marginLeft: 8, elevation: 2 }
});