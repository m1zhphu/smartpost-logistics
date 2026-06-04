import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../services/notification';
import { COLORS } from '../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import Toast from 'react-native-toast-message';

export default function NotificationScreen({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { setUnreadCount } = useUser();


    const loadNotifications = async () => {
        try {
            const res = await notificationService.getUnread();
            const data = res.data.data || res.data;
            setNotifications(data);

            setUnreadCount(data.length);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải thông báo. Vui lòng thử lại sau.'
            });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadNotifications();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleMarkAsRead = async (id) => {
        try {
            // Cập nhật UI ngay lập tức
            setNotifications(prev => prev.filter(item => item.id !== id));

            // Trừ đi 1 số ở chuông đỏ toàn cục
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Gọi API chìm ở dưới
            await notificationService.markAsRead(id);
        } catch (error) {
            loadNotifications(); // Phục hồi data nếu lỗi
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                    <Ionicons name="arrow-back" size={26} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông Báo Của Bạn</Text>
                <View style={{ width: 26 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Bạn không có thông báo mới nào</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    listContent: { padding: 16, paddingBottom: 40 },
    notificationCard: {
        flexDirection: 'row', backgroundColor: '#FFF', padding: 16,
        borderRadius: 12, marginBottom: 12, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
    },
    iconContainer: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    textContainer: { flex: 1, marginRight: 8 },
    title: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    message: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
    time: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 15, color: '#6B7280' }
});