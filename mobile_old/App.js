import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
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
import { WaybillProvider } from "./src/context/WaybillContext";
import { getRoleKey, roleRouteGroups } from "./src/utils/roleUtils";
import { COLORS } from "./src/constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "./src/constants/theme";
import "./src/services/locationService";
import LocationGuard from "./src/components/LocationGuard";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();

const HIDE_GLOBAL_HEADER_ROUTES = new Set([
  "Login",
  "Register",
  "Home",
  "CameraPOD",
]);
const ROUTE_TITLES = {
  Login: "Dang nhap",
  Register: "Dang ky",
  Home: "Trang chu",
  Profile: "Ho so ca nhan",
  CreateWaybill: "Tao van don",
  Success: "Tao don thanh cong",
  OrderDetail: "Chi tiet van don",
  ProcessedList: "Danh sach xu ly",
  ScanBagging: "Dong tui",
  ScanInHub: "Nhap kho",
  ScanManifestLoad: "Len xe",
  ScanManifestUnload: "Xuong xe",
  ScanTask: "Quet nhiem vu",
  HubManagement: "Quan ly buu cuc",
  ShopStatement: "Doi soat shop",
  WarehouseDashboard: "Tong quan kho",
  WarehouseMenu: "Menu kho",
  AccountingDashboard: "Tong quan ke toan",
  AccountantMenu: "Menu ke toan",
  AdminOperations: "Van hanh he thong",
  StaffManagement: "Quan ly nhan su",
  UpdateStatus: "Cap nhat trang thai",
  WaybillList: "Danh sach van don",
  PricingRules: "Bang gia",
  AssignShipper: "Phan cong shipper",
  CashConfirm: "Xac nhan COD",
  CameraPOD: "Chup anh POD",
  TaskList: "Danh sach nhiem vu",
  TaskDetail: "Chi tiet nhiem vu",
};

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, styles.toastSuccess]}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastTitle}
      text2Style={styles.toastMessage}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[styles.toastBase, styles.toastError]}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastTitle}
      text2Style={styles.toastMessage}
    />
  ),
  warning: (props) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, styles.toastWarning]}
      contentContainerStyle={styles.toastContentContainer}
      text1Style={styles.toastTitle}
      text2Style={styles.toastMessage}
    />
  ),
};

function AppRoutes() {
  const { user } = useUser();
  const roleKey = getRoleKey(user);
  const allowedRoutes = roleRouteGroups[roleKey] || roleRouteGroups.default;

  let authInitialRoute = "Login";
  if (user.isAuthenticated) {
    if (roleKey === "shipper") authInitialRoute = "TaskList";
    else if (roleKey === "accountant") authInitialRoute = "AccountantMenu";
    else if (roleKey === "warehouse" || roleKey === "hub_manager") {
      authInitialRoute = "WarehouseMenu";
    } else {
      authInitialRoute = "Home";
    }
  }

  return (
    <Stack.Navigator
      initialRouteName={authInitialRoute}
      screenOptions={{
        headerShown: false,
      }}
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
    <SafeAreaProvider>
      <UserProvider>
        <WaybillProvider>
          <QueueProvider>
            <LocationGuard>
              <NavigationContainer>
                <AppRoutes />
              </NavigationContainer>
              <Toast config={toastConfig} />
            </LocationGuard>
          </QueueProvider>
        </WaybillProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toastBase: {
    borderLeftWidth: 0,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: SPACING.xxl + SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    ...SHADOWS.md,
  },
  toastContentContainer: {
    paddingHorizontal: SPACING.md,
  },
  toastSuccess: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  toastError: {
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.dangerAccent,
  },
  toastWarning: {
    backgroundColor: COLORS.amberAccent,
    borderWidth: 1,
    borderColor: COLORS.warningText,
  },
  toastTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  toastMessage: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
});
