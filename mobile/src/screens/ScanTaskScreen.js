import React from "react";
import { StatusBar, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UniversalScanner from "../components/UniversalScanner";
import ScanTaskStyles from "../styles/ScanTaskStyles";
import { waybillService } from "../services/waybillService";
import { deliveryService } from "../services/deliveryService";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import Toast from "react-native-toast-message";

export default function ScanTaskScreen({ navigation }) {
  const { user } = useUser();

  React.useEffect(() => {
    if (!isRouteAllowed(user, "ScanTask")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
    }
  }, [navigation, user]);

  const handleScanFindTask = async (scannedCode) => {
    try {
      const res = await waybillService.searchWaybills(user.token, {
        waybill_code: scannedCode,
        page: 1,
        size: 1,
      });

      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
          ? res
          : [];
      let waybill = items[0];

      if (!waybill) {
        const tasks = await deliveryService.getMyTasks(user.token);
        waybill = (tasks || []).find(
          (item) => item.waybill_code === scannedCode,
        );
      }

      if (waybill) {
        navigation.replace("TaskDetail", { waybill });
        return;
      }

      Toast.show({
        type: "error",
        text1: "Không tìm thấy",
        text2: `Mã ${scannedCode} không tồn tại hoặc không nằm trong danh sách cần giao.`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: error.message || "Không thể tìm kiếm đơn hàng lúc này.",
      });
    }
  };

  return (
    <View style={ScanTaskStyles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.neutralDark}
      />

      <UniversalScanner
        title="Tìm nhanh đơn hàng"
        instruction="Đưa mã vạch hoặc QR vào giữa khung quét"
        onScan={handleScanFindTask}
      />

      <Pressable
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={ScanTaskStyles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28} color={COLORS.white} />
      </Pressable>
    </View>
  );
}
