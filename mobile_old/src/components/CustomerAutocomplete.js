import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createWaybillService } from "../services/createWaybillService";
import { useUser } from "../context/UserContext";
import { debounce } from "../utils/debounce";
import { COLORS } from "../constants/colors";

/**
 * CustomerAutocomplete Component
 * Cho phép tìm kiếm khách hàng với debounce 500ms
 * Hiển thị dropdown danh sách kết quả
 * Khi chọn, auto-fill thông tin người gửi
 *
 * @param {string} value - Giá trị hiển thị
 * @param {Function} onSelect - Callback khi chọn customer
 * @param {string} placeholder - Placeholder text
 */
export default function CustomerAutocomplete({ value, onSelect, placeholder }) {
  const { user } = useUser();
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Hàm tìm kiếm khách hàng (được debounce)
   */
  const doSearch = async (q) => {
    if (!q || q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await createWaybillService.searchCustomers(user?.token, q);
      if (mounted.current) {
        setResults(res || []);
        setIsOpen((res || []).length > 0);
      }
    } catch (err) {
      console.warn("[CustomerAutocomplete] search error:", err);
      if (mounted.current) {
        setResults([]);
        setIsOpen(false);
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Debounce hàm tìm kiếm với 500ms
   */
  const debouncedSearch = useRef(debounce(doSearch, 500)).current;

  /**
   * Handle khi người dùng gõ
   */
  const handleChange = (text) => {
    setQuery(text);
    debouncedSearch(text);
  };

  /**
   * Handle khi chọn 1 item từ dropdown
   */
  const handleSelectItem = (item) => {
    const displayName =
      item.contact_name || item.name || item.customer_name || "";
    setQuery(displayName);
    setIsOpen(false);
    onSelect && onSelect(item);
  };

  /**
   * Render item trong dropdown list
   */
  const renderItem = ({ item, index }) => {
    const name = item.contact_name || item.name || item.customer_name || "";
    const phone = item.contact_phone || item.phone || "";
    const code = item.customer_code || item.code || "";

    return (
      <TouchableOpacity
        style={[
          styles.item,
          index > 0 && {
            borderTopWidth: 1,
            borderTopColor: COLORS.borderLight,
          },
        ]}
        onPress={() => handleSelectItem(item)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          {/* Name */}
          <Text style={styles.itemTitle} numberOfLines={1}>
            {name}
          </Text>
          {/* Phone + Code */}
          <View style={{ flexDirection: "row", marginTop: 4, gap: 8 }}>
            {phone && (
              <Text style={styles.itemSub} numberOfLines={1}>
                📞 {phone}
              </Text>
            )}
            {code && (
              <Text style={styles.itemCode} numberOfLines={1}>
                {code}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.textGray}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          placeholder={placeholder || "Tìm khách hàng: Tên, SĐT, Mã..."}
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleChange}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="default"
          editable={!isLoading}
        />
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.secondary} />
        )}
      </View>

      {/* Dropdown Results */}
      {isOpen && !isLoading && results.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            scrollEnabled={results.length > 4}
            nestedScrollEnabled={true}
          >
            {results.map((item, idx) => (
              <React.Fragment key={item.customer_id || item.id || idx}>
                {renderItem({ item, index: idx })}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No Results Message */}
      {isOpen && !isLoading && results.length === 0 && query && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={24} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
          <Text style={styles.emptySubText}>Kiểm tra lại từ khóa tìm kiếm</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 12,
    position: "relative",
    zIndex: 999, // Allow dropdown to overlap subsequent items
    elevation: 999,
  },

  // Search Input Wrapper
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg || "#FAFAFA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight || "#E0E0E0",
    gap: 8,
  },

  // Input field
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMain || "#222",
  },

  // Dropdown overlay
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: COLORS.cardBg || "#FFF",
    borderRadius: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: COLORS.borderLight || "#E0E0E0",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    overflow: "hidden",
    zIndex: 1000,
  },

  // Individual item
  item: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMain || "#222",
  },

  itemSub: {
    fontSize: 12,
    color: COLORS.textMuted || "#999",
  },

  itemCode: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.secondary || "#007AFF",
    backgroundColor: COLORS.secondaryLight || "#F0F7FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Empty state
  emptyState: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.cardBg || "#FAFAFA",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight || "#E0E0E0",
    zIndex: 1000,
    elevation: 10,
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMain || "#222",
    marginTop: 8,
  },

  emptySubText: {
    fontSize: 12,
    color: COLORS.textMuted || "#999",
    marginTop: 4,
  },
});
