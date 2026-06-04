import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const LoginStyles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    topSpacer: {
        height: Platform.OS === 'ios' ? 80 : 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    logoImage: {
        width: width * 0.8,
        height: 90,
        // height: 140,
    },
    formSection: {
        width: '100%',
        alignItems: 'center',
    },
    loginTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 25,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        width: '100%',
        height: 55,
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: COLORS.borderColorAuth,
        shadowColor: COLORS.primaryColorAuth,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.45,
    },
    icon: {
        marginRight: 10,
    },
    eyeIcon: {
        padding: 5,
    },
    input: {
        flex: 1,
        color: '#333333',
        fontSize: 16,
        height: '100%',
    },
    loginBtn: {
        width: '100%',
        height: 55,
        marginTop: 10,
        shadowColor: '#1b5e20',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 5,
    },
    gradientBtn: {
        flex: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerRow: {
        flexDirection: 'row',
        marginTop: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerTextNormal: {
        color: '#666666',
        fontSize: 14,
    },
    registerTextBold: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footerLogosContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        marginTop: 50,
    },
    footerImage: {
        width: width * 0.35,
        height: 45,
    },
    footerDivider: {
        width: 1,
        height: 35,
        backgroundColor: COLORS.borderColorAuth,
        marginHorizontal: 15,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e0e0e0',
        borderRadius: 25,
        marginBottom: 20,
        padding: 4,
        width: '100%',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: COLORS.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    toggleTextActive: {
        color: COLORS.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.background,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    otpInput: {
        width: '80%',
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.borderColorAuth,
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 20,
        letterSpacing: 5,
        marginBottom: 20,
    },
    modalBtnContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalBtnCancel: {
        backgroundColor: '#e0e0e0',
    },
    modalBtnSubmit: {
        backgroundColor: COLORS.primary,
    },
    modalBtnText: {
        color: COLORS.background,
        fontWeight: 'bold',
    },
    modalBtnTextCancel: {
        color: '#333',
        fontWeight: 'bold',
    }
});

export default LoginStyles;