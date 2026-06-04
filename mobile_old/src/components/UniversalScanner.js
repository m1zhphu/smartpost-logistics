import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    StyleSheet,
    Text,
    Vibration,
    View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function UniversalScanner({ title, instruction, onScan }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const resetTimerRef = useRef(null);
    const lineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(lineAnim, {
                    toValue: 190,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(lineAnim, {
                    toValue: 0,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => {
            animation.stop();
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
            }
        };
    }, [lineAnim, permission, requestPermission]);

    const handleBarcodeScanned = async (result) => {
        if (isProcessing || !result || !result.data || typeof onScan !== 'function') {
            return;
        }

        Vibration.vibrate(100);
        setIsProcessing(true);

        try {
            await onScan(result.data);
        } finally {
            resetTimerRef.current = setTimeout(() => {
                setIsProcessing(false);
            }, 800);
        }
    };

    if (!permission) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.stateContainer}>
                <View style={styles.permissionIcon}>
                    <Ionicons name="camera-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
                <Text style={styles.permissionText}>Ứng dụng cần camera để quét mã vận đơn và QR.</Text>
                <Text style={styles.permissionHint}>Vui lòng cấp quyền trong thông báo hệ thống.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarCodeScanned={isProcessing ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128'] }}
            />

            <View style={styles.overlay}>
                {title ? <Text style={styles.title}>{title}</Text> : null}

                <View style={styles.scanFrameContainer}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />

                        {!isProcessing ? (
                            <Animated.View
                                style={[
                                    styles.laserLine,
                                    { transform: [{ translateY: lineAnim }] },
                                ]}
                            />
                        ) : null}
                    </View>

                    {isProcessing ? (
                        <View style={styles.processingBadge}>
                            <ActivityIndicator size="small" color="#fff" style={styles.processingSpinner} />
                            <Text style={styles.processingText}>Đang xử lý...</Text>
                        </View>
                    ) : (
                        <Text style={styles.instructionText}>{instruction}</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    stateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 32,
    },
    permissionIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8,
    },
    permissionHint: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        position: 'absolute',
        top: 64,
        left: 24,
        right: 24,
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 6,
    },
    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingBottom: 80,
        position: 'relative',
    },
    scanFrame: {
        width: 260,
        height: 220,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderColor: '#fff',
        zIndex: 5,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    laserLine: {
        position: 'absolute',
        left: 16,
        right: 16,
        top: 14,
        height: 2,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 6,
    },
    instructionText: {
        color: '#fff',
        marginTop: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.35)',
        overflow: 'hidden',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    processingBadge: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 61, 38, 0.92)',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 22,
    },
    processingSpinner: {
        marginRight: 8,
    },
    processingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
