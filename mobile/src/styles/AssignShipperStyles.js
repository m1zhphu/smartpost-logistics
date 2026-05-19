import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { height } = Dimensions.get('window');

const AssignShipperStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    scannerWrapper: { flex: 0.45, position: 'relative' },

    // --- Camera Overlay Headers ---
    camHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 55 : 45, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    liveBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, justifyContent: 'center', shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    liveBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

    // --- Bottom Sheet ---
    bottomSheet: { flex: 0.55, backgroundColor: COLORS.backgroundSoft, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 0 },

    selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: COLORS.inputBorderColor },
    selectorIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center' },
    selectorMeta: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
    selectorText: { fontSize: 16, color: COLORS.primary, fontWeight: '800' },
    selectorPlaceholder: { color: COLORS.textGray, fontWeight: '600' },

    // --- List Header ---
    listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    listTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
    badgeCount: { backgroundColor: COLORS.secondaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 12 },
    badgeCountText: { color: COLORS.secondary, fontWeight: '800', fontSize: 13 },
    clearAllText: { color: COLORS.logOut, fontSize: 14, fontWeight: '700' },

    // --- List Items ---
    listContent: { paddingBottom: 100 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.inputBorderColor, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
    firstItem: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    listItemLeft: { flexDirection: 'row', alignItems: 'center' },
    itemIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.secondaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    itemIconWrapPrimary: { backgroundColor: 'rgba(255,255,255,0.15)' },
    itemText: { fontSize: 16, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
    itemTextPrimary: { color: COLORS.white },

    // --- Empty State ---
    emptyWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: COLORS.white },
    emptyText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '500', textAlign: 'center' },

    // --- Footer Action ---
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, backgroundColor: COLORS.backgroundSoft, borderTopWidth: 1, borderTopColor: COLORS.inputBorderColor },
    confirmBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    // --- Modal Styles ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: height * 0.85 },
    sheetHandle: { width: 40, height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary },

    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 14, paddingHorizontal: 16, marginBottom: 20, height: 52, borderWidth: 1, borderColor: COLORS.inputBorderColor },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.textMain, fontWeight: '600' },

    shipperItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.inputBg },
    shipperItemActive: { backgroundColor: COLORS.secondaryLight, borderRadius: 16, paddingHorizontal: 16, borderBottomWidth: 0, marginTop: 4 },
    shipperAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    shipperName: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
    shipperPhone: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

    modalEmptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted, fontSize: 15, fontWeight: '500' },
});

export default AssignShipperStyles;