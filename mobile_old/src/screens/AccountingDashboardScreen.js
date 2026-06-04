import React, { useEffect, useState } from "react";
import { FlatList, StatusBar, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { accountingService } from "../services/accountingService";
import { COLORS } from "../constants/colors";
import styles from "../styles/AccountingDashboardStyles";
import SkeletonLoader from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";
import CustomButton from "../components/CustomButton";
import { TYPOGRAPHY } from "../constants/theme";
import Toast from "react-native-toast-message";

export default function AccountingDashboardScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isRouteAllowed(user, "AccountingDashboard")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
      return;
    }

    fetchAccountingData();
  }, [user.token]);

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const cashConfirmList = await accountingService.getCashConfirmationList(
        user.token,
      );
      setPendingCount(
        Array.isArray(cashConfirmList) ? cashConfirmList.length : 0,
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tải dữ liệu kế toán.",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { id: "CashConfirm", label: "Xác nhận COD", icon: "cash-outline" },
    {
      id: "ShopStatement",
      label: "Báo cáo cửa hàng",
      icon: "document-text-outline",
    },
    { id: "PricingRules", label: "Quy tắc giá", icon: "pricetag-outline" },
    { id: "WaybillList", label: "Danh sách vận đơn", icon: "list-outline" },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Bảng điều khiển</Text>
          <Text style={styles.headerSubtitle}>
            Theo dõi COD và báo cáo tài chính
          </Text>
        </View>
        <View style={styles.loadingWrap}>
          <SkeletonLoader height={TYPOGRAPHY.lineHeight.headingSm} />
          <SkeletonLoader height={TYPOGRAPHY.lineHeight.body} />
          <SkeletonLoader height={TYPOGRAPHY.lineHeight.body} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Bảng điều khiển</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi COD và báo cáo tài chính
        </Text>
      </View>

      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Đơn COD đang chờ</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calculator-variant-outline"
            title="Không có dữ liệu"
            message="Chưa có tác vụ kế toán phù hợp."
          />
        }
        renderItem={({ item }) => (
          <CustomButton
            title={item.label}
            variant="outline"
            onPress={() => navigation.navigate(item.id)}
            style={styles.actionCard}
            contentStyle={styles.actionContent}
            leftIcon={({ color }) => (
              <Ionicons
                name={item.icon}
                size={TYPOGRAPHY.fontSize.body}
                color={color}
              />
            )}
            rightIcon={({ color }) => (
              <Ionicons
                name="chevron-forward"
                size={TYPOGRAPHY.fontSize.body}
                color={color}
              />
            )}
          />
        )}
      />
    </View>
  );
}
