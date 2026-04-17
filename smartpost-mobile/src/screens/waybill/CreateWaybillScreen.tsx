import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar, Switch, KeyboardAvoidingView, Platform, Modal, FlatList, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { waybillService } from '../../api/services/waybillService';
import { pricingService } from '../../api/services/pricingService';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../hooks/useAppTheme';

const TABS = ['Gửi & nhận', 'Hàng hóa', 'Dịch vụ', 'Cước phí'];

export default function CreateWaybillScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const user = useAuthStore((state: any) => state.user);
  const scrollViewRef = useRef<ScrollView>(null);

  // --- STATE DỮ LIỆU ---
  const [hubs, setHubs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form, setForm] = useState({
    customer_id: '',
    service_type: 'STANDARD',
    origin_hub_id: '',
    dest_hub_id: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    actual_weight: '0.5',
    product_name: '',
    payment_method: 'SENDER_PAY',
    cod_amount: '0',
    note: '',
    extra_services: [] as string[]
  });

  const [fees, setFees] = useState({ main_fee: 0, extra_fee: 0, fuel_fee: 0, vat: 0, total: 0 });
  const [pricingSource, setPricingSource] = useState<string>('');
  const [feeLoading, setFeeLoading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- STATE SCROLL SPY ---
  const [activeTab, setActiveTab] = useState('Gửi & nhận');
  const sectionLayouts = useRef<{ [key: string]: number }>({});
  const isAutoScrolling = useRef(false);

  // --- STATE SEARCH MODALS ---
  const [showCustModal, setShowCustModal] = useState(false);
  const [custSearch, setCustSearch] = useState('');

  const [showHubModal, setShowHubModal] = useState(false);
  const [hubSearch, setHubSearch] = useState('');
  const [hubTarget, setHubTarget] = useState<'origin' | 'dest'>('origin');

  // --- STATE CREATE CUSTOMER MODAL ---
  const [showCreateCustModal, setShowCreateCustModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', address: '' });
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [resHubs, resCustomers, resServices] = await Promise.all([
          waybillService.getHubs(),
          waybillService.getCustomers(),
          pricingService.getExtraServices().catch(() => [])
        ]);

        setHubs(resHubs);
        setCustomers(resCustomers);
        setAvailableServices(resServices.filter((s: any) => s.is_active));

        let defaultOrigin = '';
        if (user?.roleId !== 1) {
          defaultOrigin = user?.primary_hub_id ? user.primary_hub_id.toString() : '';
        } else if (resHubs.length > 0) {
          defaultOrigin = resHubs[0].hub_id.toString();
        }
        setForm(prev => ({ ...prev, origin_hub_id: defaultOrigin }));
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu danh mục');
      } finally {
        setDataLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    const fetchFee = async () => {
      const weight = Number(form.actual_weight);
      if (!weight || weight <= 0 || !form.origin_hub_id || !form.dest_hub_id) {
        setFees({ main_fee: 0, extra_fee: 0, fuel_fee: 0, vat: 0, total: 0 });
        setPricingSource('');
        return;
      }
      setFeeLoading(true);
      try {
        const res = await pricingService.calculateFee({
          origin_hub_id: Number(form.origin_hub_id),
          dest_hub_id: Number(form.dest_hub_id),
          weight: weight,
          service_type: form.service_type,
          extra_services: form.extra_services,
          cod_amount: Number(form.cod_amount)
        });
        setFees({ main_fee: res.main_fee, extra_fee: res.extra_fee || 0, fuel_fee: res.fuel_fee, vat: res.vat, total: res.total });
        setPricingSource(res.matched_rule);
      } catch (err) {
        setFees({ main_fee: 0, extra_fee: 0, fuel_fee: 0, vat: 0, total: 0 });
        setPricingSource('chưa có bảng giá');
      } finally {
        setFeeLoading(false);
      }
    };

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { fetchFee(); }, 400);
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, [form.actual_weight, form.service_type, form.origin_hub_id, form.dest_hub_id, form.cod_amount, form.extra_services]);

  const handleScroll = (event: any) => {
    if (isAutoScrolling.current) return;
    const y = event.nativeEvent.contentOffset.y;
    const offset = 100;

    if (y >= (sectionLayouts.current['Cước phí'] || 9999) - offset) setActiveTab('Cước phí');
    else if (y >= (sectionLayouts.current['Dịch vụ'] || 9999) - offset) setActiveTab('Dịch vụ');
    else if (y >= (sectionLayouts.current['Hàng hóa'] || 9999) - offset) setActiveTab('Hàng hóa');
    else setActiveTab('Gửi & nhận');
  };

  const scrollToSection = (tabName: string) => {
    setActiveTab(tabName);
    isAutoScrolling.current = true;
    scrollViewRef.current?.scrollTo({ y: sectionLayouts.current[tabName] || 0, animated: true });
    setTimeout(() => { isAutoScrolling.current = false; }, 500);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const phoneRegex = /^[0-9]{10}$/;
    if (!form.receiver_phone.match(phoneRegex)) return Alert.alert('Lỗi Dữ Liệu', 'Số điện thoại người nhận phải đúng 10 chữ số!');

    const weight = Number(form.actual_weight);
    if (isNaN(weight) || weight <= 0) return Alert.alert('Lỗi Dữ Liệu', 'Khối lượng hàng hóa phải lớn hơn 0 kg!');

    if (!form.customer_id) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn khách hàng (Shop) gửi.');
    if (!form.dest_hub_id) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn bưu cục nhận hàng.');
    if (!form.receiver_name || !form.receiver_address) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ tên và địa chỉ người nhận!');

    setSubmitLoading(true);
    try {
      const payload = {
        ...form,
        customer_id: Number(form.customer_id),
        origin_hub_id: Number(form.origin_hub_id),
        dest_hub_id: Number(form.dest_hub_id),
        actual_weight: weight,
        cod_amount: Number(form.cod_amount) || 0,
        shipping_fee: fees.total
      };
      const res = await waybillService.createWaybill(payload);
      Alert.alert('Thành công', `Tạo vận đơn ${res.waybill_code} thành công!`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Lỗi hệ thống', e.response?.data?.detail || 'Lưu đơn hàng thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustForm.name || !newCustForm.phone) return Alert.alert('Lỗi', 'Vui lòng nhập Tên và Số điện thoại!');

    setIsCreatingCust(true);
    try {
      const payload = {
        customer_code: `KH${new Date().getTime().toString().slice(-6)}`,
        customer_type: "SHOP",
        name: newCustForm.name,
        company_name: newCustForm.name,
        phone: newCustForm.phone,
        address: newCustForm.address,
        status: "ACTIVE"
      };

      const newCust = await waybillService.createCustomer(payload);

      setCustomers([newCust, ...customers]);
      setForm({ ...form, customer_id: newCust.customer_id.toString() });

      Alert.alert('Thành công', 'Đã lưu thông tin khách hàng mới!');
      setShowCreateCustModal(false);
      setShowCustModal(false);
      setNewCustForm({ name: '', phone: '', address: '' });
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.detail || 'Không thể tạo khách hàng lúc này');
    } finally {
      setIsCreatingCust(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(custSearch.toLowerCase()) ||
    (c.phone || '').includes(custSearch) ||
    (c.customer_code || '').toLowerCase().includes(custSearch.toLowerCase())
  );

  const filteredHubs = hubs.filter(h =>
    (h.hub_name || '').toLowerCase().includes(hubSearch.toLowerCase()) ||
    (h.hub_code || '').toLowerCase().includes(hubSearch.toLowerCase())
  );

  if (dataLoading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

        {/* HEADER */}
        <View style={styles.blueHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backCircleBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerHubName}>BƯU CỤC HCM-01</Text>
              <Text style={styles.headerMainTitle}>Tạo vận đơn mới</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab} onPress={() => scrollToSection(tab)}>
                <Text style={[styles.tabItem, activeTab === tab && styles.tabActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* KHỐI 1: THÔNG TIN GỬI NHẬN */}
          <View style={styles.card} onLayout={(e) => sectionLayouts.current['Gửi & nhận'] = e.nativeEvent.layout.y}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <Text style={styles.sectionTitle}>THÔNG TIN GỬI & NHẬN</Text>
            </View>

            <Text style={styles.label}>Khách hàng gửi (Shop) <Text style={styles.req}>*</Text></Text>
            <TouchableOpacity style={styles.mockInput} onPress={() => { setCustSearch(''); setShowCustModal(true); }}>
              <Text style={form.customer_id ? styles.textMain : styles.textMuted}>
                {form.customer_id ? customers.find(c => c.customer_id.toString() === form.customer_id)?.name : 'Tìm tên, SĐT, mã khách...'}
              </Text>
              <Ionicons name="search" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.label}>Dịch vụ vận chuyển</Text>
            <View style={styles.serviceTypeRow}>
              {['STANDARD', 'EXPRESS', 'ECONOMY'].map((type) => (
                <TouchableOpacity key={type} style={[styles.serviceBtn, form.service_type === type && styles.serviceBtnActive]} onPress={() => setForm({ ...form, service_type: type })}>
                  <Text style={[styles.serviceBtnText, form.service_type === type && styles.serviceBtnTextActive]}>
                    {type === 'STANDARD' ? 'Tiêu chuẩn' : type === 'EXPRESS' ? 'Hỏa tốc' : 'Tiết kiệm'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>Bưu cục gửi</Text>
                <TouchableOpacity
                  style={[styles.mockInput, { backgroundColor: '#F8FAFC' }]}
                  disabled={user?.roleId !== 1}
                  onPress={() => { setHubTarget('origin'); setHubSearch(''); setShowHubModal(true); }}
                >
                  <Text style={styles.textMain} numberOfLines={1}>{hubs.find(h => h.hub_id.toString() === form.origin_hub_id)?.hub_code || 'Chọn'}</Text>
                  <Ionicons name="caret-down" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={{ justifyContent: 'center', marginTop: -5 }}><Ionicons name="arrow-forward" size={20} color={theme.textSecondary} /></View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>Bưu cục nhận <Text style={styles.req}>*</Text></Text>
                <TouchableOpacity
                  style={styles.mockInput}
                  onPress={() => { setHubTarget('dest'); setHubSearch(''); setShowHubModal(true); }}
                >
                  <Text style={form.dest_hub_id ? styles.textMain : styles.textMuted} numberOfLines={1}>
                    {hubs.find(h => h.hub_id.toString() === form.dest_hub_id)?.hub_code || 'Tìm BC...'}
                  </Text>
                  <Ionicons name="search" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 15, color: theme.textSecondary, fontSize: 13 }]}>NGƯỜI NHẬN</Text>
            <Text style={styles.label}>Số điện thoại <Text style={styles.req}>*</Text></Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={theme.textSecondary} style={{ marginLeft: 10, marginRight: 5 }} />
              <TextInput style={styles.inputFlex} placeholder="Nhập 10 số (VD: 0901234567)" keyboardType="phone-pad" maxLength={10} value={form.receiver_phone} onChangeText={(t) => setForm({ ...form, receiver_phone: t.replace(/[^0-9]/g, '') })} />
            </View>

            <Text style={styles.label}>Họ tên <Text style={styles.req}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Nhập họ và tên..." value={form.receiver_name} onChangeText={(t) => setForm({ ...form, receiver_name: t })} />

            <Text style={styles.label}>Địa chỉ giao hàng <Text style={styles.req}>*</Text></Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Số nhà, đường, phường, quận..." multiline value={form.receiver_address} onChangeText={(t) => setForm({ ...form, receiver_address: t })} />
          </View>

          {/* KHỐI 2: HÀNG HÓA & THANH TOÁN */}
          <View style={styles.card} onLayout={(e) => sectionLayouts.current['Hàng hóa'] = e.nativeEvent.layout.y}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: theme.warning }]} />
              <Text style={styles.sectionTitle}>HÀNG HÓA & THANH TOÁN</Text>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 0.4, marginRight: 10 }}>
                <Text style={styles.label}>Khối lượng (Lớn hơn 0)</Text>
                <View style={styles.inputWrap}>
                  <TextInput style={[styles.inputFlex, { fontWeight: 'bold', paddingLeft: 10 }]} keyboardType="numeric" value={form.actual_weight} onChangeText={(t) => setForm({ ...form, actual_weight: t })} />
                  <Text style={{ marginRight: 10, color: theme.textSecondary, fontWeight: 'bold' }}>kg</Text>
                </View>
              </View>
              <View style={{ flex: 0.6 }}>
                <Text style={styles.label}>Tên sản phẩm</Text>
                <TextInput style={styles.input} placeholder="Quần áo..." value={form.product_name} onChangeText={(t) => setForm({ ...form, product_name: t })} />
              </View>
            </View>

            <Text style={styles.label}>Thanh toán cước</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity style={[styles.payBtn, form.payment_method === 'SENDER_PAY' && styles.payBtnActive]} onPress={() => setForm({ ...form, payment_method: 'SENDER_PAY' })}>
                <Text style={[styles.payBtnText, form.payment_method === 'SENDER_PAY' && styles.payBtnTextActive]}>Người gửi trả</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.payBtn, form.payment_method === 'RECEIVER_PAY' && styles.payBtnActive]} onPress={() => setForm({ ...form, payment_method: 'RECEIVER_PAY' })}>
                <Text style={[styles.payBtnText, form.payment_method === 'RECEIVER_PAY' && styles.payBtnTextActive]}>Người nhận trả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.codBox}>
              <Text style={styles.codLabel}>TIỀN THU HỘ COD</Text>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput style={styles.codInput} keyboardType="numeric" value={form.cod_amount} onChangeText={(t) => setForm({ ...form, cod_amount: t.replace(/[^0-9]/g, '') })} />
                  <Text style={styles.codCurrency}>đ</Text>
                </View>
                <View style={styles.codIconWrap}><Ionicons name="pencil" size={16} color={theme.warning} /></View>
              </View>
            </View>

            <Text style={styles.label}>Ghi chú đơn hàng</Text>
            <TextInput style={styles.input} placeholder="Lưu ý khi giao..." value={form.note} onChangeText={(t) => setForm({ ...form, note: t })} />
          </View>

          {/* KHỐI 3: DỊCH VỤ TIỆN ÍCH */}
          <View style={styles.card} onLayout={(e) => sectionLayouts.current['Dịch vụ'] = e.nativeEvent.layout.y}>
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.sectionTitle}>DỊCH VỤ TIỆN ÍCH</Text>
            </View>

            {availableServices.length === 0 ? (
              <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>Chưa có dịch vụ tiện ích nào được cấu hình.</Text>
            ) : (
              availableServices.map((srv) => {
                const isChecked = form.extra_services.includes(srv.service_code);
                return (
                  <View key={srv.service_code} style={[styles.serviceBox, isChecked && styles.serviceBoxActive]}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.serviceName}>{srv.service_name}</Text>
                      <Text style={styles.serviceDesc}>Phụ phí áp dụng theo quy định</Text>
                    </View>
                    <Switch
                      value={isChecked}
                      onValueChange={(val) => {
                        if (val) setForm({ ...form, extra_services: [...form.extra_services, srv.service_code] });
                        else setForm({ ...form, extra_services: form.extra_services.filter(s => s !== srv.service_code) });
                      }}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={'#FFF'}
                    />
                  </View>
                );
              })
            )}
          </View>

          {/* KHỐI 4: TẠM TÍNH CƯỚC PHÍ */}
          <View style={styles.card} onLayout={(e) => sectionLayouts.current['Cước phí'] = e.nativeEvent.layout.y}>
            <View style={styles.rowBetween}>
              <View style={styles.sectionHeader}>
                <View style={[styles.dot, { backgroundColor: theme.success }]} />
                <Text style={styles.sectionTitle}>TẠM TÍNH CƯỚC PHÍ</Text>
              </View>
              {pricingSource && pricingSource !== 'chưa có bảng giá' && <View style={styles.badge}><Text style={styles.badgeText}>Hợp lệ</Text></View>}
            </View>

            {feeLoading && <Text style={{ color: theme.primary, marginBottom: 15, fontStyle: 'italic' }}>Đang tính cước phí...</Text>}
            {pricingSource === 'chưa có bảng giá' && <Text style={{ color: theme.danger, marginBottom: 15, fontWeight: 'bold' }}>Tuyến này chưa có bảng giá!</Text>}

            <View style={styles.feeRow}><Text style={styles.feeLabel}>Cước chính</Text><Text style={styles.feeValue}>{fees.main_fee.toLocaleString()} đ</Text></View>
            <View style={styles.feeRow}><Text style={styles.feeLabel}>Dịch vụ</Text><Text style={styles.feeValue}>{fees.extra_fee.toLocaleString()} đ</Text></View>
            <View style={styles.feeRow}><Text style={styles.feeLabel}>Phụ phí nhiên liệu</Text><Text style={styles.feeValue}>{fees.fuel_fee.toLocaleString()} đ</Text></View>
            <View style={styles.feeRow}><Text style={styles.feeLabel}>VAT (10%)</Text><Text style={styles.feeValue}>{fees.vat.toLocaleString()} đ</Text></View>

            <View style={styles.dividerDashed} />

            <View style={styles.feeRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{fees.total.toLocaleString()} đ</Text>
            </View>
          </View>

        </ScrollView>

        {/* BOTTOM ACTION */}
        <View style={styles.bottomFooter}>
          <TouchableOpacity
            style={[styles.submitBtn, (fees.total === 0 || pricingSource === 'chưa có bảng giá') && { backgroundColor: '#94A3B8' }]}
            onPress={handleSubmit}
            disabled={submitLoading || fees.total === 0 || pricingSource === 'chưa có bảng giá'}
          >
            {submitLoading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Cất lưu vận đơn</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* =============================================================
            MODALS TÌM KIẾM VÀ TẠO MỚI (Bọc trong KeyboardAvoidingView)
        ============================================================= */}

        {/* 1. Modal Tìm Khách Hàng */}
        <Modal visible={showCustModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCustModal(false)}>
              <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tìm Khách Hàng</Text>
                  <TouchableOpacity onPress={() => setShowCustModal(false)}><Ionicons name="close" size={28} /></TouchableOpacity>
                </View>

                <View style={styles.searchWrap}>
                  <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginHorizontal: 10 }} />
                  <TextInput style={{ flex: 1, height: 50 }} placeholder="SĐT, Tên, Mã KH..." value={custSearch} onChangeText={setCustSearch} autoFocus />
                </View>

                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.customer_id.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.searchItem} onPress={() => { setForm({ ...form, customer_id: item.customer_id.toString() }); setShowCustModal(false); }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                      <Text style={{ color: theme.textSecondary }}>{item.phone} | {item.customer_code}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>Không tìm thấy kết quả.</Text>}
                />

                <TouchableOpacity style={styles.createNewBtn} onPress={() => setShowCreateCustModal(true)}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 5 }} />
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tạo mới khách hàng nhanh</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* 2. Modal Tạo Khách Hàng Mới */}
        <Modal visible={showCreateCustModal} animationType="fade" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateCustModal(false)}>
              <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Thêm Khách Hàng Mới</Text>
                  <TouchableOpacity onPress={() => setShowCreateCustModal(false)}><Ionicons name="close" size={28} /></TouchableOpacity>
                </View>

                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <Text style={styles.label}>Họ và Tên / Tên Shop <Text style={styles.req}>*</Text></Text>
                  <TextInput style={styles.input} placeholder="Nhập tên..." value={newCustForm.name} onChangeText={t => setNewCustForm({ ...newCustForm, name: t })} />

                  <Text style={styles.label}>Số điện thoại <Text style={styles.req}>*</Text></Text>
                  <TextInput style={styles.input} placeholder="Nhập 10 số..." keyboardType="phone-pad" maxLength={10} value={newCustForm.phone} onChangeText={t => setNewCustForm({ ...newCustForm, phone: t.replace(/[^0-9]/g, '') })} />

                  <Text style={styles.label}>Địa chỉ</Text>
                  <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Địa chỉ cửa hàng..." multiline value={newCustForm.address} onChangeText={t => setNewCustForm({ ...newCustForm, address: t })} />

                  <TouchableOpacity style={styles.submitBtn} onPress={handleCreateCustomer} disabled={isCreatingCust}>
                    {isCreatingCust ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>LƯU THÔNG TIN</Text>}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* 3. Modal Tìm Bưu Cục */}
        <Modal visible={showHubModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHubModal(false)}>
              <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tìm Bưu Cục {hubTarget === 'origin' ? 'Gửi' : 'Nhận'}</Text>
                  <TouchableOpacity onPress={() => setShowHubModal(false)}><Ionicons name="close" size={28} /></TouchableOpacity>
                </View>

                <View style={styles.searchWrap}>
                  <Ionicons name="search" size={20} color={theme.textSecondary} style={{ marginHorizontal: 10 }} />
                  <TextInput style={{ flex: 1, height: 50 }} placeholder="Mã BC, Tên BC..." value={hubSearch} onChangeText={setHubSearch} autoFocus />
                </View>

                <FlatList
                  data={filteredHubs}
                  keyExtractor={(item) => item.hub_id.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.searchItem} onPress={() => {
                      if (hubTarget === 'origin') setForm({ ...form, origin_hub_id: item.hub_id.toString() });
                      else setForm({ ...form, dest_hub_id: item.hub_id.toString() });
                      setShowHubModal(false);
                    }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.hub_code}</Text>
                      <Text style={{ color: theme.textSecondary }}>{item.hub_name}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>Không tìm thấy kết quả.</Text>}
                />
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: theme.background },

  blueHeader: { backgroundColor: theme.primary, paddingTop: 50 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 15 },
  backCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { flex: 1, paddingHorizontal: 15 },
  headerHubName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  headerMainTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  tabScroll: { paddingHorizontal: 15, paddingBottom: 15, alignItems: 'center' },
  tabItem: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', marginRight: 25 },
  tabActive: { color: '#FFF', fontWeight: 'bold', borderBottomWidth: 2, borderBottomColor: '#FFF', paddingBottom: 4 },

  scrollContent: { padding: 15, paddingBottom: 100 },
  card: { backgroundColor: theme.card, borderRadius: 16, padding: 15, paddingVertical: 20, marginBottom: 15, elevation: 1, borderColor: theme.background, borderWidth: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: theme.text, letterSpacing: 0.5 },

  label: { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 },
  req: { color: theme.danger },

  mockInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.background, borderRadius: 10, padding: 14, marginBottom: 15 },
  textMain: { color: theme.text, fontSize: 15 },
  textMuted: { color: theme.textSecondary, fontSize: 15 },

  input: { backgroundColor: theme.background, borderRadius: 10, padding: 14, fontSize: 15, color: theme.text, marginBottom: 15 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 10, marginBottom: 15 },
  inputFlex: { flex: 1, padding: 14, fontSize: 15, color: theme.text },

  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dividerDashed: { height: 1, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', marginVertical: 15 },

  serviceTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  serviceBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, marginHorizontal: 2 },
  serviceBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  serviceBtnText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  serviceBtnTextActive: { color: '#FFF', fontWeight: 'bold' },

  paymentRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 20 },
  payBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  payBtnActive: { backgroundColor: theme.primary, elevation: 1 },
  payBtnText: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
  payBtnTextActive: { color: '#FFF', fontWeight: 'bold' },

  codBox: { backgroundColor: theme.warningBackground, padding: 15, borderRadius: 12, marginBottom: 20 },
  codLabel: { fontSize: 12, fontWeight: 'bold', color: theme.warning, marginBottom: 5 },
  codInput: { fontSize: 24, fontWeight: 'bold', color: theme.text, minWidth: 100, padding: 0 },
  codCurrency: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginLeft: 5 },
  codIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.warning, justifyContent: 'center', alignItems: 'center' },

  serviceBox: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: theme.background, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  serviceBoxActive: { backgroundColor: theme.primaryBackground, borderColor: theme.primary },
  serviceName: { fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 3 },
  serviceDesc: { fontSize: 12, color: theme.textSecondary },

  badge: { backgroundColor: theme.successBackground, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: theme.success, fontSize: 12, fontWeight: 'bold' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  feeLabel: { color: theme.textSecondary, fontSize: 14 },
  feeValue: { color: theme.text, fontSize: 14, fontWeight: '600' },
  totalLabel: { fontSize: 16, color: theme.text },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: theme.primary },

  bottomFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.background, padding: 15, paddingBottom: 25 },
  submitBtn: { flexDirection: 'row', backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // --- Modals Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 10, marginBottom: 15 },
  searchItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border },
  createNewBtn: { flexDirection: 'row', backgroundColor: theme.success, padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 15 }
});