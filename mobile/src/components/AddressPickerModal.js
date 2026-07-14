import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getOldProvinceNames } from '../utils/provinces';

const PRIMARY = COLORS.primary || '#1B5E20';

/**
 * AddressPickerModal
 * @param {boolean} showMergeInfo - Khi true, hiển thị tên tỉnh cũ bên dưới tên tỉnh mới (dùng cho picker tỉnh/thành)
 */
export default function AddressPickerModal({ visible, onClose, data, onSelect, title, showMergeInfo = false }) {
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (visible) {
      setSearchText('');
    }
  }, [visible]);

  // Chuẩn hóa chuỗi để tìm kiếm không dấu
  const normalize = (str) =>
    String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Xây dựng index tìm kiếm theo cả tên mới lẫn tên cũ
  const searchIndex = useMemo(() => {
    if (!showMergeInfo) return {};
    const idx = {};
    (data || []).forEach((item) => {
      const oldNames = getOldProvinceNames(item);
      idx[item] = [normalize(item), ...oldNames.map(normalize)].join(' ');
    });
    return idx;
  }, [data, showMergeInfo]);

  const filteredData = useMemo(() => {
    const cleanSearch = normalize(searchText);
    return (data || []).filter((item) => {
      if (!item) return false;
      if (!cleanSearch) return true;
      if (showMergeInfo) {
        // Tìm kiếm theo cả tên mới + tên cũ
        return (searchIndex[item] || normalize(item)).includes(cleanSearch);
      }
      return normalize(item).includes(cleanSearch);
    });
  }, [data, searchText, searchIndex, showMergeInfo]);

  const renderItem = ({ item }) => {
    const oldNames = showMergeInfo ? getOldProvinceNames(item) : [];
    // Lọc bỏ tên trùng với tên mới
    const oldDisplay = oldNames.filter((n) => n !== item);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        {/* Tên tỉnh mới — ưu tiên */}
        <Text style={styles.itemText}>{item}</Text>
        {/* Tên tỉnh cũ — phụ, chỉ hiển thị khi showMergeInfo và có tên cũ */}
        {showMergeInfo && oldDisplay.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
            <Ionicons name="git-merge-outline" size={11} color="#94A3B8" style={{ marginRight: 3 }} />
            <Text style={styles.itemSubText}>
              Sáp nhập từ: {oldDisplay.join(', ')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container} onStartShouldSetResponder={() => true}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={showMergeInfo ? "Tìm theo tên mới hoặc tên cũ..." : "Nhập để tìm kiếm..."}
                placeholderTextColor="#94A3B8"
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Ionicons name="search-outline" size={32} color="#CBD5E1" />
                  <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>
                    Không tìm thấy kết quả
                  </Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  item: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  itemSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    fontStyle: 'italic',
  },
});
