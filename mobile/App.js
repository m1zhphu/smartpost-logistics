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
import CustomerProfileScreen from './src/screens/CustomerProfileScreen';
import CustomerUpdateProfileScreen from './src/screens/CustomerUpdateProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

// New Pickup Screens
import CustomerCreatePickupScreen from './src/screens/CustomerCreatePickupScreen';
import CustomerPickupDraftsScreen from './src/screens/CustomerPickupDraftsScreen';
import CustomerPickupListScreen from './src/screens/CustomerPickupListScreen';
import CustomerPickupDetailScreen from './src/screens/CustomerPickupDetailScreen';
import CustomerTrackingScreen from './src/screens/CustomerTrackingScreen';
import ShipperPickupListScreen from './src/screens/ShipperPickupListScreen';
import ShipperPickupDetailScreen from './src/screens/ShipperPickupDetailScreen';
import ShipperSelfAssignPickupScreen from './src/screens/ShipperSelfAssignPickupScreen';
import ShipperCreateBillScreen from './src/screens/ShipperCreateBillScreen';
import ShipperCameraScreen from './src/screens/ShipperCameraScreen';
import ShipperDeliveryListScreen from './src/screens/ShipperDeliveryListScreen';
import ShipperDeliveryDetailScreen from './src/screens/ShipperDeliveryDetailScreen';
import ShipperReportIncidentScreen from './src/screens/ShipperReportIncidentScreen';
import ShipperTrackingScreen from './src/screens/ShipperTrackingScreen';

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
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

            {/* Màn hình của Shipper */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ShipperCamera" component={ShipperCameraScreen} />

            {/* Màn hình của Nhân viên Kho */}
            <Stack.Screen name="WarehouseHome" component={WarehouseHomeScreen} />
            <Stack.Screen name="WarehouseAction" component={WarehouseActionScreen} />

            {/* Màn hình của Khách hàng */}
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
            <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
            <Stack.Screen name="CustomerUpdateProfile" component={CustomerUpdateProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

            <Stack.Screen name="NotificationScreen" component={NotificationScreen} />

            <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
            <Stack.Screen name="Success" component={SuccessScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="ProcessedList" component={ProcessedListScreen} />

            {/* Màn hình Pickup mới */}
            <Stack.Screen name="CustomerCreatePickup" component={CustomerCreatePickupScreen} />
            <Stack.Screen name="CustomerPickupDrafts" component={CustomerPickupDraftsScreen} />
            <Stack.Screen name="CustomerPickupList" component={CustomerPickupListScreen} />
            <Stack.Screen name="CustomerPickupDetail" component={CustomerPickupDetailScreen} />
            <Stack.Screen name="CustomerTracking" component={CustomerTrackingScreen} />
            <Stack.Screen name="ShipperPickupList" component={ShipperPickupListScreen} />
            <Stack.Screen name="ShipperPickupDetail" component={ShipperPickupDetailScreen} />
            <Stack.Screen name="ShipperSelfAssignPickup" component={ShipperSelfAssignPickupScreen} />
            <Stack.Screen name="ShipperCreateBill" component={ShipperCreateBillScreen} />
            <Stack.Screen name="ShipperDeliveryList" component={ShipperDeliveryListScreen} />
            <Stack.Screen name="ShipperDeliveryDetail" component={ShipperDeliveryDetailScreen} />
            <Stack.Screen name="ShipperReportIncident" component={ShipperReportIncidentScreen} />
            <Stack.Screen name="ShipperTracking" component={ShipperTrackingScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </QueueProvider>
    </UserProvider>
  );
}
