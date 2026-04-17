import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, Linking } from 'react-native';

const LOCATION_TASK = 'SMARTPOST_LOCATION_TASK';

// =============================
// BACKGROUND TASK
// =============================
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.log('❌ Task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const loc = locations?.[0];

    if (loc) {
      console.log('📍 BG Location:', loc.coords.latitude, loc.coords.longitude);

      // TODO: gọi API gửi vị trí
      // await api.sendLocation(loc.coords)
    }
  }
});

// =============================
// SERVICE
// =============================
export const LocationService = {

  // =============================
  // START TRACKING
  // =============================
  startTracking: async () => {
    try {
      // =============================
      // 1. FOREGROUND PERMISSION (QUAN TRỌNG NHẤT)
      // =============================
      let fg = await Location.getForegroundPermissionsAsync();

      if (!fg.granted) {
        if (!fg.canAskAgain) {
          Alert.alert(
            'Quyền vị trí bị khóa',
            'Bạn đã từ chối quyền. Hãy bật lại trong Cài đặt.',
            [{ text: 'Mở cài đặt', onPress: () => Linking.openSettings() }]
          );
          return false;
        }

        fg = await Location.requestForegroundPermissionsAsync();
        if (!fg.granted) return false;
      }

      // =============================
      // 2. CHECK GPS
      // =============================
      const gpsEnabled = await Location.hasServicesEnabledAsync();

      if (!gpsEnabled) {
        Alert.alert('GPS đang tắt', 'Vui lòng bật GPS để tiếp tục!');
        return false;
      }

      // =============================
      // 3. BACKGROUND PERMISSION (OPTIONAL)
      // =============================
      let bg = await Location.getBackgroundPermissionsAsync();

      if (!bg.granted && bg.canAskAgain) {
        await Location.requestBackgroundPermissionsAsync();
        // ❗ không return false nếu fail
      }

      // =============================
      // 4. START TRACKING
      // =============================
      const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);

      if (!started) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,

          foregroundService: {
            notificationTitle: 'SmartPost đang chạy',
            notificationBody: 'Đang cập nhật vị trí...',
          },

          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
        });

        console.log('🚀 Tracking started');
      }

      return true;

    } catch (e) {
      console.log('❌ startTracking error:', e);
      return false;
    }
  },

  // =============================
  // STOP TRACKING
  // =============================
  stopTracking: async () => {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);

    if (started) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      console.log('🛑 Tracking stopped');
    }
  },

  // =============================
  // CHECK STATUS (KHÔNG BLOCK NGU NGỐC)
  // =============================
  checkStatus: async () => {
    try {
      const gps = await Location.hasServicesEnabledAsync();
      const fg = await Location.getForegroundPermissionsAsync();

      const ok = gps && fg.status === 'granted';

      console.log('📊 STATUS:', {
        gps,
        fg: fg.status,
      });

      return ok;
    } catch {
      return false;
    }
  },
};