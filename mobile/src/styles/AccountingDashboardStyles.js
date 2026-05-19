import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const AccountingDashboardStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundSoft },

    headerArea: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
        backgroundColor: COLORS.headerBg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
    },
    headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    headerSubtitle: { color: COLORS.secondary, fontSize: 14, fontWeight: '600' },

    loading: { marginTop: 60 },
    content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

    summaryCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    summaryTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: { fontSize: 42, fontWeight: '800', color: COLORS.primary },

    actionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.secondaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.primary },
});

export default AccountingDashboardStyles;
