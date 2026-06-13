import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Pressable, TextInput, Platform, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { getOcrBagWaybills, createOcrExtraWaybills } from '../services/pickupService';

const PRIMARY = COLORS.primary || '#1B5E20';

const OCR_STATUS_CONFIG = {
  PENDING: { label: 'Chờ OCR', color: '#64748B', bg: '#F1F5F9', icon: 'time-outline' },
  INCOMPLETE: { label: 'Thiếu thông tin', color: '#D97706', bg: '#FEF3C7', icon: 'warning-outline' },
  REVIEW: { label: 'Đã OCR xong', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
};

export default function OcrBagDetailScreen({ route, navigation }) {
  const { bagCode, bagData: initialBag } = route.params;
  const [bag, setBag] = useState(initialBag || null);
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraCount, setExtraCount] = useState('1');
  const [extraNote, setExtraNote] = useState('');
  const [addingExtra, setAddingExtra] = useState(false);

  const fetchBag = useCallback(async () => {
    setLoading(true);
    const result = await getOcrBagWaybills(bagCode);
    if (result.success) {
      setBag(result.data);
      setWaybills(result.data?.waybills || []);
    } else {
      Toast.show({ type: 'error', text1: 'Lỗi tải túi thư', text2: result.message });
    }
    setLoading(false);
  }, [bagCode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchBag);
    return unsubscribe;
  }, [navigation, fetchBag]);

  const handleAddExtra = async () => {
    const count = parseInt(extraCount, 10);
    if (isNaN(count) || count < 1 || count > 20) {
      Toast.show({ type: 'error', text1: 'Số lượng không hợp lệ', text2: 'Nhập số từ 1 đến 20' });
      return;
    }
    setAddingExtra(true);
    const result = await createOcrExtraWaybills(bagCode, count, extraNote);
    setAddingExtra(false);
    if (result.success) {
      setShowExtraModal(false);
      setExtraCount('1');
      setExtraNote('');
      Toast.show({ type: 'success', text1: `Đã thêm ${count} vận đơn phát sinh`, text2: `Túi: ${bagCode}` });
      fetchBag();
    } else {
      Toast.show({ type: 'error', text1: 'Không thể thêm đơn phát sinh', text2: result.message });
    }
  };

  const HeaderButton = ({ icon, onPress, badge }) => (
    <TouchableOpacity onPress={onPress} style={styles.headerButton} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color='#FFF' />
      {badge && (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const pendingCount = waybills.filter(w => w.ocr_status !== 'REVIEW').length;
  const doneCount = waybills.filter(w => w.ocr_status === 'REVIEW').length;
  const progressPct = waybills.length > 0 ? (doneCount / waybills.length) * 100 : 0;

  const renderWaybill = ({ item, index }) => {
    const ocrCfg = OCR_STATUS_CONFIG[item.ocr_status] || OCR_STATUS_CONFIG.PENDING;
    return (
      <TouchableOpacity
        style={[styles.waybillCard, item.ocr_status === 'REVIEW' && styles.waybillCardDone]}
        onPress={() => navigation.navigate('OcrWaybillDetail', { waybillCode: item.waybill_code, waybillData: item })}
        activeOpacity={0.8}
      >
        <View style={styles.waybillTop}>
          <View style={styles.seqBadge}>
            <Text style={styles.seqText}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
          <View style={styles.waybillMiddle}>
            <Text style={styles.waybillCode}>{item.waybill_code}</Text>
            <Text style={styles.waybillName} numberOfLines={1}>
              {item.product_name || item.product_type_label || 'Thư/bưu phẩm'}
            </Text>
          </View>
          <View style={[styles.ocrBadge, { backgroundColor: ocrCfg.bg, borderColor: `${ocrCfg.color}40` }]}>
            <Ionicons name={ocrCfg.icon} size={12} color={ocrCfg.color} />
            <Text style={[styles.ocrBadgeText, { color: ocrCfg.color }]}>{ocrCfg.label}</Text>
          </View>
        </View>
        {(item.receiver_name || item.receiver_phone) && (
          <View style={styles.waybillBottom}>
            <Ionicons name='person-outline' size={12} color='#94A3B8' />
            <Text style={styles.waybillReceiverText} numberOfLines={1}>
              {item.receiver_name || '---'} • {item.receiver_phone || '---'}
            </Text>
          </View>
        )}
        <View style={styles.waybillArrow}>
          <Ionicons name='chevron-forward' size={16} color='#CBD5E1' />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <View style={styles.header}>
        <HeaderButton icon='arrow-back' onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{bagCode}</Text>
          <Text style={styles.headerSubtitle}>Chi tiết túi thư</Text>
        </View>
        <HeaderButton icon='reload' onPress={fetchBag} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={waybills}
          keyExtractor={(item) => item.waybill_code}
          renderItem={renderWaybill}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Stats card */}
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNum}>{bag?.expected_quantity || 0}</Text>
                    <Text style={styles.statLabel}>Dự kiến</Text>
                  </View>
                  <View style={[styles.statDivider]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#7C3AED' }]}>{waybills.length}</Text>
                    <Text style={styles.statLabel}>Vận đơn</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#D97706' }]}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Chờ OCR</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#059669' }]}>{doneCount}</Text>
                    <Text style={styles.statLabel}>Xong</Text>
                  </View>
                </View>
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Tiến độ OCR</Text>
                    <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {
                      width: `${progressPct}%`,
                      backgroundColor: progressPct === 100 ? '#059669' : PRIMARY
                    }]} />
                  </View>
                </View>
              </View>

              {/* Add extra waybill button */}
              <TouchableOpacity
                style={styles.extraBtn}
                onPress={() => setShowExtraModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name='add-circle-outline' size={20} color='#7C3AED' />
                <Text style={styles.extraBtnText}>Thêm vận đơn phát sinh</Text>
                <Text style={styles.extraBtnDesc}>Khi nhận nhiều hơn dự kiến</Text>
              </TouchableOpacity>

              <Text style={styles.listTitle}>Danh sách vận đơn ({waybills.length})</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name='mail-outline' size={36} color='#94A3B8' />
              <Text style={styles.emptyText}>Chưa có vận đơn nào trong túi</Text>
            </View>
          }
        />
      )}

      {/* Modal thêm đơn phát sinh */}
      <Modal visible={showExtraModal} transparent animationType='slide' onRequestClose={() => setShowExtraModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowExtraModal(false)}>
          <Pressable style={styles.modalContainer} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name='add-circle' size={24} color='#7C3AED' />
              </View>
              <Text style={styles.modalTitle}>Thêm vận đơn phát sinh</Text>
              <Text style={styles.modalSubtitle}>Túi: {bagCode}</Text>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.fieldLabel}>Số lượng thêm</Text>
              <TextInput
                style={styles.fieldInput}
                value={extraCount}
                onChangeText={setExtraCount}
                keyboardType='number-pad'
                placeholder='Nhập số lượng (1-20)'
                placeholderTextColor='#94A3B8'
                maxLength={2}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 70, textAlignVertical: 'top' }]}
                value={extraNote}
                onChangeText={setExtraNote}
                placeholder='Lý do phát sinh...'
                placeholderTextColor='#94A3B8'
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowExtraModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, addingExtra && { opacity: 0.7 }]}
                onPress={handleAddExtra}
                disabled={addingExtra}
                activeOpacity={0.8}
              >
                {addingExtra ? (
                  <ActivityIndicator size='small' color='#FFF' />
                ) : (
                  <Ionicons name='add' size={18} color='#FFF' />
                )}
                <Text style={styles.confirmBtnText}>{addingExtra ? 'Đang thêm...' : 'Thêm đơn'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingHorizontal: 20, paddingBottom: 22,
    alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 42, borderBottomRightRadius: 42,
    shadowColor: '#ebebeb', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 5, zIndex: 10,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  headerButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#EF4444', borderRadius: 8,
    width: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  headerBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: '#64748B', fontWeight: '700', marginTop: 12, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 30 },
  // Stats card
  statsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: PRIMARY, marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  statDivider: { width: 1, backgroundColor: '#E2E8F0', alignSelf: 'stretch' },
  progressSection: {},
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  progressPct: { fontSize: 12, fontWeight: '900', color: PRIMARY },
  progressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  // Extra btn
  extraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#DDD6FE',
  },
  extraBtnText: { flex: 1, fontSize: 14, fontWeight: '800', color: '#7C3AED' },
  extraBtnDesc: { fontSize: 11, fontWeight: '600', color: '#A78BFA' },
  listTitle: { fontSize: 13, fontWeight: '900', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Waybill card
  waybillCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  waybillCardDone: { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' },
  waybillTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  seqBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F1F5F9', alignItems: 'center',
    justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  seqText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
  waybillMiddle: { flex: 1, marginRight: 8 },
  waybillCode: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  waybillName: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  ocrBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  ocrBadgeText: { fontSize: 10, fontWeight: '900' },
  waybillBottom: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  waybillReceiverText: { fontSize: 11, fontWeight: '600', color: '#94A3B8', flex: 1 },
  waybillArrow: { position: 'absolute', right: 14, top: '50%' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalHeaderIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F5F3FF', alignItems: 'center',
    justifyContent: 'center', marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  modalSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },
  modalField: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8 },
  fieldInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, fontWeight: '700', color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  confirmBtn: {
    flex: 2, flexDirection: 'row', borderRadius: 14, paddingVertical: 14,
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
});
