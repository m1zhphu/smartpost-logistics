import React from 'react';
import { Alert, StatusBar, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../components/UniversalScanner';
import ScanTaskStyles from '../styles/ScanTaskStyles';
import { waybillService } from '../services/waybillService';
import { deliveryService } from '../services/deliveryService';
import { useUser } from '../context/UserContext';
import { isRouteAllowed } from '../utils/roleUtils';

export default function ScanTaskScreen({ navigation }) {
    const { user } = useUser();

    React.useEffect(() => {
        if (!isRouteAllowed(user, 'ScanTask')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    const handleScanFindTask = async (scannedCode) => {
        try {
            const res = await waybillService.searchWaybills(user.token, {
                waybill_code: scannedCode,
                page: 1,
                size: 1,
            });

            const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
            let waybill = items[0];

            if (!waybill) {
                const tasks = await deliveryService.getMyTasks(user.token);
                waybill = (tasks || []).find((item) => item.waybill_code === scannedCode);
            }

            if (waybill) {
                navigation.replace('TaskDetail', { waybill });
                return;
            }

            Alert.alert('Không tìm thấy', `Mã ${scannedCode} không tồn tại hoặc không nằm trong danh sách cần giao.`);
        } catch (error) {
            Alert.alert('Lỗi kết nối', error.message || 'Không thể tìm kiếm đơn hàng lúc này.');
        }
    };

    return (
        <View style={ScanTaskStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <UniversalScanner
                title="Tìm nhanh đơn hàng"
                instruction="Đưa mã vạch hoặc QR vào giữa khung quét"
                onScan={handleScanFindTask}
            />

            <TouchableOpacity style={ScanTaskStyles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}
