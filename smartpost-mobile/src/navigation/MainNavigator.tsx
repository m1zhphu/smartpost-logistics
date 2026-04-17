import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

// ==========================================
// 📦 IMPORT TẤT CẢ CÁC SCREEN TẠI ĐÂY
// ==========================================

// CHUNG
import ProfileScreen from '../screens/profile/ProfileScreen';

// QUẢN TRỊ VIÊN (ROLE 1)
import HubManagementScreen from '../screens/admin/HubManagementScreen';
import AdminOperationsScreen from '../screens/admin/AdminOperationsScreen';

// KHO & ĐIỀU PHỐI (ROLE 1, 2, 3)
import WarehouseMenuScreen from '../screens/warehouse/WarehouseMenuScreen';
import ScanInHubScreen from '../screens/warehouse/ScanInHubScreen';
import ScanBaggingScreen from '../screens/warehouse/ScanBaggingScreen';
import ScanManifestLoadScreen from '../screens/warehouse/ScanManifestLoadScreen';
import ScanManifestUnloadScreen from '../screens/warehouse/ScanManifestUnloadScreen';
import AssignShipperScreen from '../screens/warehouse/AssignShipperScreen';
import StaffManagementScreen from '../screens/warehouse/StaffManagementScreen';

// ĐƠN HÀNG (ROLE 1, 2, 5)
import WaybillListScreen from '../screens/waybill/WaybillListScreen';
import CreateWaybillScreen from '../screens/waybill/CreateWaybillScreen';

// SHIPPER (ROLE 4)
import TaskListScreen from '../screens/shipper/TaskListScreen';
import TaskDetailScreen from '../screens/shipper/TaskDetailScreen';
import UpdateStatusScreen from '../screens/shipper/UpdateStatusScreen';
import CameraPODScreen from '../screens/shipper/CameraPODScreen';
import ScanTaskScreen from '../screens/shipper/ScanTaskScreen';

// KẾ TOÁN (ROLE 5)
import AccountantMenuScreen from '../screens/accounting/AccountantMenuScreen';
import CashConfirmScreen from '../screens/accounting/CashConfirmScreen';
import ShopStatementScreen from '../screens/accounting/ShopStatementScreen';
import PricingRulesScreen from '../screens/accounting/PricingRulesScreen';

// ==========================================
// THIẾT LẬP NAVIGATOR
// ==========================================
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  primary: '#254BE0',
  card: '#FFFFFF',
  textMain: '#1E293B',
  textLight: '#94A3B8',
};

const tabScreenOptions = ({ route }: any) => ({
  headerShown: false,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textLight,
  tabBarStyle: {
    backgroundColor: COLORS.card,
    borderTopWidth: 0,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    height: 65,
    paddingBottom: 10,
    paddingTop: 8
  },
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const },
});

// ==========================================
// 🚀 TÁCH RIÊNG CÁC BOTTOM TABS THEO ROLE
// ==========================================

function AdminWarehouseTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="WarehouseHome" component={WarehouseMenuScreen} options={{ title: 'Tổng quan', tabBarIcon: ({ color, size }: any) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tab.Screen name="WaybillList" component={WaybillListScreen} options={{ title: 'Đơn hàng', tabBarIcon: ({ color, size }: any) => <Ionicons name="cube" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân', tabBarIcon: ({ color, size }: any) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function AccountantTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="AccHome" component={AccountantMenuScreen} options={{ title: 'Tổng quan', tabBarIcon: ({ color, size }: any) => <Ionicons name="pie-chart" size={size} color={color} /> }} />
      <Tab.Screen name="AccCash" component={CashConfirmScreen} options={{ title: 'Chốt ca', tabBarIcon: ({ color, size }: any) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tab.Screen name="AccStatement" component={ShopStatementScreen} options={{ title: 'Đối soát', tabBarIcon: ({ color, size }: any) => <Ionicons name="document-text" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân', tabBarIcon: ({ color, size }: any) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function ShipperTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="ShipperHome" component={TaskListScreen} options={{ title: 'Công việc', tabBarIcon: ({ color, size }: any) => <Ionicons name="bicycle" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân', tabBarIcon: ({ color, size }: any) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

// 🚀 COMPONENT BỌC TABS ĐỂ GIỮ STATE
const RootTabsWrapper = () => {
  const user = useAuthStore((state: any) => state.user);
  const roleId = user?.roleId;

  if (roleId === 5) return <AccountantTabs />;
  if (roleId === 4) return <ShipperTabs />;
  return <AdminWarehouseTabs />; // Role 1, 2, 3
};

// ==========================================
// 🚀 MASTER STACK NAVIGATOR
// ==========================================
export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* 1. MÀN HÌNH GỐC CHỨA TABS */}
      <Stack.Screen name="RootTabs" component={RootTabsWrapper} />

      {/* 2. CÁC MÀN HÌNH STACK */}
      <Stack.Screen name="HubManagement" component={HubManagementScreen} />
      <Stack.Screen name="AdminOperations" component={AdminOperationsScreen} />
      <Stack.Screen name="PricingRules" component={PricingRulesScreen} />
      <Stack.Screen name="CreateWaybill" component={CreateWaybillScreen} />
      <Stack.Screen name="WaybillList" component={WaybillListScreen} />
      <Stack.Screen name="ScanInHub" component={ScanInHubScreen} />
      <Stack.Screen name="ScanBagging" component={ScanBaggingScreen} />
      <Stack.Screen name="ScanManifestLoad" component={ScanManifestLoadScreen} />
      <Stack.Screen name="ScanManifestUnload" component={ScanManifestUnloadScreen} />
      <Stack.Screen name="AssignShipper" component={AssignShipperScreen} />
      <Stack.Screen name="CashConfirm" component={CashConfirmScreen} />
      <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="UpdateStatus" component={UpdateStatusScreen} />
      <Stack.Screen name="CameraPOD" component={CameraPODScreen} />
      <Stack.Screen name="ScanTask" component={ScanTaskScreen} />
    </Stack.Navigator>
  );
}