import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Dimensions, StatusBar } from 'react-native';
import { deliveryService } from '../../api/services/deliveryService';
import { uploadService } from '../../api/services/uploadService';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';

const { width } = Dimensions.get('window');

export default function UpdateStatusScreen({ route, navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { waybill, podUri } = route.params || {};

  const [statusType, setStatusType] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const expectedCod = Number(waybill?.cod_amount) || 0;

  // Trạng thái cho Quick Actions của COD
  const [codMode, setCodMode] = useState<'FULL' | 'MANUAL' | 'ZERO'>('FULL');
  const [actualCod, setActualCod] = useState(expectedCod.toString());

  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Tự động set tiền dựa vào Quick Action
    if (codMode === 'FULL') setActualCod(expectedCod.toString());
    if (codMode === 'ZERO') setActualCod('0');
  }, [codMode, expectedCod]);

  if (!waybill) return <View style={{ flex: 1 }} />;

  const formatMoney = (val: string) => {
    const num = Number(val.replace(/[^0-9]/g, ''));
    return num.toLocaleString('vi-VN');
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (statusType === 'FAILED') {
        if (!note.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập lý do giao thất bại!');
        await deliveryService.reportFailure({
          waybill_code: waybill.waybill_code,
          reason_code: 'DELIVERY_FAILED',
          note: note
        });
        Alert.alert('Ghi nhận', 'Đã báo cáo giao thất bại!');
      } else {
        if (!podUri) return Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh kiện hàng (POD).');
        // const uploadedUrl = await uploadService.uploadPOD(podUri);
        const uploadedUrl = "mock_url"; // Tạm thời mock để test UI

        await deliveryService.confirmSuccess({
          waybill_code: waybill.waybill_code,
          actual_cod_collected: Number(actualCod.replace(/[^0-9]/g, '')),
          pod_image_url: uploadedUrl,
          note: note
        });
        Alert.alert('Thành công', `Chốt đơn ${waybill.waybill_code} thành công!`);
      }

      navigation.popToTop();

    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.detail || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* =========================================
          1. HEADER & THÔNG TIN KHÁCH HÀNG 
      ========================================= */}
      <View style={styles.headerArea}>
        <View style={styles.headerCircleDecoration} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerSubTitle}>CẬP NHẬT TRẠNG THÁI</Text>
            <Text style={styles.headerTitle}>{waybill.waybill_code}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Thanh Thông Tin Khách Hàng (Nằm đè lên viền Header) */}
      <View style={styles.customerBar}>
        <Ionicons name="person-outline" size={18} color={theme.text} />
        <Text style={styles.custName} numberOfLines={1}>{waybill.receiver_name}</Text>
        <Text style={styles.custPhone}>{waybill.receiver_phone}</Text>
        <View style={styles.codBadge}>
          <Text style={styles.codBadgeText}>COD: {expectedCod >= 1000 ? `${expectedCod / 1000}k` : expectedCod}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* =========================================
            2. TOGGLE TRẠNG THÁI (THÀNH CÔNG / THẤT BẠI)
        ========================================= */}
        <View style={styles.statusToggleCard}>
          <TouchableOpacity
            style={[styles.toggleBtn, statusType === 'SUCCESS' && styles.toggleBtnActiveSuccess]}
            onPress={() => setStatusType('SUCCESS')}
          >
            <Ionicons name={statusType === 'SUCCESS' ? "checkmark" : "checkmark-outline"} size={20} color={statusType === 'SUCCESS' ? '#FFF' : theme.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, statusType === 'SUCCESS' && { color: '#FFF' }]}>Giao thành công</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, statusType === 'FAILED' && styles.toggleBtnActiveFail]}
            onPress={() => setStatusType('FAILED')}
          >
            <Ionicons name={statusType === 'FAILED' ? "close" : "close-outline"} size={20} color={statusType === 'FAILED' ? '#FFF' : theme.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.toggleText, statusType === 'FAILED' && { color: '#FFF' }]}>Giao thất bại</Text>
          </TouchableOpacity>
        </View>

        {/* =========================================
            3. FORM GIAO THÀNH CÔNG
        ========================================= */}
        {statusType === 'SUCCESS' ? (
          <>
            {/* CARD TIỀN COD */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.dotWarning} />
                  <Text style={styles.cardTitleWarning}>TIỀN COD THU THỰC TẾ</Text>
                </View>
                <Text style={styles.expectedText}>Dự kiến: {expectedCod.toLocaleString()} đ</Text>
              </View>

              <View style={styles.codInputWrapper}>
                <TextInput
                  style={styles.codInput}
                  keyboardType="numeric"
                  value={formatMoney(actualCod)}
                  onChangeText={(t) => {
                    setActualCod(t.replace(/[^0-9]/g, ''));
                    setCodMode('MANUAL');
                  }}
                  editable={codMode === 'MANUAL'}
                />
                <Text style={styles.codCurrency}>đ</Text>
              </View>

              {/* Quick Actions cho COD */}
              <View style={styles.quickActionRow}>
                <TouchableOpacity style={[styles.quickBtn, codMode === 'FULL' && styles.quickBtnActive]} onPress={() => setCodMode('FULL')}>
                  <Text style={[styles.quickBtnText, codMode === 'FULL' && styles.quickBtnTextActive]}>Đủ tiền</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, codMode === 'MANUAL' && styles.quickBtnActive]} onPress={() => setCodMode('MANUAL')}>
                  <Text style={[styles.quickBtnText, codMode === 'MANUAL' && styles.quickBtnTextActive]}>Nhập tay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickBtn, codMode === 'ZERO' && styles.quickBtnActive]} onPress={() => setCodMode('ZERO')}>
                  <Text style={[styles.quickBtnText, codMode === 'ZERO' && styles.quickBtnTextActive]}>Không thu</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CARD ẢNH POD */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.dotPrimary} />
                  <Text style={styles.cardTitlePrimary}>ẢNH BẰNG CHỨNG (POD)</Text>
                </View>
                <View style={styles.requiredBadge}><Text style={styles.requiredText}>Bắt buộc</Text></View>
              </View>

              {podUri ? (
                <View style={{ position: 'relative', marginBottom: 15 }}>
                  <Image source={{ uri: podUri }} style={styles.podImage} />
                  <TouchableOpacity style={styles.reCamBtn} onPress={() => navigation.navigate('CameraPOD', { waybill })}>
                    <Ionicons name="camera-reverse" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.cameraBox} onPress={() => navigation.navigate('CameraPOD', { waybill })}>
                  <Ionicons name="camera-outline" size={32} color={theme.primary} />
                  <Text style={styles.cameraBoxTitle}>Chụp ảnh kiện hàng</Text>
                  <Text style={styles.cameraBoxSub}>Ảnh phải thấy rõ mã vận đơn</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.galleryBtn}>
                <Ionicons name="image-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={styles.galleryBtnText}>Chọn từ thư viện</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* =========================================
              4. FORM GIAO THẤT BẠI
          ========================================= */
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.dotDanger} />
                <Text style={styles.cardTitleDanger}>LÝ DO THẤT BẠI</Text>
              </View>
              <View style={styles.requiredBadge}><Text style={styles.requiredText}>Bắt buộc</Text></View>
            </View>
            <TextInput
              style={styles.inputNoteArea}
              multiline
              placeholder="Khách không nghe máy, boom hàng, sai địa chỉ..."
              value={note}
              onChangeText={setNote}
            />
          </View>
        )}

        {/* CARD GHI CHÚ THÊM (Chung) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.dotGray} />
              <Text style={styles.cardTitleGray}>GHI CHÚ THÊM (TÙY CHỌN)</Text>
            </View>
          </View>
          <TextInput
            style={styles.inputNotePlain}
            multiline
            placeholder="Nhập thêm thông tin (nếu có)..."
            value={statusType === 'SUCCESS' ? note : ''}
            onChangeText={statusType === 'SUCCESS' ? setNote : () => { }}
          />
        </View>

      </ScrollView>

      {/* =========================================
          5. FOOTER ACTION BAR CỐ ĐỊNH
      ========================================= */}
      <View style={styles.footer}>
        {statusType === 'SUCCESS' && (
          <View style={styles.summaryBanner}>
            <Text style={styles.summaryBannerText}>Tổng thu: {formatMoney(actualCod)} đ</Text>
            <Ionicons name="checkmark" size={18} color={theme.success} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, statusType === 'FAILED' ? { backgroundColor: theme.danger } : { backgroundColor: theme.success }]}
          onPress={handleConfirm} disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name={statusType === 'SUCCESS' ? "checkbox-outline" : "close-circle-outline"} size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Xác nhận chốt đơn</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  headerArea: { backgroundColor: theme.primary, paddingTop: 50, paddingBottom: 30, position: 'relative', overflow: 'hidden' },
  headerCircleDecoration: { position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

  // Customer Bar (Đè lên viền Header)
  customerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, marginHorizontal: 20, marginTop: -20, padding: 15, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: theme.border, zIndex: 10 },
  custName: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginLeft: 10, flex: 1 },
  custPhone: { fontSize: 14, color: theme.textSecondary, marginHorizontal: 10 },
  codBadge: { backgroundColor: theme.warningBackground, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  codBadgeText: { color: theme.warning, fontSize: 12, fontWeight: 'bold' },

  scrollContent: { padding: 15, paddingTop: 25, paddingBottom: 150 },

  // Status Toggle
  statusToggleCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 6, marginBottom: 15, borderWidth: 1, borderColor: theme.border, elevation: 1 },
  toggleBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  toggleBtnActiveSuccess: { backgroundColor: theme.success, elevation: 2 },
  toggleBtnActiveFail: { backgroundColor: theme.danger, elevation: 2 },
  toggleText: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },

  // Card Chung
  card: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 15, elevation: 1, borderWidth: 1, borderColor: theme.border },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

  dotWarning: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.warning, marginRight: 8 },
  cardTitleWarning: { fontSize: 13, fontWeight: 'bold', color: theme.warning, letterSpacing: 0.5 },

  dotPrimary: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginRight: 8 },
  cardTitlePrimary: { fontSize: 13, fontWeight: 'bold', color: theme.primary, letterSpacing: 0.5 },

  dotDanger: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.danger, marginRight: 8 },
  cardTitleDanger: { fontSize: 13, fontWeight: 'bold', color: theme.danger, letterSpacing: 0.5 },

  dotGray: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.textSecondary, marginRight: 8 },
  cardTitleGray: { fontSize: 13, fontWeight: 'bold', color: theme.textSecondary, letterSpacing: 0.5 },

  expectedText: { fontSize: 13, color: theme.text, fontWeight: '500' },
  requiredBadge: { backgroundColor: theme.dangerBackground, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  requiredText: { color: theme.danger, fontSize: 11, fontWeight: 'bold' },

  // Tiền COD
  codInputWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  codInput: { fontSize: 36, fontWeight: 'bold', color: theme.warning, textAlign: 'center', minWidth: 120 },
  codCurrency: { fontSize: 24, fontWeight: 'bold', color: theme.warning, marginLeft: 8, marginTop: 6 },

  quickActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, alignItems: 'center', borderRadius: 10, marginHorizontal: 4, borderWidth: 1, borderColor: 'transparent' },
  quickBtnActive: { backgroundColor: theme.warningBackground, borderColor: theme.warning },
  quickBtnText: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
  quickBtnTextActive: { color: theme.warning, fontWeight: 'bold' },

  // POD (Ảnh)
  cameraBox: { borderWidth: 1, borderColor: theme.primary, borderStyle: 'dashed', borderRadius: 12, height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primaryBackground, marginBottom: 15 },
  cameraBoxTitle: { color: theme.primary, fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  cameraBoxSub: { color: theme.textSecondary, fontSize: 12 },
  podImage: { width: '100%', height: 250, borderRadius: 12, resizeMode: 'cover' },
  reCamBtn: { position: 'absolute', bottom: 15, right: 15, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },

  galleryBtn: { flexDirection: 'row', backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  galleryBtnText: { color: theme.text, fontWeight: '600', fontSize: 15 },

  // Note
  inputNotePlain: { fontSize: 15, color: theme.text, lineHeight: 22, height: 80, textAlignVertical: 'top' },
  inputNoteArea: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 15, fontSize: 15, color: theme.text, height: 120, textAlignVertical: 'top' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, paddingBottom: 25, backgroundColor: theme.card, borderTopWidth: 1, borderColor: theme.border },
  summaryBanner: { flexDirection: 'row', backgroundColor: theme.successBackground, padding: 12, borderRadius: 8, justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryBannerText: { color: theme.success, fontSize: 13, fontWeight: '600' },

  submitBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});