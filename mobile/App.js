// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import CreateOrderScreen from './src/screens/CreateOrderScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import LoginScreen from './src/screens/LoginScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import ProcessedListScreen from './src/screens/ProcessedListScreen';
import TutorialScreen from './src/screens/TutorialScreen';
import NotificationScreen from './src/screens/NotificationScreen';
// Màn hình mới cho nhân viên kho
import WarehouseHomeScreen from './src/screens/WarehouseHomeScreen';
import WarehouseActionScreen from './src/screens/WarehouseActionScreen';
import CustomerHomeScreen from './src/screens/CustomerHomeScreen';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

import { QueueProvider } from './src/context/QueueContext';
import { UserProvider, navigationRef } from './src/context/UserContext';

// =========================================================================
// THÊM IMPORT VÀ CẤU HÌNH EXPO NOTIFICATIONS TẠI ĐÂY
// =========================================================================
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});
// =========================================================================

const toastConfig = {
  // Giữ nguyên thiết kế mặc định của success, chỉ can thiệp vào error
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#10b981' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 14, fontWeight: 'bold' }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{
        fontSize: 14,
        fontWeight: 'bold'
      }}
      // Cho phép text2 hiển thị tối đa 5 dòng thay vì 2 dòng
      text2NumberOfLines={5}
      text2Style={{
        fontSize: 12,
        color: '#334155'
      }}
    />
  )
};

const Stack = createStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <QueueProvider>
        {/* Quan trọng: Gán ref vào đây */}
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Tutorial" component={TutorialScreen} />

            {/* Màn hình của Shipper */}
            <Stack.Screen name="Home" component={HomeScreen} />

            {/* Màn hình của Nhân viên Kho */}
            <Stack.Screen name="WarehouseHome" component={WarehouseHomeScreen} />
            <Stack.Screen name="WarehouseAction" component={WarehouseActionScreen} />

            {/* Màn hình của Khách hàng */}
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />

            <Stack.Screen name="NotificationScreen" component={NotificationScreen} />

            <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
            <Stack.Screen name="Success" component={SuccessScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="ProcessedList" component={ProcessedListScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </QueueProvider>
    </UserProvider>
  );
}