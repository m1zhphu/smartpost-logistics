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
    
    // Modal Select Role
    roleModalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    roleModalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    roleModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
    },
    roleButton: {
        width: '100%',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    roleButtonText: {
        fontSize: 16,
        color: '#333',
    },
    roleButtonTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    roleCloseBtn: {
        marginTop: 20,
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
    },
    roleCloseText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    }
});

export default LoginStyles;
