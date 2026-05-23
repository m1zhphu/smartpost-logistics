import React, { useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import styles from "../styles/AccountantMenuStyles";

export default function AccountantMenuScreen({ navigation }) {
  const { user } = useUser();

  useEffect(() => {
    if (!isRouteAllowed(user, "AccountantMenu")) {
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return;
    }
  }, [user]);

  const accFunctions = [
    {
      id: "CashConfirm",
      title: "Chốt ca - Thu COD",
      sub: "Thu tiền COD từ shipper",
      icon: "wallet",
      color: COLORS.secondary,
      bg: COLORS.secondaryLight,
    },
    {
      id: "ShopStatement",
      title: "Đối soát cửa hàng",
      sub: "Tạo bảng kê, xuất Excel",
      icon: "document-text",
      color: COLORS.primary,
      bg: COLORS.primaryLight,
    },
    {
      id: "WaybillList",
      title: "Tra cứu vận đơn",
      sub: "Xem lịch sử đơn hàng",
      icon: "search",
      color: COLORS.secondary,
      bg: COLORS.secondaryLight,
    },
    {
      id: "AccountingDashboard",
      title: "Báo cáo tài chính",
      sub: "Tổng quan thu chi",
      icon: "stats-chart",
      color: COLORS.primary,
      bg: COLORS.primaryLight,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={styles.mainHeader}>
        <View style={styles.headerCircleDecoration} />
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerSubTitle}>PHÒNG KẾ TOÁN</Text>
            <Text style={styles.headerTitle}>Kế Toán Viên</Text>
          </View>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || user?.username || "K")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsFloatingCard}>
          <View style={styles.statBox}>
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: COLORS.secondaryLight },
              ]}
            >
              <Ionicons name="cash" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.statLabel}>COD CHỜ THU</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>0</Text>
            <Text style={styles.statUnit}>VNĐ</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: COLORS.primaryLight },
              ]}
            >
              <Ionicons name="documents" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>BẢNG KÊ CHỜ</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>0</Text>
            <Text style={styles.statUnit}>shop</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>NGHIỆP VỤ TÀI CHÍNH</Text>
        <View style={styles.grid}>
          {accFunctions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.mainCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(item.id)}
            >
              <View
                style={[styles.mainCardIconWrap, { backgroundColor: item.bg }]}
              >
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.mainCardTitle}>{item.title}</Text>
              <Text style={styles.mainCardSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
