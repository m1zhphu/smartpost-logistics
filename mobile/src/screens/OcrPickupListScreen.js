import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { getOcrCustomerPickups } from '../services/pickupService';
import { formatDateTime } from '../utils/pickupHelpers';
import styles from '../styles/OcrPickupListScreenStyles';

const PRIMARY = COLORS.primary || '#1B5E20';

const OCR_STATUS_CONFIG = {
  PENDING: { label: 'Chờ OCR', color: '#64748B', bg: '#F8FAFC' },
  INCOMPLETE: { label: 'Thiếu thông tin', color: '#D97706', bg: '#FEF3C7' },
  VERIFIED: { label: 'Đã duyệt', color: '#059669', bg: '#DCFCE7' },
  REVIEW: { label: 'Đã OCR xong', color: '#059669', bg: '#D1FAE5' },
};

const getWaybillOcrState = (waybill) => {
  if (waybill?.verify_status === 'VERIFIED' || waybill?.status === 'PICKED_PENDING_VERIFY') {
    return 'VERIFIED';
  }
  return waybill?.ocr_status || 'PENDING';
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
    const done = waybills.filter(w => getWaybillOcrState(w) !== 'PENDING').length;
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
    const ocrCfg = OCR_STATUS_CONFIG[getWaybillOcrState(item)] || OCR_STATUS_CONFIG.PENDING;
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

// styles moved to ../styles/OcrPickupListScreenStyles
