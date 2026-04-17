import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Linking, Dimensions, Alert } from 'react-native';
import axiosClient from '../../api/axiosClient';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';
import { waybillService } from '../../api/services/waybillService';
import { printService } from '../../api/services/printService';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function TaskDetailScreen({ route, navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { waybill } = route.params || {};
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!waybill) return;

    setLoading(true);

    const res = waybillService.getTracking(waybill.waybill_code)
      .then(res => {
        setTracking(res || []);
      })
      .catch(err => {
        console.log("Lỗi tải tracking:", err);
        setTracking([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [waybill]);

  // HÀM MỞ BẢN ĐỒ
  const openMap = () => {
    const url = `http://maps.google.com/?q=${encodeURIComponent(waybill.receiver_address)}`;
    Linking.openURL(url);
  };

  const callCustomer = () => {
    Linking.openURL(`tel:${waybill.receiver_phone}`);
  };

  const handlePrint = async () => {
    try {
      if (!waybill) return;
      setLoading(true);

      const htmlContent = await printService.printWaybill(waybill.waybill_code);

      if (htmlContent) {
        await Print.printAsync({
          html: htmlContent,
        });
      } else {
        Alert.alert('Lỗi', 'Dữ liệu in bị rỗng.');
      }
    } catch (error) {
      console.log("Lỗi in:", error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ in ấn.');
    } finally {
      setLoading(false);
    }
  };

  if (!waybill) return <View style={styles.center}><Text>Không có dữ liệu</Text></View>;

  const isExpress = waybill.service_type === 'EXPRESS';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* =========================================
          1. HEADER NỀN XANH
      ========================================= */}
      <View style={styles.headerArea}>
        <View style={styles.headerCircleDecoration} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerSub}>CHI TIẾT ĐƠN</Text>
            <Text style={styles.headerTitle}>{waybill.waybill_code}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.badgeRow}>
          {isExpress && (
            <View style={styles.expressBadge}>
              <Text style={styles.expressText}>Hỏa tốc</Text>
            </View>
          )}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Đang giao</Text>
          </View>
        </View>
      </View>

      <View style={styles.customerBar}>
        <View style={styles.customerHeader}>
          <Ionicons name="person-circle-outline" size={36} color={theme.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.custName} numberOfLines={1}>{waybill.receiver_name}</Text>
            <Text style={styles.custPhone}>{waybill.receiver_phone}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtnCall} onPress={callCustomer}>
            <Ionicons name="call" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnMap} onPress={openMap}>
            <Ionicons name="location" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={styles.addressText} numberOfLines={2}>{waybill.receiver_address}</Text>
        </View>
      </View>

      {/* =========================================
          3. NỘI DUNG CUỘN (COD, TIMELINE, SCROLL)
      ========================================= */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* GRID COD VÀ KHỐI LƯỢNG */}
        <View style={styles.infoGrid}>
          <View style={styles.codBox}>
            <Text style={styles.codLabel}>THU HỘ COD</Text>
            <Text style={styles.codValue}>{Number(waybill.cod_amount || 0).toLocaleString()}</Text>
            <Text style={styles.codUnit}>đồng</Text>
          </View>

          <View style={styles.rightStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>KHỐI LƯỢNG</Text>
              <Text style={styles.statValue}>{waybill.actual_weight || 0} <Text style={styles.statUnitInline}>kg</Text></Text>
            </View>
            <View style={[styles.statBox, { marginTop: 10 }]}>
              <Text style={styles.statLabel}>CƯỚC PHÍ</Text>
              <Text style={styles.statValue}>{Number(waybill.shipping_fee || 0).toLocaleString()} <Text style={styles.statUnitInline}>đ</Text></Text>
            </View>
          </View>
        </View>

        {/* CARD GHI CHÚ */}
        {waybill.note && (
          <View style={styles.card}>
            <Text style={styles.noteLabel}>GHI CHÚ TỪ SHOP</Text>
            <Text style={styles.noteText}>{waybill.note}</Text>
          </View>
        )}

        {/* LỊCH SỬ HÀNH TRÌNH (TIMELINE) */}
        <View style={styles.card}>
          <View style={styles.timelineHeaderRow}>
            <View style={styles.dotPrimaryTitle} />
            <Text style={styles.timelineTitle}>LỊCH SỬ HÀNH TRÌNH</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
          ) : tracking.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có thông tin hành trình</Text>
          ) : (
            <View style={{ marginTop: 15 }}>
              {tracking.map((t, i) => {
                const isFirst = i === 0;
                const isLast = i === tracking.length - 1;
                return (
                  <View key={i} style={styles.trackItemContainer}>
                    <View style={styles.timeline}>
                      {isFirst ? (
                        <View style={styles.timelineDotActiveWrap}>
                          <View style={styles.timelineDotActive} />
                        </View>
                      ) : isLast ? (
                        <View style={styles.timelineDotStart} />
                      ) : (
                        <View style={styles.timelineDotPast} />
                      )}

                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.trackItem}>
                      <Text style={[styles.trackStatus, isFirst && { color: theme.primary }]}>{t.note}</Text>
                      <Text style={styles.trackTime}>{new Date(t.time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(t.time).toLocaleDateString('vi-VN')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* =========================================
          4. BOTTOM ACTION BAR
      ========================================= */}
      {waybill.status === 'DELIVERING' && (
        <View style={styles.bottomBar}>
          {/* NÚT IN VẬN ĐƠN */}
          <TouchableOpacity style={styles.printerBtn} onPress={handlePrint}>
            <Ionicons name="print-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.updateBtn} onPress={() => navigation.navigate('UpdateStatus', { waybill })}>
            <Ionicons name="checkbox-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnText}>Cập nhật trạng thái giao</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  headerArea: {
    backgroundColor: theme.primary,
    paddingTop: 50,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1
  },
  headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  expressBadge: { backgroundColor: theme.warningBackground, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16, marginRight: 10 },
  expressText: { color: theme.warning, fontWeight: 'bold', fontSize: 13 },
  statusBadge: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  // Customer Bar Nổi Bên Ngoài ScrollView
  customerBar: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginTop: -25, // Đè lên viền Header
    padding: 15,
    borderRadius: 12,
    elevation: 5, // Đảm bảo nổi tuyệt đối trên Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    zIndex: 10
  },
  customerHeader: { flexDirection: 'row', alignItems: 'center' },
  custName: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
  custPhone: { fontSize: 14, color: theme.textSecondary },
  actionBtnCall: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8, elevation: 1 },
  actionBtnMap: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.primaryBackground, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  addressText: { flex: 1, fontSize: 14, color: theme.text, lineHeight: 20 },

  // Scroll Content
  scrollView: { flex: 1, zIndex: 1 },
  scrollContent: { padding: 15, paddingTop: 15, paddingBottom: 100 },

  card: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 15, elevation: 1, borderWidth: 1, borderColor: theme.border },

  // Info Grid
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  codBox: { flex: 1, backgroundColor: theme.warningBackground, borderRadius: 16, padding: 20, marginRight: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#FEF08A' },
  codLabel: { fontSize: 11, fontWeight: 'bold', color: theme.warning, marginBottom: 8, letterSpacing: 0.5 },
  codValue: { fontSize: 24, fontWeight: 'bold', color: theme.warning },
  codUnit: { fontSize: 13, color: theme.warning, marginTop: 4 },
  rightStats: { flex: 1 },
  statBox: { backgroundColor: theme.card, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: theme.border },
  statLabel: { fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '600', color: theme.text },
  statUnitInline: { fontSize: 13, color: theme.textSecondary, fontWeight: 'normal' },

  noteLabel: { fontSize: 13, fontWeight: 'bold', color: theme.text, marginBottom: 8, letterSpacing: 0.5 },
  noteText: { fontSize: 15, color: theme.text, lineHeight: 22 },

  // Timeline
  timelineHeaderRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 15 },
  dotPrimaryTitle: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginRight: 8 },
  timelineTitle: { fontSize: 14, fontWeight: 'bold', color: theme.primary, letterSpacing: 0.5 },
  trackItemContainer: { flexDirection: 'row' },
  timeline: { alignItems: 'center', width: 30 },
  timelineDotActiveWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.primaryBackground, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineDotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  timelineDotPast: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 2, borderColor: theme.success, zIndex: 1, marginTop: 4 },
  timelineDotStart: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D1D5DB', zIndex: 1, marginTop: 4 },
  timelineLine: { flex: 1, width: 2, backgroundColor: theme.border, marginVertical: -4 },
  trackItem: { paddingLeft: 10, paddingBottom: 25, flex: 1 },
  trackStatus: { fontSize: 15, fontWeight: '500', color: theme.text, marginBottom: 4 },
  trackTime: { fontSize: 13, color: theme.textSecondary },
  emptyText: { textAlign: 'center', color: theme.textSecondary, fontStyle: 'italic', marginTop: 15 },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: theme.card, padding: 15, paddingBottom: 25, borderTopWidth: 1, borderColor: theme.border, zIndex: 20 },
  printerBtn: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: theme.border },
  updateBtn: { flex: 1, flexDirection: 'row', backgroundColor: theme.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  updateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});