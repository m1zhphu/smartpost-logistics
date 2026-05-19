import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

// Khung quét tối ưu cho việc chụp ngang (Landscape) khi cầm máy dọc
export const FRAME_W = width * 0.9;
export const FRAME_H = height * 0.65;

const HomeStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    // --- Permission Screen ---
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.formSectionBg, paddingHorizontal: 32 },
    permissionIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.secondary },
    permissionTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
    permissionDesc: { fontSize: 15, color: COLORS.textGray, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    btnPermission: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 100, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    btnPermissionText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

    // --- Camera Overlays ---
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },

    // Mask layer (Tạo hiệu ứng kính mờ xung quanh khung quét)
    maskContainer: { ...StyleSheet.absoluteFillObject },
    maskTop: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.65)' },
    maskBottom: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.65)' },
    maskCenter: { flexDirection: 'row', height: FRAME_H },
    maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },

    scanFrame: { width: FRAME_W, height: FRAME_H, position: 'relative', justifyContent: 'center', alignItems: 'center' },
    scanHint: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' },

    // --- Header ---
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 55 : 45, paddingBottom: 15, zIndex: 100 },
    headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerCenter: { flexDirection: 'column', alignItems: 'center' },
    headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    headerSubtitle: { color: COLORS.secondary, fontSize: 12, fontWeight: '600', marginTop: 2 },
    queueBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    badge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.error, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#000' },
    badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },

    // --- Corners Focus ---
    corner: { position: 'absolute', width: 40, height: 40, zIndex: 30 },
    cornerHorizontal: { position: 'absolute', top: 0, left: 0, width: 40, height: 4, backgroundColor: COLORS.secondary, borderRadius: 2 },
    cornerVertical: { position: 'absolute', top: 0, left: 0, width: 4, height: 40, backgroundColor: COLORS.secondary, borderRadius: 2 },

    // --- Bottom Bar ---
    bottomBar: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 45 : 30, paddingTop: 20, alignItems: 'center', backgroundColor: '#000000', zIndex: 100, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 },
    statChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    statText: { fontSize: 12, fontWeight: '600' },

    shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
    sideBtn: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    sideBtnLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, marginTop: 4, fontWeight: '600' },

    // Camera Shutter Button
    shutterOuter: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 4, borderColor: COLORS.white },
    shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },

    versionText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 15, fontWeight: '500' },

    // --- Menus & Bottom Sheets ---
    toastLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
    menuSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.headerBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12, maxHeight: height * 0.85, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, elevation: 20 },
    sheetHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    menuUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16 },
    menuAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuAvatarText: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
    menuUserName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
    menuUserRole: { fontSize: 13, color: COLORS.textGray, marginTop: 4, fontWeight: '500' },
    closeSheetBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    sheetDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },
    sheetSectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textGray, letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 8, marginLeft: 4 },
    sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
    sheetIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    sheetItemText: { fontSize: 16, fontWeight: '600', color: COLORS.white, flex: 1 },
});

export default HomeStyles;