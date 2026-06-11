import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const LoginStyles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    topSpacer: {
        height: Platform.OS === 'ios' ? 80 : 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    logoImage: {
        width: width * 0.75,
        height: 80,
    },
    formSection: {
        width: '100%',
        alignItems: 'center',
    },
    loginTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.primaryColorAuth,
        marginBottom: 24,
    },
    loginBtn: {
        width: '100%',
        marginTop: 12,
    },
    registerRow: {
        flexDirection: 'row',
        marginTop: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerTextNormal: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: "600"
    },
    registerTextBold: {
        color: COLORS.primaryColorAuth,
        fontWeight: '800',
        fontSize: 14,
    },
    footerLogosContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        marginTop: 40,
    },
    footerImage: {
        width: width * 0.35,
        height: 40,
    },
    footerDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalKeyboardWrap: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
            android: { elevation: 10 }
        })
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: "#0F172A",
        marginBottom: 12,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    modalBtnContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 24
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 6,
    },
});

export default LoginStyles;
