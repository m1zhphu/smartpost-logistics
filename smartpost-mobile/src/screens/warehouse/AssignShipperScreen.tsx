import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, Modal, StatusBar, ActivityIndicator, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../../components/UniversalScanner';
import { deliveryService } from '../../api/services/deliveryService';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../hooks/useAppTheme';

const { width } = Dimensions.get('window');

export default function AssignShipperScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const user = useAuthStore((state: any) => state.user);

  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [shippers, setShippers] = useState<any[]>([]);
  const [filteredShippers, setFilteredShippers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedShipper, setSelectedShipper] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    deliveryService.getShippers()
      .then((data) => {
        setShippers(data);
        setFilteredShippers(data);
      })
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách Shipper của bưu cục này'));
  }, [user]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const query = text.toLowerCase();
    const filtered = shippers.filter(s =>
      (s.full_name && s.full_name.toLowerCase().includes(query)) ||
      (s.username && s.username.toLowerCase().includes(query)) ||
      (s.phone && s.phone.includes(query))
    );
    setFilteredShippers(filtered);
  };

  const handleScan = async (code: string) => {
    if (!selectedShipper) return Alert.alert('Lỗi', 'Vui lòng chọn Shipper trước khi quét đơn!');
    if (scannedCodes.includes(code)) return;
    setScannedCodes(prev => [code, ...prev]);
  };

  const handleConfirmAssign = async () => {
    if (!selectedShipper) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn Shipper trước.');
    if (scannedCodes.length === 0) return Alert.alert('Thiếu thông tin', 'Vui lòng quét ít nhất 1 vận đơn.');

    setLoading(true);
    try {
      await deliveryService.assignShipper({ shipper_id: selectedShipper.user_id, waybill_codes: scannedCodes });
      Alert.alert('Thành công', `Đã bàn giao ${scannedCodes.length} đơn cho ${selectedShipper.full_name || selectedShipper.username}`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể phân công đơn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* KHU VỰC CAMERA */}
      <View style={styles.scannerWrapper}>
        <UniversalScanner
          title="BÀN GIAO ĐƠN"
          instruction={selectedShipper ? `Đang quét cho: ${selectedShipper.full_name || selectedShipper.username}` : "Bấm nút bên dưới chọn Shipper trước khi quét"}
          onScan={handleScan}
        />
        <View style={styles.camHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          {selectedShipper && <View style={styles.liveBadge}><Text style={{ color: theme.warning, fontSize: 12, fontWeight: 'bold' }}>SCANNING</Text></View>}
        </View>
      </View>

      {/* BOTTOM SHEET */}
      <View style={styles.bottomSheet}>
        <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <View style={styles.selectorIcon}>
            <Ionicons name="bicycle" size={24} color={selectedShipper ? theme.primary : theme.textSecondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 'bold', marginBottom: 2 }}>NHÂN VIÊN GIAO HÀNG</Text>
            <Text style={[styles.selectorText, !selectedShipper && { color: theme.textSecondary, fontWeight: 'normal' }]}>
              {selectedShipper ? (selectedShipper.full_name || selectedShipper.username) : "Nhấn để chọn Shipper..."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Danh sách đơn bàn giao</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.badgeCount}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{scannedCodes.length}</Text></View>
            {scannedCodes.length > 0 && (
              <TouchableOpacity onPress={() => setScannedCodes([])} style={{ marginLeft: 15 }}>
                <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 13 }}>Xóa hết</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={scannedCodes}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <View style={[styles.listItem, index === 0 && styles.firstItem]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.itemIconWrap, index === 0 ? { backgroundColor: '#FFF' } : { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="cube" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.itemText, index === 0 && { color: '#FFF' }]}>{item}</Text>
              </View>
              <TouchableOpacity onPress={() => setScannedCodes(scannedCodes.filter(c => c !== item))}>
                <Ionicons name="close-circle" size={26} color={index === 0 ? 'rgba(255,255,255,0.5)' : theme.border} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="barcode-outline" size={60} color={theme.border} />
              <Text style={styles.emptyText}>Đưa mã vận đơn vào Camera để quét</Text>
            </View>
          }
        />

        {scannedCodes.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAssign} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-done" size={22} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>XÁC NHẬN BÀN GIAO</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 🚀 MODAL CHỌN SHIPPER (CHUẨN KEYBOARD AVOIDING) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn Shipper Giao Hàng</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <Ionicons name="close-circle" size={20} color={theme.border} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredShippers}
                keyExtractor={(s) => s.user_id.toString()}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.shipperItem} onPress={() => { setSelectedShipper(item); setModalVisible(false); }}>
                    <View style={styles.shipperAvatar}><Ionicons name="person" size={20} color={theme.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shipperName}>{item.full_name || item.username}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, marginLeft: 15 }}>{item.phone || 'Không có SĐT'}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={selectedShipper?.user_id === item.user_id ? theme.success : 'transparent'} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary, fontStyle: 'italic' }}>Không tìm thấy Shipper phù hợp</Text>
                }
              />
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scannerWrapper: { height: '45%', position: 'relative' },
  camHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { borderWidth: 1, borderColor: theme.warning, backgroundColor: theme.warning + '33', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  bottomSheet: { flex: 1, backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20, position: 'relative' },

  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 25, elevation: 2 },
  selectorIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  selectorText: { fontSize: 16, fontWeight: 'bold', color: theme.text },

  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text },
  badgeCount: { backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: theme.card, borderRadius: 16, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: theme.border },
  firstItem: { backgroundColor: theme.primary, borderColor: theme.primary, elevation: 4 },
  itemIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemText: { fontSize: 16, fontWeight: 'bold', color: theme.text },

  emptyWrap: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: theme.textSecondary, marginTop: 10, fontSize: 14, fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: theme.background, borderTopWidth: 1, borderColor: theme.border },
  confirmBtn: { flexDirection: 'row', backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, fontSize: 15, color: theme.text },

  shipperItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: theme.border },
  shipperAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' },
  shipperName: { fontSize: 16, fontWeight: 'bold', marginLeft: 15, color: theme.text, marginBottom: 2 }
});