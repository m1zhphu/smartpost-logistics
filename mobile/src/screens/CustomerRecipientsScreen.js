import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import {
  getRecipientBook,
  removeFromRecipientBook,
} from "../services/pickupService";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function CustomerRecipientsScreen({ navigation, route }) {
  const { user } = useUser();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isSelectMode = route.params?.isSelectMode || false;

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    setLoading(true);
    const data = await getRecipientBook(user?.user_id);
    setRecipients(data || []);
    setLoading(false);
  };

  const handleDelete = (id) => {
    Alert.alert("Xóa địa chỉ", "Bạn có chắc chắn muốn xóa địa chỉ này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await removeFromRecipientBook(user?.user_id, id);
          loadRecipients();
        },
      },
    ]);
  };

  const handleSelect = (item) => {
    if (isSelectMode && route.params?.onSelect) {
      route.params.onSelect(item);
      navigation.goBack();
    }
  };

  const filteredData = recipients.filter(
    (r) =>
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.phone && r.phone.includes(searchQuery)),
  );

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.headerButton}
      activeOpacity={0.7}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelect(item)}
      disabled={!isSelectMode}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Ionicons name="person-circle-outline" size={24} color={PRIMARY} />
          <Text style={styles.name}>{item.name}</Text>
        </View>
        {!isSelectMode && (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.infoRow}>
        <Ionicons
          name="call-outline"
          size={16}
          color="#64748B"
          style={styles.infoIcon}
        />
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons
          name="location-outline"
          size={16}
          color="#64748B"
          style={styles.infoIcon}
        />
        <Text style={styles.address}>
          {[
            item.address_detail,
            item.ward_name,
            item.district_name,
            item.province_name,
          ]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sổ địa chỉ</Text>
          <Text style={styles.headerSubtitle}>
            {isSelectMode ? "Chọn người nhận" : "Quản lý địa chỉ nhận"}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên, số điện thoại..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="book-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>Chưa có địa chỉ nào được lưu</Text>
          <Text style={styles.emptySubtext}>
            Các địa chỉ sẽ tự động được lưu khi bạn tạo đơn hàng mới.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },

  listContent: { padding: 16, paddingBottom: 30 },

  // Card Phẳng Chuẩn DNA
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginLeft: 8 },
  deleteBtn: { padding: 8, backgroundColor: "#FEE2E2", borderRadius: 10 },

  infoRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8 },
  infoIcon: { marginTop: 2, marginRight: 8 },
  phone: { fontSize: 14, color: "#0F172A", fontWeight: "700" },
  address: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
    lineHeight: 20,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  // Empty State Chuẩn
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
});
