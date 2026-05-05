import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, StatusBar, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../../components/UniversalScanner';
import { warehouseService } from '../../api/services/warehouseService';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function ScanInHubScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const [scannedItems, setScannedItems] = useState<{ code: string, weight: number, time: string }[]>([]);
  const [manualCode, setManualCode] = useState('');

  const totalWeight = scannedItems.reduce((sum, item) => sum + (item.weight || 0), 0);

  const handleScanInHub = async (waybillCode: string) => {
    if (!waybillCode) return;
    if (scannedItems.find(item => item.code === waybillCode)) return;

    try {
      const data = await warehouseService.scanInHub(waybillCode, 'Nhập kho qua App');
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });

      setScannedItems(prev => [{ code: data.waybill_code, weight: data.actual_weight, time: timeStr }, ...prev]);
    } catch (error: any) {
      Alert.alert('Lỗi nhập kho', error.response?.data?.detail || 'Không thể xác nhận đơn này.');
    }
  };

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (manualCode.trim()) {
      handleScanInHub(manualCode.trim());
      setManualCode('');
    }
  };

  const handleClearAll = () => {
    if (scannedItems.length === 0) return;
    Alert.alert('Xác nhận', 'Bạn muốn xóa toàn bộ lịch sử quét của phiên làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa tất cả', style: 'destructive', onPress: () => setScannedItems([]) }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* =========================================
          KHU VỰC CAMERA (Tối ưu theo thiết kế ảnh)
      ========================================= */}
      <View style={styles.cameraArea}>
        <UniversalScanner title="" instruction="Đưa mã vạch vào khung để quét" onScan={handleScanInHub} />

        {/* Header đè lên Camera */}
        <View style={styles.camHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>NHẬP KHO</Text>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>In-Hub Scanner</Text>
          </View>
          <View style={styles.liveBadge}><Text style={{ color: theme.success, fontSize: 12, fontWeight: 'bold' }}>LIVE</Text></View>
        </View>

        {/* Form nhập thủ công đè lên Camera */}
        <View style={styles.manualInputContainer}>
          <View style={styles.inputBox}>
            <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Nhập mã thủ công..."
              placeholderTextColor="#94A3B8"
              value={manualCode}
              onChangeText={setManualCode}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={handleManualSubmit}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================================
          KHU VỰC BOTTOM SHEET (Danh sách & Thống kê)
      ========================================= */}
      <View style={styles.bottomSheet}>
        {/* Thanh Header của danh sách */}
        <View style={styles.sheetHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sheetTitle}>Đã quét thành công</Text>
            <View style={styles.badgeCount}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{scannedItems.length}</Text></View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.outlineBtn} onPress={handleClearAll}><Text style={styles.outlineBtnText}>Xóa tất cả</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { marginLeft: 8 }]}><Text style={styles.outlineBtnText}>Xuất DS</Text></TouchableOpacity>
          </View>
        </View>

        {/* Danh sách Item */}
        <FlatList
          data={scannedItems}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: 100 }}
          renderItem={({ item, index }) => {
            const isFirst = index === 0;
            return (
              <View style={[styles.listItem, isFirst && styles.firstItem]}>
                {isFirst && (
                  <View style={styles.firstItemTag}>
                    <View style={styles.dot} />
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>VỪA QUÉT XONG</Text>
                  </View>
                )}

                <View style={[styles.itemContent, isFirst && { paddingTop: 30 }]}>
                  <View style={styles.leftInfo}>
                    <View style={[styles.iconCircle, isFirst ? { backgroundColor: '#FFF' } : { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="checkmark" size={20} color={isFirst ? theme.primary : theme.success} />
                    </View>
                    <View>
                      <Text style={[styles.itemCode, isFirst && { color: '#FFF' }]}>{item.code}</Text>
                      <Text style={[styles.itemTime, isFirst && { color: 'rgba(255,255,255,0.8)' }]}>{item.time} • Nhập kho qua App</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.itemWeight, isFirst && { color: '#FFF' }]}>{item.weight.toFixed(1)} kg</Text>
                    <Text style={[styles.itemWeightSub, isFirst && { color: 'rgba(255,255,255,0.8)' }]}>thực tế</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="scan-circle-outline" size={60} color={theme.border} />
              <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Chưa có kiện hàng nào</Text>
            </View>
          }
        />

        {/* Thanh chốt tổng khối lượng cố định ở đáy */}
        <View style={styles.summaryFooter}>
          <Text style={styles.summaryLabel}>Tổng khối lượng phiên này</Text>
          <Text style={styles.summaryValue}>{totalWeight.toFixed(1)} kg <Text style={{ fontWeight: '400' }}> / {scannedItems.length} kiện</Text></Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Camera Area
  cameraArea: { height: '52%', position: 'relative' },
  camHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { borderWidth: 1, borderColor: theme.success, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  manualInputContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.85)', borderRadius: 12, paddingHorizontal: 15, height: 50, marginRight: 10, borderWidth: 1, borderColor: '#334155' },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  sendBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },

  // Bottom Sheet
  bottomSheet: { flex: 1, backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, position: 'relative' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  badgeCount: { backgroundColor: theme.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  outlineBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
  outlineBtnText: { color: theme.text, fontSize: 13, fontWeight: '500' },

  // List Item
  listItem: { backgroundColor: theme.card, borderRadius: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: theme.border, position: 'relative', overflow: 'hidden' },
  firstItem: { backgroundColor: theme.primary, borderColor: theme.primary, elevation: 5 },
  firstItemTag: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.15)', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 15 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF', marginRight: 6 },

  itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  leftInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemCode: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
  itemTime: { fontSize: 12, color: theme.textSecondary },
  itemWeight: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  itemWeightSub: { fontSize: 12, color: theme.textSecondary, textAlign: 'right' },

  // Footer
  summaryFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderColor: theme.border },
  summaryLabel: { fontSize: 15, color: theme.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: theme.text },
});