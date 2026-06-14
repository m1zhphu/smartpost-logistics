import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';


const { width } = Dimensions.get('window');

const CreateOrderStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primary },

    header: {
        // flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        // paddingHorizontal: 15, paddingVertical: 30, backgroundColor: COLORS.headerBg
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        backgroundColor: COLORS.headerBg
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    trackingBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1b5e20', padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.inputBorderColor
    },
    trackingLabel: { color: '#888', fontSize: 12, marginRight: 8, fontWeight: 'bold' },
    trackingValue: { color: COLORS.secondary, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

    content: { flex: 1, padding: 15 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
        padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    activeCard: {
        backgroundColor: 'white',
        borderColor: COLORS.secondary, borderWidth: 1
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#aaa', marginLeft: 10, flex: 1 },

    cardBody: { marginLeft: 5 },

    infoRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
    iconFixed: { width: 24 },
    infoText: { color: '#ddd', fontSize: 14, flex: 1 },

    connectorContainer: { alignItems: 'center', height: 30, justifyContent: 'center', marginVertical: -5, zIndex: 1 },
    dottedLine: { height: '100%', width: 1, backgroundColor: COLORS.secondary, position: 'absolute' },
    connectorIcon: { backgroundColor: COLORS.primary, borderRadius: 10 },

    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f5f5f5', borderRadius: 8,
        paddingHorizontal: 10, marginBottom: 10, height: 45,
        borderWidth: 1, borderColor: '#eee'
    },
    input: { flex: 1, fontSize: 14, color: '#333' },

    bottomDock: {
        padding: 20,
        borderTopWidth: 1, borderTopColor: '#1b5e20',
        paddingBottom: 30
    },
    confirmBtn: {
        backgroundColor: COLORS.secondary, borderRadius: 30, height: 50,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, elevation: 2
    },
    confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default CreateOrderStyles;