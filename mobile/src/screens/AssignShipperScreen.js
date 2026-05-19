import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalScanner from '../components/UniversalScanner';
import AssignShipperStyles from '../styles/AssignShipperStyles';
import { deliveryService } from '../services/deliveryService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

export default function AssignShipperScreen({ navigation }) {
    const { user } = useUser();
    const [scannedCodes, setScannedCodes] = useState([]);
    const [shippers, setShippers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShipper, setSelectedShipper] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isRouteAllowed(user, 'AssignShipper')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    useEffect(() => {
        if (!user.token) return;

        deliveryService.getShippers(user.token)
            .then((data) => setShippers(Array.isArray(data) ? data : []))
            .catch((error) => Alert.alert('Lỗi', error.message || 'Không thể tải danh sách shipper.'));
    }, [user.token]);

    const filteredShippers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return shippers;

        return shippers.filter((item) => {
            const fullName = (item.full_name || '').toLowerCase();
            const username = (item.username || '').toLowerCase();
            const phone = item.phone || '';
            return fullName.includes(query) || username.includes(query) || phone.includes(query);
        });
    }, [searchQuery, shippers]);

    const handleScan = async (code) => {
        if (!selectedShipper) {
            Alert.alert('Lỗi', 'Vui lòng chọn shipper trước khi quét đơn.');
            return;
        }

        if (scannedCodes.includes(code)) return;

        setScannedCodes((prev) => [code, ...prev]);
    };

    const handleConfirmAssign = async () => {
        if (!selectedShipper) {
            Alert.alert('Thiếu thông tin', 'Vui lòng chọn shipper trước.');
            return;
        }

        if (scannedCodes.length === 0) {
            Alert.alert('Thiếu thông tin', 'Vui lòng quét ít nhất 1 vận đơn.');
            return;
        }

        setLoading(true);
        try {
            await deliveryService.assignShipper(user.token, {
                shipper_id: selectedShipper.user_id,
                waybill_codes: scannedCodes,
            });
            Alert.alert(
                'Thành công',
                `Đã bàn giao ${scannedCodes.length} đơn cho ${selectedShipper.full_name || selectedShipper.username}.`
            );
            navigation.goBack();
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Không thể phân công đơn.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={AssignShipperStyles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* --- Camera Scanner Section --- */}
            <View style={AssignShipperStyles.scannerWrapper}>
                <UniversalScanner
                    title="BÀN GIAO ĐƠN"
                    instruction={
                        selectedShipper
                            ? `Đang quét cho: ${selectedShipper.full_name || selectedShipper.username}`
                            : 'Bấm ở bên dưới để chọn shipper trước khi quét'
                    }
                    onScan={handleScan}
                />

                <View style={AssignShipperStyles.camHeader}>
                    <TouchableOpacity style={AssignShipperStyles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    {selectedShipper ? (
                        <View style={AssignShipperStyles.liveBadge}>
                            <Text style={AssignShipperStyles.liveBadgeText}>SẴN SÀNG QUÉT</Text>
                        </View>
                    ) : <View style={{ width: 40 }} />}
                </View>
            </View>

            {/* --- Bottom Sheet Panel --- */}
            <View style={AssignShipperStyles.bottomSheet}>
                <TouchableOpacity
                    style={AssignShipperStyles.selector}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <View style={AssignShipperStyles.selectorIcon}>
                        <Ionicons
                            name="bicycle"
                            size={24}
                            color={selectedShipper ? COLORS.secondary : COLORS.textMuted}
                        />
                    </View>

                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={AssignShipperStyles.selectorMeta}>NHÂN VIÊN GIAO HÀNG</Text>
                        <Text
                            style={[
                                AssignShipperStyles.selectorText,
                                !selectedShipper && AssignShipperStyles.selectorPlaceholder,
                            ]}
                        >
                            {selectedShipper
                                ? (selectedShipper.full_name || selectedShipper.username)
                                : 'Nhấn để chọn shipper...'}
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={COLORS.textGray} />
                </TouchableOpacity>

                <View style={AssignShipperStyles.listHeaderRow}>
                    <Text style={AssignShipperStyles.listTitle}>Danh sách đơn bàn giao</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={AssignShipperStyles.badgeCount}>
                            <Text style={AssignShipperStyles.badgeCountText}>{scannedCodes.length}</Text>
                        </View>

                        {scannedCodes.length > 0 ? (
                            <TouchableOpacity onPress={() => setScannedCodes([])} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Text style={AssignShipperStyles.clearAllText}>Xóa hết</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                <FlatList
                    data={scannedCodes}
                    keyExtractor={(item) => item}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={AssignShipperStyles.listContent}
                    renderItem={({ item, index }) => {
                        const isFirst = index === 0;
                        return (
                            <View style={[AssignShipperStyles.listItem, isFirst && AssignShipperStyles.firstItem]}>
                                <View style={AssignShipperStyles.listItemLeft}>
                                    <View style={[AssignShipperStyles.itemIconWrap, isFirst && AssignShipperStyles.itemIconWrapPrimary]}>
                                        <Ionicons name="cube" size={20} color={isFirst ? COLORS.white : COLORS.secondary} />
                                    </View>
                                    <Text style={[AssignShipperStyles.itemText, isFirst && AssignShipperStyles.itemTextPrimary]}>
                                        {item}
                                    </Text>
                                </View>

                                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => setScannedCodes(scannedCodes.filter((code) => code !== item))}>
                                    <Ionicons
                                        name="close-circle"
                                        size={26}
                                        color={isFirst ? 'rgba(255,255,255,0.8)' : COLORS.borderLight}
                                    />
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={AssignShipperStyles.emptyWrap}>
                            <View style={AssignShipperStyles.emptyIconCircle}>
                                <Ionicons name="barcode-outline" size={48} color={COLORS.textGray} />
                            </View>
                            <Text style={AssignShipperStyles.emptyText}>Đưa mã vận đơn vào khung camera để quét.</Text>
                        </View>
                    }
                />

                {scannedCodes.length > 0 ? (
                    <View style={AssignShipperStyles.footer}>
                        <TouchableOpacity
                            style={AssignShipperStyles.confirmBtn}
                            onPress={handleConfirmAssign}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-done" size={22} color={COLORS.white} style={{ marginRight: 8 }} />
                                    <Text style={AssignShipperStyles.btnText}>XÁC NHẬN BÀN GIAO</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>

            {/* --- Modal Chọn Shipper --- */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableOpacity style={AssignShipperStyles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
                        <View style={AssignShipperStyles.modalContent} onStartShouldSetResponder={() => true}>
                            <View style={AssignShipperStyles.sheetHandle} />

                            <View style={AssignShipperStyles.modalHeader}>
                                <Text style={AssignShipperStyles.modalTitle}>Chọn Shipper Giao Hàng</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="close-circle" size={28} color={COLORS.borderLight} />
                                </TouchableOpacity>
                            </View>

                            <View style={AssignShipperStyles.searchBar}>
                                <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={AssignShipperStyles.searchInput}
                                    placeholder="Tìm theo tên hoặc số điện thoại..."
                                    placeholderTextColor={COLORS.textGray}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery ? (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color={COLORS.textGray} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            <FlatList
                                data={filteredShippers}
                                keyExtractor={(item, index) => String(item.user_id || index)}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const isSelected = selectedShipper && selectedShipper.user_id === item.user_id;
                                    return (
                                        <TouchableOpacity
                                            style={[AssignShipperStyles.shipperItem, isSelected && AssignShipperStyles.shipperItemActive]}
                                            onPress={() => {
                                                setSelectedShipper(item);
                                                setModalVisible(false);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[AssignShipperStyles.shipperAvatar, isSelected && { backgroundColor: COLORS.secondary }]}>
                                                <Ionicons name="person" size={20} color={isSelected ? COLORS.white : COLORS.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[AssignShipperStyles.shipperName, isSelected && { color: COLORS.primary }]}>
                                                    {item.full_name || item.username}
                                                </Text>
                                                <Text style={AssignShipperStyles.shipperPhone}>
                                                    {item.phone || 'Không có SĐT'}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    <Text style={AssignShipperStyles.modalEmptyText}>Không tìm thấy shipper phù hợp.</Text>
                                }
                            />
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}