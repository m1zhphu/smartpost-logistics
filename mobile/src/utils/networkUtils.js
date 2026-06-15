import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

export const checkNetworkConnection = async () => {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {

        Toast.show({ type: 'error', text1: 'Không có mạng', text2: 'Vui lòng kiểm tra lại Wifi hoặc 4G/5G.' });

        return false;
    }

    return true;
};

export const checkNetworkConnectionWithoutToast = async () => {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {

        return false;
    }

    return true;
};
