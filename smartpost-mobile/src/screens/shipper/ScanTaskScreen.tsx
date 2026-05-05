import React from 'react';
import { View, Alert, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../../components/UniversalScanner';
import { waybillService } from '../../api/services/waybillService';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function ScanTaskScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  // Hàm này sẽ được truyền vào prop 'onScan' của UniversalScanner
  const handleScanFindTask = async (scannedCode: string) => {
    try {
      // Tìm kiếm mã vận đơn thông qua API search đã cấu hình
      const res = await waybillService.searchWaybills({
        waybill_code: scannedCode,
        page: 1,
        size: 1
      });

      const waybill = res.items?.[0];

      if (waybill) {
        // Đẩy thẳng vào màn hình Chi tiết giao hàng
        navigation.replace('TaskDetail', { waybill });
      } else {
        Alert.alert('Không tìm thấy', `Mã ${scannedCode} không có trong danh sách cần giao của bạn hoặc không tồn tại.`);
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể tìm kiếm đơn hàng lúc này.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <UniversalScanner
        title="🔍 TÌM NHANH ĐƠN HÀNG"
        instruction="Đưa mã vạch/QR của gói hàng vào khung hình để tìm kiếm và xem chi tiết."
        onScan={handleScanFindTask}
      />

      {/* Nút Quay lại nổi lên trên Camera */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  }
});