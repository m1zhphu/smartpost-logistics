import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { getOcrCustomerPickups } from '../services/pickupService';
import { formatDateTime } from '../utils/pickupHelpers';

const PRIMARY = COLORS.primary || '#1B5E20';

const OCR_STATUS_CONFIG = {
  PENDING: { label: 'Chờ OCR', color: '#64748B', bg: '#F8FAFC' },
  INCOMPLETE: { label: 'Thiếu thông tin', color: '#D97706', bg: '#FEF3C7' },
  REVIEW: { label: 'Đã OCR xong', color: '#059669', bg: '#D1FAE5' },
};

const MATERIALIZATION_CONFIG = {
  PENDING: { label: 'Chờ nhận', color: '#7C3AED' },
  PARTIAL: { label: 'Nhận một phần', color: '#D97706' },
  COMPLETED: { label: 'Đã nhận đủ', color: '#059669' },
};

export default function OcrPickupListScreen({ route, navigation }) {
  const { customer } = route.params;
  const [data, setData] = useState({ bags: [], single_waybills: [] });
  const [loading, setLoading] = useState(true);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    const result = await getOcrCustomerPickups(customer.customer_id);
    if (result.success) {
      setData({
        bags: result.data?.bags || [],
        single_waybills: result.data?.single_waybills || [],
      });
    } else {
      Toast.show({ type: 'error', text1: 'Lỗi tải danh sách pickup', text2: result.message });
    }
    setLoading(false);
  }, [customer.customer_id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchPickups);
    return unsubscribe;
  }, [navigation, fetchPickups]);

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.headerButton} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color='#FFF' />
    </TouchableOpacity>
  );

  const getOcrProgress = (waybills = []) => {
    const done = waybills.filter(w => w.ocr_status === 'REVIEW').length;
    return { done, total: waybills.length };
  };

  const renderBagItem = ({ item: bag }) => {
    const { done, total } = getOcrProgress(bag.waybills || []);
    const matConfig = MATERIALIZATION_CONFIG[bag.materialization_status] || MATERIALIZATION_CONFIG.PENDING;
    const progressPct = total > 0 ? (done / total) * 100 : 0;
    return (
      <TouchableOpacity
        style={styles.bagCard}
        onPress={() => navigation.navigate('OcrBagDetail', { bagCode: bag.bag_code, bagData: bag })}
        activeOpacity={0.8}
      >
        <View style={styles.bagCardHeader}>
          <View style={styles.bagIconBox}>
            <Ionicons name='mail-open-outline' size={20} color={PRIMARY} />
          </View>
          <View style={styles.bagCardInfo}>
            <Text style={styles.bagCode}>{bag.bag_code}</Text>
            <Text style={styles.bagMeta}>{bag.product_type_label || 'Túi thư'} • {bag.expected_quantity || 0} kiện dự kiến</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${matConfig.color}15`, borderColor: `${matConfig.color}40` }]}>
            <Text style={[styles.statusBadgeText, { color: matConfig.color }]}>{matConfig.label}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>OCR: {done}/{total} vận đơn</Text>
            <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#059669' : PRIMARY }]} />
          </View>
        </View>

        <View style={styles.bagFooter}>
          <View style={styles.countPill}>
            <Text style={styles.countLabel}>Dự kiến</Text>
            <Text style={styles.countValue}>{bag.expected_quantity || 0}</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countLabel}>Thực tế</Text>
            <Text style={[styles.countValue, { color: bag.actual_quantity > 0 ? '#059669' : '#64748B' }]}>{bag.actual_quantity || 0}</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countLabel}>Vận đơn</Text>
            <Text style={styles.countValue}>{bag.waybill_count || total}</Text>
          </View>
          <TouchableOpacity
            style={styles.openBagBtn}
            onPress={() => navigation.navigate('OcrBagDetail', { bagCode: bag.bag_code, bagData: bag })}
            activeOpacity={0.8}
          >
            <Ionicons name='open-outline' size={14} color='#FFFFFF' />
            <Text style={styles.openBagBtnText}>Mở túi</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSingleWaybill = ({ item }) => {
    const ocrCfg = OCR_STATUS_CONFIG[item.ocr_status] || OCR_STATUS_CONFIG.PENDING;
    return (
      <TouchableOpacity
        style={styles.waybillCard}
        onPress={() => navigation.navigate('OcrWaybillDetail', { waybillCode: item.waybill_code, waybillData: item })}
        activeOpacity={0.8}
      >
        <View style={styles.waybillRow}>
          <Text style={styles.waybillCode}>{item.waybill_code}</Text>
          <View style={[styles.ocrBadge, { backgroundColor: ocrCfg.bg, borderColor: `${ocrCfg.color}40` }]}>
            <Text style={[styles.ocrBadgeText, { color: ocrCfg.color }]}>{ocrCfg.label}</Text>
          </View>
        </View>
        <Text style={styles.waybillMeta} numberOfLines={1}>
          Người nhận: {item.receiver_name || 'Chưa có'} • {item.receiver_phone || '---'}
        </Text>
      </TouchableOpacity>
    );
  };

  const sections = [
    data.bags.length > 0 ? { title: `Túi thư (${data.bags.length})`, data: data.bags, type: 'bag' } : null,
    data.single_waybills.length > 0 ? { title: `Đơn lẻ (${data.single_waybills.length})`, data: data.single_waybills, type: 'single' } : null,
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <View style={styles.header}>
        <HeaderButton icon='arrow-back' onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{customer.customer_name}</Text>
          <Text style={styles.headerSubtitle}>{customer.customer_code}</Text>
        </View>
        <HeaderButton icon='reload' onPress={fetchPickups} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={PRIMARY} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name='cube-outline' size={36} color='#94A3B8' />
          </View>
          <Text style={styles.emptyText}>Không có pickup nào</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => (item.bag_code || item.waybill_code || String(index))}
          renderItem={({ item, section }) =>
            section.type === 'bag' ? renderBagItem({ item }) : renderSingleWaybill({ item })
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { color: 'white', fontSize: 17, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  headerButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: { color: '#0F172A', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 30 },
  sectionHeader: { backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8, marginTop: 4 },
  sectionHeaderText: { fontSize: 13, fontWeight: '900', color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase' },
  // Bag card
  bagCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bagCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bagIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: `${PRIMARY}10`, alignItems: 'center',
    justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: `${PRIMARY}25`,
  },
  bagCardInfo: { flex: 1 },
  bagCode: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  bagMeta: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '900' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  progressPct: { fontSize: 12, fontWeight: '900', color: PRIMARY },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  bagFooter: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  countPill: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10,
    paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
  },
  countLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 2 },
  countValue: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  openBagBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  openBagBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  // Single waybill card
  waybillCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1,
  },
  waybillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  waybillCode: { fontSize: 14, fontWeight: '900', color: PRIMARY },
  ocrBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  ocrBadgeText: { fontSize: 10, fontWeight: '900' },
  waybillMeta: { fontSize: 12, fontWeight: '600', color: '#64748B' },
});
