import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import HomeScreen from "./src/screens/HomeScreen";
import SuccessScreen from "./src/screens/SuccessScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import OrderDetailScreen from "./src/screens/OrderDetailScreen";
import ProcessedListScreen from "./src/screens/ProcessedListScreen";
import ScanBaggingScreen from "./src/screens/ScanBaggingScreen";
import ScanInHubScreen from "./src/screens/ScanInHubScreen";
import ScanManifestLoadScreen from "./src/screens/ScanManifestLoadScreen";
import ScanManifestUnloadScreen from "./src/screens/ScanManifestUnloadScreen";
import ScanTaskScreen from "./src/screens/ScanTaskScreen";
import HubManagementScreen from "./src/screens/HubManagementScreen";
import ShopStatementScreen from "./src/screens/ShopStatementScreen";
import CreateWaybillScreen from "./src/screens/CreateWaybillScreen";
import UpdateStatusScreen from "./src/screens/UpdateStatusScreen";
import WaybillListScreen from "./src/screens/WaybillListScreen";
import PricingRulesScreen from "./src/screens/PricingRulesScreen";
import AssignShipperScreen from "./src/screens/AssignShipperScreen";
import CashConfirmScreen from "./src/screens/CashConfirmScreen";
import CameraPODScreen from "./src/screens/CameraPODScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AdminOperationsScreen from "./src/screens/AdminOperationsScreen";
import StaffManagementScreen from "./src/screens/StaffManagementScreen";
import WarehouseDashboardScreen from "./src/screens/WarehouseDashboardScreen";
import WarehouseMenuScreen from "./src/screens/WarehouseMenuScreen";
import AccountingDashboardScreen from "./src/screens/AccountingDashboardScreen";
import AccountantMenuScreen from "./src/screens/AccountantMenuScreen";
import TaskListScreen from "./src/screens/TaskListScreen";
import TaskDetailScreen from "./src/screens/TaskDetailScreen";
import { QueueProvider } from "./src/context/QueueContext";
import { UserProvider, useUser } from "./src/context/UserContext";
import { getRoleKey, roleRouteGroups } from "./src/utils/roleUtils";
import "./src/services/locationService";
import LocationGuard from "./src/components/LocationGuard";

// Cấu hình xử lý notification khi app mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();

function AppRoutes() {
  const { user } = useUser();
  const roleKey = getRoleKey(user);
  const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;

  // Xác định màn hình khởi đầu phù hợp theo vai trò
  let authInitialRoute = "Login";
  if (user.isAuthenticated) {
    if (roleKey === "shipper") {
      // Người giao hàng → Thẳng vào danh sách nhiệm vụ
      authInitialRoute = "TaskList";
    } else if (roleKey === "accountant") {
      // Kế toán → Thẳng vào menu nghiệp vụ kế toán
      authInitialRoute = "AccountantMenu";
    } else if (roleKey === "warehouse" || roleKey === "hub_manager") {
      // Nhân viên kho / Quản lý kho → Vào menu kho
      authInitialRoute = "WarehouseMenu";
    } else {
      // Admin hoặc mặc định → Trang chủ
      authInitialRoute = allowedRoutes.includes("Home")
        ? "Home"
        : allowedRoutes[0] || "Home";
    }
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={authInitialRoute}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      {allowedRoutes.includes("Profile") && (
        <Stack.Screen name="Profile" component={ProfileScreen} />
      )}
      {allowedRoutes.includes("CreateWaybill") && (
        <Stack.Screen name="CreateWaybill" component={CreateWaybillScreen} />
      )}
      {allowedRoutes.includes("Success") && (
        <Stack.Screen name="Success" component={SuccessScreen} />
      )}
      {allowedRoutes.includes("OrderDetail") && (
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      )}
      {allowedRoutes.includes("ProcessedList") && (
        <Stack.Screen name="ProcessedList" component={ProcessedListScreen} />
      )}
      {allowedRoutes.includes("ScanBagging") && (
        <Stack.Screen name="ScanBagging" component={ScanBaggingScreen} />
      )}
      {allowedRoutes.includes("ScanInHub") && (
        <Stack.Screen name="ScanInHub" component={ScanInHubScreen} />
      )}
      {allowedRoutes.includes("ScanManifestLoad") && (
        <Stack.Screen
          name="ScanManifestLoad"
          component={ScanManifestLoadScreen}
        />
      )}
      {allowedRoutes.includes("ScanManifestUnload") && (
        <Stack.Screen
          name="ScanManifestUnload"
          component={ScanManifestUnloadScreen}
        />
      )}
      {allowedRoutes.includes("ScanTask") && (
        <Stack.Screen name="ScanTask" component={ScanTaskScreen} />
      )}
      {allowedRoutes.includes("HubManagement") && (
        <Stack.Screen name="HubManagement" component={HubManagementScreen} />
      )}
      {allowedRoutes.includes("ShopStatement") && (
        <Stack.Screen name="ShopStatement" component={ShopStatementScreen} />
      )}
      {allowedRoutes.includes("WarehouseDashboard") && (
        <Stack.Screen
          name="WarehouseDashboard"
          component={WarehouseDashboardScreen}
        />
      )}
      {allowedRoutes.includes("WarehouseMenu") && (
        <Stack.Screen name="WarehouseMenu" component={WarehouseMenuScreen} />
      )}
      {allowedRoutes.includes("AccountingDashboard") && (
        <Stack.Screen
          name="AccountingDashboard"
          component={AccountingDashboardScreen}
        />
      )}
      {allowedRoutes.includes("AccountantMenu") && (
        <Stack.Screen name="AccountantMenu" component={AccountantMenuScreen} />
      )}
      {allowedRoutes.includes("AdminOperations") && (
        <Stack.Screen
          name="AdminOperations"
          component={AdminOperationsScreen}
        />
      )}
      {allowedRoutes.includes("StaffManagement") && (
        <Stack.Screen
          name="StaffManagement"
          component={StaffManagementScreen}
        />
      )}
      {allowedRoutes.includes("UpdateStatus") && (
        <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
      )}
      {allowedRoutes.includes("WaybillList") && (
        <Stack.Screen name="WaybillList" component={WaybillListScreen} />
      )}
      {allowedRoutes.includes("PricingRules") && (
        <Stack.Screen name="PricingRules" component={PricingRulesScreen} />
      )}
      {allowedRoutes.includes("AssignShipper") && (
        <Stack.Screen name="AssignShipper" component={AssignShipperScreen} />
      )}
      {allowedRoutes.includes("CashConfirm") && (
        <Stack.Screen name="CashConfirm" component={CashConfirmScreen} />
      )}
      {allowedRoutes.includes("CameraPOD") && (
        <Stack.Screen name="CameraPOD" component={CameraPODScreen} />
      )}
      {allowedRoutes.includes("TaskList") && (
        <Stack.Screen name="TaskList" component={TaskListScreen} />
      )}
      {allowedRoutes.includes("TaskDetail") && (
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider>
      <QueueProvider>
        <LocationGuard>
          <NavigationContainer>
            <AppRoutes />
          </NavigationContainer>
        </LocationGuard>
      </QueueProvider>
    </UserProvider>
  );
}
