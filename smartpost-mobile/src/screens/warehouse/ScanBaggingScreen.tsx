import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, StatusBar, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import UniversalScanner from '../../components/UniversalScanner';
import { warehouseService } from '../../api/services/warehouseService';
import { waybillService } from '../../api/services/waybillService';

const COLORS = {
  primary: '#254BE0', background: '#FFFFFF', card: '#FFFFFF', textMain: '#1E293B', textSub: '#64748B', border: '#E2E8F0', success: '#10B981', danger: '#EF4444', warning: '#F59E0B'
};

export default function ScanBaggingScreen({ navigation }: any) {
  const [isLocked, setIsLocked] = useState(false);
  const [destHubId, setDestHubId] = useState<string>('');
  const [hubs, setHubs] = useState<any[]>([]);

  const [bagCode, setBagCode] = useState<string>('');
  const [scannedItems, setScannedItems] = useState<{ code: string, time: string }[]>([]);
  const [manualCode, setManualCode] = useState('');

  // Lấy danh sách bưu cục để cho vào Picker
  useEffect(() => {
    waybillService.getHubs().then(setHubs).catch(() => console.log('Lỗi tải danh sách Hub'));
  }, []);

  const handleStartBagging = () => {
    if (!destHubId) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn Bưu cục đích đến trước khi đóng túi!');
    setIsLocked(true);
  };

  const handleScanItem = async (waybillCode: string) => {
    if (!waybillCode) return;
    if (!isLocked) return Alert.alert('Khóa an toàn', 'Vui lòng chọn Bưu cục đích và bấm BẮT ĐẦU ĐÓNG TÚI trước khi quét.');
    if (scannedItems.find(item => item.code === waybillCode)) return;

    try {
      const data = await warehouseService.scanBagging({
        bag_code: bagCode,
        destination_hub_id: Number(destHubId),
        waybill_codes: [waybillCode],
        note: 'Đóng túi qua App'
      });

      // Nếu là mã đầu tiên, backend sẽ trả về mã túi mới tạo
      if (!bagCode && data.bag_code) {
        setBagCode(data.bag_code);
      }

      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
      setScannedItems(prev => [{ code: waybillCode, time: timeStr }, ...prev]);
    } catch (error: any) {
      Alert.alert('Lỗi đóng túi', error.response?.data?.detail || 'Không thể quét đơn này vào túi.');
    }
  };

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (manualCode.trim()) {
      handleScanItem(manualCode.trim());
      setManualCode('');
    }
  };

  const finishBagging = () => {
    if (scannedItems.length === 0) return;
    Alert.alert(
      'Chốt Túi Hàng',
      `Bạn có chắc chắn muốn khóa và chốt túi:\n📦 ${bagCode}\nĐang có ${scannedItems.length} đơn hàng?`,
      [
        { text: 'Kiểm tra lại', style: 'cancel' },
        {
          text: 'Chốt & Khóa Túi', style: 'destructive', onPress: () => {
            Alert.alert('Thành công', `Đã khóa túi ${bagCode} thành công!`);
            setBagCode('');
            setScannedItems([]);
            setIsLocked(false);
            setDestHubId('');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* =========================================
          KHU VỰC CAMERA Đè Manual Input
      ========================================= */}
      <View style={styles.cameraArea}>
        {isLocked ? (
          <UniversalScanner
            title={bagCode ? `ĐANG ĐÓNG TÚI` : "QUÉT TẠO TÚI MỚI"}
            instruction={bagCode ? `Túi: ${bagCode} - Quét đơn tiếp theo` : "Quét đơn hàng đầu tiên để tạo túi"}
            onScan={handleScanItem}
          />
        ) : (
          <View style={styles.cameraOverlayLock}>
            <Ionicons name="lock-closed" size={60} color="rgba(255,255,255,0.5)" />
            <Text style={styles.lockText}>CHỌN BƯU CỤC ĐỂ MỞ SCANNER</Text>
          </View>
        )}

        {/* Nút Back nổi */}
        <View style={styles.camHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          {isLocked && <View style={styles.liveBadge}><Text style={{ color: COLORS.warning, fontSize: 12, fontWeight: 'bold' }}>BAGGING</Text></View>}
        </View>

        {/* Input nhập tay đè lên Camera */}
        {isLocked && (
          <View style={styles.manualInputContainer}>
            <View style={styles.inputBox}>
              <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mã đơn thủ công..."
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
        )}
      </View>

      {/* =========================================
          BOTTOM SHEET NỔI CÚP LÊN
      ========================================= */}
      <View style={styles.bottomSheet}>

        {/* Khung cấu hình Bưu cục (Chỉ hiện khi chưa khóa) */}
        {!isLocked ? (
          <View style={styles.configArea}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleWarning}><Ionicons name="briefcase" size={20} color={COLORS.warning} /></View>
              <Text style={styles.configTitle}>THIẾT LẬP ĐÓNG TÚI</Text>
            </View>

            <Text style={styles.label}>Túi này sẽ được vận chuyển tới đâu?</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={destHubId} onValueChange={(val) => setDestHubId(val)} dropdownIconColor={COLORS.textSub}>
                <Picker.Item label="--- Chọn Bưu Cục Đích ---" value="" color={COLORS.textSub} />
                {hubs.map(h => (
                  <Picker.Item key={h.hub_id} label={`${h.hub_code} - ${h.hub_name}`} value={h.hub_id.toString()} color={COLORS.textMain} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleStartBagging}>
              <Ionicons name="scan-circle-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.startBtnText}>BẮT ĐẦU ĐÓNG TÚI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Danh sách đã quét (Hiện khi đã khóa) */
          <>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Chi tiết túi hàng</Text>
                {bagCode ? <Text style={styles.bagCodeText}>Mã: <Text style={{ color: COLORS.primary }}>{bagCode}</Text></Text> : <Text style={{ color: COLORS.textSub, fontSize: 13 }}>Đang chờ mã túi...</Text>}
              </View>
              <View style={styles.badgeCount}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{scannedItems.length}</Text></View>
            </View>

            <FlatList
              data={scannedItems}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingTop: 5, paddingBottom: 100 }}
              renderItem={({ item, index }) => {
                const isFirst = index === 0;
                return (
                  <View style={[styles.listItem, isFirst && styles.firstItem]}>
                    <View style={styles.leftInfo}>
                      <View style={[styles.iconCircle, isFirst ? { backgroundColor: '#FFF' } : { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="cube" size={20} color={isFirst ? COLORS.warning : COLORS.warning} />
                      </View>
                      <View>
                        <Text style={[styles.itemCode, isFirst && { color: '#FFF' }]}>{item.code}</Text>
                        <Text style={[styles.itemTime, isFirst && { color: 'rgba(255,255,255,0.8)' }]}>{item.time} • Đóng túi</Text>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={isFirst ? '#FFF' : COLORS.success} />
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="briefcase-outline" size={60} color={COLORS.border} />
                  <Text style={styles.emptyText}>Quét mã kiện hàng để cho vào túi</Text>
                </View>
              }
            />

            {/* Footer Nút Chốt Túi */}
            {scannedItems.length > 0 && (
              <View style={styles.summaryFooter}>
                <TouchableOpacity style={styles.finishBtn} onPress={finishBagging}>
                  <Ionicons name="lock-closed" size={22} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.finishBtnText}>CHỐT TÚI & KHÓA ({scannedItems.length})</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Camera Area
  cameraArea: { height: '50%', position: 'relative' },
  camHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { borderWidth: 1, borderColor: COLORS.warning, backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  cameraOverlayLock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  lockText: { color: 'rgba(255,255,255,0.6)', marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },

  manualInputContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.85)', borderRadius: 12, paddingHorizontal: 15, height: 50, marginRight: 10, borderWidth: 1, borderColor: '#334155' },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  sendBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },

  // Bottom Sheet
  bottomSheet: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, position: 'relative' },

  // Config Area (Chưa lock)
  configArea: { padding: 25 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircleWarning: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  configTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 10 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: 30, backgroundColor: '#F8FAFC' },
  startBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  startBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // List Area (Đã lock)
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: COLORS.border },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 2 },
  bagCodeText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
  badgeCount: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 12, padding: 16, elevation: 1, borderWidth: 1, borderColor: COLORS.border },
  firstItem: { backgroundColor: COLORS.warning, borderColor: COLORS.warning, elevation: 4 },

  leftInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemCode: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 2 },
  itemTime: { fontSize: 13, color: COLORS.textSub },

  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textSub, marginTop: 10, fontSize: 14, fontStyle: 'italic' },

  // Footer Button
  summaryFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, padding: 15, borderTopWidth: 1, borderColor: COLORS.border },
  finishBtn: { flexDirection: 'row', backgroundColor: COLORS.danger, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});