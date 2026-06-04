import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Image, FlatList, StyleSheet,
    Modal, Dimensions, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/ProcessedListStyles';
import { COLORS } from '../constants/colors';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

export default function ProcessedListComponent({
    queue, onClose, onClear, onDelete, onRetry, navigation
}) {
    const safeQueue = Array.isArray(queue) ? queue : [];
    const [viewingItem, setViewingItem] = useState(null);
    const { user } = useUser();

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const handleCreateOrder = (item) => {
        onClose();
        navigation.navigate('CreateOrder', {
            senderData: item.data?.sender,
            receiverData: item.data?.receiver,
            trackingNumber: item.data?.tracking_number,
            username: user.username,
            queueId: item.id,
            bankBranch: item.data?.bank_branch,
            unitCode: item.data?.unit_code
        });
    };

    const handleRetakeFromModal = () => {
        if (viewingItem) {
            onDelete(viewingItem.id);
            setViewingItem(null);
            setTimeout(() => {
                onClose();
            }, Platform.OS === 'ios' ? 500 : 0);
        }
    };

    const getErrorMessage = (type) => {
        switch (type) {
            case 'SERVER':
                return 'Lỗi máy chủ. Vui lòng thử lại.';
            case 'NETWORK':
                return 'Thao tác quá nhanh. Vui lòng thử lại.';
            case 'ORIENTATION':
                return 'Ảnh bị xoay. Vui lòng tắt khóa xoay và chụp ngang.';
            case 'FORMAT':
            default:
                return 'Không nhận diện được. Vui lòng thử lại.';
        }
    };
    const renderItem = ({ item, index }) => {
        const sequenceNumber = safeQueue.length - index;
        const timeStr = formatTime(item.id);

        return (
            <View style={styles.card}>
                <View style={styles.metaRow}>
                    <View style={styles.badgeIndex}>
                        <Text style={styles.badgeIndexText}>#{sequenceNumber}</Text>
                    </View>
                    <Text style={styles.timestampText}>Chụp lúc {timeStr}</Text>

                    <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.closeBtn}>
                        <Ionicons name="close" size={18} color="#999" />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {item.status === 'loading' && <ActivityIndicator size="small" color={COLORS.processScanOrange} />}
                        {item.status === 'success' && <Ionicons name="qr-code-outline" size={18} color={COLORS.secondary} />}
                        {item.status === 'error' && <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />}

                        <Text style={[styles.cardTitle, { color: item.status === 'error' ? COLORS.error : COLORS.secondary }]}>
                            {item.status === 'loading' ? ' ĐANG XỬ LÝ...' :
                                item.status === 'error' ? ' XỬ LÝ THẤT BẠI' :
                                    ' MÃ VẬN ĐƠN'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => setViewingItem(item)}>
                            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                            <View style={styles.zoomIcon}>
                                <Ionicons name="expand-outline" size={12} color="white" />
                            </View>
                        </TouchableOpacity>

                        <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                            {item.status === 'success' ? (
                                <>
                                    <Text style={styles.trackingText}>{item.data?.tracking_number}</Text>
                                    <Text style={styles.subText}>Người gửi: {item.data?.sender?.name || '---'}</Text>
                                </>
                            ) : item.status === 'error' ? (
                                <Text style={styles.errorText}>
                                    {getErrorMessage(item.errorType)}
                                </Text>
                            ) : (
                                <Text style={styles.subText}>Đang tải lên máy chủ...</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        {item.status === 'success' && (
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleCreateOrder(item)}>
                                <Text style={styles.primaryBtnText}>Tạo Đơn</Text>
                                <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 5 }} />
                            </TouchableOpacity>
                        )}

                        {item.status === 'error' && (
                            <TouchableOpacity style={styles.retryBtn} onPress={() => onRetry(item)}>
                                <Ionicons name="refresh" size={16} color="white" style={{ marginRight: 5 }} />
                                <Text style={styles.retryBtnText}>Thử lại</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.illustrationCircle}>
                <Ionicons name="qr-code-outline" size={80} color={COLORS.secondary} style={{ opacity: 0.8 }} />
                <View style={styles.miniIconBadge}>
                    <Ionicons name="camera" size={24} color="white" />
                </View>
            </View>

            <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>

            <Text style={styles.emptySubtitle}>
                Hãy căn mã vận đơn vào khung và bấm nút chụp để bắt đầu xử lý!
            </Text>

            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
                <Ionicons name="camera-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>QUÉT NGAY</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="chevron-down" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hàng chờ quét ({safeQueue.length})</Text>

                    {safeQueue.length > 0 && (
                        <TouchableOpacity onPress={onClear}>
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>XÓA TẤT CẢ</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={safeQueue}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={[
                        { padding: 15, paddingBottom: 50 },
                        safeQueue.length === 0 && { flex: 1 }
                    ]}
                    ListEmptyComponent={renderEmptyState}
                />
            </SafeAreaView>

            <Modal visible={viewingItem !== null} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setViewingItem(null)}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>

                    {viewingItem && (
                        <Image
                            source={{ uri: viewingItem.uri }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    <View style={styles.modalFooter}>
                        <Text style={{ color: 'white', marginBottom: 15 }}>Ảnh bị lỗi hoặc không phù hợp?</Text>

                        <TouchableOpacity
                            style={styles.modalRetakeBtn}
                            onPress={handleRetakeFromModal}
                        >
                            <Ionicons name="scan-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>XÓA VÀ QUÉT LẠI</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}