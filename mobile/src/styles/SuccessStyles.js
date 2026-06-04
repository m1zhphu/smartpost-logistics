import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const SuccessStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', padding: 20 },

    iconContainer: { marginBottom: 30 },
    circleBg: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.secondary,
        justifyContent: 'center', alignItems: 'center',
        elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3
    },

    contentBox: { width: '100%', alignItems: 'center' },
    title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
    subtitle: { color: '#a5d6a7', fontSize: 14, marginBottom: 30, textAlign: 'center' },

    ticketContainer: {
        width: '100%', backgroundColor: 'white', borderRadius: 12,
        overflow: 'hidden', marginBottom: 40,
        elevation: 5
    },
    ticketHeader: { backgroundColor: '#e8f5e9', padding: 10, alignItems: 'center' },
    ticketLabel: { color: COLORS.secondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    ticketBody: { padding: 20, alignItems: 'center' },
    trackingCode: { fontSize: 26, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 2 },

    dashedLine: { height: 1, width: '90%', alignSelf: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 1 },

    ticketFooter: { flexDirection: 'row', padding: 10, justifyContent: 'center', alignItems: 'center' },
    ticketFooterText: { color: '#666', fontSize: 12, marginLeft: 5 },

    buttonGroup: { width: '100%' },

    btnPrimary: {
        backgroundColor: COLORS.secondary,
        height: 55, borderRadius: 30,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        elevation: 5
    },
    btnPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    btnOutline: {
        height: 55, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.secondary,
        marginBottom: 15, backgroundColor: 'transparent'
    },
    btnOutlineText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 16 }
});

export default SuccessStyles;