import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskDetailStyles from '../styles/TaskDetailStyles';
import { waybillService } from '../services/waybillService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

export default function TaskDetailScreen({ route, navigation }) {
    const { user } = useUser();
    const { waybill } = route.params || {};
    const [tracking, setTracking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isRouteAllowed(user, 'TaskDetail')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    useEffect(() => {
        if (!waybill || !user.token) {
            setLoading(false);
            return;
        }

        const loadTracking = async () => {
            setLoading(true);
            try {
                const data = await waybillService.getTracking(user.token, waybill.waybill_code);
                setTracking(Array.isArray(data) ? data : []);
            } catch (error) {
                setTracking([]);
            } finally {
                setLoading(false);
            }
        };

        loadTracking();
    }, [user.token, waybill]);

    if (!waybill) {
        return (
            <View style={TaskDetailStyles.center}>
                <Text>Không có dữ liệu</Text>
            </View>
        );
    }

    const openMap = () => {
        const url = `http://maps.google.com/?q=${encodeURIComponent(waybill.receiver_address || '')}`;
        Linking.openURL(url);
    };

    const callCustomer = () => {
        Linking.openURL(`tel:${waybill.receiver_phone}`);
    };

    const handlePrint = () => {
        Alert.alert('Thông báo', 'Tính năng in vận đơn chưa được bật trong dự án hiện tại.');
    };

    const isExpress = waybill.service_type === 'EXPRESS';
    const canUpdate = !['SUCCESS', 'FAILED', 'DELIVERED'].includes(waybill.status);

    return (
        <View style={TaskDetailStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

            <View style={TaskDetailStyles.headerArea}>
                <View style={TaskDetailStyles.headerCircleDecoration} />
                <View style={TaskDetailStyles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={TaskDetailStyles.iconBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={TaskDetailStyles.headerSub}>CHI TIẾT ĐƠN</Text>
                        <Text style={TaskDetailStyles.headerTitle}>{waybill.waybill_code}</Text>
                    </View>
                    <TouchableOpacity style={TaskDetailStyles.iconBtn} onPress={handlePrint}>
                        <Ionicons name="print-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={TaskDetailStyles.badgeRow}>
                    {isExpress ? (
                        <View style={TaskDetailStyles.expressBadge}>
                            <Text style={TaskDetailStyles.expressText}>Hỏa tốc</Text>
                        </View>
                    ) : null}
                    <View style={TaskDetailStyles.statusBadge}>
                        <Text style={TaskDetailStyles.statusText}>{canUpdate ? 'Đang giao' : 'Hoàn tất'}</Text>
                    </View>
                </View>
            </View>

            <View style={TaskDetailStyles.customerBar}>
                <View style={TaskDetailStyles.customerHeader}>
                    <Ionicons name="person-circle-outline" size={36} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={TaskDetailStyles.custName} numberOfLines={1}>{waybill.receiver_name}</Text>
                        <Text style={TaskDetailStyles.custPhone}>{waybill.receiver_phone}</Text>
                    </View>
                    <TouchableOpacity style={TaskDetailStyles.actionBtnCall} onPress={callCustomer}>
                        <Ionicons name="call" size={18} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={TaskDetailStyles.actionBtnMap} onPress={openMap}>
                        <Ionicons name="location" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <View style={TaskDetailStyles.divider} />

                <View style={TaskDetailStyles.addressRow}>
                    <Ionicons name="location-outline" size={16} color="#7b867e" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text style={TaskDetailStyles.addressText} numberOfLines={2}>{waybill.receiver_address}</Text>
                </View>
            </View>

            <ScrollView style={TaskDetailStyles.scrollView} contentContainerStyle={TaskDetailStyles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={TaskDetailStyles.infoGrid}>
                    <View style={TaskDetailStyles.codBox}>
                        <Text style={TaskDetailStyles.codLabel}>THU HỘ COD</Text>
                        <Text style={TaskDetailStyles.codValue}>{Number(waybill.cod_amount || 0).toLocaleString('vi-VN')}</Text>
                        <Text style={TaskDetailStyles.codUnit}>đồng</Text>
                    </View>

                    <View style={TaskDetailStyles.rightStats}>
                        <View style={TaskDetailStyles.statBox}>
                            <Text style={TaskDetailStyles.statLabel}>KHỐI LƯỢNG</Text>
                            <Text style={TaskDetailStyles.statValue}>
                                {waybill.actual_weight || 0} <Text style={TaskDetailStyles.statUnitInline}>kg</Text>
                            </Text>
                        </View>
                        <View style={[TaskDetailStyles.statBox, { marginTop: 10 }]}>
                            <Text style={TaskDetailStyles.statLabel}>CƯỚC PHÍ</Text>
                            <Text style={TaskDetailStyles.statValue}>
                                {Number(waybill.shipping_fee || 0).toLocaleString('vi-VN')} <Text style={TaskDetailStyles.statUnitInline}>đ</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                {waybill.note ? (
                    <View style={TaskDetailStyles.card}>
                        <Text style={TaskDetailStyles.noteLabel}>GHI CHÚ TỪ SHOP</Text>
                        <Text style={TaskDetailStyles.noteText}>{waybill.note}</Text>
                    </View>
                ) : null}

                <View style={TaskDetailStyles.card}>
                    <View style={TaskDetailStyles.timelineHeaderRow}>
                        <View style={TaskDetailStyles.dotPrimaryTitle} />
                        <Text style={TaskDetailStyles.timelineTitle}>LỊCH SỬ HÀNH TRÌNH</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={COLORS.secondary} style={{ marginVertical: 20 }} />
                    ) : tracking.length === 0 ? (
                        <Text style={TaskDetailStyles.emptyText}>Chưa có thông tin hành trình</Text>
                    ) : (
                        <View style={{ marginTop: 15 }}>
                            {tracking.map((item, index) => {
                                const isFirst = index === 0;
                                const isLast = index === tracking.length - 1;

                                return (
                                    <View key={`${item.time || index}`} style={TaskDetailStyles.trackItemContainer}>
                                        <View style={TaskDetailStyles.timeline}>
                                            {isFirst ? (
                                                <View style={TaskDetailStyles.timelineDotActiveWrap}>
                                                    <View style={TaskDetailStyles.timelineDotActive} />
                                                </View>
                                            ) : isLast ? (
                                                <View style={TaskDetailStyles.timelineDotStart} />
                                            ) : (
                                                <View style={TaskDetailStyles.timelineDotPast} />
                                            )}
                                            {!isLast ? <View style={TaskDetailStyles.timelineLine} /> : null}
                                        </View>
                                        <View style={TaskDetailStyles.trackItem}>
                                            <Text style={TaskDetailStyles.trackStatus}>{item.note}</Text>
                                            <Text style={TaskDetailStyles.trackTime}>
                                                {item.time ? new Date(item.time).toLocaleString('vi-VN') : ''}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {canUpdate ? (
                <View style={TaskDetailStyles.bottomBar}>
                    <TouchableOpacity style={TaskDetailStyles.printerBtn} onPress={handlePrint}>
                        <Ionicons name="print-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={TaskDetailStyles.updateBtn}
                        onPress={() => navigation.navigate('UpdateStatus', { waybill })}
                    >
                        <Ionicons name="checkbox-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={TaskDetailStyles.updateBtnText}>Cập nhật trạng thái giao</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}
