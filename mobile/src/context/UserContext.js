
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL, CUSTOMER_ENDPOINTS } from '../constants/customerEndpoints';
import { ADMIN_ENDPOINTS } from '../constants/adminEndpoints';
import { WAREHOUSE_API_URL, WAREHOUSE_ENDPOINTS } from '../constants/warehouseEndpoints';
import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { checkNetworkConnection } from '../utils/networkUtils';
import NetInfo from '@react-native-community/netinfo';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, DeviceEventEmitter } from 'react-native';

const UserContext = createContext();
export const navigationRef = createNavigationContainerRef();

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const logoutTimer = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.length;

    const wsRef = useRef(null);
    const isConnectingRef = useRef(false);       // Tránh kết nối song song
    const reconnectTimeoutRef = useRef(null);    // Lưu ID của bộ đếm giờ để clear
    const retryCountRef = useRef(0);             // Đếm số lần đã thử kết nối lại
    const realtimeWsRef = useRef(null);          // Logistics Realtime WS

    // Cấu hình Axios Interceptors
    useEffect(() => {
        let isSessionExpired = false;

        const requestInterceptor = apiClient.interceptors.request.use(
            async (config) => {
                const currentToken = await AsyncStorage.getItem('access_token');
                if (currentToken) {
                    config.headers.Authorization = `Bearer ${currentToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response && error.response.status === 401 && !isSessionExpired) {
                    // Nếu request đánh dấu ignore401 thì không logout (dùng cho các background tasks dễ bị lỗi 401 ảo)
                    if (error.config && error.config.ignore401) {
                        return Promise.reject(error);
                    }

                    isSessionExpired = true;
                    console.error("401 Unauthorized for URL:", error.config?.url);
                    Toast.show({ type: 'error', text1: 'Lỗi xác thực', text2: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
                    logout(true);

                    setTimeout(() => {
                        isSessionExpired = false;
                    }, 3000);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.request.eject(requestInterceptor);
            apiClient.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    useEffect(() => {
        let unsubscribeNetInfo = null;

        const connectAndFetchNotifications = async () => {
            const currentToken = await AsyncStorage.getItem('access_token');

            // Cổng chốt chặn: Đang kết nối hoặc đã kết nối thì không làm gì cả
            if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) return;

            isConnectingRef.current = true;

            if (!currentToken) {
                isConnectingRef.current = false;
                return;
            }

            try {
                const uType = await AsyncStorage.getItem('user_type') || 'employee';

                // Tạm thời nếu là Khách hàng hoặc Nội bộ (Admin) thì chưa có tính năng thông báo ở FastAPI, bỏ qua gọi API để không bị lỗi 401 từ kho cũ
                if (uType === 'customer' || uType === 'admin') {
                    isConnectingRef.current = false;
                    return;
                }

                const res = await apiClient.get(WAREHOUSE_ENDPOINTS.GET_UNREAD_NOTIFICATIONS, {
                    headers: { Authorization: `Bearer ${currentToken}` },
                    ignore401: true
                });
                const data = res.data.data || res.data;
                setNotifications(data);
            } catch (err) {
                // console.log("Lỗi kéo thông báo tồn đọng:", err);
                // Toast.show({ type: 'error', text1: 'Không thể tải thông báo!' });
            }

            // Đóng sạch kết nối cũ nếu bị kẹt (phải gỡ onclose để tránh vòng lặp)
            if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }

            const wsBaseUrl = WAREHOUSE_API_URL.replace(/^http/, 'ws');
            const wsUrl = `${wsBaseUrl}/api/ws/notifications?token=${currentToken}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                isConnectingRef.current = false;
                retryCountRef.current = 0; // Reset lại số lần thử khi kết nối thành công
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const newNotif = JSON.parse(event.data);
                    setNotifications(prev => {
                        if (prev.some(n => n.id === newNotif.id)) return prev;
                        return [newNotif, ...prev];
                    });
                } catch (err) {
                    // console.log('Lỗi parse WS', err); 
                    Toast.show({ type: 'error', text1: 'Lỗi parse thông báo!' });
                }
            };

            wsRef.current.onerror = (error) => {
                isConnectingRef.current = false;
            };

            wsRef.current.onclose = () => {
                isConnectingRef.current = false;
                wsRef.current = null;

                // THUẬT TOÁN EXPONENTIAL BACKOFF KÈM JITTER
                const baseDelay = 2000; // Khởi điểm 2 giây
                const maxDelay = 30000; // Tối đa không quá 30 giây

                // Tính toán: 2s -> 4s -> 8s -> 16s -> 30s...
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), maxDelay);

                // Jitter: Thêm độ trễ ngẫu nhiên từ 0 - 1000 mili-giây
                const jitter = Math.floor(Math.random() * 1000);
                const finalDelay = exponentialDelay + jitter;

                reconnectTimeoutRef.current = setTimeout(() => {
                    retryCountRef.current += 1;
                    connectAndFetchNotifications();
                }, finalDelay);
            };

            // --- THÊM KẾT NỐI WEBSOCKET REALTIME LOGISTICS ---
            if (realtimeWsRef.current && realtimeWsRef.current.readyState !== WebSocket.CLOSED) {
                realtimeWsRef.current.onclose = null;
                realtimeWsRef.current.close();
            }

            const realtimeWsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
            const realtimeWsUrl = `${realtimeWsBaseUrl}/ws/realtime?token=${currentToken}`;
            realtimeWsRef.current = new WebSocket(realtimeWsUrl);

            realtimeWsRef.current.onopen = () => {
                // console.log("Connected to Realtime WebSocket");
            };

            realtimeWsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event) {
                        DeviceEventEmitter.emit('realtime_event', data);
                    }
                } catch (err) {
                    console.error('Lỗi parse Realtime WS', err);
                }
            };

            realtimeWsRef.current.onclose = () => {
                realtimeWsRef.current = null;
            };
        };

        if (user) {
            // Chỉ kiểm tra ngầm (shouldAsk = false). Nếu đã có quyền từ trước thì cập nhật token.
            registerForPushNotificationsAsync(false).then(async pushToken => {
                if (pushToken) {
                    const uType = await AsyncStorage.getItem('user_type') || 'employee';
                    if (uType === 'customer') {
                        apiClient.post(CUSTOMER_ENDPOINTS.CUSTOMER_REGISTER_PUSH_TOKEN_URL, { push_token: pushToken }, { ignore401: true })
                            .catch(err => Toast.show({ type: 'error', text1: 'Không thể đồng bộ Push Token Customer!' }));
                    } else if (uType === 'admin') {
                        apiClient.post(ADMIN_ENDPOINTS.ADMIN_REGISTER_PUSH_TOKEN_URL, { push_token: pushToken }, { ignore401: true })
                            .catch(err => Toast.show({ type: 'error', text1: 'Không thể đồng bộ Push Token Admin!' }));
                    } else {
                        apiClient.put(WAREHOUSE_ENDPOINTS.UPDATE_PUSH_TOKEN_URL, { token: pushToken }, { ignore401: true })
                            .catch(err => Toast.show({ type: 'error', text1: 'Không thể đồng bộ Push Token Warehouse!' }));
                    }
                }
            });

            connectAndFetchNotifications();

            unsubscribeNetInfo = NetInfo.addEventListener(state => {
                if (state.isConnected && state.isInternetReachable) {
                    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
                        // Reset retry khi có mạng trở lại để nó thử kết nối ngay
                        retryCountRef.current = 0;
                        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                        connectAndFetchNotifications();
                    }
                }
            });

        } else {
            // DỌN DẸP SẠCH SẼ KHI LOGOUT
            setNotifications([]);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // Gỡ onclose trước để không kích hoạt reconnect
                wsRef.current.close();
                wsRef.current = null;
            }
            if (realtimeWsRef.current) {
                realtimeWsRef.current.onclose = null;
                realtimeWsRef.current.close();
                realtimeWsRef.current = null;
            }
            if (unsubscribeNetInfo) unsubscribeNetInfo();
        }

        return () => {
            // DỌN DẸP KHI COMPONENT UNMOUNT
            if (unsubscribeNetInfo) unsubscribeNetInfo();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
            if (realtimeWsRef.current) {
                realtimeWsRef.current.onclose = null;
                realtimeWsRef.current.close();
            }
        };
    }, [user]);

    const promptForPushPermission = async () => {
        const pushToken = await registerForPushNotificationsAsync(true); // true = Cho phép bật popup
        if (pushToken) {
            const uType = await AsyncStorage.getItem('user_type') || 'employee';
            if (uType === 'customer') {
                apiClient.post(CUSTOMER_ENDPOINTS.CUSTOMER_REGISTER_PUSH_TOKEN_URL, { push_token: pushToken }, { ignore401: true })
                    .catch(err => Toast.show({ type: 'error', text1: 'Không thể đồng bộ Push Token Customer!' }));
            } else if (uType === 'admin') {
                apiClient.post(ADMIN_ENDPOINTS.ADMIN_REGISTER_PUSH_TOKEN_URL, { push_token: pushToken }, { ignore401: true })
                    .catch(err => Toast.show({ type: 'error', text1: 'Không thể đồng bộ Push Token Admin!' }));
            } else {
                apiClient.put(WAREHOUSE_ENDPOINTS.UPDATE_PUSH_TOKEN_URL, { token: pushToken }, { ignore401: true })
                    .catch(err => Toast.show({ type: 'error', text1: 'Không thể đồng bộ Push Token Warehouse!' }));
            }
        }
    };

    async function registerForPushNotificationsAsync(shouldAsk = false) {
        let pushToken;

        // Push Notification chỉ hoạt động trên máy thật
        if (Device.isDevice) {
            // Android cần thiết lập Channel riêng
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#0284C7', // Màu xanh thương hiệu
                });
            }

            // Kiểm tra và xin quyền
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                // NẾU KHÔNG CHO PHÉP HỎI (NẰM Ở CONTEXT) -> DỪNG LẠI NGAY
                if (!shouldAsk) {
                    return null;
                }

                // NẾU CHO PHÉP HỎI (TỪ TUTORIAL SCREEN) -> BẬT POPUP
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            // Nếu người dùng bấm "Từ chối" thì bỏ qua
            if (finalStatus !== 'granted') {
                return null;
            }

            // Lấy mã Token. Lấy cả cấu hình projectId từ app.json (nếu có dùng EAS Build)
            try {
                const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? '0c288d76-926e-4022-b908-9778d8cc31bb';
                pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } catch (e) {
                console.log("Lỗi khi xin Expo Push Token:", e);
                const errorStr = String(e);
                if (!errorStr.includes('FirebaseApp is not initialized')) {
                    Toast.show({ type: 'error', text1: 'Không thể lấy Push Token', text2: e.message || errorStr });
                }
            }
        }
        return pushToken;
    }
    // =========================================================================

    const setupAutoLogout = (jwtToken) => {
        if (logoutTimer.current) {
            clearTimeout(logoutTimer.current);
            logoutTimer.current = null;
        }
        if (!jwtToken) return;

        try {
            const decodedToken = jwtDecode(jwtToken);
            if (!decodedToken.exp) return;

            const expirationTimeMs = decodedToken.exp * 1000;
            const currentTimeMs = Date.now();
            const timeUntilExpiry = expirationTimeMs - currentTimeMs;

            if (timeUntilExpiry <= 0) {
                logout(true);
            } else {
                logoutTimer.current = setTimeout(() => {
                    Toast.show({ type: 'info', text1: 'Phiên đăng nhập đã kết thúc!' });
                    logout(true);
                }, timeUntilExpiry);
            }
        } catch (error) {
            throw error;
        }
    };

    const fetchMyProfile = async (directToken = null, providedUserType = null) => {
        if (!(await checkNetworkConnection())) return;
        try {
            const currentToken = directToken || await AsyncStorage.getItem('access_token');
            const userType = providedUserType || await AsyncStorage.getItem('user_type') || 'employee';
            
            // NẾU LÀ KHÁCH HÀNG HOẶC NỘI BỘ (ADMIN/SHIPPER) CỦA HỆ THỐNG MỚI: Gọi API tương ứng
            if (userType === 'customer' || userType === 'admin') {
                const profileUrl = userType === 'customer' ? CUSTOMER_ENDPOINTS.GET_PROFILE_CUSTOMER : ADMIN_ENDPOINTS.GET_PROFILE_ADMIN;
                try {
                    const decoded = jwtDecode(currentToken);
                    const response = await apiClient.get(profileUrl, {
                        headers: { Authorization: `Bearer ${currentToken}` }
                    });
                    
                    const data = response.data;
                    const profileData = {
                        id: data.user_id || data.id,
                        user_id: data.user_id || data.id,
                        role_id: data.role_id || decoded?.role_id,
                        username: data.username,
                        customer_id: data.customer_id,
                        full_name: data.full_name || data.name || data.representative_name || (userType === 'customer' ? 'Khách hàng' : 'Nhân viên'),
                        phone_number: data.phone || data.phone_number,
                        email: data.email,
                        address: data.address || data.address_detail,
                        street_address: data.street_address,
                        province: data.province || data.province_name,
                        district: data.district || data.district_name,
                        ward: data.ward || data.ward_name,
                        province_id: data.province_id,
                        district_id: data.district_id,
                        ward_id: data.ward_id,
                        is_online: data.is_online,
                        primary_hub_id: data.primary_hub_id || null,
                        primary_hub_name: data.primary_hub_name || null,
                        accessible_hub_ids: data.accessible_hub_ids || []
                    };
                    
                    setUser(profileData);
                    
                    // Giữ lại roles và permissions từ JWT
                    const perms = [];
                    if (decoded.permissions) {
                        Object.keys(decoded.permissions).forEach(key => {
                            if (decoded.permissions[key]) perms.push(key);
                        });
                    }
                    setPermissions(perms);
                    setRoles([{ role_id: decoded.role_id }]);
                    
                    return profileData;
                } catch (err) {
                    console.error("Lỗi lấy hồ sơ:", err);
                    // Fallback to JWT if API fails
                    const decoded = jwtDecode(currentToken);
                    const mockProfileData = {
                        id: decoded.user_id,
                        user_id: decoded.user_id,
                        role_id: decoded.role_id,
                        username: decoded.sub,
                        customer_id: decoded.customer_id,
                        full_name: userType === 'customer' ? 'Khách hàng' : 'Nhân viên',
                        primary_hub_id: decoded.primary_hub_id || null,
                        accessible_hub_ids: decoded.accessible_hub_ids || [],
                    };
                    setUser(mockProfileData);
                    return mockProfileData;
                }
            }

            // NẾU LÀ NHÂN VIÊN: Cứ gọi API như cũ (để không phá vỡ logic cũ)
            const profileUrl = WAREHOUSE_ENDPOINTS.GET_PROFILE_EMPLOYEE;
            const response = await apiClient.get(profileUrl, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });

            const data = response.data;

            let isOnline = false;
            if (data.is_shipper) {
                try {
                    const statusRes = await apiClient.get(ADMIN_ENDPOINTS.TOGGLE_AVAILABILITY, {
                        headers: { Authorization: `Bearer ${currentToken}` }
                    });
                    if (statusRes.data && statusRes.data.success) {
                        isOnline = statusRes.data.is_online;
                    }
                } catch (e) {
                    console.log("Could not fetch shipper online status", e);
                }
            }

            setUser({
                id: data.id,
                username: data.username,
                full_name: data.full_name,
                ma_kho_spl: data.ma_kho_spl,
                bien_so_xe: data.bien_so_xe,
                is_shipper: data.is_shipper,
                is_chat_banned: data.is_chat_banned,
                is_online: isOnline
            });
            setRoles(data.roles || []);

            const perms = [];
            (data.roles || []).forEach(role => {
                (role.permissions || []).forEach(p => {
                    if (!perms.includes(p.code)) perms.push(p.code);
                });
            });
            setPermissions(perms);

            return data;
        } catch (error) {
            throw error;
        }
    };

    const loginUserAndFetchProfile = async (username, password, userType = 'employee') => {
        try {
            const loginUrl = userType === 'customer' ? CUSTOMER_ENDPOINTS.CUSTOMER_LOGIN : 
                             userType === 'admin' ? ADMIN_ENDPOINTS.ADMIN_LOGIN : 
                             WAREHOUSE_ENDPOINTS.EMPLOYEE_LOGIN;

            let response;
            if (userType === 'customer' || userType === 'admin') {
                // Khách hàng hoặc Admin: Backend FastAPI mong đợi JSON
                response = await axios.post(loginUrl, {
                    username: username,
                    password: password
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                // Nhân viên: Backend kho cũ mong đợi Form URL Encoded
                const params = new URLSearchParams();
                params.append('grant_type', 'password');
                params.append('username', username);
                params.append('password', password);

                response = await axios.post(loginUrl, params.toString(), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
            }

            const accessToken = response.data.access_token;
            setToken(accessToken);
            await AsyncStorage.setItem('access_token', accessToken);
            
            // Lưu loại user để dùng sau (tùy chọn, ví dụ lưu trữ local)
            await AsyncStorage.setItem('user_type', userType);

            setupAutoLogout(accessToken);

            // ---> QUAN TRỌNG: Hứng lấy data từ fetchMyProfile và trả về <---
            const profileData = await fetchMyProfile(accessToken, userType);

            return { success: true, profileData: profileData };
        } catch (error) {
            throw error;
        }
    };

    const autoLogin = async () => {
        try {
            const currentToken = await AsyncStorage.getItem('access_token');
            const uType = await AsyncStorage.getItem('user_type') || 'employee';
            if (!currentToken) return false;
            
            setToken(currentToken);
            setupAutoLogout(currentToken);

            const profileData = await fetchMyProfile(currentToken, uType);
            return { success: true, profileData, userType: uType };
        } catch (error) {
            console.log("Auto login failed:", error);
            await AsyncStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
            return false;
        }
    };

    const logout = async (isAutoLogout = false) => {

        if (logoutTimer.current) clearTimeout(logoutTimer.current);

        // try {
        //     const currentToken = await AsyncStorage.getItem('access_token');
        //     const uType = await AsyncStorage.getItem('user_type') || 'employee';
        //     if (currentToken) {
        //         if (uType === 'customer' || uType === 'admin') {
        //             await apiClient.post(
        //                 `${API_BASE_URL}/api/users/register-push-token`,
        //                 { push_token: null },
        //                 { headers: { Authorization: `Bearer ${currentToken}` } }
        //             );
        //         } else {
        //             await apiClient.put(
        //                 `${WAREHOUSE_API_URL}/api/users/update-push-token`,
        //                 { token: null },
        //                 { headers: { Authorization: `Bearer ${currentToken}` } }
        //             );
        //         }
        //     }
        // } catch (err) { ... }

        setToken(null);
        setUser(null);
        setRoles([]);
        setPermissions([]);
        await AsyncStorage.removeItem('access_token');

        if (navigationRef.isReady()) {
            navigationRef.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
            );
        } else {
            Toast.show({ type: 'error', text1: 'Không thể chuyển hướng sau khi đăng xuất!' });
        }
    };

    // Kiểm tra xem User có quyền vào kho hay không (Dựa trên mảng truyền vào, không phụ thuộc state)
    const isWarehouseStaff = (userPermissions) => {
        // Dùng mảng truyền vào (nếu có) để check ngay lập tức, nếu không có thì dùng state (cho các màn hình khác gọi sau này)
        const permsToCheck = userPermissions || permissions;

        if (!permsToCheck || permsToCheck.length === 0) return false;
        if (permsToCheck.includes('FUNC_ADMIN_ALL')) return true;

        return permsToCheck.some(perm =>
            perm.startsWith('FUNC_VIP_') ||
            perm.startsWith('FUNC_THUONG_') ||
            perm.startsWith('FUNC_LE_')
        );
    };

    const updateUserVehicle = (bienSoXeMoi) => {
        setUser(prev => ({ ...prev, bien_so_xe: bienSoXeMoi }));
    };

    const clearUserVehicle = () => {
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, bien_so_xe: null };
        });
    };

    const refreshProfile = async () => {
        try {
            await fetchMyProfile();
        } catch (error) {
            // console.log("Lỗi khi refresh profile ngầm:", error);
            Toast.show({ type: 'error', text1: 'Không thể làm mới thông tin người dùng!' });
        }
    };

    const toggleUserOnlineStatus = (status) => {
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, is_online: status };
        });
    };

    return (
        <UserContext.Provider value={{
            user, roles, permissions,
            loginUserAndFetchProfile, autoLogin, logout, isWarehouseStaff, updateUserVehicle, clearUserVehicle, refreshProfile, unreadCount, notifications, setNotifications, promptForPushPermission, toggleUserOnlineStatus
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
