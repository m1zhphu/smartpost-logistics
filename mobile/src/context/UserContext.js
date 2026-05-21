import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { userService } from "../services/userService";

const UserContext = createContext();

const decodeJWT = (token) => {
  try {
    if (!token) return {};
    return jwtDecode(token);
  } catch (e) {
    console.warn("Lỗi decode JWT token:", e);
    return {};
  }
};

const normalizeUser = (payload = {}) => {
  const token =
    payload.token || payload.access_token || payload.accessToken || "";
  const decoded = decodeJWT(token);

  const userId =
    payload.user_id ||
    payload.userId ||
    payload.id ||
    decoded.user_id ||
    decoded.id ||
    null;
  const username =
    payload.username ||
    payload.sub ||
    payload.userName ||
    payload.name ||
    decoded.username ||
    decoded.sub ||
    "";
  const fullName =
    payload.full_name ||
    payload.fullName ||
    payload.name ||
    decoded.full_name ||
    decoded.name ||
    "";
  const roleId =
    payload.role_id ||
    payload.roleId ||
    (typeof payload.role === "number" ? payload.role : null) ||
    decoded.role_id ||
    decoded.roleId ||
    null;
  const roleName =
    payload.role_name ||
    payload.roleName ||
    (typeof payload.role === "string" ? payload.role : null) ||
    decoded.role_name ||
    decoded.roleName ||
    null;
  const hubId =
    payload.hub_id ||
    payload.hubId ||
    payload.primary_hub_id ||
    decoded.hub_id ||
    decoded.hubId ||
    decoded.primary_hub_id ||
    null;
  const primaryHubId =
    payload.primary_hub_id ||
    payload.primaryHubId ||
    payload.hubId ||
    decoded.primary_hub_id ||
    decoded.primaryHubId ||
    decoded.hub_id ||
    null;

  const permissionsRaw =
    payload.permissions ||
    payload.scopes ||
    decoded.permissions ||
    decoded.scopes ||
    {};
  const permissions = Array.isArray(permissionsRaw)
    ? permissionsRaw.reduce((acc, perm) => ({ ...acc, [perm]: true }), {})
    : typeof permissionsRaw === "object" && permissionsRaw !== null
      ? permissionsRaw
      : {};

  const profile = payload.profile || payload.user || null;

  return {
    user_id: userId,
    username,
    full_name: fullName,
    token,
    role:
      roleName ||
      (typeof payload.role === "string" ? payload.role : null) ||
      roleId,
    role_id: roleId,
    role_name: roleName,
    hub_id: hubId,
    primary_hub_id: primaryHubId,
    permissions,
    profile,
    isAuthenticated: !!token,
  };
};

const STORAGE_USER_KEY = "@SpeedlightAppFn:user";

const initialUserState = {
  user_id: null,
  username: "",
  full_name: "",
  token: "",
  role: null,
  role_id: null,
  role_name: null,
  hub_id: null,
  primary_hub_id: null,
  permissions: {},
  profile: null,
  isAuthenticated: false,
};

const persistUser = async (normalizedUser) => {
  try {
    if (normalizedUser?.token) {
      await AsyncStorage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(normalizedUser),
      );
    } else {
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
    }
  } catch (error) {
    console.warn("Failed to persist user data", error);
  }
};

const loadStoredUser = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_USER_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Failed to load stored user data", error);
    return null;
  }
};

