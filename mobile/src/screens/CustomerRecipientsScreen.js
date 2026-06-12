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
  TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { getRecipientBook, removeFromRecipientBook } from "../services/pickupService";

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

  const filteredData = recipients.filter(r => 
    (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.phone && r.phone.includes(searchQuery))
  );

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.headerButton}>
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleSelect(item)}
      disabled={!isSelectMode}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.name}>{item.name}</Text>
        </View>
        {!isSelectMode && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={16} color="#64748B" style={styles.infoIcon} />
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#64748B" style={styles.infoIcon} />
        <Text style={styles.address}>
          {[item.address_detail, item.ward_name, item.district_name, item.province_name].filter(Boolean).join(", ")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>Chưa có địa chỉ nào được lưu</Text>
          <Text style={styles.emptySubtext}>Các địa chỉ sẽ tự động được lưu khi bạn tạo đơn hàng mới.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: COLORS.primary || "#1B5E20",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
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
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginLeft: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  phone: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  address: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  }
});
