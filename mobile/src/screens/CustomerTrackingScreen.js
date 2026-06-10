import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { COLORS } from "../constants/colors";
import { API_BASE_URL } from "../constants/customerEndpoints";
import { apiClient } from "../context/UserContext";
import dayjs from "dayjs";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default function CustomerTrackingScreen({ navigation }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const blurProps = {
    intensity: Platform.OS === "ios" ? 66 : 40,
    tint: "light",
  };

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
      style={styles.headerButtonShadow}
      activeOpacity={0.78}
    >
      <BlurView {...blurProps} intensity={52} style={styles.headerButton}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.36)",
            "rgba(255,255,255,0.14)",
            "rgba(255,255,255,0.06)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerButtonTopLine} />
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </BlurView>
    </TouchableOpacity>
  );

  const GlassCard = ({ children, style }) => (
    <View style={[styles.cardShadow, style]}>
      <BlurView {...blurProps} intensity={56} style={styles.card}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.95)",
            "rgba(255,255,255,0.64)",
            "rgba(255,255,255,0.34)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.cardTopLine} />
        <View pointerEvents="none" style={styles.cardGlow} />

        {children}
      </BlurView>
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
            {dayjs(item.system_time).format("DD/MM/YYYY HH:mm:ss")}
          </Text>

          {item.location ? (
            <Text style={styles.logLocation}>
              <Ionicons name="location-outline" size={12} /> {item.location}
            </Text>
          ) : null}

          {item.note ? <Text style={styles.logNote}>{item.note}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <LinearGradient
          pointerEvents="none"
          colors={[PRIMARY, "#15803D", "#16A34A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.headerOrbOne} />
        <View pointerEvents="none" style={styles.headerOrbTwo} />
        <View pointerEvents="none" style={styles.headerGlassLine} />

        <HeaderButton icon="arrow-back" onPress={() => navigation.goBack()} />

        <Text style={styles.headerTitle}>Tra cứu vận đơn</Text>

        <View style={{ width: 42 }} />
      </View>

      <View style={styles.searchSectionShadow}>
        <BlurView {...blurProps} intensity={70} style={styles.searchSection}>
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.94)",
              "rgba(255,255,255,0.68)",
              "rgba(255,255,255,0.42)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

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
            <LinearGradient
              colors={[PRIMARY, "#16A34A", "#4ADE80"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.searchBtnText}>Tra cứu</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
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

const glassShadow = {
  ...Platform.select({
    ios: {
      shadowColor: "#123816",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.13,
      shadowRadius: 22,
    },
    android: {
      elevation: 5,
    },
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    height: 96,
    paddingTop: Platform.OS === "ios" ? 46 : 36,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerOrbOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -70,
    right: -45,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  headerOrbTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    bottom: -70,
    left: -38,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  headerGlassLine: {
    position: "absolute",
    top: Platform.OS === "ios" ? 42 : 30,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.34)",
  },

  headerButtonShadow: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  headerButton: {
    flex: 1,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  headerButtonTopLine: {
    position: "absolute",
    top: 1,
    left: 9,
    right: 9,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  searchSectionShadow: {
    margin: 15,
    borderRadius: 24,
    ...glassShadow,
  },

  searchSection: {
    borderRadius: 24,
    padding: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248,250,252,0.76)",
    borderRadius: 18,
    paddingHorizontal: 12,
    minHeight: 52,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
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
    borderRadius: 18,
    overflow: "hidden",
  },

  searchBtnGradient: {
    height: 48,
    borderRadius: 18,
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
    padding: 15,
    paddingBottom: 50,
  },

  cardShadow: {
    borderRadius: 24,
    marginBottom: 15,
    ...glassShadow,
  },

  card: {
    borderRadius: 24,
    padding: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.84)"
        : "rgba(255,255,255,0.36)",
  },

  cardTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  cardGlow: {
    position: "absolute",
    top: 12,
    left: 14,
    width: 62,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
    transform: [{ rotate: "-18deg" }],
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: SECONDARY,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.18)",
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
    backgroundColor: "rgba(148,163,184,0.3)",
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
    color: "#1E293B",
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
});
