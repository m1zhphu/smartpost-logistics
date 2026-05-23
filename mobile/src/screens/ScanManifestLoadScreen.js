import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../components/UniversalScanner';
import ScanManifestLoadStyles from '../styles/ScanManifestLoadStyles';
import { warehouseService } from '../services/warehouseService';
import { waybillService } from '../services/waybillService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

export default function ScanManifestLoadScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const [isLocked, setIsLocked] = useState(false);
    const [manifestCode, setManifestCode] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [toHubId, setToHubId] = useState('');
    const [hubs, setHubs] = useState([]);
    const [hubModalVisible, setHubModalVisible] = useState(false);
    const [scannedBags, setScannedBags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');

    useEffect(() => {
        if (!isRouteAllowed(user, 'ScanManifestLoad')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    useEffect(() => {
        if (!user.token) {
            return;
        }

        waybillService.getHubs(user.token)
            .then((data) => setHubs(Array.isArray(data) ? data : []))
            .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách hub.'));
    }, [user.token]);

    const selectedHub = useMemo(() => {
        return hubs.find((item) => String(item.hub_id) === String(toHubId));
    }, [hubs, toHubId]);

    const handleLock = () => {
        let nextManifestCode = manifestCode;
        if (!nextManifestCode) {
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            nextManifestCode = `MFL-${dateStr}-${randomNum}`;
            setManifestCode(nextManifestCode);
        }

        if (!vehicleNumber.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập biển số xe tải.');
            return;
        }

        if (!toHubId) {
            Alert.alert('Lỗi', 'Vui lòng chọn bưu cục đích đến.');
            return;
        }

        setIsLocked(true);
    };

    const handleScanBag = async (bagCode) => {
        if (!bagCode) {
            return;
        }

        if (!isLocked) {
            Alert.alert('Khóa an toàn', 'Vui lòng chốt thông tin chuyến xe trước khi quét túi.');
            return;
        }

        if (scannedBags.find((item) => item.code === bagCode)) {
            return;
        }

        Alert.alert(
            'Xác nhận Bốc Hàng',
            `Chuyển túi ${bagCode} lên xe ${vehicleNumber}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    onPress: () => {
                        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
                        setScannedBags((prev) => [{ code: bagCode, time: timeStr }, ...prev]);
                    },
                },
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
        if (scannedBags.length === 0) {
            return;
        }

        setLoading(true);
        try {
            await warehouseService.manifestLoad(user.token, {
                manifest_code: manifestCode,
                to_hub_id: Number(toHubId),
                vehicle_number: vehicleNumber.trim(),
                bag_codes: scannedBags.map((item) => item.code),
            });
            Alert.alert('Hoàn tất', `Đã chốt chuyến xe ${manifestCode} với ${scannedBags.length} túi.`);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Lỗi hệ thống khi bốc xe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView edges={['top', 'bottom']} style={ScanManifestLoadStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={[ScanManifestLoadStyles.cameraArea, { paddingTop: insets.top + 12 }]}> 
                {isLocked ? (
                    <UniversalScanner
                        title="ĐANG BỐC XE"
                        instruction={`Xe: ${vehicleNumber} - Đưa mã túi vào khung ngắm`}
                        onScan={handleScanBag}
                    />
                ) : (
                    <View style={ScanManifestLoadStyles.cameraOverlayLock}>
                        <Ionicons name="bus" size={60} color="rgba(255,255,255,0.5)" />
                        <Text style={ScanManifestLoadStyles.lockText}>CHỐT THÔNG TIN XE ĐỂ MỞ SCANNER</Text>
                    </View>
                )}

                <View style={[ScanManifestLoadStyles.camHeader, { top: 8 }]}> 
                    <TouchableOpacity style={ScanManifestLoadStyles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    {isLocked ? (
                        <View style={ScanManifestLoadStyles.liveBadge}>
                            <Text style={{ color: COLORS.secondary, fontSize: 12, fontWeight: 'bold' }}>LOADING</Text>
                        </View>
                    ) : <View style={{ width: 40 }} />}
                </View>

                {isLocked ? (
                    <View style={[ScanManifestLoadStyles.manualInputContainer, { bottom: insets.bottom + 16 }]}> 
                        <View style={ScanManifestLoadStyles.inputBox}>
                            <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                            <TextInput
                                style={ScanManifestLoadStyles.inputCam}
                                placeholder="Nhập mã túi thủ công..."
                                placeholderTextColor="#94A3B8"
                                value={manualCode}
                                onChangeText={setManualCode}
                                onSubmitEditing={handleManualSubmit}
                                returnKeyType="send"
                            />
                        </View>
                        <TouchableOpacity style={ScanManifestLoadStyles.sendBtn} onPress={handleManualSubmit}>
                            <Ionicons name="send" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>

            <View style={[ScanManifestLoadStyles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}> 
                {!isLocked ? (
                    <ScrollView contentContainerStyle={[ScanManifestLoadStyles.configArea, { paddingBottom: insets.bottom + 30 }] }>
                        <View style={ScanManifestLoadStyles.cardHeaderRow}>
                            <View style={ScanManifestLoadStyles.iconCirclePrimary}>
                                <Ionicons name="bus" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={ScanManifestLoadStyles.configTitle}>THÔNG TIN CHUYẾN XE</Text>
                        </View>

                        <Text style={ScanManifestLoadStyles.label}>Mã chuyến (Tùy chọn)</Text>
                        <TextInput
                            style={ScanManifestLoadStyles.inputForm}
                            placeholder="Để trống hệ thống sẽ tự tạo..."
                            placeholderTextColor="#8c978f"
                            value={manifestCode}
                            onChangeText={setManifestCode}
                        />

                        <Text style={ScanManifestLoadStyles.label}>Biển số xe tải</Text>
                        <TextInput
                            style={ScanManifestLoadStyles.inputForm}
                            placeholder="VD: 51C-123.45"
                            placeholderTextColor="#8c978f"
                            value={vehicleNumber}
                            onChangeText={setVehicleNumber}
                            autoCapitalize="characters"
                        />

                        <Text style={ScanManifestLoadStyles.label}>Chuyến xe sẽ đi đến đâu?</Text>
                        <TouchableOpacity style={ScanManifestLoadStyles.selectorBtn} onPress={() => setHubModalVisible(true)}>
                            <Text
                                style={[
                                     ScanManifestLoadStyles.selectorBtnText,
                                     !selectedHub && ScanManifestLoadStyles.selectorPlaceholder,
                                ]}
                            >
                                {selectedHub
                                    ? `${selectedHub.hub_code} - ${selectedHub.hub_name}`
                                    : 'Chọn bưu cục đích'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#7b867e" />
                        </TouchableOpacity>

                        <TouchableOpacity style={ScanManifestLoadStyles.startBtn} onPress={handleLock}>
                            <Ionicons name="lock-closed" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={ScanManifestLoadStyles.startBtnText}>CHỐT THÔNG TIN & BẮT ĐẦU</Text>
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <>
                        <View style={ScanManifestLoadStyles.sheetHeader}>
                            <View>
                                <Text style={ScanManifestLoadStyles.sheetTitle}>Xe: {vehicleNumber}</Text>
                                <Text style={ScanManifestLoadStyles.sheetSub}>
                                    Mã chuyến: <Text style={{ color: COLORS.secondary }}>{manifestCode}</Text>
                                </Text>
                            </View>
                            <View style={ScanManifestLoadStyles.badgeCount}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>{scannedBags.length}</Text>
                            </View>
                        </View>

                        <FlatList
                            data={scannedBags}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[ScanManifestLoadStyles.listContent, { paddingBottom: insets.bottom + 120 }]}
                            renderItem={({ item, index }) => {
                                const isFirst = index === 0;
                                return (
                                    <View style={[ScanManifestLoadStyles.listItem, isFirst && ScanManifestLoadStyles.firstItem]}>
                                        <View style={ScanManifestLoadStyles.leftInfo}>
                                            <View style={ScanManifestLoadStyles.iconCircle}>
                                                <Ionicons
                                                    name="briefcase"
                                                    size={20}
                                                    color={isFirst ? '#fff' : COLORS.primary}
                                                />
                                            </View>
                                            <View>
                                                <Text style={[ScanManifestLoadStyles.itemCode, isFirst && ScanManifestLoadStyles.itemCodePrimary]}>
                                                    {item.code}
                                                </Text>
                                                <Text style={[ScanManifestLoadStyles.itemTime, isFirst && ScanManifestLoadStyles.itemTimePrimary]}>
                                                    {item.time} • Lên xe
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color={isFirst ? '#fff' : COLORS.secondary}
                                        />
                                    </View>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={ScanManifestLoadStyles.emptyWrap}>
                                    <Ionicons name="barcode-outline" size={60} color="#d1d8d3" />
                                    <Text style={ScanManifestLoadStyles.emptyText}>Đưa mã túi hàng vào camera để quét.</Text>
                                </View>
                            }
                        />

                        {scannedBags.length > 0 ? (
                            <View style={[ScanManifestLoadStyles.summaryFooter, { bottom: insets.bottom }]}> 
                                <TouchableOpacity
                                    style={ScanManifestLoadStyles.finishBtn}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="paper-plane" size={22} color="#FFF" style={{ marginRight: 8 }} />
                                            <Text style={ScanManifestLoadStyles.finishBtnText}>XUẤT BẾN & HOÀN TẤT ({scannedBags.length})</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </>
                )}
            </View>

            <Modal visible={hubModalVisible} animationType="slide" transparent>
                <TouchableOpacity
                    style={ScanManifestLoadStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setHubModalVisible(false)}
                >
                    <View style={ScanManifestLoadStyles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={ScanManifestLoadStyles.modalHeader}>
                            <Text style={ScanManifestLoadStyles.modalTitle}>Chọn Bưu Cục Đích</Text>
                            <TouchableOpacity onPress={() => setHubModalVisible(false)}>
                                <Ionicons name="close" size={28} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={hubs}
                            keyExtractor={(item, index) => String(item.hub_id || index)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={ScanManifestLoadStyles.optionItem}
                                    onPress={() => {
                                        setToHubId(String(item.hub_id));
                                        setHubModalVisible(false);
                                    }}
                                >
                                    <Text style={ScanManifestLoadStyles.optionTitle}>{item.hub_code} - {item.hub_name}</Text>
                                    <Text style={ScanManifestLoadStyles.optionSub}>{item.address || 'Không có địa chỉ'}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
