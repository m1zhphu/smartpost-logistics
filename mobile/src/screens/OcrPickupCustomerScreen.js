import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/colors';
import { getOcrCustomers } from '../services/pickupService';
import styles from '../styles/OcrPickupCustomerScreenStyles';

const PRIMARY = COLORS.primary || '#1B5E20';

export default function OcrPickupCustomerScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async (q = '') => {
    setLoading(true);
    const result = await getOcrCustomers(q);
    if (result.success) {
      setCustomers(result.data?.items || []);
    } else {
      Toast.show({ type: 'error', text1: 'Lỗi tải danh sách khách hàng', text2: result.message });
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => fetchCustomers(search));
    return unsubscribe;
  }, [navigation, search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCustomers(search), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const HeaderButton = ({ icon, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.headerButton} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color='#FFF' />
    </TouchableOpacity>
  );

  const getOcrStatusColor = (count) => {
    if (count === 0) return '#10B981';
    if (count <= 3) return '#F59E0B';
    return '#EF4444';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OcrPickupList', { customer: item })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>
            {(item.customer_name || 'K')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.customerName} numberOfLines={1}>{item.customer_name || '---'}</Text>
          <Text style={styles.customerCode}>{item.customer_code}</Text>
          <Text style={styles.customerPhone}>{item.phone_number || '---'}</Text>
        </View>
        <Ionicons name='chevron-forward' size={20} color='#CBD5E1' />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.statPill}>
          <Ionicons name='cube-outline' size={13} color='#0284C7' />
          <Text style={[styles.statText, { color: '#0284C7' }]}>
            {item.active_pickup_count || 0} pickup
          </Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name='mail-outline' size={13} color='#7C3AED' />
          <Text style={[styles.statText, { color: '#7C3AED' }]}>
            {item.bag_count || 0} túi
          </Text>
        </View>
        <View style={[styles.statPill, { borderColor: `${getOcrStatusColor(item.pending_ocr_count || 0)}33`, backgroundColor: `${getOcrStatusColor(item.pending_ocr_count || 0)}10` }]}>
          <Ionicons name='scan-outline' size={13} color={getOcrStatusColor(item.pending_ocr_count || 0)} />
          <Text style={[styles.statText, { color: getOcrStatusColor(item.pending_ocr_count || 0) }]}>
            {item.pending_ocr_count || 0} chờ OCR
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <View style={styles.header}>
        <HeaderButton icon='arrow-back' onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>OCR Túi Thư</Text>
          <Text style={styles.headerSubtitle}>Chọn khách hàng</Text>
        </View>
        <HeaderButton icon='reload' onPress={() => fetchCustomers(search)} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name='search-outline' size={18} color='#94A3B8' style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder='Tìm tên, mã KH, số điện thoại...'
          placeholderTextColor='#94A3B8'
          value={search}
          onChangeText={setSearch}
          returnKeyType='search'
          clearButtonMode='while-editing'
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={PRIMARY} />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconBox}>
            <Ionicons name='people-outline' size={36} color='#94A3B8' />
          </View>
          <Text style={styles.emptyText}>Không có khách hàng nào</Text>
          <Text style={styles.emptySubtext}>có pickup đang chờ OCR tại bưu cục</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => String(item.customer_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); fetchCustomers(search); }}
          refreshing={refreshing}
        />
      )}
    </View>
  );
}

// styles moved to ../styles/OcrPickupCustomerScreenStyles
