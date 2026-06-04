import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');


const HomeStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },

    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    permissionText: { marginTop: 10, color: '#666', marginBottom: 20 },
    btnPermission: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    btnPermissionText: { color: 'white', fontWeight: 'bold' },

    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 10
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
    iconBtnBlur: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
    headerTitleBlur: { color: 'white', fontSize: 18, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5, zIndex: 20 },
    scanHintText: { color: 'white', marginTop: 15, padding: 8, borderRadius: 8, overflow: 'hidden', fontSize: 13, zIndex: 10 },

    captureFloatingContainer: { position: 'absolute', bottom: 40, alignSelf: 'center', zIndex: 20 },
    shutterBtnOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    shutterBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'white' },

    closePreviewBtn: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, zIndex: 20 },

    bottomSheetWrapper: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        justifyContent: 'flex-end',
        maxHeight: '85%'
    },
    bottomSheetContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25, borderTopRightRadius: 25,
        paddingHorizontal: 20, paddingTop: 12,
        flexShrink: 1,
        minHeight: 250
    },
    dragHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

    centerContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
    statusText: { marginTop: 15, color: COLORS.primary, fontWeight: '500' },

    successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    successTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginLeft: 8 },
    sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#888', marginBottom: 8, marginTop: 5 },

    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12,
        marginBottom: 10, borderWidth: 1, borderColor: '#eee',
        minHeight: 48
    },
    input: { flex: 1, fontSize: 15, color: '#333', paddingVertical: 10 },

    btnRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
    btnSecondary: {
        flex: 0.3, justifyContent: 'center', alignItems: 'center', height: 48,
        borderRadius: 24, borderWidth: 1, borderColor: '#ccc', backgroundColor: 'white'
    },
    btnSecondaryText: { color: '#666', fontWeight: 'bold' },
    btnPrimary: {
        flex: 0.65, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 48,
        borderRadius: 24, backgroundColor: '#0f3d26', elevation: 2
    },
    btnPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    errorIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    errorTitle: { fontSize: 17, fontWeight: 'bold', color: '#d32f2f', marginBottom: 5 },
    errorDesc: { color: '#666', marginBottom: 20 },
    btnRetry: {
        flexDirection: 'row', backgroundColor: '#d32f2f', paddingHorizontal: 25, paddingVertical: 12,
        borderRadius: 25, alignItems: 'center'
    },
    btnRetryText: { color: 'white', fontWeight: 'bold' },

    // scanFrameContainer: {
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     flex: 1,
    //     paddingBottom: 100,
    //     position: 'relative',
    // },

    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingBottom: 100,
        position: 'relative',
    },

    // scanFrame: {
    //     width: width * 0.8,
    //     height: width * 1.2,
    //     borderWidth: 2,
    //     borderColor: '#fff',
    //     borderStyle: 'dashed',
    //     zIndex: 10,
    //     position: 'relative',
    // },

    // --- CẬP NHẬT LẠI SCANFRAME: XÓA BỎ BORDER CŨ ---
    scanFrame: {
        width: width * 0.8,
        height: width * 1.2,
        // borderWidth: 2,     <- XÓA DÒNG NÀY
        // borderColor: '#fff', <- XÓA DÒNG NÀY
        // borderStyle: 'dashed', <- XÓA DÒNG NÀY
        zIndex: 10,
        position: 'relative',
    },

    // --- THÊM CÁC STYLE MỚI ĐỂ VẼ 4 GÓC VUÔNG ---
    // Style chung cho 1 cạnh của góc vuông
    corner: {
        position: 'absolute',
        width: 30, // Độ dài của cạnh góc vuông
        height: 30, // Độ dài của cạnh góc vuông
        borderColor: '#fff', // Màu trắng (hoặc dùng COLORS.secondary nếu muốn màu xanh)
        borderWidth: 5, // Độ dày của góc vuông (làm đậm lên cho rõ)
        zIndex: 11, // Nằm trên lớp mask
    },
    // Vị trí góc trên bên trái
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0, // Ẩn cạnh dưới
        borderRightWidth: 0,  // Ẩn cạnh phải
    },
    // Vị trí góc trên bên phải
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0, // Ẩn cạnh dưới
        borderLeftWidth: 0,   // Ẩn cạnh trái
    },
    // Vị trí góc dưới bên trái
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,   // Ẩn cạnh trên
        borderRightWidth: 0,  // Ẩn cạnh phải
    },
    // Vị trí góc dưới bên phải
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,   // Ẩn cạnh trên
        borderLeftWidth: 0,   // Ẩn cạnh trái
    },
    // ---------------------------------------------

    // maskBase: {
    //     position: 'absolute',
    //     backgroundColor: 'rgba(0, 0, 0, 0.80)',
    //     zIndex: 1,
    // },

    maskBase: {
        position: 'absolute',
        // Làm mờ vùng xung quanh đậm hơn một chút (0.85) để nổi bật khung ngắm
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1,
    },

    maskTop: {
        bottom: '100%',
        left: -1000,
        right: -1000,
        height: 1900,
    },

    maskBottom: {
        top: '100%',
        left: -1000,
        right: -1000,
        height: 2000,
    },

    maskLeft: {
        right: '100%',
        top: 0,
        bottom: 0,
        width: 1000,
    },

    maskRight: {
        left: '100%',
        top: 0,
        bottom: 0,
        width: 1000,
    },


    listButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center'
    },
    badge: {
        backgroundColor: '#a5d6a7',
        // backgroundColor: COLORS.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    menuContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        alignSelf: 'center',
        elevation: 5
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    menuTitle: { fontSize: 18, fontWeight: 'bold' },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    menuText: { fontSize: 16, flex: 1, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 5 },

    accountModalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
    accountHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : 50,
        backgroundColor: 'white'
    },
    accountHeaderTitle: { fontSize: 20, fontWeight: 'bold' },
    closeBtnCircle: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee',
        justifyContent: 'center', alignItems: 'center'
    },
    accountBody: { padding: 20 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#4caf50',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, elevation: 5
    },
    sectionBox: {
        backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 20
    },
    rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    rowLabel: { color: '#666', fontSize: 16 },
    rowValue: { fontWeight: 'bold', fontSize: 16 },
    deleteBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffcdd2',
        backgroundColor: '#ffebee'
    }
});

export default HomeStyles;