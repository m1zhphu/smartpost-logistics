import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const LoginStyles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        backgroundColor: COLORS.backgroundSoft
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
        height: 90,
    },

    // --- Modern Form Card ---
    formSection: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 28,
        padding: 24,
        paddingTop: 32,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
    },
    loginTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 28,
        textAlign: 'center',
        letterSpacing: 0.5,
    },

    // --- Modern Inputs ---
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        width: '100%',
        height: 56,
        borderRadius: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.inputBorderColor,
    },
    icon: {
        marginRight: 12,
    },
    eyeIcon: {
        padding: 8,
    },
    input: {
        flex: 1,
        color: COLORS.textMain,
        fontSize: 15,
        fontWeight: '600',
        height: '100%',
    },

    // --- Gradient Button ---
    loginBtn: {
        width: '100%',
        height: 56,
        marginTop: 16,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    gradientBtn: {
        flex: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // --- Register Row (If needed later) ---
    registerRow: {
        flexDirection: 'row',
        marginTop: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerTextNormal: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    registerTextBold: {
        color: COLORS.secondary,
        fontWeight: '800',
        fontSize: 14,
    },

    // --- Footer Logos ---
    footerLogosContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        marginTop: 50,
    },
    footerImage: {
        width: width * 0.35,
        height: 40,
    },
    footerDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.borderLight,
        marginHorizontal: 16,
    }
});

export default LoginStyles;