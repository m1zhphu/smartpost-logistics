import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerRecipientsScreenStyles";
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

// styles moved to ../styles/CustomerRecipientsScreenStyles
