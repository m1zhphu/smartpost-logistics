import React, { useState, useRef } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";
import { scanInboundAtDestHub, scanOutboundDelivery } from "../services/outboundService";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function MobileDestHubScanScreen({ navigation, route }) {
  const [scanMode, setScanMode] = useState(route.params?.mode || "INBOUND"); // INBOUND or OUTBOUND_DELIVERY
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const inputRef = useRef(null);

  const handleScanSubmit = async () => {
    const code = barcodeInput.trim();
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
        text1: scanMode === "INBOUND" ? "Nhập kho bưu cục đến thành công" : "Xuất kho đi giao thành công",
        text2: result.data?.message || code,
      });
      setScannedItems((prev) => [
        { code, time: new Date().toLocaleTimeString(), success: true, message: result.data?.message },
        ...prev,
      ]);
      setBarcodeInput("");
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

        <View style={{ width: 38 }} />
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
            : "Bưu tá quét mã Vận đơn (SP...) thuộc tuyến đi giao:"}
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
            onSubmitEditing={handleScanSubmit}
          />
          <TouchableOpacity
            style={[styles.scanBtn, loading && { opacity: 0.7 }]}
            onPress={handleScanSubmit}
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

      {/* HISTORY OF SCANNED CODES IN THIS SESSION */}
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
          emptyText="Chưa có mã nào được quét"
        />
      </View>
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
});
