// src/components/AccountModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import Constants from 'expo-constants';
import { COLORS } from '../constants/colors';

export default function AccountModal({ visible, onClose }) {
    const { user } = useUser();
    const appVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.1';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet" // Hoạt động siêu mượt trên iOS
            onRequestClose={onClose}
        >
            <View style={styles.accountModalContainer}>
                <View style={styles.accountHeader}>
                    <Text style={styles.accountHeaderTitle}>Tài khoản</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtnCircle}>
                        <Ionicons name="close" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.accountBody}>
                    <View style={{ alignItems: 'center', marginBottom: 30 }}>
                        <View style={styles.avatarCircle}>
                            <Text style={{ fontSize: 30, color: 'white', fontWeight: 'bold' }}>
                                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>{user?.username}</Text>
                        <Text style={{ color: '#666' }}>Thành viên Speed Light</Text>
                    </View>

                    <View style={styles.sectionBox}>
                        <View style={styles.rowItem}>
                            <Text style={styles.rowLabel}>Tên đăng nhập</Text>
                            <Text style={styles.rowValue}>{user?.username}</Text>
                        </View>
                        <View style={styles.divider} />

                        {/* Hiện thông tin kho SPL (Nếu có) */}
                        {user?.ma_kho_spl && (
                            <>
                                <View style={styles.rowItem}>
                                    <Text style={styles.rowLabel}>Mã kho</Text>
                                    <Text style={styles.rowValue}>{user.ma_kho_spl}</Text>
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}

                        <View style={styles.rowItem}>
                            <Text style={styles.rowLabel}>Phiên bản App</Text>
                            <Text style={styles.rowValue}>{appVersion}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Bê luôn các styles liên quan từ HomeStyles.js sang đây cho gọn nhẹ file gốc
const styles = StyleSheet.create({
    accountModalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
    accountHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : 50,
        backgroundColor: 'white'
    },
    accountHeaderTitle: { fontSize: 20, fontWeight: 'bold' },
    closeBtnCircle: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee',
        justifyContent: 'center', alignItems: 'center'
    },
    accountBody: { padding: 20 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#4caf50',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, elevation: 5
    },
    sectionBox: {
        backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 20
    },
    rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    rowLabel: { color: '#666', fontSize: 16 },
    rowValue: { fontWeight: 'bold', fontSize: 16 },
    deleteBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffcdd2',
        backgroundColor: '#ffebee'
    },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 5 },
});