import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const HubManagementStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerArea: { backgroundColor: COLORS.headerBg, paddingTop: 50, paddingBottom: 60, position: 'relative', overflow: 'hidden', zIndex: 1 },
    headerCircleDecoration: { position: 'absolute', top: -30, right: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scrollView: { flex: 1, zIndex: 10, marginTop: -35 },
    scrollContent: { padding: 15, paddingBottom: 100 },
    summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#edf1ed' },
    summaryIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#edf8ef', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    summaryLabel: { fontSize: 13, color: '#7b867e', marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    summaryBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    summaryBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#edf1ed' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconWrap: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#edf8ef', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    hubName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
    hubCode: { fontSize: 13, color: '#7b867e', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#edf1ed', marginVertical: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    addressText: { color: '#7b867e', fontSize: 14, flex: 1, lineHeight: 22 },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#edf1ed', backgroundColor: COLORS.backgroundSoft, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, color: COLORS.primary, marginBottom: 20 },
    submitBtn: { backgroundColor: COLORS.secondary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
});

export default HubManagementStyles;
