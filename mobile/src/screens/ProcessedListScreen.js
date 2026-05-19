import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Image, FlatList,
    Modal, ActivityIndicator, Platform, Alert, LayoutAnimation, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import listStyles from '../styles/ProcessedListStyles';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';

// Kích hoạt LayoutAnimation cho Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_CONFIG = {
    loading: { color: COLORS.warning, bg: COLORS.warningBg, border: COLORS.warning, label: 'Đang xử lý', icon: null },
    success: { color: COLORS.secondary, bg: COLORS.secondaryLight, border: COLORS.secondary, label: 'Thành công', icon: 'checkmark-circle' },
    error: { color: COLORS.error, bg: COLORS.errorBg, border: COLORS.error, label: 'Thất bại', icon: 'alert-circle' },
};

const ERROR_MESSAGES = {
    SERVER: 'Lỗi máy chủ. Vui lòng thử lại.',
    NETWORK: 'Thao tác quá nhanh. Vui lòng thử lại.',
    ORIENTATION: 'Ảnh bị xoay. Vui lòng tắt khóa xoay và chụp ngang.',
    FORMAT: 'Không nhận diện được. Vui lòng thử lại.',
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.error;
    return (
        <View style={[listStyles.statusBadge, { backgroundColor: cfg.bg }]}>
            {status === 'loading'
                ? <ActivityIndicator size={12} color={cfg.color} style={{ marginRight: 6 }} />
                : <Ionicons name={cfg.icon} size={14} color={cfg.color} style={{ marginRight: 4 }} />
            }
            <Text style={[listStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}

function QueueCard({ item, index, total, onDelete, onRetry, onViewImage, onCreateOrder }) {
    const seqNum = total - index;
    const time = new Date(item.id);
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

    return (
        <View style={listStyles.card}>
            <View style={listStyles.cardTop}>
                {/* Trái: Ảnh và Thông tin */}
                <View style={listStyles.cardTopLeft}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => onViewImage(item)} style={listStyles.thumbWrap}>
                        <Image source={{ uri: item.uri }} style={listStyles.thumb} resizeMode="cover" />
                        <View style={listStyles.zoomOverlay}>
                            <Ionicons name="expand" size={16} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>

                    <View style={listStyles.cardInfo}>
                        <View style={listStyles.seqRow}>
                            <Text style={listStyles.seqText}>Mã quét #{seqNum}</Text>
                            <Text style={listStyles.timeText}>{timeStr}</Text>
                        </View>

                        {item.status === 'success' && (
                            <>
                                <Text style={listStyles.trackingNum} numberOfLines={1}>{item.data?.tracking_number || '—'}</Text>
                                <View style={listStyles.infoRow}>
                                    <Ionicons name="person" size={14} color={COLORS.textGray} />
                                    <Text style={listStyles.infoText} numberOfLines={1}>{item.data?.sender?.name || 'Chưa rõ người gửi'}</Text>
                                </View>
                                <View style={listStyles.infoRow}>
                                    <Ionicons name="location" size={14} color={COLORS.textGray} />
                                    <Text style={listStyles.infoText} numberOfLines={2}>{item.data?.receiver?.address || 'Chưa rõ địa chỉ nhận'}</Text>
                                </View>
                            </>
                        )}
                        {item.status === 'error' && (
                            <Text style={listStyles.errorMsg}>{ERROR_MESSAGES[item.errorType] || ERROR_MESSAGES.FORMAT}</Text>
                        )}
                        {item.status === 'loading' && (
                            <Text style={listStyles.loadingMsg}>Đang xử lý AI...</Text>
                        )}
                    </View>
                </View>

                {/* Phải: Trạng thái và Xóa */}
                <View style={listStyles.cardTopRight}>
                    <StatusBadge status={item.status} />
                    <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={listStyles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.textGray} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Các nút Hành động */}
            {(item.status === 'success' || item.status === 'error') && (
                <View style={listStyles.cardFooter}>
                    {item.status === 'success' && (
                        <TouchableOpacity activeOpacity={0.8} style={listStyles.btnPrimary} onPress={() => onCreateOrder(item)}>
                            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={listStyles.btnPrimaryText}>Tạo đơn hàng</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'error' && (
                        <TouchableOpacity activeOpacity={0.8} style={listStyles.btnRetry} onPress={() => onRetry(item)}>
                            <Ionicons name="refresh" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                            <Text style={listStyles.btnRetryText}>Thử lại ngay</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

export default function ProcessedListScreen({ queue, onClose, onClear, onDelete, onRetry, navigation }) {
    const safeQueue = Array.isArray(queue) ? queue : [];
    const [viewingItem, setViewingItem] = useState(null);
    const { user } = useUser();

    const successCount = safeQueue.filter(i => i.status === 'success').length;
    const loadingCount = safeQueue.filter(i => i.status === 'loading').length;
    const errorCount = safeQueue.filter(i => i.status === 'error').length;

    // Bọc hàm delete với Animation
    const handleAnimatedDelete = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onDelete(id);
    };

    const handleAnimatedClear = () => {
        Alert.alert('Xoá tất cả', 'Bạn có chắc chắn muốn xoá toàn bộ danh sách hàng chờ?', [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Xoá tất cả',
                onPress: () => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    onClear();
                },
                style: 'destructive'
            },
        ]);
    };

    const handleCreateOrder = (item) => {
        onClose();
        navigation.navigate('CreateWaybill', {
            ocrData: item.data,
            queueId: item.id,
        });
    };

    const handleRetakeFromModal = () => {
        if (!viewingItem) return;
        handleAnimatedDelete(viewingItem.id);
        setViewingItem(null);
        setTimeout(onClose, Platform.OS === 'ios' ? 500 : 0);
    };

    const renderEmpty = () => (
        <View style={listStyles.emptyWrap}>
            <View style={listStyles.emptyIconWrap}>
                <Ionicons name="images-outline" size={48} color={COLORS.textGray} />
            </View>
            <Text style={listStyles.emptyTitle}>Hàng chờ trống</Text>
            <Text style={listStyles.emptyDesc}>Các ảnh vận đơn đã quét sẽ được lưu trữ và hiển thị tại đây.</Text>
            <TouchableOpacity style={listStyles.emptyBtn} onPress={onClose}>
                <Ionicons name="camera-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={listStyles.emptyBtnText}>Bắt đầu quét ngay</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={listStyles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

                {/* ── Header ── */}
                <View style={listStyles.header}>
                    <TouchableOpacity onPress={onClose} style={listStyles.headerBtn}>
                        <Ionicons name="chevron-down" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingHorizontal: 16 }}>
                        <Text style={listStyles.headerTitle}>Hàng chờ xử lý</Text>
                        {safeQueue.length > 0 && <Text style={listStyles.headerSub}>{safeQueue.length} bản ghi chưa tạo đơn</Text>}
                    </View>
                    {safeQueue.length > 0 && (
                        <TouchableOpacity onPress={handleAnimatedClear} style={listStyles.clearBtn}>
                            <Ionicons name="trash" size={14} color={COLORS.error} style={{ marginRight: 6 }} />
                            <Text style={listStyles.clearBtnText}>Xoá hết</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Summary chips ── */}
                {safeQueue.length > 0 && (
                    <View style={listStyles.summaryRow}>
                        {loadingCount > 0 && (
                            <View style={[listStyles.chip, { backgroundColor: COLORS.warningBg, borderColor: '#FDE68A' }]}>
                                <ActivityIndicator size={12} color={COLORS.warning} style={{ marginRight: 6 }} />
                                <Text style={[listStyles.chipText, { color: COLORS.warningText }]}>{loadingCount} đang xử lý</Text>
                            </View>
                        )}
                        {successCount > 0 && (
                            <View style={[listStyles.chip, { backgroundColor: COLORS.secondaryLight, borderColor: COLORS.secondary }]}>
                                <Ionicons name="checkmark-circle" size={14} color={COLORS.secondary} style={{ marginRight: 4 }} />
                                <Text style={[listStyles.chipText, { color: COLORS.secondary }]}>{successCount} thành công</Text>
                            </View>
                        )}
                        {errorCount > 0 && (
                            <View style={[listStyles.chip, { backgroundColor: COLORS.errorBg, borderColor: COLORS.error }]}>
                                <Ionicons name="alert-circle" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
                                <Text style={[listStyles.chipText, { color: COLORS.error }]}>{errorCount} lỗi</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ── List ── */}
                <FlatList
                    data={safeQueue}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <QueueCard
                            item={item}
                            index={index}
                            total={safeQueue.length}
                            onDelete={handleAnimatedDelete}
                            onRetry={onRetry}
                            onViewImage={setViewingItem}
                            onCreateOrder={handleCreateOrder}
                        />
                    )}
                    contentContainerStyle={[
                        listStyles.listContent,
                        safeQueue.length === 0 && { flex: 1 },
                    ]}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>

            {/* ── Image Viewer Modal ── */}
            <Modal visible={viewingItem !== null} transparent animationType="fade" onRequestClose={() => setViewingItem(null)}>
                <View style={listStyles.imgModal}>
                    <TouchableOpacity activeOpacity={0.8} style={listStyles.imgModalClose} onPress={() => setViewingItem(null)}>
                        <Ionicons name="close" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    {viewingItem && (
                        <Image source={{ uri: viewingItem.uri }} style={listStyles.fullImg} resizeMode="contain" />
                    )}

                    <View style={listStyles.imgModalFooter}>
                        <Text style={listStyles.imgModalHint}>Ảnh chụp bị mờ, lóa hoặc không phù hợp?</Text>
                        <TouchableOpacity activeOpacity={0.8} style={listStyles.imgModalBtn} onPress={handleRetakeFromModal}>
                            <Ionicons name="scan-outline" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
                            <Text style={listStyles.imgModalBtnText}>Xoá thẻ này & Quét lại</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}