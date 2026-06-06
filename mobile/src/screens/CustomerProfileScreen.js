import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function CustomerProfileScreen({ navigation }) {
    const { user, refreshProfile } = useUser();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await refreshProfile();
            setLoading(false);
        };
        load();
    }, []);

    const InfoRow = ({ icon, label, value }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        <View style={styles.profileCard}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {(user?.full_name || user?.username || 'K').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.userName}>{user?.full_name || 'Chưa cập nhật tên'}</Text>
                            <Text style={styles.userRole}>Khách hàng thành viên</Text>
                            
                            <TouchableOpacity 
                                style={styles.editBtn}
                                onPress={() => navigation.navigate('CustomerUpdateProfile')}
                            >
                                <Ionicons name="pencil" size={16} color="#FFF" />
                                <Text style={styles.editBtnText}>Cập nhật thông tin</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.editBtn, { backgroundColor: '#4B5563', marginTop: 10 }]}
                                onPress={() => navigation.navigate('ChangePassword')}
                            >
                                <Ionicons name="lock-closed" size={16} color="#FFF" />
                                <Text style={styles.editBtnText}>Đổi mật khẩu</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                            <InfoRow icon="person-outline" label="Tên đăng nhập" value={user?.username} />
                            <InfoRow icon="call-outline" label="Số điện thoại" value={user?.phone_number} />
                            <InfoRow icon="mail-outline" label="Email" value={user?.email} />
                            <InfoRow icon="location-outline" label="Địa chỉ" value={user?.address} />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 15,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    content: { flex: 1 },
    profileCard: {
        backgroundColor: '#FFF',
        margin: 16, padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 2,
    },
    avatarPlaceholder: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
    userName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    userRole: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
    editBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 20,
    },
    editBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
    infoSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 16, marginBottom: 16,
        padding: 16, borderRadius: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
});
