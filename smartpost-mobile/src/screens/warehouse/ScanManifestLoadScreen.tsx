import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Dimensions, StatusBar, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import UniversalScanner from '../../components/UniversalScanner';
import { warehouseService } from '../../api/services/warehouseService';
import { waybillService } from '../../api/services/waybillService';

const { width } = Dimensions.get('window');
const PLATE_API_TOKEN = process.env.EXPO_PLATE_API_KEY; // Thay bằng token thật

const COLORS = {
  primary: '#254BE0', background: '#FFFFFF', card: '#FFFFFF', textMain: '#1E293B', textSub: '#64748B', border: '#E2E8F0', success: '#10B981', warning: '#F59E0B', danger: '#EF4444'
};

export default function ScanManifestLoadScreen({ navigation }: any) {
  const [isLocked, setIsLocked] = useState(false);
  const [manifestCode, setManifestCode] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [toHubId, setToHubId] = useState('');

  const [hubs, setHubs] = useState<any[]>([]);
  const [scannedBags, setScannedBags] = useState<{ code: string, time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [plateLoading, setPlateLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    waybillService.getHubs().then(setHubs).catch(() => console.log('Lỗi tải danh sách Hub'));
  }, []);

  const handleLock = () => {
    if (!manifestCode) {
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setManifestCode(`MFL-${dateStr}-${randomNum}`);
    }
    if (!vehicleNumber) return Alert.alert('Lỗi', 'Vui lòng nhập hoặc quét biển số xe tải');
    if (!toHubId) return Alert.alert('Lỗi', 'Vui lòng chọn Bưu cục đích đến');
    setIsLocked(true);
  };

  const handleScanBag = async (bagCode: string) => {
    if (!bagCode) return;
    if (!isLocked) return Alert.alert('Khóa an toàn', 'Vui lòng chốt thông tin chuyến xe trước khi quét túi.');
    if (scannedBags.find(item => item.code === bagCode)) return;

    Alert.alert(
      'Xác nhận Bốc Hàng',
      `Chuyển túi ${bagCode} lên xe ${vehicleNumber}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý', onPress: () => {
            const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
            setScannedBags(prev => [{ code: bagCode, time: timeStr }, ...prev]);
          }
        }
      ]
    );
  };

  const handleManualSubmit = () => {
    Keyboard.dismiss();
    if (manualCode.trim()) {
      handleScanBag(manualCode.trim());
      setManualCode('');
    }
  };

  const handleSubmit = async () => {
    if (scannedBags.length === 0) return;
    setLoading(true);
    try {
      await warehouseService.manifestLoad({
        manifest_code: manifestCode,
        to_hub_id: Number(toHubId),
        vehicle_number: vehicleNumber,
        bag_codes: scannedBags.map(b => b.code)
      });
      Alert.alert('Hoàn tất', `Đã chốt chuyến xe ${manifestCode} với ${scannedBags.length} túi.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.detail || 'Lỗi hệ thống khi bốc xe');
    } finally {
      setLoading(false);
    }
  };

  const openPlateScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return Alert.alert('Lỗi', 'Cần quyền Camera để quét biển số!');
    }
    setShowPlateScanner(true);
  };

  const takePlatePicture = async () => {
    if (!cameraRef.current || plateLoading) return;
    setPlateLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('Không chụp được ảnh');

      const formData = new FormData();
      formData.append('upload', { uri: photo.uri, name: 'plate.jpg', type: 'image/jpeg' } as any);
      formData.append('config', JSON.stringify({ region: "vn", mode: "fast" }));

      const response = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${PLATE_API_TOKEN}`, 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setVehicleNumber(data.results[0].plate.toUpperCase());
        setShowPlateScanner(false);
      } else {
        Alert.alert('Lỗi', 'Không nhận diện được biển số. Thử lại gần hơn.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Lỗi API nhận diện biển số.');
    } finally {
      setPlateLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* KHU VỰC CAMERA */}
      <View style={styles.cameraArea}>
        {isLocked ? (
          <UniversalScanner
            title="ĐANG BỐC XE"
            instruction={`Xe: ${vehicleNumber} - Đưa mã TÚI vào khung ngắm`}
            onScan={handleScanBag}
          />
        ) : (
          <View style={styles.cameraOverlayLock}>
            <Ionicons name="bus" size={60} color="rgba(255,255,255,0.5)" />
            <Text style={styles.lockText}>CHỐT THÔNG TIN XE ĐỂ MỞ SCANNER</Text>
          </View>
        )}

        {/* Nút Back nổi */}
        <View style={styles.camHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          {isLocked && <View style={styles.liveBadge}><Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: 'bold' }}>LOADING</Text></View>}
        </View>

        {/* Form nhập thủ công */}
        {isLocked && (
          <View style={styles.manualInputContainer}>
            <View style={styles.inputBox}>
              <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputCam}
                placeholder="Nhập mã túi thủ công..."
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

      {/* BOTTOM SHEET NỔI */}
      <View style={styles.bottomSheet}>
        {!isLocked ? (
          <ScrollView contentContainerStyle={styles.configArea}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCirclePrimary}><Ionicons name="bus" size={20} color={COLORS.primary} /></View>
              <Text style={styles.configTitle}>THÔNG TIN CHUYẾN XE</Text>
            </View>

            <Text style={styles.label}>Mã chuyến (Tùy chọn)</Text>
            <TextInput
              style={styles.inputForm}
              placeholder="Để trống hệ thống sẽ tự tạo..."
              value={manifestCode}
              onChangeText={setManifestCode}
            />

            <Text style={styles.label}>Biển số xe tải</Text>
            <View style={styles.plateInputRow}>
              <TextInput
                style={[styles.inputForm, { flex: 1, marginBottom: 0, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                placeholder="VD: 51C-123.45"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.scanPlateBtn} onPress={openPlateScanner}>
                <Ionicons name="camera" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Chuyến xe sẽ đi đến đâu?</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={toHubId} onValueChange={setToHubId} dropdownIconColor={COLORS.textSub}>
                <Picker.Item label="--- Chọn bưu cục đích ---" value="" color={COLORS.textSub} />
                {hubs.map(h => (
                  <Picker.Item key={h.hub_id} label={`${h.hub_code} - ${h.hub_name}`} value={h.hub_id.toString()} color={COLORS.textMain} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleLock}>
              <Ionicons name="lock-closed" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.startBtnText}>CHỐT THÔNG TIN & BẮT ĐẦU</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Xe: {vehicleNumber}</Text>
                <Text style={styles.sheetSub}>Mã chuyến: <Text style={{ color: COLORS.primary }}>{manifestCode}</Text></Text>
              </View>
              <View style={styles.badgeCount}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{scannedBags.length}</Text></View>
            </View>

            <FlatList
              data={scannedBags}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingTop: 5, paddingBottom: 100 }}
              renderItem={({ item, index }) => {
                const isFirst = index === 0;
                return (
                  <View style={[styles.listItem, isFirst && styles.firstItem]}>
                    <View style={styles.leftInfo}>
                      <View style={[styles.iconCircle, isFirst ? { backgroundColor: '#FFF' } : { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="briefcase" size={20} color={COLORS.primary} />
                      </View>
                      <View>
                        <Text style={[styles.itemCode, isFirst && { color: '#FFF' }]}>{item.code}</Text>
                        <Text style={[styles.itemTime, isFirst && { color: 'rgba(255,255,255,0.8)' }]}>{item.time} • Lên xe</Text>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={isFirst ? '#FFF' : COLORS.success} />
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="barcode-outline" size={60} color={COLORS.border} />
                  <Text style={styles.emptyText}>Đưa mã túi hàng vào Camera để quét</Text>
                </View>
              }
            />

            {scannedBags.length > 0 && (
              <View style={styles.summaryFooter}>
                <TouchableOpacity style={styles.finishBtn} onPress={handleSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="paper-plane" size={22} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.finishBtnText}>XUẤT BẾN & HOÀN TẤT ({scannedBags.length})</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* MODAL CAMERA QUÉT BIỂN SỐ */}
      <Modal visible={showPlateScanner} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back" autofocus="on">
            <View style={styles.plateOverlay}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.guideText}>ĐƯA BIỂN SỐ VÀO KHUNG HÌNH</Text>
              </View>
            </View>
          </CameraView>
          <View style={styles.plateFooter}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowPlateScanner(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>HỦY BỎ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.capturePlateBtn} onPress={takePlatePicture} disabled={plateLoading}>
              {plateLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>CHỤP & NHẬN DIỆN</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  cameraArea: { height: '50%', position: 'relative' },
  camHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { borderWidth: 1, borderColor: COLORS.primary, backgroundColor: 'rgba(37, 75, 224, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  cameraOverlayLock: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  lockText: { color: 'rgba(255,255,255,0.6)', marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },

  manualInputContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.85)', borderRadius: 12, paddingHorizontal: 15, height: 50, marginRight: 10, borderWidth: 1, borderColor: '#334155' },
  inputCam: { flex: 1, color: '#FFF', fontSize: 15 },
  sendBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },

  bottomSheet: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, position: 'relative' },

  configArea: { padding: 25, paddingBottom: 50 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCirclePrimary: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  configTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, marginBottom: 8 },
  inputForm: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 15, height: 50, backgroundColor: '#F8FAFC', marginBottom: 20, fontSize: 15, color: COLORS.textMain },
  plateInputRow: { flexDirection: 'row', marginBottom: 20 },
  scanPlateBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, borderTopRightRadius: 12, borderBottomRightRadius: 12, justifyContent: 'center', alignItems: 'center', height: 50 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: 30, backgroundColor: '#F8FAFC' },

  startBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  startBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: COLORS.border },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 2 },
  sheetSub: { fontSize: 13, color: COLORS.textSub },
  badgeCount: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 12, padding: 16, elevation: 1, borderWidth: 1, borderColor: COLORS.border },
  firstItem: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, elevation: 4 },

  leftInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemCode: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 2 },
  itemTime: { fontSize: 13, color: COLORS.textSub },

  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textSub, marginTop: 10, fontSize: 14, fontStyle: 'italic' },

  summaryFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, padding: 15, borderTopWidth: 1, borderColor: COLORS.border },
  finishBtn: { flexDirection: 'row', backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  plateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  targetFrame: { width: width * 0.8, height: width * 0.5, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.success },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  guideText: { color: '#fff', fontSize: 14, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
  plateFooter: { flexDirection: 'row', padding: 20, backgroundColor: '#111827', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 30 },
  closeModalBtn: { padding: 15 },
  capturePlateBtn: { flex: 1, marginLeft: 20, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' }
});