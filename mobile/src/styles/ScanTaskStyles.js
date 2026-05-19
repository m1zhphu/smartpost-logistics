import { StyleSheet } from 'react-native';

const ScanTaskStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', position: 'relative' },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
});

export default ScanTaskStyles;
