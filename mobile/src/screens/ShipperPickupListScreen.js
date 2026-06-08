import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getShipperAssignedPickups } from '../services/pickupService';
import { useUser } from '../context/UserContext';

export default function ShipperPickupListScreen({ navigation }) {
    const { logout } = useUser();
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPickups();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchPickups = async () => {
        setLoading(true);
        const result = await getShipperAssignedPickups();
        if (result.success) {
            setPickups(result.data);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        logout();
        navigation.replace('Login');
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('ShipperPickupDetail', { requestCode: item.request_code })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.requestCode}>{item.request_code}</Text>
                <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color="#666" style={styles.icon} />
                    <Text style={styles.infoText}>{item.sender_name}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="call" size={16} color="#666" style={styles.icon} />
                    <Text style={styles.infoText}>{item.sender_phone}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location" size={16} color="#666" style={styles.icon} />
                    <Text style={styles.infoText} numberOfLines={2}>{item.sender_address}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                    <Ionicons name="log-out-outline" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đơn được gán lấy hàng</Text>
                <TouchableOpacity onPress={fetchPickups} style={styles.iconButton}>
                    <Ionicons name="reload" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : pickups.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Hiện không có đơn nào cần đi lấy.</Text>
                </View>
            ) : (
                <FlatList
                    data={pickups}
                    keyExtractor={(item) => item.request_code}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 90, paddingTop: 40, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    iconButton: { padding: 5 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#666', fontSize: 16 },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
    requestCode: { fontWeight: 'bold', fontSize: 16, color: COLORS.secondary },
    statusText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 14 },
    cardBody: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    icon: { marginRight: 8, marginTop: 2 },
    infoText: { fontSize: 15, color: '#444', flex: 1 }
});
