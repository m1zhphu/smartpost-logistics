import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const RegisterStyles = StyleSheet.create({
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
        height: Platform.OS === 'ios' ? 60 : 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    logoImage: {
        width: width * 0.7,
        height: 70,
    },
    formSection: {
        width: '100%',
        alignItems: 'center',
    },
    registerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        width: '100%',
        height: 50,
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
        fontSize: 15,
        height: '100%',
    },
    registerBtn: {
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
    registerText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginRow: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginTextNormal: {
        color: '#666666',
        fontSize: 14,
    },
    loginTextBold: {
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footerLogosContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        marginTop: 30,
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

    // OTP Modal Styles
    otpModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpModalContent: {
        width: '85%',
        backgroundColor: COLORS.background,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#1b5e20',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    otpModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 12,
        textAlign: 'center'
    },
    otpModalSubtitle: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    otpInput: {
        height: 60,
        width: '100%',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 8,
        color: '#333333',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: COLORS.borderColorAuth,
        marginBottom: 20,
    },
    otpBtnContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    otpCancelBtn: {
        flex: 1,
        height: 50,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    otpCancelText: {
        color: '#666666',
        fontWeight: 'bold',
        fontSize: 15,
    },
    otpSubmitBtn: {
        flex: 1,
        height: 50,
        marginLeft: 8,
        shadowColor: '#1b5e20',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    otpGradientBtn: {
        flex: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpSubmitText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    }
});

export default RegisterStyles;
