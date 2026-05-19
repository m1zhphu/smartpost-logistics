import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const ProcessedListStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundSoft },

    // --- Header ---
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.3 },
    headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
    clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.errorBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    clearBtnText: { fontSize: 13, color: COLORS.error, fontWeight: '700' },

    // --- Summary Row ---
    summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { fontSize: 12, fontWeight: '700' },

    // --- List Container ---
    listContent: { padding: 20, gap: 16 },

    // --- Modern Card ---
    card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    cardTopLeft: { flex: 1, flexDirection: 'row', gap: 12 },

    // Thumbnail Wrap
    thumbWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.borderLight },
    thumb: { width: 85, height: 85, borderRadius: 14 },
    zoomOverlay: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 6 },

    // Info Wrap
    cardInfo: { flex: 1, justifyContent: 'center', paddingRight: 4 },
    seqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    seqText: { color: COLORS.textGray, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

    trackingNum: { fontSize: 18, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5, marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    infoText: { fontSize: 13, color: COLORS.textMuted, flex: 1, marginLeft: 6, fontWeight: '500' },
    errorMsg: { fontSize: 14, color: COLORS.error, lineHeight: 20, fontWeight: '500', marginTop: 4 },
    loadingMsg: { fontSize: 14, color: COLORS.warning, fontStyle: 'italic', fontWeight: '500', marginTop: 4 },

    // Status Badge & Delete
    cardTopRight: { alignItems: 'flex-end', gap: 8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },
    deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center', marginTop: 4 },

    // Actions
    cardFooter: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.inputBg },
    btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
    btnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
    btnRetry: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.errorBg, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.error },
    btnRetryText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },

    // --- Empty State ---
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: height * 0.1 },
    emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 10 },
    emptyDesc: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 100 },
    emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

    // --- Image Viewer Modal ---
    imgModal: { flex: 1, backgroundColor: '#000000', justifyContent: 'center' },
    imgModalClose: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width, height: height * 0.7 },
    imgModalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 24, paddingHorizontal: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    imgModalHint: { color: COLORS.textGray, fontSize: 14, marginBottom: 16, fontWeight: '500' },
    imgModalBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.logOut, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 100, shadowColor: COLORS.logOut, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    imgModalBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});

export default ProcessedListStyles;