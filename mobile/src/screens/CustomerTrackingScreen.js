import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerTrackingScreenStyles";
import { API_BASE_URL } from "../constants/customerEndpoints";
import { apiClient } from "../context/UserContext";
import dayjs from "dayjs";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default function CustomerTrackingScreen({ navigation }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const handleSearch = async () => {
    if (!trackingCode.trim()) {
      Toast.show({
        type: "error",
        text1: "Vui lòng nhập mã vận đơn",
      });
      return;
    }

    setLoading(true);
    setTrackingData(null);

    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/waybills/${trackingCode.trim()}/tracking`,
      );
      setTrackingData(response.data);
    } catch (error) {
      console.error("Lỗi tra cứu:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không tìm thấy mã vận đơn hoặc có lỗi hệ thống.",
      });
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
        <Ionicons name={icon} size={20} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );

  const Row = ({ label, value, bold, color }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[bold ? styles.valueBold : styles.value, color && { color }]}
      >
        {value || "---"}
      </Text>
    </View>
  );

  const renderLogItem = ({ item, index }) => {
    const total = trackingData?.logs?.length || 0;

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineColumn}>
          <View style={[styles.dot, index === 0 && styles.activeDot]} />
          {index < total - 1 && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.contentColumn}>
          <Text style={styles.logStatus}>
            {item.status_name || item.status_code}
          </Text>

          <Text style={styles.logTime}>
            {dayjs(item.time || item.system_time).format("DD/MM/YYYY HH:mm:ss")}
          </Text>

          {item.location ? (
            <Text style={styles.logLocation}>
              <Ionicons name="location-outline" size={12} /> {item.location}
            </Text>
          ) : null}

          {item.note ? <Text style={styles.logNote}>{item.note}</Text> : null}

          {item.pickup_image_url ? (
            <Image
              source={{ uri: item.pickup_image_url }}
              style={{
                width: "100%",
                height: 150,
                borderRadius: 8,
                marginTop: 10,
                resizeMode: "cover",
              }}
            />
          ) : null}

          {item.pod_image_url ? (
            <Image
              source={{ uri: item.pod_image_url }}
              style={{
                width: "100%",
                height: 150,
                borderRadius: 8,
                marginTop: 10,
                resizeMode: "cover",
              }}
            />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tra cứu vận đơn</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color={PRIMARY}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập mã vận đơn (VD: SP123456...)"
            placeholderTextColor="#94A3B8"
            value={trackingCode}
            onChangeText={setTrackingCode}
            autoCapitalize="characters"
            onSubmitEditing={handleSearch}
            underlineColorAndroid="transparent"
          />
          {trackingCode.length > 0 && (
            <TouchableOpacity
              onPress={() => setTrackingCode("")}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, loading && { opacity: 0.7 }]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.searchBtnText}>Tra cứu</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : trackingData ? (
        <ScrollView
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>THÔNG TIN VẬN ĐƠN</Text>
            <Row label="Mã đơn:" value={trackingData.waybill_code} bold />
            <Row
              label="Trạng thái hiện tại:"
              value={trackingData.current_status}
              bold
              color="#F59E0B"
            />
            <Row label="Người gửi:" value={trackingData.sender_name} />
            <Row label="Người nhận:" value={trackingData.receiver_name} />
          </View>

          <Text style={styles.timelineTitle}>HÀNH TRÌNH ĐƠN HÀNG</Text>

          {trackingData.logs && trackingData.logs.length > 0 ? (
            <View style={styles.card}>
              <FlatList
                data={[...trackingData.logs].reverse()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderLogItem}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <View style={styles.centerContentInline}>
              <Text style={styles.emptyText}>
                Chưa có hành trình nào được ghi nhận.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.centerContent}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="search-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.placeholderText}>
            Nhập mã vận đơn để bắt đầu tra cứu
          </Text>
        </View>
      )}
    </View>
  );
}

// styles moved to ../styles/CustomerTrackingScreenStyles