// Cấu hình xin quyền Push Notification từ thiết bị
const registerForPushNotificationsAsync = async () => {
  try {
    // Kiểm tra xem có phải thiết bị thật không (Simulator thường không nhận được push thực tế từ Expo)
    if (!Device.isDevice) {
      console.log("[PUSH] Running on simulator - generating dummy push token for testing flow");
      return "ExponentPushToken[dummy_token_123_for_simulator]";
    }

    // Xin quyền thông báo
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[PUSH] Permission not granted for push notifications");
      return null;
    }

    // Lấy mã Expo Push Token. projectId phải là Expo project ID, không phải Firebase ID.
    const expoProjectId =
      Constants?.expoConfig?.projectId ||
      Constants?.manifest2?.projectId ||
      Constants?.manifest?.projectId ||
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.manifest2?.extra?.eas?.projectId ||
      Constants?.manifest?.extra?.eas?.projectId;

    const requestOptions = expoProjectId ? { projectId: expoProjectId } : {};
    if (expoProjectId) {
      console.log("[PUSH] Using Expo projectId for push token:", expoProjectId);
    } else {
      console.warn(
        "[PUSH] No Expo projectId found. Skipping push token registration.",
      );
      return null;
    }

    let token;
    try {
      token = await Notifications.getExpoPushTokenAsync(requestOptions);
    } catch (errorWithProjectId) {
      if (requestOptions.projectId) {
        console.warn(
          "[PUSH] getExpoPushTokenAsync failed with projectId, retrying without projectId:",
          errorWithProjectId.message || errorWithProjectId,
        );
        try {
          token = await Notifications.getExpoPushTokenAsync();
        } catch (fallbackError) {
          console.warn("[PUSH] Fallback without projectId also failed:", fallbackError.message || fallbackError);
          return null;
        }
      } else {
        console.warn("[PUSH] getExpoPushTokenAsync failed:", errorWithProjectId.message || errorWithProjectId);
        return null;
      }
    }

    if (!token) return null;

    console.log("[PUSH] Push token obtained:", token.data);

    return token.data;
  } catch (error) {
    console.warn("[PUSH] Registration warning:", error.message || error);
    return null;
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(initialUserState);

  // Tự động tải thông tin user đã lưu khi mở app
  useEffect(() => {
    (async () => {
      const storedUser = await loadStoredUser();
      if (storedUser?.token) {
        setUserState({ ...initialUserState, ...normalizeUser(storedUser) });
      }
    })();
  }, []);

  const pushTokenRegisteredRef = React.useRef(false);

  useEffect(() => {
    if (user.token && !pushTokenRegisteredRef.current) {
      pushTokenRegisteredRef.current = true;
      setupPushNotifications();
    }
  }, [user.token]);

  // Khởi tạo các bộ lắng nghe (Listeners) cho thông báo đẩy khi ứng dụng đang chạy nền/foreground
  useEffect(() => {
    let notificationSubscription;

    notificationSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "[PUSH] Notification received:",
          notification.request.content,
        );
      },
    );

    return () => {
      notificationSubscription?.remove();
    };
  }, []);

  const login = async (payload) => {
    if (typeof payload === "string") {
      const normalized = {
        ...initialUserState,
        username: payload,
        isAuthenticated: true,
      };
      setUserState(normalized);
      persistUser(normalized);

      await setupPushNotifications();
      return;
    }

    const normalized = {
      ...initialUserState,
      ...normalizeUser(payload),
    };
    setUserState(normalized);
    persistUser(normalized);

    await setupPushNotifications();
  };

  // Đăng ký nhận token và chuẩn bị luồng đồng bộ với Backend
  const setupPushNotifications = async () => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        console.log("[PUSH] Push notifications registered successfully");
        console.log(
          "[PUSH-TOKEN-API] Token ready to be sent to backend:",
          pushToken,
        );

        if (user.token) {
          try {
            await userService.registerPushToken(user.token, pushToken);
            console.log("[PUSH] Push token synced to backend successfully");
          } catch (syncError) {
            console.error(
              "[PUSH] Failed to sync push token to backend:",
              syncError,
            );
          }
        }
      }
    } catch (error) {
      console.error("[PUSH] Failed to setup push notifications:", error);
    }
  };

  const updateUser = (updates) => {
    setUserState((prevUser) => {
      const mergedUser = { ...prevUser, ...(updates || {}) };
      const normalized = {
        ...initialUserState,
        ...normalizeUser(mergedUser),
        permissions: mergedUser.permissions || prevUser.permissions || [],
        profile: mergedUser.profile || prevUser.profile || null,
      };
      persistUser(normalized);
      return normalized;
    });
  };

  const logout = () => {
    setUserState(initialUserState);
    AsyncStorage.removeItem(STORAGE_USER_KEY).catch(() => null);
  };

  const hasRole = (roleToCheck) => {
    if (!roleToCheck) return false;
    const normalizedCheck = String(roleToCheck).toLowerCase();
    return [user.role, user.role_name, user.role_id]
      .filter((value) => value !== undefined && value !== null)
      .some((value) => String(value).toLowerCase() === normalizedCheck);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        hasRole,
        isAuthenticated: user.isAuthenticated,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
