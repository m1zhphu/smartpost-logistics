import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WaybillListStyles from '../styles/WaybillListStyles';
import { waybillService } from '../services/waybillService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

const getStartOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
};

const getEndOfToday = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
};

const STATUS_OPTIONS = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Mới tạo (CREATED)', value: 'CREATED' },
    { label: 'Đã nhập kho (IN_HUB)', value: 'IN_HUB' },
    { label: 'Đang giao (DELIVERING)', value: 'DELIVERING' },
    { label: 'Thành công (SUCCESS)', value: 'SUCCESS' },
    { label: 'Đã hủy (CANCELED)', value: 'CANCELED' },
];

export default function WaybillListScreen({ navigation }) {
    const { user } = useUser();
    const [waybills, setWaybills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        waybill_code: '',
        status: '',
        start_date: getStartOfToday(),
        end_date: getEndOfToday(),
        page: 1,
        size: 50,
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [actionItem, setActionItem] = useState(null);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [searchTimer, setSearchTimer] = useState(null);

    const selectedStatus = useMemo(() => {
        return STATUS_OPTIONS.find((item) => item.value === filters.status);
    }, [filters.status]);

    useEffect(() => {
        if (!isRouteAllowed(user, 'WaybillList')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    useEffect(() => {
        loadWaybills();
        return () => {
            if (searchTimer) {
                clearTimeout(searchTimer);
            }
        };
    }, [user.token, filters.page, filters.status, filters.start_date, filters.end_date]);

    const loadWaybills = async () => {
        if (!user.token) {
            return;
        }

        setLoading(true);
        try {
            const response = await waybillService.searchWaybills(user.token, filters);
            setWaybills(response && response.items ? response.items : []);
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể tải danh sách vận đơn.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchTextChange = (text) => {
        setFilters((prev) => ({ ...prev, waybill_code: text, page: 1 }));
        if (searchTimer) {
            clearTimeout(searchTimer);
        }

        const timeout = setTimeout(() => {
            loadWaybills();
        }, 500);

        setSearchTimer(timeout);
    };

    const handleExportExcel = async () => {
        Alert.alert('Thông báo', 'Tính năng xuất Excel sẽ được kích hoạt sau khi bổ sung gói chia sẻ tệp cho project này.');
    };

    const handleUpdateWeight = async () => {
        if (!newWeight || isNaN(Number(newWeight))) {
            Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ.');
            return;
        }

        try {
            await waybillService.updateWeight(user.token, actionItem.waybill_code, Number(newWeight));
            Alert.alert('Thành công', 'Đã cập nhật trọng lượng.');
            setShowWeightModal(false);
            setActionItem(null);
            setNewWeight('');
            loadWaybills();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Thất bại.');
        }
    };

    const handleCancelWaybill = () => {
        Alert.alert(
            'Cảnh báo nguy hiểm',
            `Hủy vận đơn ${actionItem.waybill_code}? Hành động này không thể hoàn tác.`,
            [
                { text: 'Quay lại', style: 'cancel' },
                {
                    text: 'Hủy đơn',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await waybillService.cancelWaybill(user.token, actionItem.waybill_code);
                            Alert.alert('Thành công', 'Đã hủy đơn hàng.');
                            setActionItem(null);
                            loadWaybills();
                        } catch (error) {
                            Alert.alert('Lỗi', error.message || 'Không thể hủy đơn này.');
                        }
                    },
                },
            ]
        );
    };

    const openMap = (address) => {
        const url = `http://maps.google.com/?q=${encodeURIComponent(address || '')}`;
        Linking.openURL(url);
    };

    const callCustomer = (phone) => {
        if (!phone) {
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    const renderWaybillCard = (item) => {
        const isExpress = item.service_type === 'EXPRESS';
        const codAmount = Number(item.cod_amount) || 0;

        return (
            <View style={[WaybillListStyles.card, isExpress && WaybillListStyles.cardExpress]}>
                {isExpress ? (
                    <View style={WaybillListStyles.expressBanner}>
                        <Text style={WaybillListStyles.expressBannerText}>ƯU TIÊN • HỎA TỐC</Text>
                    </View>
                ) : null}

                <TouchableOpacity activeOpacity={0.85} onPress={() => {
                    setActionItem(item);
                    setShowDetailModal(true);
                }}>
                    <View style={WaybillListStyles.cardInner}>
                        <View style={WaybillListStyles.cardHeader}>
                            <View style={[WaybillListStyles.typeBadge, isExpress ? WaybillListStyles.typeBadgeExpress : WaybillListStyles.typeBadgeNormal]}>
                                <Text style={[WaybillListStyles.typeText, isExpress ? WaybillListStyles.typeTextExpress : WaybillListStyles.typeTextNormal]}>
                                    {isExpress ? 'Hỏa tốc' : 'Tiêu chuẩn'}
                                </Text>
                            </View>
                            <Text style={WaybillListStyles.waybillCode}>{item.waybill_code}</Text>
                        </View>

                        <Text style={WaybillListStyles.custInfo}>
                            {item.receiver_name} • {item.receiver_phone}
                        </Text>

                        <View style={WaybillListStyles.addressRow}>
                            <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginTop: 2, marginRight: 6 }} />
                            <Text style={WaybillListStyles.addressText}>{item.receiver_address}</Text>
                        </View>

                        <View style={WaybillListStyles.divider} />

                        <View style={WaybillListStyles.footerRow}>
                            <Text style={WaybillListStyles.footerLabel}>{codAmount > 0 ? 'COD cần thu' : 'Không có COD'}</Text>
                            <Text style={codAmount > 0 ? WaybillListStyles.footerCodValue : WaybillListStyles.footerNoCod}>
                                {codAmount > 0 ? `${codAmount.toLocaleString('vi-VN')} đ` : '— đ'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={WaybillListStyles.actionMenuBtn} onPress={() => setActionItem(item)}>
                    <View style={WaybillListStyles.actionMenuBg}>
                        <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textMuted} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={WaybillListStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

            <View style={WaybillListStyles.headerArea}>
                <View style={WaybillListStyles.headerCircleDecoration} />

                <View style={WaybillListStyles.headerTop}>
                    <TouchableOpacity style={WaybillListStyles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={WaybillListStyles.headerTitle}>DANH SÁCH ĐƠN HÀNG</Text>
                    <TouchableOpacity style={WaybillListStyles.exportBtn} onPress={handleExportExcel}>
                        <Ionicons name="download-outline" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <View style={WaybillListStyles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginLeft: 15 }} />
                    <TextInput
                        style={WaybillListStyles.searchInput}
                        placeholder="Nhập mã vận đơn để tìm kiếm..."
                        placeholderTextColor={COLORS.textMuted}
                        value={filters.waybill_code}
                        onChangeText={handleSearchTextChange}
                    />
                    {filters.waybill_code ? (
                        <TouchableOpacity style={{ padding: 5 }} onPress={() => handleSearchTextChange('')}>
                            <Ionicons name="close-circle" size={18} color={COLORS.textGray} />
                        </TouchableOpacity>
                    ) : null}
                    <View style={WaybillListStyles.searchDivider} />
                    <TouchableOpacity style={WaybillListStyles.filterBtn} onPress={() => setShowFilterModal(true)}>
                        <Ionicons name="options-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={waybills}
                    keyExtractor={(item, index) => item.waybill_code || String(index)}
                    contentContainerStyle={WaybillListStyles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => renderWaybillCard(item)}
                    ListEmptyComponent={
                        <View style={WaybillListStyles.emptyState}>
                            <Ionicons name="search-outline" size={60} color="#d1d8d3" />
                            <Text style={WaybillListStyles.emptyStateText}>
                                Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={WaybillListStyles.fab} onPress={() => navigation.navigate('CreateWaybill')}>
                <Ionicons name="add" size={32} color={COLORS.white} />
            </TouchableOpacity>

            <Modal visible={showFilterModal} animationType="fade" transparent>
                <TouchableOpacity style={WaybillListStyles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
                    <View style={WaybillListStyles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={WaybillListStyles.modalHeader}>
                            <Text style={WaybillListStyles.modalTitle}>Bộ Lọc Dữ Liệu</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={28} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={WaybillListStyles.label}>Trạng thái đơn hàng</Text>
                        {STATUS_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value || 'all'}
                                style={[
                                    WaybillListStyles.dateChip,
                                    selectedStatus && selectedStatus.value === option.value && WaybillListStyles.dateChipActive,
                                    { marginHorizontal: 0, marginBottom: 10 },
                                ]}
                                onPress={() => setFilters({ ...filters, status: option.value })}
                            >
                                <Text style={selectedStatus && selectedStatus.value === option.value ? WaybillListStyles.dateChipTextActive : WaybillListStyles.dateChipText}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <Text style={WaybillListStyles.label}>Thời gian tạo</Text>
                        <View style={WaybillListStyles.filterRow}>
                            <TouchableOpacity
                                style={[
                                    WaybillListStyles.dateChip,
                                    filters.start_date === getStartOfToday() && WaybillListStyles.dateChipActive,
                                ]}
                                onPress={() => setFilters({ ...filters, start_date: getStartOfToday(), end_date: getEndOfToday() })}
                            >
                                <Text style={filters.start_date === getStartOfToday() ? WaybillListStyles.dateChipTextActive : WaybillListStyles.dateChipText}>
                                    Hôm nay
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    WaybillListStyles.dateChip,
                                    filters.start_date === '' && WaybillListStyles.dateChipActive,
                                ]}
                                onPress={() => setFilters({ ...filters, start_date: '', end_date: '' })}
                            >
                                <Text style={filters.start_date === '' ? WaybillListStyles.dateChipTextActive : WaybillListStyles.dateChipText}>
                                    Tất cả
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={WaybillListStyles.submitBtn}
                            onPress={() => {
                                setShowFilterModal(false);
                                loadWaybills();
                            }}
                        >
                            <Text style={WaybillListStyles.btnText}>ÁP DỤNG LỌC</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={!!actionItem && !showWeightModal && !showDetailModal} animationType="fade" transparent>
                <TouchableOpacity style={WaybillListStyles.modalOverlay} activeOpacity={1} onPress={() => setActionItem(null)}>
                    <View style={WaybillListStyles.actionSheet} onStartShouldSetResponder={() => true}>
                        <Text style={WaybillListStyles.actionTitle}>Thao tác mã: {actionItem && actionItem.waybill_code}</Text>

                        <TouchableOpacity
                            style={WaybillListStyles.actionBtnRow}
                            onPress={() => {
                                setShowDetailModal(true);
                            }}
                        >
                            <View style={[WaybillListStyles.actionIconBg, { backgroundColor: COLORS.secondaryLight }]}>
                                <Ionicons name="eye" size={20} color={COLORS.secondary} />
                            </View>
                            <Text style={WaybillListStyles.actionBtnText}>Xem chi tiết vận đơn</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={WaybillListStyles.actionBtnRow}
                            onPress={() => {
                                setShowWeightModal(true);
                            }}
                        >
                            <View style={[WaybillListStyles.actionIconBg, { backgroundColor: COLORS.warningBg }]}>
                                <Ionicons name="scale" size={20} color={COLORS.processScanOrange} />
                            </View>
                            <Text style={WaybillListStyles.actionBtnText}>Cập nhật trọng lượng thực tế</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={WaybillListStyles.actionBtnRow}
                            onPress={() => callCustomer(actionItem && actionItem.receiver_phone)}
                        >
                            <View style={[WaybillListStyles.actionIconBg, { backgroundColor: COLORS.blueAccentBg }]}>
                                <Ionicons name="call" size={20} color={COLORS.blueAccent} />
                            </View>
                            <Text style={WaybillListStyles.actionBtnText}>Gọi khách hàng</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={WaybillListStyles.actionBtnRow}
                            onPress={() => openMap(actionItem && actionItem.receiver_address)}
                        >
                            <View style={[WaybillListStyles.actionIconBg, { backgroundColor: COLORS.blueAccentBg }]}>
                                <Ionicons name="location" size={20} color={COLORS.blueAccent} />
                            </View>
                            <Text style={WaybillListStyles.actionBtnText}>Mở bản đồ giao hàng</Text>
                        </TouchableOpacity>

                        <View style={WaybillListStyles.dividerAction} />

                        <TouchableOpacity style={WaybillListStyles.actionBtnRow} onPress={handleCancelWaybill}>
                            <View style={[WaybillListStyles.actionIconBg, { backgroundColor: COLORS.errorBg }]}>
                                <Ionicons name="trash" size={20} color={COLORS.error} />
                            </View>
                            <Text style={[WaybillListStyles.actionBtnText, { color: COLORS.error }]}>Hủy bỏ vận đơn này</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showDetailModal} animationType="slide" transparent>
                <TouchableOpacity style={WaybillListStyles.modalOverlay} activeOpacity={1} onPress={() => setShowDetailModal(false)}>
                    <View style={WaybillListStyles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={WaybillListStyles.modalHeader}>
                            <Text style={WaybillListStyles.modalTitle}>Chi Tiết Vận Đơn</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Ionicons name="close" size={28} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {actionItem ? (
                            <>
                                <View style={WaybillListStyles.detailBox}>
                                    <View style={WaybillListStyles.detailRow}>
                                        <Text style={WaybillListStyles.detailLabel}>Mã vận đơn</Text>
                                        <Text style={WaybillListStyles.detailValue}>{actionItem.waybill_code}</Text>
                                    </View>
                                    <View style={WaybillListStyles.detailRow}>
                                        <Text style={WaybillListStyles.detailLabel}>Người nhận</Text>
                                        <Text style={WaybillListStyles.detailValue}>{actionItem.receiver_name || 'N/A'}</Text>
                                    </View>
                                    <View style={WaybillListStyles.detailRow}>
                                        <Text style={WaybillListStyles.detailLabel}>Số điện thoại</Text>
                                        <Text style={WaybillListStyles.detailValue}>{actionItem.receiver_phone || 'N/A'}</Text>
                                    </View>
                                    <View style={WaybillListStyles.detailRow}>
                                        <Text style={WaybillListStyles.detailLabel}>Địa chỉ</Text>
                                        <Text style={WaybillListStyles.detailValue}>{actionItem.receiver_address || 'N/A'}</Text>
                                    </View>
                                    <View style={WaybillListStyles.detailRow}>
                                        <Text style={WaybillListStyles.detailLabel}>Trạng thái</Text>
                                        <Text style={WaybillListStyles.detailValue}>{actionItem.status || 'N/A'}</Text>
                                    </View>
                                    <View style={[WaybillListStyles.detailRow, { marginBottom: 0 }]}>
                                        <Text style={WaybillListStyles.detailLabel}>COD</Text>
                                        <Text style={WaybillListStyles.detailValue}>{(Number(actionItem.cod_amount) || 0).toLocaleString('vi-VN')} đ</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={WaybillListStyles.submitBtn} onPress={() => {
                                    setShowDetailModal(false);
                                    setActionItem(null);
                                }}>
                                    <Text style={WaybillListStyles.btnText}>ĐÓNG</Text>
                                </TouchableOpacity>
                            </>
                        ) : null}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showWeightModal} animationType="slide" transparent>
                <View style={WaybillListStyles.modalOverlay}>
                    <View style={WaybillListStyles.modalContent}>
                        <Text style={WaybillListStyles.modalTitle}>Trọng lượng thực tế (kg)</Text>
                        <Text style={{ marginBottom: 20, color: COLORS.textMuted, fontSize: 13 }}>
                            Mã đơn: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{actionItem && actionItem.waybill_code}</Text>
                        </Text>

                        <TextInput
                            style={WaybillListStyles.weightInput}
                            keyboardType="numeric"
                            placeholder="Nhập số kg..."
                            placeholderTextColor="#90a092"
                            value={newWeight}
                            onChangeText={setNewWeight}
                            autoFocus
                        />

                        <View style={WaybillListStyles.filterRow}>
                            <TouchableOpacity
                                style={WaybillListStyles.cancelBtn}
                                onPress={() => {
                                    setShowWeightModal(false);
                                    setActionItem(null);
                                    setNewWeight('');
                                }}
                            >
                                <Text style={{ fontWeight: 'bold', color: COLORS.textMuted }}>HỦY BỎ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={WaybillListStyles.saveBtn} onPress={handleUpdateWeight}>
                                <Text style={{ fontWeight: 'bold', color: COLORS.white }}>LƯU THAY ĐỔI</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
