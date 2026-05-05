import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function CameraPODScreen({ navigation, route }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  // Nhận waybill từ màn hình trước để in Watermark
  const { waybill } = route.params || {};

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={80} color="#CBD5E1" style={{ marginBottom: 20 }} />
        <Text style={styles.authText}>Ứng dụng cần quyền sử dụng Camera{'\n'}để chụp ảnh bằng chứng giao hàng.</Text>
        <TouchableOpacity style={styles.authBtn} onPress={requestPermission}>
          <Text style={styles.authBtnText}>Cấp Quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      // Giảm quality xuống 0.5 để ảnh nhẹ, upload nhanh mà vẫn đủ nét để đọc thông tin
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPreview(photo?.uri || null);
    } catch (e) {
      console.log("Lỗi chụp ảnh", e);
    } finally {
      setTaking(false);
    }
  };

  const confirmPhoto = () => {
    // Đẩy ngược dữ liệu ảnh về lại màn hình UpdateStatus
    navigation.navigate({
      name: 'UpdateStatus',
      params: { waybill: waybill, podUri: preview },
      merge: true,
    });
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  // MÀN HÌNH XEM TRƯỚC ẢNH VỪA CHỤP
  if (preview) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <View style={styles.previewContainer}>
          <Image source={{ uri: preview }} style={styles.previewImage} />

          {/* WATERMARK ĐÓNG DẤU LÊN ẢNH GIAO DIỆN */}
          <View style={styles.watermark}>
            <View style={styles.watermarkRow}>
              <Ionicons name="cube" size={14} color="#FFF" style={{ marginRight: 5 }} />
              <Text style={styles.watermarkText}>{waybill?.waybill_code || 'N/A'}</Text>
            </View>
            <View style={styles.watermarkRow}>
              <Ionicons name="time" size={14} color="#FFF" style={{ marginRight: 5 }} />
              <Text style={styles.watermarkText}>{new Date().toLocaleString('vi-VN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.actionBtnReject} onPress={() => setPreview(null)}>
            <Ionicons name="refresh-circle" size={24} color="#FFF" />
            <Text style={styles.actionText}>Chụp Lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnAccept} onPress={confirmPhoto}>
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.actionText}>Dùng Ảnh Này</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // MÀN HÌNH CAMERA ĐỂ CHỤP
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        enableTorch={flash === 'on'}
      >
        {/* Nút quay lại & Flash */}
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleFlash}>
            <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={24} color={flash === 'on' ? theme.warning : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* Khung căn chỉnh trên màn hình Camera */}
        <View style={styles.overlay}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.guideText}>Căn chỉnh rõ mã vận đơn và gói hàng</Text>
        </View>

        {/* Nút chụp ảnh */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={taking}>
            {taking ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 30 },
  authText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  authBtn: { backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12 },
  authBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Camera UI
  topActions: { position: 'absolute', top: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  frame: { width: '85%', height: '60%', position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  guideText: { color: '#FFF', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, fontWeight: 'bold' },

  bottomActions: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },

  // Preview UI
  previewContainer: { flex: 1, position: 'relative' },
  previewImage: { flex: 1, resizeMode: 'cover' },

  watermark: { position: 'absolute', bottom: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 10 },
  watermarkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  watermarkText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },

  previewActions: { flexDirection: 'row', backgroundColor: '#000', padding: 20, paddingBottom: 30, justifyContent: 'space-between' },
  actionBtnReject: { flex: 1, flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  actionBtnAccept: { flex: 1, flexDirection: 'row', backgroundColor: theme.success, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});
