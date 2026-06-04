import React, { useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import styles from "../styles/AccountantMenuStyles";
import Toast from "react-native-toast-message";

export default function AccountantMenuScreen({ navigation }) {
  const { user } = useUser();

  useEffect(() => {
    if (!isRouteAllowed(user, "AccountantMenu")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  const accFunctions = [
    {
      id: "CashConfirm",
      title: "Chốt ca - Thu COD",
      sub: "Thu tiền COD, xuat bang ke",
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
      sub: "Xem lịch sử đơn hàng, tình trạng COD",
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
            <Text style={styles.headerTitle}>Kế toán viên</Text>
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
            <Text style={styles.statLabel}>COD CHO THU</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>0</Text>
            <Text style={styles.statUnit}>VND</Text>
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
            <Text style={styles.statLabel}>BẢNG KÊ CHO</Text>
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
              activeOpacity={0.85}
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
