import React, { useState, useEffect } from "react";
import { CustomAlert } from '../components/CustomAlert';

import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform, DeviceEventEmitter } from 'react-native';
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import Toast from "react-native-toast-message";
import styles from "../styles/ShipperSelfAssignPickupScreenStyles";

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

    const realtimeListener = DeviceEventEmitter.addListener(
      "realtime_event",
      (data) => {
        if (data.event === "pickup.created" || data.event === "pickup.bulk_mail_created") {
          fetchAvailablePickups();
        }
      }
    );

    return () => {
      realtimeListener.remove();
    };
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

    CustomAlert.alert("Tự điều phối nhận hàng", "Bạn muốn điều phối nhận hàng?", [
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


