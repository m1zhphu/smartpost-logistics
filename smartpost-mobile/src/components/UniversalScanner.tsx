import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Vibration, Animated, Easing } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';

interface UniversalScannerProps {
  title?: string;
  instruction: string;
  onScan: (code: string) => Promise<void>;
}

const COLORS = {
  primary: '#254BE0',
  laser: '#3B82F6', // Màu xanh lơ sáng cho tia laser và góc
};

export default function UniversalScanner({ title, instruction, onScan }: UniversalScannerProps) {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🚀 ANIMATION TIA LASER CHẠY DỌC
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();

    // Cấu hình vòng lặp cho tia Laser
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 200, // Chiều cao của khung ngắm
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ])
    ).start();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128', 'qr'],
    onCodeScanned: async (codes) => {
      if (isProcessing || codes.length === 0 || !codes[0].value) return;

      // Rung nhẹ khi quét thành công
      Vibration.vibrate(100);

      setIsProcessing(true);
      try {
        await onScan(codes[0].value);
      } finally {
        setTimeout(() => setIsProcessing(false), 800);
      }
    }
  });

  if (!hasPermission) return <View style={styles.center}><Text style={{ color: '#FFF' }}>Đang chờ cấp quyền Camera...</Text></View>;
  if (device == null) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isProcessing}
        codeScanner={codeScanner}
        enableZoomGesture={true}
      />

      <View style={styles.overlay}>
        {title ? <Text style={styles.titleText}>{title}</Text> : null}

        {/* KHUNG NGẮM CÓ TIA LASER */}
        <View style={styles.reticleFrame}>
          {/* 4 Góc xanh chuẩn thiết kế */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Tia Laser chạy dọc (Chỉ hiện khi đang không xử lý) */}
          {!isProcessing && (
            <Animated.View style={[styles.laserLine, { transform: [{ translateY: lineAnim }] }]} />
          )}
        </View>

        {isProcessing ? (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.processingText}>Đang xử lý...</Text>
          </View>
        ) : (
          <Text style={styles.instructionText}>{instruction}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  container: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', // Nền tối lại để làm nổi bật khung ngắm
    justifyContent: 'center',
    alignItems: 'center'
  },

  titleText: { position: 'absolute', top: 40, color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },

  // KHUNG NGẮM
  reticleFrame: {
    width: 250,
    height: 200,
    position: 'relative',
    marginBottom: 30
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.laser },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },

  // TIA LASER
  laserLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.laser,
    shadowColor: COLORS.laser,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },

  instructionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5
  },

  processingBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5
  },
  processingText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});