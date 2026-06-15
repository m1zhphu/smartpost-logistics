import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const OrderDetailStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC'},
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1f13' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, height: 60, marginTop: StatusBar.currentHeight || 20 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 15 },

    card: { backgroundColor: '#1d3b2e', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    label: { color: '#aaa', fontSize: 12, marginBottom: 5 },
    trackingNumber: { color: COLORS.secondary, fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    date: { color: '#888', fontSize: 13, marginBottom: 10 },
    statusBadge: { backgroundColor: 'rgba(76, 175, 80, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
    statusText: { color: COLORS.secondary, fontSize: 12, fontWeight: 'bold' },

    section: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, marginBottom: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10 },
    sectionTitle: { color: COLORS.secondary, fontWeight: 'bold', marginLeft: 10 },

    infoRow: { flexDirection: 'row', marginBottom: 8 },
    infoLabel: { color: '#aaa', width: 60, fontSize: 14 },
    infoValue: { color: 'white', flex: 1, fontSize: 14, fontWeight: '500' },

    btnBack: { marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 5 },
    homeBtn: { marginTop: 20, marginBottom: 20, backgroundColor: '#1b5e20', padding: 15, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.secondary },
    homeBtnText: { color: 'white', fontWeight: 'bold' }
});

export default OrderDetailStyles;
