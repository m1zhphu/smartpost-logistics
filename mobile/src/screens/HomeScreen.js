import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useUser } from "../context/UserContext";
import {
  getHomeMenuItems,
  getRoleLabel,
  getBottomTabItems,
  isRouteAllowed,
} from "../utils/roleUtils";
import HomeStyles from "../styles/HomeStyles";
import { COLORS } from "../constants/colors";

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const menuItems = getHomeMenuItems(user);
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

  const displayName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Người dùng";
  const roleText = getRoleLabel(user);
  const bottomTabs = getBottomTabItems(user);
  const cameraAvailable = isRouteAllowed(user, "CameraPOD");

  const handleNavigate = (route) => {
    if (!route) return;
    navigation.navigate(route);
  };

  const getIconBackground = (route) => {
    if (route === "CreateWaybill") return COLORS.blueAccentBg;
    if (route === "ScanTask" || route === "TaskList")
      return COLORS.amberAccentBg;
    if (
      route === "ShopStatement" ||
      route === "AccountingDashboard" ||
      route === "CashConfirm"
    )
      return COLORS.purpleAccentBg;
    if (
      route === "WarehouseDashboard" ||
      route === "WarehouseMenu" ||
      route === "ScanInHub" ||
      route === "ScanBagging" ||
      route === "ScanManifestLoad" ||
      route === "ScanManifestUnload"
    )
      return COLORS.successBg;
    if (
      route === "HubManagement" ||
      route === "StaffManagement" ||
      route === "AdminOperations"
    )
      return COLORS.dangerAccentBg;
    return COLORS.secondaryLight;
  };

  const getIconColor = (route) => {
    if (route === "CreateWaybill") return COLORS.blueAccent;
    if (route === "ScanTask" || route === "TaskList") return COLORS.amberAccent;
    if (
      route === "ShopStatement" ||
      route === "AccountingDashboard" ||
      route === "CashConfirm"
    )
      return COLORS.purpleAccent;
    if (
      route === "WarehouseDashboard" ||
      route === "WarehouseMenu" ||
      route === "ScanInHub" ||
      route === "ScanBagging" ||
      route === "ScanManifestLoad" ||
      route === "ScanManifestUnload"
    )
      return COLORS.successAccent;
    if (
      route === "HubManagement" ||
      route === "StaffManagement" ||
      route === "AdminOperations"
    )
      return COLORS.dangerAccent;
    return COLORS.primary;
  };

  return (
    <SafeAreaView style={HomeStyles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={HomeStyles.homeHeader}>
        <View style={HomeStyles.homeTextGroup}>
          <Text style={HomeStyles.homeHello}>Xin chào,</Text>
          <Text style={HomeStyles.homeName}>{displayName}</Text>
          <Text style={HomeStyles.homeRole}>{roleText}</Text>
        </View>

        <TouchableOpacity
          style={HomeStyles.profileButton}
          onPress={() => handleNavigate("Profile")}
          activeOpacity={0.85}
        >
          <Ionicons name="person-circle" size={34} color={COLORS.white} />
          <Text style={HomeStyles.profileButtonText}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={HomeStyles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={HomeStyles.sectionHeader}>
          <Text style={HomeStyles.sectionTitle}>Chức năng chính</Text>
          <Text style={HomeStyles.sectionSubtitle}>
            Truy cập nhanh theo vai trò của bạn
          </Text>
        </View>

        <View style={HomeStyles.actionGrid}>
          {safeMenuItems.length > 0 ? (
            safeMenuItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={HomeStyles.actionCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate(item.route)}
              >
                <View
                  style={[
                    HomeStyles.actionIcon,
                    { backgroundColor: getIconBackground(item.route) },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={getIconColor(item.route)}
                  />
                </View>
                <Text style={HomeStyles.actionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={HomeStyles.emptyState}>
              <Text style={HomeStyles.emptyTitle}>Không có chức năng nào</Text>
              <Text style={HomeStyles.emptyText}>
                Tài khoản của bạn hiện chưa có quyền truy cập chức năng nào. Vui
                lòng liên hệ quản trị viên.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={HomeStyles.bottomTabsContainer}>
        {bottomTabs.map((tab) => (
          <TouchableOpacity
            key={tab.route}
            style={HomeStyles.bottomTabItem}
            activeOpacity={0.85}
            onPress={() => handleNavigate(tab.route)}
          >
            <View style={HomeStyles.bottomTabIcon}>
              <Ionicons
                name={tab.icon}
                size={22}
                color={
                  tab.route === "Home" ? COLORS.secondary : COLORS.textGray
                }
              />
            </View>
            <Text
              style={[
                HomeStyles.bottomTabLabel,
                tab.route === "Home" && HomeStyles.bottomTabActive,
              ]}
            >
              {" "}
              {tab.label}{" "}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {cameraAvailable && (
        <TouchableOpacity
          style={HomeStyles.floatingAction}
          activeOpacity={0.9}
          onPress={() => handleNavigate("CameraPOD")}
        >
          <Ionicons name="camera" size={26} color={COLORS.white} />
          <Text style={HomeStyles.floatingText}>Camera</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
