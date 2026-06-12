import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { API_BASE_URL } from "../constants/customerEndpoints";
import { apiClient } from "../context/UserContext";
import dayjs from "dayjs";
import styles from "../styles/CustomerTrackingScreenStyles";

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
      activeOpacity={0.78}
    >
      <View style={styles.headerButtonInner}>
        <Ionicons name={icon} size={24} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );

  const GlassCard = ({ children, style }) => (
    <View style={[styles.card, style]}>
      {children}
    </View>
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
              style={{ width: '100%', height: 150, borderRadius: 8, marginTop: 10, resizeMode: 'cover' }} 
            />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <Text style={styles.headerTitle}>Tra cứu vận đơn</Text>

        <View style={{ width: 42 }} />
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
            placeholder="Nhập mã vận đơn (VD: SP123456789)"
            placeholderTextColor="rgba(71,85,105,0.5)"
            value={trackingCode}
            onChangeText={setTrackingCode}
            autoCapitalize="characters"
            onSubmitEditing={handleSearch}
            underlineColorAndroid="transparent"
          />

          {trackingCode.length > 0 && (
            <TouchableOpacity onPress={() => setTrackingCode("")}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, loading && { opacity: 0.72 }]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.88}
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
          <GlassCard>
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
          </GlassCard>

          <Text style={styles.timelineTitle}>HÀNH TRÌNH ĐƠN HÀNG</Text>

          {trackingData.logs && trackingData.logs.length > 0 ? (
            <GlassCard>
              <FlatList
                data={[...trackingData.logs].reverse()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderLogItem}
                scrollEnabled={false}
              />
            </GlassCard>
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
            <Ionicons name="cube-outline" size={60} color="#CBD5E1" />
          </View>

          <Text style={styles.placeholderText}>
            Nhập mã vận đơn để bắt đầu tra cứu
          </Text>
        </View>
      )}
    </View>
  );
}

/* const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  searchSection: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },

  searchBtn: {
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  centerContentInline: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyIconBox: {
    marginBottom: 10,
  },

  placeholderText: {
    color: "#64748B",
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },

  resultContainer: {
    padding: 16,
    paddingBottom: 50,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: SECONDARY,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 7,
  },

  timelineTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: SECONDARY,
    marginLeft: 4,
    marginTop: 4,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  label: {
    color: "#64748B",
    fontSize: 14,
    flex: 1,
    fontWeight: "700",
  },

  value: {
    color: "#1E293B",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
    fontWeight: "700",
  },

  valueBold: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },

  timelineItem: {
    flexDirection: "row",
  },

  timelineColumn: {
    width: 20,
    alignItems: "center",
    marginRight: 15,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
    zIndex: 2,
    marginTop: 4,
  },

  activeDot: {
    backgroundColor: PRIMARY,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: -4,
    zIndex: 1,
  },

  contentColumn: {
    flex: 1,
    paddingBottom: 25,
  },

  logStatus: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  logTime: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },

  logLocation: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    fontWeight: "700",
  },

  logNote: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 4,
    fontStyle: "italic",
    fontWeight: "700",
  },
}); */
