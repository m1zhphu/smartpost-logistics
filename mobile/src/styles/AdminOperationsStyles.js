import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const AdminOperationsStyles = StyleSheet.create({
    // --- Modern Header ---
    headerArea: {
        backgroundColor: COLORS.headerBg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        zIndex: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    headerCircleDecoration: {
        position: 'absolute',
        top: -30,
        right: -60,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '800',
    },

    // --- Body Content ---
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
        backgroundColor: COLORS.backgroundSoft,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: COLORS.secondaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 0.3,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 8,
    },

    // --- Modern Inputs ---
    input: {
        borderWidth: 1,
        borderColor: COLORS.inputBorderColor,
        backgroundColor: COLORS.inputBg,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textMain,
        marginBottom: 16,
    },

    // --- Status Toggles ---
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
    },
    statusBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    statusBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    statusText: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '700',
    },
    statusTextActive: {
        color: COLORS.white,
    },

    // --- Call to Action Button ---
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 10,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnText: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },

    // --- Log Items ---
    logItem: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.inputBorderColor,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
    },
    logTitle: {
        fontWeight: '800',
        color: COLORS.primary,
        fontSize: 14,
    },
    logTime: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    logText: {
        color: COLORS.textMain,
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 22,
        fontWeight: '500',
    },
    logReason: {
        color: COLORS.textMuted,
        fontSize: 13,
        marginTop: 6,
        fontStyle: 'italic',
    },
});

export default AdminOperationsStyles;