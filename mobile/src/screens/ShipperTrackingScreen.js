import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, FlatList, Keyboard, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getWaybillTimeline } from '../services/deliveryService';
import Toast from 'react-native-toast-message';

const PRIMARY = COLORS.primary || '#1B5E20';
const SECONDARY = COLORS.secondary || '#0F766E';

export default function ShipperTrackingScreen({ navigation }) {
    const [searchCode, setSearchCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [trackingData, setTrackingData] = useState(null);

    const handleSearch = async () => {
        if (!searchCode.trim()) {
            Toast.show({ type: 'error', text1: 'Vui lòng nhập mã vận đơn' });
            return;
        }

        Keyboard.dismiss();
        setLoading(true);
        const result = await getWaybillTimeline(searchCode.trim());
        setLoading(false);

        if (result.success) {
            setTrackingData(result.data);
        } else {
            setTrackingData(null);
            Toast.show({ type: 'error', text1: 'Không tìm thấy thông tin', text2: result.message });
        }
    };

    const renderTimelineItem = ({ item, index }) => {
        const isFirst = index === 0;
        const isLast = index === trackingData.timeline.length - 1;

        return (
            <View style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                    <Text style={styles.timeText}>{item.time.split(' ')[0]}</Text>
                    <Text style={styles.dateText}>{item.time.split(' ')[1]}</Text>
                </View>

                <View style={styles.timelineCenter}>
                    {!isFirst && <View style={styles.timelineLineTop} />}
                    <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
                    {!isLast && <View style={styles.timelineLineBottom} />}
                </View>

                <View style={styles.timelineRight}>
                    <Text style={[styles.actionText, isFirst && styles.actionTextActive]}>
                        {item.action}
                    </Text>
                    {item.location && item.location !== 'Hệ thống' && (
                        <Text style={styles.detailText}>Vị trí: {item.location}</Text>
                    )}
                    {item.actor && item.actor !== 'Hệ thống' && (
                        <Text style={styles.detailText}>Người thao tác: {item.actor}</Text>
                    )}
                    {item.note ? (
                        <Text style={styles.noteText}>Ghi chú: {item.note}</Text>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* ===== HEADER ===== */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Tracking Vận Đơn</Text>
                </View>

                <View style={{ width: 38 }} />
            </View>

            {/* ===== SEARCH BAR ===== */}
            <View style={styles.searchSection}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputWrap}>
                        <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Nhập mã vận đơn..."
                            placeholderTextColor="#94A3B8"
                            value={searchCode}
                            onChangeText={setSearchCode}
                            autoCapitalize="characters"
                            onSubmitEditing={handleSearch}
                        />
                        {searchCode.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchCode('')}>
                                <Ionicons name="close-circle" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#FFF" size="small" />
                            : <Text style={styles.searchBtnText}>Tìm</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>

            {/* ===== CONTENT ===== */}
            {trackingData ? (
                <View style={{ flex: 1 }}>
                    <View style={styles.statusCard}>
                        <View style={styles.statusCardLeft}>
                            <View style={styles.statusIconBox}>
                                <Ionicons name="pulse" size={20} color={PRIMARY} />
                            </View>
                            <View>
                                <Text style={styles.statusLabel}>Trạng thái hiện tại</Text>
                                <Text style={styles.statusValue}>{trackingData.status}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Hành trình chi tiết</Text>

                    <FlatList
                        data={[...trackingData.timeline].reverse()}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderTimelineItem}
                        contentContainerStyle={styles.timelineContainer}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="cube-outline" size={36} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
                    <Text style={styles.emptyText}>Nhập mã vận đơn để xem hành trình</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },

    /* ===== HEADER ===== */
    header: {
        flexDirection: 'row',
        backgroundColor: PRIMARY,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        paddingHorizontal: 20,
        paddingBottom: 22,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 42,
        borderBottomRightRadius: 42,
        ...Platform.select({
            ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
            android: { elevation: 8 },
        }),
    },
    headerBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },

    /* ===== SEARCH ===== */
    searchSection: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    searchRow: { flexDirection: 'row', gap: 10 },
    searchInputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 44,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '600' },
    searchBtn: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 20,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 44,
    },
    searchBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    /* ===== STATUS CARD ===== */
    statusCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusIconBox: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center', alignItems: 'center',
    },
    statusLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 2 },
    statusValue: { fontSize: 15, fontWeight: '900', color: PRIMARY },

    /* ===== SECTION TITLE ===== */
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },

    /* ===== TIMELINE ===== */
    timelineContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 12,
    },
    timelineRow: { flexDirection: 'row', minHeight: 50 },
    timelineLeft: {
        width: 64,
        alignItems: 'flex-end',
        paddingRight: 12,
        paddingTop: 2,
    },
    timeText: { fontSize: 13, fontWeight: '800', color: '#374151' },
    dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    timelineCenter: { width: 20, alignItems: 'center' },
    timelineDot: {
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#CBD5E1',
        marginTop: 5, zIndex: 2,
    },
    timelineDotActive: {
        backgroundColor: PRIMARY,
        width: 14, height: 14, borderRadius: 7,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    timelineLineTop: {
        position: 'absolute', top: 0, bottom: '80%',
        width: 2, backgroundColor: '#E2E8F0',
    },
    timelineLineBottom: {
        position: 'absolute', top: 15, bottom: -10,
        width: 2, backgroundColor: '#E2E8F0',
    },
    timelineRight: { flex: 1, paddingLeft: 12, paddingBottom: 24 },
    actionText: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
    actionTextActive: { color: PRIMARY, fontWeight: '900' },
    detailText: { fontSize: 12, color: '#64748B', marginBottom: 2, fontWeight: '600' },
    noteText: { fontSize: 12, color: '#D97706', fontStyle: 'italic', marginTop: 2, fontWeight: '600' },

    /* ===== EMPTY STATE ===== */
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyIconBox: {
        width: 80, height: 80, borderRadius: 28,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 4,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: '#374151' },
    emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
});
