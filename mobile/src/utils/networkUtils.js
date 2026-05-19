import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

export const checkNetworkConnection = async () => {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {

        Toast.show({ type: 'error', text1: 'Không có mạng', text2: 'Vui lòng kiểm tra kết nối internet.' });

        return false;
    }

    return true;
};