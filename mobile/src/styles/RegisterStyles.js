import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const PRIMARY = COLORS.primaryColorAuth || "#1B5E20";

const RegisterStyles = StyleSheet.create({
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
    registerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: PRIMARY,
        marginBottom: 24,
    },
    inputWrapper: {
        minHeight: 56,
        width: "100%",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
    },
    icon: {
        marginLeft: 16,
        marginRight: 10,
    },
    eyeIcon: {
        width: 48,
        height: 56,
        alignItems: "center",
        justifyContent: "center",
    },
    input: {
        flex: 1,
        height: 56,
        color: "#0F172A",
        fontSize: 15,
        fontWeight: "600",
        paddingRight: 12,
        paddingVertical: 0,
    },
    registerBtn: {
        width: '100%',
        minHeight: 56,
        borderRadius: 14,
        backgroundColor: PRIMARY,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    registerText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
    },
    loginRow: {
        flexDirection: 'row',
        marginTop: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginTextNormal: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: "600"
    },
    loginTextBold: {
        color: PRIMARY,
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
    toastContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        elevation: 9999,
        pointerEvents: 'box-none'
    }
});

export default RegisterStyles;