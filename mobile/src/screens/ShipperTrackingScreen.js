import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, FlatList, Keyboard, ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getWaybillTimeline } from '../services/deliveryService';
import Toast from 'react-native-toast-message';

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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tracking Vận Đơn</Text>
                <View style={{ width: 26 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Nhập mã vận đơn..."
                        value={searchCode}
                        onChangeText={setSearchCode}
                        autoCapitalize="characters"
                        onSubmitEditing={handleSearch}
                    />
                    {searchCode.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchCode('')} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.searchBtnText}>Tìm</Text>}
                </TouchableOpacity>
            </View>

            {trackingData ? (
                <View style={{ flex: 1 }}>
                    <View style={styles.statusBox}>
                        <Text style={styles.statusLabel}>Trạng thái hiện tại:</Text>
                        <Text style={styles.statusValue}>{trackingData.status}</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Hành trình chi tiết</Text>
                    
                    <FlatList
                        data={[...trackingData.timeline].reverse()} // Show newest first
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderTimelineItem}
                        contentContainerStyle={styles.timelineContainer}
                    />
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={60} color="#DDD" />
                    <Text style={styles.emptyText}>Nhập mã vận đơn để xem hành trình</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        height: 90,
        paddingTop: 40,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    iconButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    
    searchContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    searchIcon: { marginRight: 5 },
    searchInput: { flex: 1, height: 40, fontSize: 15 },
    clearBtn: { padding: 5 },
    searchBtn: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    searchBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: { color: '#999', fontSize: 15, marginTop: 10 },

    statusBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFF',
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    statusLabel: { fontSize: 15, color: '#666' },
    statusValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        padding: 15,
        paddingBottom: 5,
    },

    timelineContainer: {
        padding: 15,
        backgroundColor: '#FFF',
        paddingBottom: 40,
    },
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        width: 60,
        alignItems: 'flex-end',
        paddingRight: 10,
        paddingTop: 2,
    },
    timeText: { fontSize: 14, fontWeight: 'bold', color: '#444' },
    dateText: { fontSize: 12, color: '#888' },
    
    timelineCenter: {
        width: 20,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#CCC',
        marginTop: 5,
        zIndex: 2,
    },
    timelineDotActive: {
        backgroundColor: COLORS.primary,
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    timelineLineTop: {
        position: 'absolute',
        top: 0,
        bottom: '80%',
        width: 2,
        backgroundColor: '#EEE',
    },
    timelineLineBottom: {
        position: 'absolute',
        top: 15,
        bottom: -10,
        width: 2,
        backgroundColor: '#EEE',
    },

    timelineRight: {
        flex: 1,
        paddingLeft: 10,
        paddingBottom: 25,
    },
    actionText: { fontSize: 15, fontWeight: 'bold', color: '#444', marginBottom: 4 },
    actionTextActive: { color: COLORS.primary },
    detailText: { fontSize: 13, color: '#666', marginBottom: 2 },
    noteText: { fontSize: 13, color: '#EAB308', fontStyle: 'italic', marginTop: 2 },
});
