/**
 * locationService.js
 *
 * Dịch vụ định vị GPS nền cho ứng dụng SmartPost Logistics.
 * - Theo dõi vị trí nền mỗi 10s hoặc khi di chuyển >20m.
 * - Gửi về server bằng WebSocket khi có thể, fallback về REST nếu chạy trong background.
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_LOCATION_TASK = "SMARTPOST_LOCATION_TRACKING";
const STORAGE_USER_KEY = "@SmartPostApp:user";
const API_LOCATION_URL = process.env.EXPO_PUBLIC_LOCATION_URL;
const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_API_WS_URL;
const WS_PATH = "/ws/location";

let wsClient = null;
let currentShipperId = null;

const buildWebSocketUrl = (shipperId) => {
  if (!WS_BASE_URL) return null;
  const protocol = WS_BASE_URL.startsWith("https://")
    ? "wss://"
    : WS_BASE_URL.startsWith("http://")
      ? "ws://"
      : "";
  const host = WS_BASE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${protocol || (WS_BASE_URL.startsWith("ws") ? "" : "wss://")}${host}${WS_PATH}/${shipperId}`;
};

const sendLocationPayload = async (payload) => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify(payload));
    return;
  }

  if (!API_LOCATION_URL) {
    console.warn("[locationService] Không có URL REST để gửi vị trí.");
    return;
  }

  try {
    await fetch(API_LOCATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(
      "[locationService] Gửi vị trí qua HTTP fallback thất bại:",
      err.message,
    );
  }
};

const connectWs = async (shipperId, token) => {
  const url = buildWebSocketUrl(shipperId);
  if (!url) {
    console.warn("[locationService] WS_BASE_URL chưa được cấu hình trong env.");
    return;
  }

  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    return;
  }

  try {
    wsClient = new WebSocket(url);
    currentShipperId = shipperId;

    wsClient.onopen = () => {
      console.log("[locationService] WebSocket kết nối thành công:", url);
    };

    wsClient.onmessage = (event) => {
      console.log("[locationService] WS message:", event.data);
    };

    wsClient.onerror = (error) => {
      console.warn("[locationService] WebSocket lỗi:", error.message || error);
    };

    wsClient.onclose = () => {
      console.log("[locationService] WebSocket đã đóng.");
      wsClient = null;
    };
  } catch (err) {
    console.warn("[locationService] Không thể mở WebSocket:", err.message);
  }
};

const disconnectWs = async () => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.close();
  }
  wsClient = null;
  currentShipperId = null;
};

const buildPayloadFromLocation = async (loc) => {
  const stored = await AsyncStorage.getItem(STORAGE_USER_KEY);
  if (!stored) return null;

  const user = JSON.parse(stored);
  if (!user) return null;
  const shipperId = user.user_id || user.shipper_id || null;
  const lat = loc.coords.latitude;
  const lng = loc.coords.longitude;

  return {
    shipper_id: shipperId,
    lat,
    lng,
    accuracy: loc.coords.accuracy || null,
    altitude: loc.coords.altitude || null,
    speed: loc.coords.speed || null,
    heading: loc.coords.heading || null,
    timestamp: new Date(loc.timestamp || Date.now()).toISOString(),
  };
};

try {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn("[LocationTask] Lỗi:", error.message);
      return;
    }

    if (!data || !data.locations || data.locations.length === 0) {
      return;
    }

    const loc = data.locations[0];
    const payload = await buildPayloadFromLocation(loc);
    if (!payload) return;

    try {
      await sendLocationPayload(payload);
    } catch (err) {
      console.warn("[LocationTask] Lỗi gửi tọa độ:", err.message);
    }
  });
} catch (nativeError) {
  console.error("[LocationTask] Không thể đăng ký TaskManager:", nativeError);
}

export const locationService = {
  requestPermissions: async () => {
    try {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== "granted") return false;

      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      return bg === "granted";
    } catch (e) {
      console.warn("[locationService] Lỗi xin quyền:", e);
      return false;
    }
  },

  connectWebsocket: async (shipperId) => {
    const stored = await AsyncStorage.getItem(STORAGE_USER_KEY);
    const user = stored ? JSON.parse(stored) : null;
    await connectWs(shipperId, user?.token);
  },

  startTracking: async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (!isRegistered) {
        console.warn("[locationService] Task chưa được đăng ký.");
        return;
      }

      const isStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (isStarted) return;

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 20,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "SmartPost Logistics",
          notificationBody: "Đang theo dõi vị trí bưu tá",
          notificationColor: "#16a34a",
        },
      });
    } catch (e) {
      console.warn("[locationService] Không thể khởi động tracking nền:", e);
    }
  },

  stopTracking: async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (!isRegistered) return;

      const isStarted = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (isStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      await disconnectWs();
    } catch (e) {
      console.warn("[locationService] Lỗi khi dừng tracking:", e);
    }
  },
};
