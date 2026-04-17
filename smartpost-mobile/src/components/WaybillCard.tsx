import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface WaybillCardProps {
  item: any;
  activeTab?: 'Current' | 'Completed';
}

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
  expressBg: '#FEF3C7',
  expressText: '#D97706'
};

export default function WaybillCard({ item, activeTab = 'Current' }: WaybillCardProps) {
  const navigation = useNavigation<any>();

  const isExpress = item.service_type === 'EXPRESS';
  const isCompleted = activeTab === 'Completed';

  // Hàm mở Bản đồ
  const openMap = () => {
    const url = `http://maps.google.com/?q=${encodeURIComponent(item.receiver_address)}`;
    Linking.openURL(url);
  };

  // Hàm gọi Điện thoại
  const callCustomer = () => {
    Linking.openURL(`tel:${item.receiver_phone}`);
  };

  // Hàm mở Chi tiết đơn
  const navigateToDetail = () => {
    navigation.navigate('TaskDetail', { waybill: item });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isExpress && styles.cardExpress]}
      activeOpacity={0.8}
      onPress={navigateToDetail}
    >
      {/* Ruy băng Hỏa tốc */}
      {isExpress && !isCompleted && (
        <View style={styles.expressBanner}>
          <Text style={styles.expressBannerText}>ƯU TIÊN · HỎA TỐC</Text>
        </View>
      )}

      <View style={{ padding: 16 }}>
        {/* 🚀 ĐÃ FIX: Header xếp dọc (Nhãn trên, Mã dưới) */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isExpress ? styles.typeBadgeExpress : styles.typeBadgeNormal]}>
            <Text style={[styles.typeText, isExpress ? styles.typeTextExpress : styles.typeTextNormal]}>
              {isExpress ? 'Hỏa tốc' : 'Tiêu chuẩn'}
            </Text>
          </View>
          <Text style={styles.waybillCode}>{item.waybill_code}</Text>
        </View>

        {/* Thông tin Khách Hàng */}
        <Text style={styles.custInfo}>{item.receiver_name} • {item.receiver_phone}</Text>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textMain} style={{ marginTop: 2, marginRight: 6 }} />
          <Text style={styles.addressText}>{item.receiver_address}</Text>
        </View>

        {/* Action Buttons (Chỉ hiện khi chưa hoàn thành) */}
        {!isCompleted && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.mainActionBtn} onPress={navigateToDetail}>
              <Ionicons name="paper-plane-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.mainActionText}>Giao hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconActionBtn} onPress={callCustomer}>
              <Ionicons name="call-outline" size={20} color={COLORS.textMain} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconActionBtn} onPress={openMap}>
              <Ionicons name="location-outline" size={20} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* Tiền COD */}
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>{Number(item.cod_amount) > 0 ? 'COD cần thu' : 'Không có COD'}</Text>
          <Text style={Number(item.cod_amount) > 0 ? styles.footerCodValue : styles.footerNoCod}>
            {Number(item.cod_amount) > 0 ? `${Number(item.cod_amount).toLocaleString('vi-VN')} đ` : '— đ'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardExpress: { borderColor: '#FDE68A' },

  expressBanner: { backgroundColor: COLORS.expressBg, paddingVertical: 6, paddingHorizontal: 16 },
  expressBannerText: { color: COLORS.expressText, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },

  // Chuyển sang xếp dọc (column), căn lề trái (flex-start)
  cardHeader: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 },
  waybillCode: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain, marginTop: 8 }, // Thêm marginTop để cách cái nhãn ở trên ra 1 xíu

  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeNormal: { backgroundColor: '#F1F5F9' },
  typeBadgeExpress: { backgroundColor: COLORS.expressBg },
  typeText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  typeTextNormal: { color: COLORS.textSub },
  typeTextExpress: { color: COLORS.expressText },

  custInfo: { fontSize: 14, color: COLORS.textMain, marginBottom: 8, fontWeight: '500' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, paddingRight: 10 },
  addressText: { fontSize: 14, color: COLORS.textSub, lineHeight: 20, flex: 1 },

  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  mainActionBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.primary, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 1 },
  mainActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  iconActionBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 15 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
  footerCodValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.expressText },
  footerNoCod: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
});