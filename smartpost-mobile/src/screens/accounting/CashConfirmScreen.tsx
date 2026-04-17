import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountingService } from '../../api/services/accountingService';

const COLORS = {
  primary: '#254BE0',
  background: '#F8F9FA',
  card: '#FFFFFF',
  textMain: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444'
};

export default function CashConfirmScreen({ navigation }: any) {
  const [shippers, setShippers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await accountingService.getCashConfirmationList();
      setShippers(data);
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách chốt ca');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCash = (shipper: any) => {
    if (!shipper.waybill_codes || shipper.waybill_codes.length === 0) return;

    Alert.alert(
      'Xác nhận thu tiền',
      `Bạn đã nhận đủ số tiền mặt:\n\n💰 ${(Number(shipper.expected_cod) || 0).toLocaleString()} VNĐ\n\nTừ: ${shipper.shipper_name}?`,
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        { text: 'Xác nhận thu đủ', onPress: () => executeConfirm(shipper), style: 'destructive' }
      ]
    );
  };

  const executeConfirm = async (shipper: any) => {
    setSubmitting(true);
    try {
      await accountingService.confirmShipperCash(shipper.waybill_codes);
      Alert.alert('Thành công', `Đã chốt ca nộp tiền cho ${shipper.shipper_name}!`);
      fetchData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.detail || 'Lỗi hệ thống khi chốt tiền');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerArea}>
        <View style={styles.headerCircleDecoration} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chốt Ca Nộp Tiền</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={shippers}
            keyExtractor={(item, index) => item.shipper_id?.toString() || index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle" size={80} color={COLORS.success} />
                <Text style={styles.emptyText}>Tất cả Shipper đã nộp đủ tiền COD.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.shipperName}>{item.shipper_name}</Text>
                  </View>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{item.delivered_count} đơn</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.label}>Tổng tiền mặt cần nộp</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
                    <Text style={styles.codAmount}>{(Number(item.expected_cod) || 0).toLocaleString()}</Text>
                    <Text style={styles.codCurrency}>đ</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.confirmBtn, submitting ? { backgroundColor: '#94A3B8' } : {}]}
                  onPress={() => handleConfirmCash(item)}
                  disabled={submitting}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>XÁC NHẬN ĐÃ THU</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerArea: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1
  },
  headerCircleDecoration: { position: 'absolute', top: -30, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  listContainer: {
    flex: 1,
    marginTop: -30,
    zIndex: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, backgroundColor: COLORS.card, padding: 40, borderRadius: 20, elevation: 2 },
  emptyText: { color: COLORS.textLight, marginTop: 15, fontSize: 15, fontWeight: 'bold' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 15, marginBottom: 15 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  shipperName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginLeft: 12 },
  badgeCount: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold' },
  cardBody: { alignItems: 'center', marginBottom: 20 },
  label: { color: COLORS.textLight, fontSize: 13, fontWeight: '500' },
  codAmount: { fontSize: 36, fontWeight: 'bold', color: COLORS.danger },
  codCurrency: { fontSize: 20, fontWeight: 'bold', color: COLORS.danger, marginLeft: 4, marginTop: 4 },
  confirmBtn: { flexDirection: 'row', backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 }
});