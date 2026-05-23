import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../components/UniversalScanner';
import ScanManifestUnloadStyles from '../styles/ScanManifestUnloadStyles';
import { warehouseService } from '../services/warehouseService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

export default function ScanManifestUnloadScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const [isLocked, setIsLocked] = useState(false);
    const [manifestCode, setManifestCode] = useState('');
    const [incomingManifests, setIncomingManifests] = useState([]);
    const [expectedBags, setExpectedBags] = useState([]);
    const [scannedCount, setScannedCount] = useState(0);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [manifestModalVisible, setManifestModalVisible] = useState(false);

    useEffect(() => {
        if (!isRouteAllowed(user, 'ScanManifestUnload')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    useEffect(() => {
        fetchIncomingManifests();
    }, [user.token]);

    const selectedManifest = useMemo(() => {
        return incomingManifests.find((item) => item.manifest_code === manifestCode);
    }, [incomingManifests, manifestCode]);

    const fetchIncomingManifests = async () => {
        if (!user.token) {
            return;
        }

        try {
            const data = await warehouseService.getIncomingManifests(user.token);
            const items = Array.isArray(data) ? data : [];
            setIncomingManifests(items);
            if (items.length > 0 && !manifestCode) {
                setManifestCode(items[0].manifest_code);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách chuyến xe đang tới.');
        }
    };

    const handleLockAndFetchBags = async () => {
        if (!manifestCode) {
            Alert.alert('Lỗi', 'Vui lòng chọn chuyến xe đang cập bến.');
            return;
        }

        setLoadingConfig(true);
        try {
            const res = await warehouseService.getManifestBags(user.token, manifestCode);
            const formattedBags = (Array.isArray(res) ? res : []).map((item) => ({
                bag_code: item.bag_code,
                is_scanned: false,
            }));
            setExpectedBags(formattedBags);
            setScannedCount(0);
            setIsLocked(true);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách túi của chuyến xe này.');
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleUnlock = () => {
        Alert.alert('Cảnh báo', 'Đổi chuyến xe sẽ xóa toàn bộ dữ liệu kiểm đếm hiện tại. Bạn có chắc chắn?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đồng ý',
                style: 'destructive',
                onPress: () => {
                    setIsLocked(false);
                    setExpectedBags([]);
                    setScannedCount(0);
                },
            },
        ]);
    };

    const handleScanBag = async (scannedCode) => {
        if (!scannedCode || !isLocked) {
            return;
        }

        const bagIndex = expectedBags.findIndex((item) => item.bag_code === scannedCode);
        if (bagIndex === -1) {
            Alert.alert('Lạc loài', `Túi hàng [${scannedCode}] không thuộc chuyến xe này.`);
            return;
        }

        if (expectedBags[bagIndex].is_scanned) {
            return;
        }

        const newExpectedBags = [...expectedBags];
        newExpectedBags[bagIndex].is_scanned = true;
        const scannedBag = newExpectedBags.splice(bagIndex, 1)[0];
        newExpectedBags.unshift(scannedBag);
        setExpectedBags(newExpectedBags);
        setScannedCount((prev) => prev + 1);
    };

    const executeUnload = async () => {
        setSubmitLoading(true);
        try {
            const actualScannedCodes = expectedBags.filter((item) => item.is_scanned).map((item) => item.bag_code);
            await warehouseService.manifestUnload(user.token, {
                manifest_code: manifestCode,
                bag_codes: actualScannedCodes,
            });
            Alert.alert('Thành công', 'Thao tác dỡ hàng hoàn tất.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Lỗi hệ thống khi dỡ hàng.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleSubmit = async () => {
        const missingCount = expectedBags.length - scannedCount;
        if (missingCount > 0) {
            Alert.alert(
                'Cảnh báo thiếu hàng',
                `Khai báo: ${expectedBags.length} túi\nThực nhận: ${scannedCount} túi\nThiếu: ${missingCount} túi\n\nChốt số dỡ hàng?`,
                [
                    { text: 'Tiếp tục quét', style: 'cancel' },
                    { text: 'Chốt số lượng', style: 'destructive', onPress: executeUnload },
                ]
            );
            return;
        }

        Alert.alert('Xác nhận', `Xác nhận dỡ đủ ${scannedCount} túi xuống kho?`, [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đồng ý', onPress: executeUnload },
        ]);
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} style={ScanManifestUnloadStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={[ScanManifestUnloadStyles.cameraArea, { paddingTop: insets.top + 12 }]}> 
                {isLocked ? (
                    <UniversalScanner
                        title="ĐANG DỠ HÀNG"
                        instruction={`Xe: ${manifestCode}`}
                        onScan={handleScanBag}
                    />
                ) : (
                    <View style={ScanManifestUnloadStyles.cameraOverlayLock}>
                        <Ionicons name="download" size={60} color="rgba(255,255,255,0.5)" />
                        <Text style={ScanManifestUnloadStyles.lockText}>CHỌN CHUYẾN XE ĐỂ KIỂM ĐẾM</Text>
                    </View>
                )}

                <View style={[ScanManifestUnloadStyles.camHeader, { top: 8 }]}> 
                    <TouchableOpacity style={ScanManifestUnloadStyles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    {isLocked ? (
                        <View style={ScanManifestUnloadStyles.liveBadge}>
                            <Text style={{ color: COLORS.secondary, fontSize: 12, fontWeight: 'bold' }}>UNLOADING</Text>
                        </View>
                    ) : <View style={{ width: 40 }} />}
                </View>
            </View>

            <View style={[ScanManifestUnloadStyles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}> 
                {!isLocked ? (
                    <ScrollView contentContainerStyle={[ScanManifestUnloadStyles.configArea, { paddingBottom: insets.bottom + 30 }] }>
                        <View style={ScanManifestUnloadStyles.cardHeaderRow}>
                            <View style={ScanManifestUnloadStyles.iconCircleSuccess}>
                                <Ionicons name="download" size={20} color={COLORS.secondary} />
                            </View>
                            <Text style={ScanManifestUnloadStyles.configTitle}>XE TẢI ĐANG CẬP BẾN</Text>
                        </View>

                        <Text style={ScanManifestUnloadStyles.label}>Chọn mã chuyến xe muốn dỡ hàng:</Text>
                        <TouchableOpacity
                            style={ScanManifestUnloadStyles.selectorBtn}
                            onPress={() => setManifestModalVisible(true)}
                        >
                            <Text
                                style={[
                                    ScanManifestUnloadStyles.selectorBtnText,
                                    !selectedManifest && ScanManifestUnloadStyles.selectorPlaceholder,
                                ]}
                            >
                                {selectedManifest
                                    ? `${selectedManifest.manifest_code} (${selectedManifest.vehicle_number || 'N/A'})`
                                    : 'Chọn chuyến xe'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#7b867e" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={ScanManifestUnloadStyles.startBtn}
                            onPress={handleLockAndFetchBags}
                            disabled={loadingConfig}
                        >
                            {loadingConfig ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="sync" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={ScanManifestUnloadStyles.startBtnText}>TẢI DỮ LIỆU & BẮT ĐẦU</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <>
                        <View style={ScanManifestUnloadStyles.sheetHeader}>
                            <View>
                                <Text style={ScanManifestUnloadStyles.sheetTitle}>Tiến độ dỡ hàng</Text>
                                <Text style={ScanManifestUnloadStyles.sheetSub}>
                                    Đã quét: <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>{scannedCount}</Text> / {expectedBags.length}
                                </Text>
                            </View>
                            <TouchableOpacity style={ScanManifestUnloadStyles.unlockBtn} onPress={handleUnlock}>
                                <Ionicons name="refresh" size={16} color={COLORS.error} style={{ marginRight: 4 }} />
                                <Text style={{ color: COLORS.error, fontWeight: 'bold', fontSize: 12 }}>ĐỔI XE</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={expectedBags}
                            keyExtractor={(item) => item.bag_code}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[ScanManifestUnloadStyles.listContent, { paddingBottom: insets.bottom + 120 }]}
                            renderItem={({ item }) => (
                                <View
                                    style={[
                                        ScanManifestUnloadStyles.listItem,
                                        item.is_scanned ? ScanManifestUnloadStyles.scannedItem : ScanManifestUnloadStyles.pendingItem,
                                    ]}
                                >
                                    <View style={ScanManifestUnloadStyles.leftInfo}>
                                        <View
                                            style={[
                                                ScanManifestUnloadStyles.iconCircle,
                                                { backgroundColor: item.is_scanned ? COLORS.secondary : '#F1F5F9' },
                                            ]}
                                        >
                                            <Ionicons
                                                name={item.is_scanned ? 'checkmark' : 'time-outline'}
                                                size={20}
                                                color={item.is_scanned ? '#FFF' : '#7b867e'}
                                            />
                                        </View>
                                        <View>
                                            <Text
                                                style={[
                                                    ScanManifestUnloadStyles.itemCode,
                                                    { color: item.is_scanned ? COLORS.secondary : '#7b867e' },
                                                ]}
                                            >
                                                {item.is_scanned ? 'ĐÃ DỠ HÀNG' : 'CHỜ QUÉT'}
                                            </Text>
                                            <Text
                                                style={[
                                                    ScanManifestUnloadStyles.itemTime,
                                                    { color: item.is_scanned ? COLORS.primary : '#7b867e' },
                                                ]}
                                            >
                                                {item.bag_code}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={ScanManifestUnloadStyles.emptyText}>Chuyến xe này không có túi hàng nào.</Text>}
                        />

                        <View style={[ScanManifestUnloadStyles.summaryFooter, { bottom: insets.bottom }]}>
                            <TouchableOpacity
                                style={ScanManifestUnloadStyles.finishBtn}
                                onPress={handleSubmit}
                                disabled={submitLoading}
                            >
                                {submitLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkbox-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={ScanManifestUnloadStyles.finishBtnText}>CHỐT SỐ NHẬN HÀNG</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            <Modal visible={manifestModalVisible} animationType="slide" transparent>
                <TouchableOpacity
                    style={ScanManifestUnloadStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setManifestModalVisible(false)}
                >
                    <View style={ScanManifestUnloadStyles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={ScanManifestUnloadStyles.modalHeader}>
                            <Text style={ScanManifestUnloadStyles.modalTitle}>Chọn Chuyến Xe</Text>
                            <TouchableOpacity onPress={() => setManifestModalVisible(false)}>
                                <Ionicons name="close" size={28} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={incomingManifests}
                            keyExtractor={(item, index) => item.manifest_code || String(index)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={ScanManifestUnloadStyles.optionItem}
                                    onPress={() => {
                                        setManifestCode(item.manifest_code);
                                        setManifestModalVisible(false);
                                    }}
                                >
                                    <Text style={ScanManifestUnloadStyles.optionTitle}>{item.manifest_code}</Text>
                                    <Text style={ScanManifestUnloadStyles.optionSub}>{item.vehicle_number || 'Không có biển số'}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
