import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../../components/UniversalScanner';
import { warehouseService } from '../../api/services/warehouseService';
import { useAppTheme } from '../../hooks/useAppTheme';

interface ExpectedBag {
  bag_code: string;
  is_scanned: boolean;
}

export default function ScanManifestUnloadScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const [isLocked, setIsLocked] = useState(false);
  const [manifestCode, setManifestCode] = useState('');

  const [incomingManifests, setIncomingManifests] = useState<any[]>([]);
  const [expectedBags, setExpectedBags] = useState<ExpectedBag[]>([]);
  const [scannedCount, setScannedCount] = useState(0);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchIncomingManifests();
  }, []);

  const fetchIncomingManifests = async () => {
    try {
      const data = await warehouseService.getIncomingManifests();
      const items = data.items || data;
      setIncomingManifests(items);
      if (items.length > 0 && !manifestCode) {
        setManifestCode(items[0].manifest_code);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách chuyến xe đang tới.');
    }
  };

  const handleLockAndFetchBags = async () => {
    if (!manifestCode) return Alert.alert('Lỗi', 'Vui lòng chọn chuyến xe đang cập bến!');

    setLoadingConfig(true);
    try {
      const res = await warehouseService.getManifestBags(manifestCode);
      const bagsData = res.items || res;
      const formattedBags = bagsData.map((b: any) => ({ bag_code: b.bag_code, is_scanned: false }));

      setExpectedBags(formattedBags);
      setScannedCount(0);
      setIsLocked(true);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách túi của chuyến xe này.');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleUnlock = () => {
    Alert.alert('Cảnh báo', 'Đổi chuyến xe sẽ xóa toàn bộ dữ liệu kiểm đếm hiện tại. Bạn có chắc chắn?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý', style: 'destructive', onPress: () => {
          setIsLocked(false);
          setExpectedBags([]);
          setScannedCount(0);
        }
      }
    ]);
  };

  const handleScanBag = async (scannedCode: string) => {
    if (!scannedCode || !isLocked) return;

    const bagIndex = expectedBags.findIndex(b => b.bag_code === scannedCode);

    if (bagIndex === -1) {
      return Alert.alert('⛔ LẠC LOÀI', `Túi hàng [${scannedCode}] KHÔNG THUỘC chuyến xe này!`);
    }

    if (expectedBags[bagIndex].is_scanned) return;

    const newExpectedBags = [...expectedBags];
    newExpectedBags[bagIndex].is_scanned = true;

    // Đẩy túi vừa quét lên đầu tiên
    const scannedBag = newExpectedBags.splice(bagIndex, 1)[0];
    newExpectedBags.unshift(scannedBag);

    setExpectedBags(newExpectedBags);
    setScannedCount(prev => prev + 1);
  };

  const handleSubmit = async () => {
    const missingCount = expectedBags.length - scannedCount;

    if (missingCount > 0) {
      Alert.alert(
        '⚠️ CẢNH BÁO THIẾU HÀNG',
        `Khai báo: ${expectedBags.length} túi\nThực nhận: ${scannedCount} túi\nTHIẾU: ${missingCount} TÚI.\n\nChốt sổ dỡ hàng?`,
        [
          { text: 'Tiếp tục quét', style: 'cancel' },
          { text: 'Chốt số lượng', onPress: executeUnload, style: 'destructive' }
        ]
      );
    } else {
      Alert.alert('Xác nhận', `Xác nhận dỡ đủ ${scannedCount} túi xuống kho?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: executeUnload }
      ]);
    }
  };

  const executeUnload = async () => {
    setSubmitLoading(true);
    try {
      const actualScannedCodes = expectedBags.filter(b => b.is_scanned).map(b => b.bag_code);
      await warehouseService.manifestUnload({
        manifest_code: manifestCode,
        bag_codes: actualScannedCodes
      });

      Alert.alert('Thành công', 'Thao tác DỠ HÀNG hoàn tất!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.detail || 'Lỗi hệ thống khi dỡ hàng');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* KHU VỰC CAMERA */}
      <View style={styles.cameraArea}>
        {isLocked ? (
          <UniversalScanner
            title="ĐANG DỠ HÀNG"
            instruction={`Xe: ${manifestCode}`}
            onScan={handleScanBag}
          />
        ) : (
          <View style={styles.cameraOverlayLock}>
            <Ionicons name="download" size={60} color="rgba(255,255,255,0.5)" />
            <Text style={styles.lockText}>CHỌN CHUYẾN XE ĐỂ KIỂM ĐẾM</Text>
          </View>
        )}

        <View style={styles.camHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          {isLocked && <View style={styles.liveBadge}><Text style={{ color: theme.success, fontSize: 12, fontWeight: 'bold' }}>UNLOADING</Text></View>}
        </View>
      </View>

      {/* BOTTOM SHEET NỔI */}
      <View style={styles.bottomSheet}>
        {!isLocked ? (
          <ScrollView contentContainerStyle={styles.configArea}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleSuccess}><Ionicons name="download" size={20} color={theme.success} /></View>
              <Text style={styles.configTitle}>XE TẢI ĐANG CẬP BẾN</Text>
            </View>

            <Text style={styles.label}>Chọn mã chuyến xe muốn dỡ hàng:</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={manifestCode} onValueChange={setManifestCode} dropdownIconColor={theme.textSecondary}>
                <Picker.Item label="--- Chọn chuyến xe ---" value="" color={theme.textSecondary} />
                {incomingManifests.map(m => (
                  <Picker.Item key={m.manifest_code} label={`${m.manifest_code} (${m.vehicle_number || 'N/A'})`} value={m.manifest_code} color={theme.text} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleLockAndFetchBags} disabled={loadingConfig}>
              {loadingConfig ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="sync" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.startBtnText}>TẢI DỮ LIỆU & BẮT ĐẦU</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Tiến độ dỡ hàng</Text>
                <Text style={styles.sheetSub}>
                  Đã quét: <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{scannedCount}</Text> / {expectedBags.length}
                </Text>
              </View>
              <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock}>
                <Ionicons name="refresh" size={16} color={theme.danger} style={{ marginRight: 4 }} />
                <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 12 }}>ĐỔI XE</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={expectedBags}
              keyExtractor={(item) => item.bag_code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingTop: 5, paddingBottom: 100 }}
              renderItem={({ item }) => (
                <View style={[styles.listItem, item.is_scanned ? styles.scannedItem : styles.pendingItem]}>
                  <View style={styles.leftInfo}>
                    <View style={[styles.iconCircle, { backgroundColor: item.is_scanned ? theme.success : '#F1F5F9' }]}>
                      <Ionicons name={item.is_scanned ? "checkmark" : "time-outline"} size={20} color={item.is_scanned ? '#FFF' : theme.textSecondary} />
                    </View>
                    <View>
                      <Text style={[styles.itemCode, { color: item.is_scanned ? theme.success : theme.textSecondary }]}>{item.is_scanned ? 'ĐÃ DỠ HÀNG' : 'CHỜ QUÉT'}</Text>
                      <Text style={[styles.itemTime, { color: item.is_scanned ? theme.text : theme.textSecondary }]}>{item.bag_code}</Text>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Chuyến xe này không có túi hàng nào</Text>}
            />

            <View style={styles.summaryFooter}>
              <TouchableOpacity style={styles.finishBtn} onPress={handleSubmit} disabled={submitLoading}>
                {submitLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkbox-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.finishBtnText}>CHỐT SỔ NHẬN HÀNG</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  cameraArea: { height: '50%', position: 'relative' },
  camHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { borderWidth: 1, borderColor: theme.success, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  cameraOverlayLock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  lockText: { color: 'rgba(255,255,255,0.6)', marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },

  bottomSheet: { flex: 1, backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, position: 'relative' },

  configArea: { padding: 25, paddingBottom: 50 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircleSuccess: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  configTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },

  label: { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, marginBottom: 30, backgroundColor: '#F8FAFC' },

  startBtn: { flexDirection: 'row', backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  startBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: theme.border },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
  sheetSub: { fontSize: 14, color: theme.textSecondary },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, marginBottom: 12, padding: 16, borderWidth: 1 },
  scannedItem: { backgroundColor: '#ECFDF5', borderColor: theme.success, elevation: 2 },
  pendingItem: { backgroundColor: theme.card, borderColor: theme.border },

  leftInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemCode: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  itemTime: { fontSize: 16, fontWeight: 'bold' },

  emptyText: { textAlign: 'center', color: theme.textSecondary, marginTop: 40, fontStyle: 'italic' },

  summaryFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.background, padding: 15, borderTopWidth: 1, borderColor: theme.border },
  finishBtn: { flexDirection: 'row', backgroundColor: theme.success, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});