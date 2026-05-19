import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../components/UniversalScanner';
import ScanInHubStyles from '../styles/ScanInHubStyles';
import { warehouseService } from '../services/warehouseService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

export default function ScanInHubScreen({ navigation }) {
    const { user } = useUser();
    const [scannedItems, setScannedItems] = useState([]);
    const [manualCode, setManualCode] = useState('');

    useEffect(() => {
        if (!isRouteAllowed(user, 'ScanInHub')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    const totalWeight = useMemo(() => {
        return scannedItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
    }, [scannedItems]);

    const handleScanInHub = async (waybillCode) => {
        if (!waybillCode) {
            return;
        }

        if (!user.token) {
            Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
        }

        if (scannedItems.find((item) => item.code === waybillCode)) {
            return;
        }

        try {
            const data = await warehouseService.scanInHub(user.token, waybillCode, 'Nhap kho qua App');
            const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });

            setScannedItems((prevItems) => [
                {
                    code: data && data.waybill_code ? data.waybill_code : waybillCode,
                    weight: data && data.actual_weight ? Number(data.actual_weight) : 0,
                    time: timeStr,
                },
                ...prevItems,
            ]);
        } catch (error) {
            Alert.alert('Lỗi nhập kho', error.message || 'Không thể xác nhận đơn này.');
        }
    };

    const handleManualSubmit = () => {
        Keyboard.dismiss();
        if (!manualCode.trim()) {
            return;
        }

        handleScanInHub(manualCode.trim());
        setManualCode('');
    };

    const handleClearAll = () => {
        if (scannedItems.length === 0) {
            return;
        }

        Alert.alert('Xác nhận', 'Bạn muốn xóa toàn bộ lịch sử quét của phiên này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa tất cả',
                style: 'destructive',
                onPress: () => setScannedItems([]),
            },
        ]);
    };

    return (
        <View style={ScanInHubStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={ScanInHubStyles.cameraArea}>
                <UniversalScanner
                    instruction="Đưa mã vạch vào giữa khung quét"
                    onScan={handleScanInHub}
                />

                <View style={ScanInHubStyles.camHeader}>
                    <TouchableOpacity style={ScanInHubStyles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>
                            NHẬP KHO
                        </Text>
                        <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>
                            Quét Nhập Kho
                        </Text>
                    </View>

                    <View style={ScanInHubStyles.liveBadge}>
                        <Text style={ScanInHubStyles.liveText}>LIVE</Text>
                    </View>
                </View>

                <View style={ScanInHubStyles.manualInputContainer}>
                    <View style={ScanInHubStyles.inputBox}>
                        <Ionicons name="search" size={20} color="#c7d1ca" style={{ marginRight: 8 }} />
                        <TextInput
                            style={ScanInHubStyles.input}
                            placeholder="Nhập mã thủ công..."
                            placeholderTextColor="#c7d1ca"
                            value={manualCode}
                            onChangeText={setManualCode}
                            onSubmitEditing={handleManualSubmit}
                            returnKeyType="send"
                        />
                    </View>

                    <TouchableOpacity style={ScanInHubStyles.sendBtn} onPress={handleManualSubmit}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={ScanInHubStyles.contentArea}>
                <View style={ScanInHubStyles.headerCard}>
                    <View style={ScanInHubStyles.headerTitleRow}>
                        <Text style={ScanInHubStyles.headerTitle}>Đã quét thành công</Text>
                        <View style={ScanInHubStyles.countBadge}>
                            <Text style={ScanInHubStyles.countBadgeText}>{scannedItems.length}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={ScanInHubStyles.clearBtn} onPress={handleClearAll}>
                        <Text style={ScanInHubStyles.clearBtnText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={scannedItems}
                    keyExtractor={(item) => item.code}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={ScanInHubStyles.listContent}
                    renderItem={({ item, index }) => {
                        const isFirst = index === 0;

                        return (
                            <View style={[ScanInHubStyles.listItem, isFirst && ScanInHubStyles.firstItem]}>
                                {isFirst ? (
                                    <View style={ScanInHubStyles.firstItemTag}>
                                        <View style={ScanInHubStyles.tagDot} />
                                        <Text style={ScanInHubStyles.firstItemTagText}>VỪA QUÉT XONG</Text>
                                    </View>
                                ) : null}

                                <View style={[ScanInHubStyles.itemContent, isFirst && ScanInHubStyles.firstItemContent]}>
                                    <View style={ScanInHubStyles.leftInfo}>
                                        <View style={[ScanInHubStyles.iconCircle, isFirst && ScanInHubStyles.iconCirclePrimary]}>
                                            <Ionicons
                                                name="checkmark"
                                                size={20}
                                                color={isFirst ? COLORS.white : COLORS.secondary}
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={[ScanInHubStyles.itemCode, isFirst && ScanInHubStyles.itemCodePrimary]}>
                                                {item.code}
                                            </Text>
                                            <Text style={[ScanInHubStyles.itemTime, isFirst && ScanInHubStyles.itemTimePrimary]}>
                                                {item.time} • Nhập kho qua App
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={ScanInHubStyles.rightInfo}>
                                        <Text style={[ScanInHubStyles.itemWeight, isFirst && ScanInHubStyles.itemWeightPrimary]}>
                                            {(Number(item.weight) || 0).toFixed(1)} kg
                                        </Text>
                                        <Text style={[ScanInHubStyles.itemWeightSub, isFirst && ScanInHubStyles.itemWeightSubPrimary]}>
                                            thực tế
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={ScanInHubStyles.emptyContainer}>
                            <Ionicons name="scan-circle-outline" size={58} color="#d3dbd5" />
                            <Text style={ScanInHubStyles.emptyText}>Chưa có kiện hàng nào được quét.</Text>
                        </View>
                    }
                />

                <View style={ScanInHubStyles.summaryFooter}>
                    <Text style={ScanInHubStyles.summaryLabel}>Tổng khối lượng phiên này</Text>
                    <Text style={ScanInHubStyles.summaryValue}>
                        {totalWeight.toFixed(1)} kg / {scannedItems.length} kiện
                    </Text>
                </View>
            </View>
        </View>
    );
}
