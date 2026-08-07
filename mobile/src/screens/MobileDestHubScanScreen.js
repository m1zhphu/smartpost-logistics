import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import {
  scanInboundAtDestHub,
  scanOutboundDelivery,
  getPendingDeliveryWaybills,
} from "../services/outboundService";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function MobileDestHubScanScreen({ navigation, route }) {
  const [scanMode, setScanMode] = useState(route.params?.mode || "INBOUND"); // INBOUND or OUTBOUND_DELIVERY
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  
  // Tab 2: Pending delivery waybills at hub
  const [pendingWaybills, setPendingWaybills] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [routeFilterTab, setRouteFilterTab] = useState("MY_ROUTE");

  const inputRef = useRef(null);

  useEffect(() => {
    if (scanMode === "OUTBOUND_DELIVERY") {
      fetchPendingWaybills();
    }
  }, [scanMode]);

  const fetchPendingWaybills = async () => {
    setLoadingPending(true);
    const res = await getPendingDeliveryWaybills();
    setLoadingPending(false);
    setRefreshing(false);

    if (res.success) {
      setPendingWaybills(res.data?.items || []);
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi tải dữ liệu",
        text2: res.message,
      });
    }
  };

  const handleScanSubmit = async (codeToUse) => {
    const code = (codeToUse || barcodeInput).trim();
    if (!code) return;

    setLoading(true);
    let result;
    if (scanMode === "INBOUND") {
      result = await scanInboundAtDestHub(code);
    } else {
      result = await scanOutboundDelivery(code);
    }
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: scanMode === "INBOUND" ? "Nhập kho bưu cục phát thành công" : "Xuất kho đi giao thành công",
        text2: result.data?.message || code,
      });
      setScannedItems((prev) => [
        { code, time: new Date().toLocaleTimeString(), success: true, message: result.data?.message },
        ...prev,
      ]);
      setBarcodeInput("");

      if (scanMode === "OUTBOUND_DELIVERY") {
        fetchPendingWaybills();
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi xử lý",
        text2: result.message,
      });
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  const handleDispatchAllPending = async () => {
    if (pendingWaybills.length === 0) return;
    const codes = pendingWaybills.map((item) => item.waybill_code);

    setLoading(true);
    const result = await scanOutboundDelivery(codes);
    setLoading(false);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Xuất kho đi giao hàng loạt",
        text2: result.data?.message || `Đã xuất kho ${codes.length} đơn thành công`,
      });
      fetchPendingWaybills();
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi xuất kho hàng loạt",
        text2: result.message,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Xử Lý Tại Bưu Cục Đến</Text>
          <Text style={styles.headerSub}>Quy trình Nhập kho phát & Xuất kho đi giao</Text>
        </View>

        <TouchableOpacity
          onPress={() => (scanMode === "OUTBOUND_DELIVERY" ? fetchPendingWaybills() : null)}
          style={styles.headerBtn}
        >
          <Ionicons name="refresh" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* MODE TOGGLE */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modeTab, scanMode === "INBOUND" && styles.modeTabActive]}
          onPress={() => setScanMode("INBOUND")}
        >
          <Ionicons
            name="download-outline"
            size={16}
            color={scanMode === "INBOUND" ? PRIMARY : "#64748B"}
          />
          <Text
            style={[styles.modeTabText, scanMode === "INBOUND" && styles.modeTabTextActive]}
          >
            1. Nhập kho bưu cục đến
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, scanMode === "OUTBOUND_DELIVERY" && styles.modeTabActive]}
          onPress={() => setScanMode("OUTBOUND_DELIVERY")}
        >
          <Ionicons
            name="bicycle-outline"
            size={16}
            color={scanMode === "OUTBOUND_DELIVERY" ? PRIMARY : "#64748B"}
          />
          <Text
            style={[styles.modeTabText, scanMode === "OUTBOUND_DELIVERY" && styles.modeTabTextActive]}
          >
            2. Xuất kho đi giao
          </Text>
        </TouchableOpacity>
      </View>

      {/* SCAN INPUT BOX */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>
          {scanMode === "INBOUND"
            ? "Quét mã Vận đơn (SP...) hoặc Mã phiếu xuất kho (PXK...):"
            : "Bưu tá quét/nhập mã Vận đơn (SP...) thuộc tuyến đi giao:"}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Quét mã vạch hoặc nhập tay..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            onSubmitEditing={() => handleScanSubmit()}
          />
          <TouchableOpacity
            style={[styles.scanBtn, loading && { opacity: 0.7 }]}
            onPress={() => handleScanSubmit()}
            disabled={loading || !barcodeInput.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="scan-outline" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: HISTORY OF SCANNED CODES IN SESSION */}
      {scanMode === "INBOUND" && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Lịch sử quét trong phiên</Text>
            <Text style={styles.listCount}>{scannedItems.length} mã</Text>
          </View>

          <FlatList
            data={scannedItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <Text style={styles.itemMsg}>{item.message || "Xử lý thành công"}</Text>
                </View>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="barcode-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>Chưa có mã nào được quét nhập kho trong phiên này</Text>
              </View>
            }
          />
        </View>
      )}

      {/* TAB 2: PENDING WAYBILLS WAITING AT DESTINATION HUB FOR OUTBOUND DELIVERY */}
      {scanMode === "OUTBOUND_DELIVERY" && (() => {
        const myRouteItems = pendingWaybills.filter((w) => w.is_my_route || w.is_assigned_to_me);
        const displayedWaybills = routeFilterTab === "MY_ROUTE" ? (myRouteItems.length > 0 ? myRouteItems : pendingWaybills) : pendingWaybills;

        return (
          <View style={styles.listContainer}>
            {/* SUB-TAB ROUTE FILTER SEGMENT */}
            <View style={styles.subTabRow}>
              <TouchableOpacity
                style={[styles.subTabBtn, routeFilterTab === "MY_ROUTE" && styles.subTabBtnActive]}
                onPress={() => setRouteFilterTab("MY_ROUTE")}
              >
                <Ionicons name="location" size={14} color={routeFilterTab === "MY_ROUTE" ? "#FFF" : "#64748B"} />
                <Text style={[styles.subTabText, routeFilterTab === "MY_ROUTE" && styles.subTabTextActive]}>
                  Tuyến của tôi ({myRouteItems.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subTabBtn, routeFilterTab === "ALL" && styles.subTabBtnActive]}
                onPress={() => setRouteFilterTab("ALL")}
              >
                <Ionicons name="globe" size={14} color={routeFilterTab === "ALL" ? "#FFF" : "#64748B"} />
                <Text style={[styles.subTabText, routeFilterTab === "ALL" && styles.subTabTextActive]}>
                  Tất cả đơn bưu cục ({pendingWaybills.length})
                </Text>
              </TouchableOpacity>
            </View>

            {displayedWaybills.length > 0 && (
              <TouchableOpacity
                style={styles.batchBtn}
                onPress={() => handleDispatchAllPending()}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="paper-plane" size={16} color="#FFF" />
                <Text style={styles.batchBtnText}>
                  Xuất kho đi giao {routeFilterTab === "MY_ROUTE" && myRouteItems.length > 0 ? "tuyến của tôi" : "tất cả"} ({displayedWaybills.length} đơn)
                </Text>
              </TouchableOpacity>
            )}

            {loadingPending ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={{ marginTop: 8, color: "#64748B", fontSize: 12 }}>
                  Đang tải các vận đơn tại bưu cục phát...
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayedWaybills}
                keyExtractor={(item) => item.waybill_id.toString()}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      fetchPendingWaybills();
                    }}
                  />
                }
                renderItem={({ item }) => (
                <View style={styles.pendingCard}>
                  <View style={styles.pendingHeader}>
                    <Text style={styles.pendingCode}>{item.waybill_code}</Text>
                    {item.is_assigned_to_me ? (
                      <Text style={[styles.pendingTag, { backgroundColor: "#DCFCE7", color: "#15803D" }]}>
                        ⭐ Tuyến của bạn
                      </Text>
                    ) : item.assigned_shipper_name ? (
                      <Text style={[styles.pendingTag, { backgroundColor: "#DBEAFE", color: "#1E40AF" }]}>
                        👤 {item.assigned_shipper_name}
                      </Text>
                    ) : (
                      <Text style={[styles.pendingTag, { backgroundColor: "#FEF3C7", color: "#B45309" }]}>
                        🔍 Ưu tiên 3 (Chờ gán)
                      </Text>
                    )}
                  </View>
                  <View style={styles.pendingBody}>
                    <Text style={styles.pendingReceiver}>
                      👤 {item.receiver_name} - 📞 {item.receiver_phone}
                    </Text>
                    <Text style={styles.pendingAddress}>📍 {item.receiver_address}</Text>
                    {item.cod_amount > 0 && (
                      <Text style={styles.pendingCod}>
                        💵 Thu hộ COD: {item.cod_amount.toLocaleString("vi-VN")} đ
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.singleDispatchBtn}
                    onPress={() => handleScanSubmit(item.waybill_code)}
                  >
                    <Ionicons name="bicycle" size={14} color="#FFF" />
                    <Text style={styles.singleDispatchText}>Xuất kho đơn này</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Ionicons name="checkmark-done-circle-outline" size={44} color="#A7F3D0" />
                  <Text style={styles.emptyTitle}>Hiện không có đơn nào chờ đi giao</Text>
                  <Text style={styles.emptyText}>
                    Các vận đơn mới nhập kho phát thành công sẽ xuất hiện tại đây để Bưu tá nhận xuất kho đi giao.
                  </Text>
                </View>
              }
            />
          )}
        </View>
        );
      })()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  modeBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 6,
    margin: 12,
    borderRadius: 10,
    elevation: 2,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: { backgroundColor: "#E8F5E9" },
  modeTabText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  modeTabTextActive: { color: PRIMARY, fontWeight: "700" },
  inputCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#334155", marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  scanBtn: {
    width: 46,
    height: 46,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listTitle: { fontSize: 13, fontWeight: "700", color: "#475569" },
  listCount: { fontSize: 12, color: PRIMARY, fontWeight: "700" },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
  },
  itemCode: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  itemMsg: { fontSize: 11, color: "#64748B", marginTop: 2 },
  itemTime: { fontSize: 11, color: "#94A3B8" },
  batchBtn: {
    backgroundColor: "#059669",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  batchBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  pendingCard: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
  },
  pendingHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  pendingCode: { fontSize: 14, fontWeight: "800", color: "#0284C7" },
  pendingTag: { fontSize: 11, fontWeight: "700", color: "#D97706", backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pendingBody: { marginVertical: 4 },
  pendingReceiver: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  pendingAddress: { fontSize: 12, color: "#475569", marginTop: 2 },
  pendingCod: { fontSize: 12, fontWeight: "700", color: "#059669", marginTop: 4 },
  singleDispatchBtn: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  singleDispatchText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  emptyCard: { backgroundColor: "#FFF", padding: 24, borderRadius: 12, alignItems: "center", marginTop: 20 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginTop: 8 },
  emptyText: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 },
  subTabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  subTabBtnActive: {
    backgroundColor: PRIMARY,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  subTabTextActive: {
    color: "#FFF",
  },
});
