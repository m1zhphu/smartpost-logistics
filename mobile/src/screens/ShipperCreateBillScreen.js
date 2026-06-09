import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    FlatList,
    Alert,
    Dimensions,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { ADMIN_ENDPOINTS } from '../constants/adminEndpoints';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function ShipperCreateBillScreen({ route, navigation }) {
    const { billType, requestCode } = route.params; // e.g. "Tạo bill tổng"
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    
    const [scannedList, setScannedList] = useState([]);
    const [manualCode, setManualCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Sub tabs state
    const [activeTab, setActiveTab] = useState(billType.includes('tổng') ? 'Bill tổng' : 'Bill lẻ');

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    const handleAddManual = () => {
        if (!manualCode.trim()) return;
        if (scannedList.find(i => i.code === manualCode.trim())) {
            Toast.show({ type: 'info', text1: 'Mã đã tồn tại', text2: 'Mã bill này đã được quét trước đó' });
            return;
        }
        setScannedList(prev => [...prev, { id: Date.now().toString(), code: manualCode.trim() }]);
        setManualCode('');
    };

    const removeScannedItem = (id) => {
        setScannedList(prev => prev.filter(item => item.id !== id));
    };

    const extractBillCode = async (uri) => {
        try {
            const formData = new FormData();
            const cleanUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
            const filename = cleanUri.split('/').pop() || 'bill.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('file', { uri: cleanUri, name: filename, type });

            const response = await fetch(ADMIN_ENDPOINTS.EXTRACT, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
            });

            const textResponse = await response.text();

            if (!response.ok) {
                throw new Error(`SERVER_${response.status}_${textResponse}`);
            }

            const data = JSON.parse(textResponse);
            
            // Assume the OCR returns tracking_number or similar
            const code = data.tracking_number || data.ma_bill || data.sender?.phone || `OCR_${Date.now()}`;
            
            if (scannedList.find(i => i.code === code)) {
                Toast.show({ type: 'info', text1: 'Mã đã tồn tại' });
            } else {
                setScannedList(prev => [...prev, { id: Date.now().toString(), code: code }]);
                Toast.show({ type: 'success', text1: 'Quét thành công', text2: `Mã: ${code}` });
            }
        } catch (error) {
            console.log("OCR Error:", error);
            Toast.show({ type: 'error', text1: 'Lỗi nhận diện mã', text2: 'Vui lòng thử lại hoặc nhập tay' });
        }
    };

    const handleScan = async () => {
        if (!cameraRef.current || isProcessing || !isCameraReady) return;

        try {
            setIsProcessing(true);
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
            
            // Resize image to make it faster to process
            const manipResult = await manipulateAsync(
                photo.uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.7, format: SaveFormat.JPEG }
            );

            await extractBillCode(manipResult.uri);

        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi chụp ảnh' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = () => {
        if (scannedList.length === 0) {
            Alert.alert("Lưu ý", "Danh sách rỗng, vui lòng quét hoặc nhập mã bill trước khi lưu.");
            return;
        }

        // Mock saving
        Toast.show({ type: 'success', text1: 'Đã lưu đơn hàng', text2: 'Chức năng đang chờ backend phát triển' });
        navigation.goBack();
    };

    if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    
    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={50} color="#666" />
                <Text style={styles.permissionText}>Cần cấp quyền Camera để quét mã</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.btnPermission}>
                    <Text style={styles.btnPermissionText}>CẤP QUYỀN</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tạo mới đơn hàng</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'Bill tổng' && styles.activeTab]}
                    onPress={() => setActiveTab('Bill tổng')}
                >
                    <Text style={[styles.tabText, activeTab === 'Bill tổng' && styles.activeTabText]}>Bill tổng</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'Bill lẻ' && styles.activeTab]}
                    onPress={() => setActiveTab('Bill lẻ')}
                >
                    <Text style={[styles.tabText, activeTab === 'Bill lẻ' && styles.activeTabText]}>Bill lẻ</Text>
                </TouchableOpacity>
            </View>

            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    ref={cameraRef}
                    onCameraReady={() => setIsCameraReady(true)}
                >
                    <View style={styles.cameraOverlay}>
                        <View style={styles.scanTarget} />
                    </View>
                </CameraView>
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="white" />
                        <Text style={{ color: 'white', marginTop: 10 }}>Đang nhận diện...</Text>
                    </View>
                )}
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Nhập mã barcode cần quét</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Quét mã hoặc nhập tay"
                        value={manualCode}
                        onChangeText={setManualCode}
                    />
                    <TouchableOpacity style={styles.scanBtn} onPress={manualCode ? handleAddManual : handleScan} disabled={isProcessing}>
                        {manualCode ? (
                            <Ionicons name="add" size={20} color="white" />
                        ) : (
                            <Ionicons name="scan" size={20} color="white" />
                        )}
                        <Text style={styles.scanBtnText}>{manualCode ? 'Thêm' : 'Quét mã'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scanned List */}
            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>DANH SÁCH ĐÃ QUÉT</Text>
                {scannedList.length === 0 ? (
                    <Text style={styles.emptyText}>Chưa có mã nào được quét</Text>
                ) : (
                    <FlatList
                        data={scannedList}
                        keyExtractor={item => item.id}
                        renderItem={({ item, index }) => (
                            <View style={styles.listItem}>
                                <View style={styles.listIndex}>
                                    <Text style={styles.listIndexText}>{index + 1}</Text>
                                </View>
                                <Text style={styles.listCode}>{item.code}</Text>
                                <TouchableOpacity onPress={() => removeScannedItem(item.id)}>
                                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtnText}>Hủy thao tác</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Lưu & Xác nhận</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    permissionText: { fontSize: 16, color: '#475569', marginVertical: 15 },
    btnPermission: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    btnPermissionText: { color: 'white', fontWeight: 'bold' },
    header: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 5 },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: 'white',
    },
    tabText: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 'bold',
        fontSize: 15,
    },
    activeTabText: {
        color: 'white',
    },
    cameraContainer: {
        height: 250,
        backgroundColor: 'black',
        position: 'relative'
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanTarget: {
        width: 250,
        height: 100,
        borderWidth: 2,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    inputSection: {
        backgroundColor: 'white',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginBottom: 10
    },
    inputRow: {
        flexDirection: 'row',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        backgroundColor: '#f8fafc',
    },
    scanBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderRadius: 8,
        marginLeft: 10,
    },
    scanBtnText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5
    },
    listSection: {
        flex: 1,
        padding: 15,
        backgroundColor: 'white',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 20
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10
    },
    listIndex: {
        backgroundColor: '#ef4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    listIndexText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    listCode: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#334155'
    },
    bottomActions: {
        flexDirection: 'row',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#ef4444',
        paddingVertical: 15,
        alignItems: 'center'
    },
    cancelBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 15,
        alignItems: 'center'
    },
    saveBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15
    }
});
