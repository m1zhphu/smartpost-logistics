import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { accountingService } from '../../api/services/accountingService';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function CashConfirmScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
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
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <View style={styles.headerArea}>
        <View style={styles.headerCircleDecoration} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chốt Ca Nộp Tiền</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={shippers}
            keyExtractor={(item, index) => item.shipper_id?.toString() || index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle" size={80} color={theme.success} />
                <Text style={styles.emptyText}>Tất cả Shipper đã nộp đủ tiền COD.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color={theme.primary} />
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
                  style={[styles.confirmBtn, submitting ? { backgroundColor: theme.disabled } : {}]}
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

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  headerArea: {
    backgroundColor: theme.primary,
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
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, backgroundColor: theme.card, padding: 40, borderRadius: 20, elevation: 2 },
  emptyText: { color: theme.textSecondary, marginTop: 15, fontSize: 15, fontWeight: 'bold' },
  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: theme.border
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 15, marginBottom: 15 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryBackground, justifyContent: 'center', alignItems: 'center' },
  shipperName: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 },
  badgeCount: { backgroundColor: theme.primaryBackground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: theme.primary, fontSize: 13, fontWeight: 'bold' },
  cardBody: { alignItems: 'center', marginBottom: 20 },
  label: { color: theme.textSecondary, fontSize: 13, fontWeight: '500' },
  codAmount: { fontSize: 36, fontWeight: 'bold', color: theme.danger },
  codCurrency: { fontSize: 20, fontWeight: 'bold', color: theme.danger, marginLeft: 4, marginTop: 4 },
  confirmBtn: { flexDirection: 'row', backgroundColor: theme.success, paddingVertical: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 }
});