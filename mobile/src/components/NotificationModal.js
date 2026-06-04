import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notification';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import { checkNetworkConnection, checkNetworkConnectionWithoutToast } from '../utils/networkUtils';

// 1. IMPORT THƯ VIỆN LẮNG NGHE MẠNG
import NetInfo from '@react-native-community/netinfo';
import { useUser } from '../context/UserContext';

export default function NotificationModal({ visible, onClose }) {
    // Kéo mảng thông báo trực tiếp từ Context toàn cục
    const { notifications, setNotifications } = useUser();
    const [isNetworkError, setIsNetworkError] = useState(false);

    // =========================================================
    // LẮNG NGHE MẠNG
    // =========================================================
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsNetworkError(state.isConnected === false);
        });
        return () => unsubscribe();
    }, []);

    const handleMarkAsRead = async (id) => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsNetworkError(true);
            Alert.alert('Không có mạng', 'Vui lòng kiểm tra lại Wifi hoặc 4G/5G');
            return;
        }

        // 1. Cập nhật mảng ở Context (giao diện và chuông đỏ tự động giảm ngay lập tức)
        setNotifications(prev => prev.filter(item => item.id !== id));

        // 2. Báo cho Backend
        try {
            await notificationService.markAsRead(id);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể đánh dấu đã đọc lúc này!' });
        }
    };

    const renderIcon = (type) => {
        switch (type) {
            case 'NOI_BO': return <Ionicons name="swap-horizontal" size={24} color="#8B5CF6" />;
            case 'WARNING': return <Ionicons name="warning" size={24} color="#F59E0B" />;
            default: return <Ionicons name="information-circle" size={24} color="#3B82F6" />;
        }
    };
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    };

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
            onDismiss={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Thông Báo Mới</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* KIỂM TRA MẠNG Ở ĐÂY */}
                {isNetworkError ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="wifi-outline" size={60} color="#9CA3AF" />
                        <Text style={styles.emptyText}>Mất kết nối mạng!</Text>
                    </View>
                ) : (
                    /* NẾU CÓ MẠNG THÌ HIỂN THỊ FLATLIST */
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-done-circle-outline" size={60} color="#10B981" />
                                <Text style={styles.emptyText}>Bạn đã đọc hết tất cả thông báo!</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.notificationCard}
                                activeOpacity={0.7}
                                onPress={() => handleMarkAsRead(item.id)}
                            >
                                <View style={styles.iconContainer}>
                                    {renderIcon(item.type)}
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.message}>{item.message}</Text>
                                    <Text style={styles.time}>{formatDate(item.created_at)}</Text>
                                </View>
                                <View style={styles.unreadDot} />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    closeBtn: { padding: 4 },
    listContent: { padding: 16, paddingBottom: 40 },
    notificationCard: {
        flexDirection: 'row', backgroundColor: '#FFF', padding: 16,
        borderRadius: 16, marginBottom: 12, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
    },
    iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    textContainer: { flex: 1, marginRight: 8 },
    title: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    message: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
    time: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 15, color: '#6B7280', fontWeight: '500' },
    retryBtn: {
        marginTop: 16, backgroundColor: '#E0F2FE', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8
    },
    retryText: { color: '#0284C7', fontWeight: 'bold' }
});