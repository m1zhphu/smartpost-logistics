import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { getWaybillTimeline } from "../services/deliveryService";
import Toast from "react-native-toast-message";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function ShipperTrackingScreen({ navigation }) {
  const [searchCode, setSearchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập mã vận đơn" });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    const result = await getWaybillTimeline(searchCode.trim());
    setLoading(false);

    if (result.success) {
      setTrackingData(result.data);
    } else {
      setTrackingData(null);
      Toast.show({
        type: "error",
        text1: "Không tìm thấy thông tin",
        text2: result.message,
      });
    }
  };

  const renderTimelineItem = ({ item, index }) => {
    const isFirst = index === 0;
    const isLast = index === trackingData.timeline.length - 1;

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <Text style={styles.timeText}>{item.time.split(" ")[0]}</Text>
          <Text style={styles.dateText}>{item.time.split(" ")[1]}</Text>
        </View>

        <View style={styles.timelineCenter}>
          {!isFirst && <View style={styles.timelineLineTop} />}
          <View
            style={[styles.timelineDot, isFirst && styles.timelineDotActive]}
          />
          {!isLast && <View style={styles.timelineLineBottom} />}
        </View>

        <View style={styles.timelineRight}>
          <Text style={[styles.actionText, isFirst && styles.actionTextActive]}>
            {item.action}
          </Text>
          {item.location && item.location !== "Hệ thống" && (
            <Text style={styles.detailText}>Vị trí: {item.location}</Text>
          )}
          {item.actor && item.actor !== "Hệ thống" && (
            <Text style={styles.detailText}>Người thao tác: {item.actor}</Text>
          )}
          {item.note ? (
            <Text style={styles.noteText}>Ghi chú: {item.note}</Text>
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tracking Vận Đơn</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* SEARCH SECTION CHUẨN FORM */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons
              name="search"
              size={20}
              color={PRIMARY}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập mã vận đơn..."
              placeholderTextColor="#94A3B8"
              value={searchCode}
              onChangeText={setSearchCode}
              autoCapitalize="characters"
              onSubmitEditing={handleSearch}
            />
            {searchCode.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchCode("")}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Tìm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      {trackingData ? (
        <View style={{ flex: 1 }}>
          <View style={styles.statusCard}>
            <View style={styles.statusCardLeft}>
              <View style={styles.statusIconBox}>
                <Ionicons name="pulse" size={20} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.statusLabel}>Trạng thái hiện tại</Text>
                <Text style={styles.statusValue}>{trackingData.status}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Hành trình chi tiết</Text>

          <FlatList
            data={[...trackingData.timeline].reverse()}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderTimelineItem}
            contentContainerStyle={styles.timelineContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="search-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
          <Text style={styles.emptyText}>
            Nhập mã vận đơn để xem hành trình
          </Text>
        </View>
      )}
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
    justifyContent: "space-between",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  headerBtn: {
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

  /* SEARCH SECTION - Card Phẳng Chuẩn */
  searchSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchRow: { flexDirection: "row", gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A", fontWeight: "700" },
  searchBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 48,
  },
  searchBtnText: { color: "#FFF", fontWeight: "900", fontSize: 15 },

  /* STATUS CARD CHUẨN DNA */
  statusCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 4,
  },
  statusValue: { fontSize: 16, fontWeight: "900", color: PRIMARY },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  /* TIMELINE CHUẨN DNA (Thẻ phẳng) */
  timelineContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 16,
  },
  timelineRow: { flexDirection: "row", minHeight: 50 },
  timelineLeft: {
    width: 64,
    alignItems: "flex-end",
    paddingRight: 12,
    paddingTop: 2,
  },
  timeText: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  dateText: { fontSize: 11, color: "#64748B", fontWeight: "700", marginTop: 2 },

  timelineCenter: { width: 20, alignItems: "center" },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
    marginTop: 5,
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: PRIMARY,
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  timelineLineTop: {
    position: "absolute",
    top: 0,
    bottom: "80%",
    width: 2,
    backgroundColor: "#E2E8F0",
  },
  timelineLineBottom: {
    position: "absolute",
    top: 15,
    bottom: -10,
    width: 2,
    backgroundColor: "#E2E8F0",
  },

  timelineRight: { flex: 1, paddingLeft: 12, paddingBottom: 24 },
  actionText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 4,
  },
  actionTextActive: { color: PRIMARY, fontWeight: "900" },
  detailText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 13,
    color: "#D97706",
    fontStyle: "italic",
    marginTop: 2,
    fontWeight: "700",
  },

  // Empty State Chuẩn
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
  },
});
