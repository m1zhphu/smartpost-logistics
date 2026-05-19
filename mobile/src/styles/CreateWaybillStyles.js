import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const CreateWaybillStyles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundSoft },
    container: { flex: 1, backgroundColor: COLORS.backgroundSoft },

    // --- Modern Header ---
    mainHeader: { backgroundColor: COLORS.headerBg, paddingTop: Platform.OS === 'ios' ? 55 : 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 15, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5, zIndex: 10 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
    backCircleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitleWrap: { flex: 1, paddingHorizontal: 16 },
    headerHubName: { color: COLORS.secondary, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
    headerMainTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },

    // --- Pill Tabs ---
    tabScroll: { paddingHorizontal: 20, alignItems: 'center', gap: 10 },
    tabItem: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tabActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: COLORS.white, fontWeight: '800' },

    // --- Content & Cards ---
    scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 120 },
    card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },

    label: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 8, marginTop: 4 },
    req: { color: COLORS.error },

    // --- Modern Inputs ---
    mockInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 16, borderWidth: 1, borderColor: COLORS.inputBorderColor },
    textMain: { color: COLORS.primary, fontSize: 15, fontWeight: '700', flex: 1 },
    textMuted: { color: COLORS.textMuted, fontSize: 15, fontWeight: '500', flex: 1 },

    input: { backgroundColor: COLORS.inputBg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: COLORS.primary, fontWeight: '600', marginBottom: 16, borderWidth: 1, borderColor: COLORS.inputBorderColor },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.inputBorderColor },
    inputFlex: { flex: 1, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: COLORS.primary, fontWeight: '600' },

    row: { flexDirection: 'row', gap: 12 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dividerDashed: { height: 1, borderWidth: 1, borderColor: COLORS.borderLight, borderStyle: 'dashed', marginVertical: 16 },

    // --- Services & Toggles ---
    serviceTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    serviceBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: 'transparent' },
    serviceBtnActive: { backgroundColor: COLORS.secondaryLight, borderColor: COLORS.secondary },
    serviceBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
    serviceBtnTextActive: { color: COLORS.primary, fontWeight: '800' },

    paymentRow: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 14, padding: 4, marginBottom: 20 },
    payBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
    payBtnActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    payBtnText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
    payBtnTextActive: { color: COLORS.primary, fontWeight: '800' },

    // --- COD Box ---
    codBox: { backgroundColor: COLORS.warningBg, padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
    codLabel: { fontSize: 12, fontWeight: '800', color: COLORS.warningText, marginBottom: 8, letterSpacing: 0.5 },
    codInput: { fontSize: 28, fontWeight: '800', color: '#92400E', minWidth: 120, padding: 0 },
    codCurrency: { fontSize: 20, fontWeight: '800', color: '#92400E', marginLeft: 6 },
    codIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.processScanOrange, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.processScanOrange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },

    serviceBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.inputBg },
    serviceBoxActive: { backgroundColor: COLORS.secondaryLight, borderColor: COLORS.secondary },
    serviceName: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
    serviceDesc: { fontSize: 13, color: COLORS.textMuted },

    // --- Fees ---
    badge: { backgroundColor: COLORS.secondaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.secondary },
    badgeText: { color: COLORS.secondary, fontSize: 12, fontWeight: '800' },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    feeLabel: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' },
    feeValue: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
    totalLabel: { fontSize: 16, color: COLORS.primary, fontWeight: '800' },
    totalValue: { fontSize: 26, fontWeight: '800', color: COLORS.secondary },

    // --- Footer ---
    bottomFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10 },
    submitBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    // --- Bottom Sheet Modals ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: height * 0.85 },
    sheetHandle: { width: 40, height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary },

    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 14, marginBottom: 16, paddingHorizontal: 12 },
    searchItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.inputBg },
    createNewBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
});

export default CreateWaybillStyles;