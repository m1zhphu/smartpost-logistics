import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import Toast from "react-native-toast-message";

// Mock data for the pickups
const MOCK_PICKUPS = [
  {
    id: "1",
    request_code: "28",
    sender_name: "KHACH HANG ITVINA",
    sender_phone: "123456789",
    pickup_address: "346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh",
    time: "14:18 09.01",
  },
  {
    id: "2",
    request_code: "27",
    sender_name: "AN KHANG",
    sender_phone: "09745896321",
    pickup_address: "346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh",
    time: "18:34 30.12",
  },
  {
    id: "3",
    request_code: "16",
    sender_name: "AN KHANG",
    sender_phone: "09745896321",
    pickup_address: "346 Bến Vân Đồn, Phường 1, Quận 4, Hồ Chí Minh",
    time: "18:34 30.12",
  },
];

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperSelfAssignPickupScreen({ navigation }) {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchAvailablePickups();
  }, []);

  const fetchAvailablePickups = async () => {
    setLoading(true);
    // MOCK: Giả lập gọi API lấy danh sách đơn có thể tự điều phối
    setTimeout(() => {
      setPickups(MOCK_PICKUPS);
      setLoading(false);
    }, 800);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleAssign = () => {
    if (selectedIds.length === 0) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn ít nhất 1 đơn hàng",
      });
      return;
    }

    Alert.alert("Tự điều phối nhận hàng", "Bạn muốn điều phối nhận hàng?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: () => {
          // MOCK: Thực hiện gọi API Tự điều phối
          Toast.show({
            type: "info",
            text1: "Đang chờ phát triển",
            text2: "Chức năng tự điều phối nhận hàng đang được phát triển.",
          });
          // Xóa các đơn đã chọn khỏi danh sách giả lập
          setPickups((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
          setSelectedIds([]);
        },
      },
    ]);
  };

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? PRIMARY : "#94A3B8"}
            />
          </View>
          <View style={styles.codeContainer}>
            <Text style={styles.labelCode}>Mã đơn hàng</Text>
            <Text style={styles.valueCode}>ID: {item.request_code}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="person-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Người gửi</Text>
              <Text style={styles.infoValue}>{item.sender_name}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>{item.sender_phone}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ nhận hàng</Text>
              <Text style={styles.infoValue}>{item.pickup_address}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="time-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tiếp nhận</Text>
              <Text style={styles.infoValue}>{item.time}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="white" />
          <Text style={styles.searchPlaceholder}>Tìm yêu cầu lấy hàng...</Text>
          <Ionicons
            name="barcode-outline"
            size={18}
            color="white"
            style={styles.barcodeIcon}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : pickups.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="list-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>
            Hiện không có đơn nào có thể điều phối.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* BOTTOM BAR CHUẨN FORM */}
      <View style={styles.bottomBar}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>ĐÃ CHỌN:</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{selectedIds.length} yêu cầu</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              if (selectedIds.length === pickups.length && pickups.length > 0) {
                setSelectedIds([]);
              } else {
                setSelectedIds(pickups.map((p) => p.id));
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>
              {selectedIds.length === pickups.length && pickups.length > 0
                ? "BỎ CHỌN"
                : "CHỌN TẤT CẢ"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              selectedIds.length === 0 && { opacity: 0.6 },
            ]}
            onPress={handleAssign}
            disabled={selectedIds.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>TỰ ĐIỀU PHỐI</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  searchPlaceholder: {
    color: "white",
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  barcodeIcon: { marginLeft: 10 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Empty State
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyText: { color: "#64748B", fontSize: 15, fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 140 },

  // Card Phẳng Chuẩn DNA
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardSelected: { borderColor: PRIMARY, backgroundColor: "#F0FDF4" },

  cardHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  checkboxContainer: { marginRight: 12 },
  codeContainer: { flex: 1 },
  labelCode: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  valueCode: { fontSize: 15, fontWeight: "900", color: PRIMARY, marginTop: 2 },

  cardBody: { padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoContent: { flex: 1, justifyContent: "center" },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
    fontWeight: "700",
  },
  infoValue: { fontSize: 14, color: "#0F172A", fontWeight: "700" },

  // Bottom Bar Chuẩn Form
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  selectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectionText: { fontWeight: "900", color: PRIMARY, fontSize: 13 },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeText: { fontSize: 13, fontWeight: "900", color: "#0F172A" },

  actionRow: { flexDirection: "row", gap: 12 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: { color: "#475569", fontWeight: "900", fontSize: 13 },
  primaryBtn: {
    flex: 1.5,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "900", fontSize: 14 },
});
