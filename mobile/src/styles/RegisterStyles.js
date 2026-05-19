import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';


const { width } = Dimensions.get('window');

const RegisterStyles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    },
    formSection: {
        width: '100%',
        alignItems: 'center',
    },
    registerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2e7d32',
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
    registerText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginRow: {
        flexDirection: 'row',
        marginTop: 25,
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

    toastContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        elevation: 9999,
        pointerEvents: 'box-none'
    }
});

export default RegisterStyles;