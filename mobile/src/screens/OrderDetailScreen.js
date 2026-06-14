import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import styles from "../styles/OrderDetailScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import { getShipment } from "../services/shipmentService";
import { useQueue } from "../context/QueueContext";
import { checkNetworkConnection } from "../utils/networkUtils";
import { COLORS } from "../constants/colors";
import { StatusBar } from "expo-status-bar";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function OrderDetailScreen({ route, navigation }) {
  const { trackingNumber, queueId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const { removeQueueItem } = useQueue();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      setLoading(false);
      setError("Không có kết nối Internet");
      return;
    }
    try {
      const result = await getShipment(trackingNumber);
      if (result.success) {
        setOrder(result.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "---"}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <StatusBar style="light" />
        <View style={styles.emptyIconBox}>
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chi tiết vận đơn</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>MÃ VẬN ĐƠN</Text>
          <Text style={styles.trackingNumber}>{order?.tracking_number}</Text>
          <Text style={styles.date}>
            {new Date(order?.created_at).toLocaleString("vi-VN")}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Đã tạo thành công</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="arrow-up-circle" size={20} color="#0284C7" />
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: "#0284C7",
                  marginBottom: 0,
                  marginLeft: 6,
                  borderBottomWidth: 0,
                },
              ]}
            >
              NGƯỜI GỬI
            </Text>
          </View>
          <View style={styles.divider} />
          <Row label="Tên:" value={order?.sender_name} />
          <Row label="SĐT:" value={order?.sender_phone} />
          <Row label="Địa chỉ:" value={order?.sender_address} />
        </View>

        <View style={{ alignItems: "center", marginVertical: -12, zIndex: 10 }}>
          <View style={styles.arrowDownBox}>
            <Ionicons name="arrow-down" size={20} color="#94A3B8" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="arrow-down-circle" size={20} color="#D97706" />
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: "#D97706",
                  marginBottom: 0,
                  marginLeft: 6,
                  borderBottomWidth: 0,
                },
              ]}
            >
              NGƯỜI NHẬN
            </Text>
          </View>
          <View style={styles.divider} />
          <Row label="Tên:" value={order?.receiver_name} />
          <Row label="SĐT:" value={order?.receiver_phone} />
          <Row label="Địa chỉ:" value={order?.receiver_address} />
        </View>
      </ScrollView>

      <View style={styles.bottomDock}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


