import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser, apiClient } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { CUSTOMER_ENDPOINTS } from "../constants/customerEndpoints";
import styles from "../styles/CustomerUpdateProfileScreenStyles";

const PRIMARY = COLORS.primary || "#1B5E20";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const SelectModal = ({
  visible,
  title,
  data,
  onSelect,
  onClose,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  emptyText,
  selectedCode,
}) => {
  const slideAnim = useRef(new Animated.Value(420)).current;
  const filteredData = data.filter((item) =>
    normalizeText(item.name).includes(normalizeText(searchValue)),
  );

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 420,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable onPress={(event) => event.stopPropagation()} style={{flex: 1}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>

              <TouchableOpacity onPress={onClose} activeOpacity={0.75}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchWrap}>
              <Ionicons name="search-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                value={searchValue}
                onChangeText={onSearchChange}
                placeholder={searchPlaceholder}
                placeholderTextColor="#94A3B8"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />
              {!!searchValue && (
                <TouchableOpacity
                  onPress={() => onSearchChange("")}
                  activeOpacity={0.75}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.code.toString()}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalListContent}
              ListEmptyComponent={
                <View style={styles.modalEmptyState}>
                  <Ionicons name="location-outline" size={24} color="#94A3B8" />
                  <Text style={styles.modalEmptyText}>
                    {emptyText || "Không có dữ liệu phù hợp"}
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    index === filteredData.length - 1 && styles.modalItemLast,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  activeOpacity={0.76}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Ionicons
                    name={
                      selectedCode === item.code
                        ? "checkmark-circle"
                        : "chevron-forward"
                    }
                    size={selectedCode === item.code ? 20 : 17}
                    color={selectedCode === item.code ? PRIMARY : "#CBD5E1"}
                  />
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const HeaderButton = ({ icon, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={styles.headerButton}
    activeOpacity={0.78}
  >
    <View style={styles.headerButtonInner}>
      <Ionicons name={icon} size={24} color={COLORS.white} />
    </View>
  </TouchableOpacity>
);

const FormInput = ({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}) => (
  <View style={[styles.inputContainer, multiline && styles.inputContainerMultiline]}>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? "top" : "center"}
      underlineColorAndroid="transparent"
    />
  </View>
);

const SelectBox = ({ value, placeholder, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.selectBox, disabled && { opacity: 0.62 }]}
    onPress={onPress}
    activeOpacity={0.82}
  >
    <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down" size={20} color={PRIMARY} />
  </TouchableOpacity>
);

export default function CustomerUpdateProfileScreen({ navigation }) {
  const { user, refreshProfile } = useUser();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");

  const [provincesData, setProvincesData] = useState([]);
  const [districtsData, setDistrictsData] = useState([]);
  const [wardsData, setWardsData] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [wardQuery, setWardQuery] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  const fetchDistricts = async (provinceCode) => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`,
      );
      const data = await response.json();
      return data.districts || [];
    } catch (error) {
      console.error("Lỗi lấy danh sách quận/huyện:", error);
      return [];
    }
  };

  const fetchWards = async (districtCode) => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
      );
      const data = await response.json();
      return data.wards || [];
    } catch (error) {
      console.error("Lỗi lấy danh sách phường/xã:", error);
      return [];
    }
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateAddressSelection = async (provinces) => {
      if (!user?.province_id && !user?.province) {
        return;
      }

      const matchedProvince = provinces.find(
        (item) =>
          item.code == user?.province_id || item.name === user?.province,
      );

      if (!matchedProvince || !isMounted) {
        return;
      }

      setSelectedProvince(matchedProvince);
      setProvinceQuery(matchedProvince.name);

      const districts = await fetchDistricts(matchedProvince.code);

      if (!isMounted) {
        return;
      }

      setDistrictsData(districts);

      let matchedDistrict =
        districts.find((item) => item.code == user?.district_id) || null;
      let wards = [];
      let matchedWard = null;

      if (matchedDistrict) {
        wards = await fetchWards(matchedDistrict.code);

        if (!isMounted) {
          return;
        }

        matchedWard =
          wards.find((item) => item.code == user?.ward_id || item.name === user?.ward) ||
          null;
      } else if (user?.ward_id || user?.ward) {
        for (const district of districts) {
          wards = await fetchWards(district.code);

          if (!isMounted) {
            return;
          }

          matchedWard =
            wards.find(
              (item) => item.code == user?.ward_id || item.name === user?.ward,
            ) || null;

          if (matchedWard) {
            matchedDistrict = district;
            break;
          }
        }
      }

      if (matchedDistrict) {
        setSelectedDistrict(matchedDistrict);
        setDistrictQuery(matchedDistrict.name);
      }

      setWardsData(wards);

      if (matchedWard) {
        setSelectedWard(matchedWard);
        setWardQuery(matchedWard.name);
      }
    };

    const fetchProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/");
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        setProvincesData(data);
        await hydrateAddressSelection(data);
      } catch (error) {
        console.error("Lỗi lấy danh sách địa chỉ:", error);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải danh sách Tỉnh/Thành",
        });
      }
    };

    fetchProvinces();

    if (user?.street_address) {
      setAddressDetail(user.street_address);
    } else if (user?.address && (!user?.province || !user?.ward)) {
      setAddressDetail(user.address);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSelectProvince = async (province) => {
    setSelectedProvince(province);
    setProvinceQuery(province.name);
    setSelectedDistrict(null);
    setDistrictQuery("");
    setDistrictsData([]);
    setSelectedWard(null);
    setWardQuery("");
    setWardsData([]);

    const districts = await fetchDistricts(province.code);
    setDistrictsData(districts);
  };

  const handleSelectDistrict = async (district) => {
    setSelectedDistrict(district);
    setDistrictQuery(district.name);
    setSelectedWard(null);
    setWardQuery("");
    setWardsData([]);

    const wards = await fetchWards(district.code);
    setWardsData(wards);
  };

  const handleSelectWard = (ward) => {
    setSelectedWard(ward);
    setWardQuery(ward.name);
  };

  const handleUpdate = async () => {
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !addressDetail.trim() ||
      !selectedProvince ||
      !selectedDistrict ||
      !selectedWard
    ) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền đầy đủ tất cả thông tin",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.patch(
        CUSTOMER_ENDPOINTS.UPDATE_PROFILE,
        {
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          province_name: selectedProvince.name,
          province_id: selectedProvince.code,
          district: selectedDistrict.name,
          district_id: selectedDistrict.code,
          ward_name: selectedWard.name,
          ward_id: selectedWard.code,
          street_address: addressDetail.trim(),
        },
      );

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã cập nhật thông tin thành công",
        });

        await refreshProfile();
        navigation.goBack();
      }
    } catch (error) {
      console.error("Update profile error:", error);

      Toast.show({
        type: "error",
        text1: "Cập nhật thất bại",
        text2: error?.response?.data?.detail || "Vui lòng thử lại sau",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <HeaderButton
          icon="arrow-back"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />

        <Text style={styles.headerTitle}>Cập nhật thông tin</Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Họ và tên <Text style={styles.required}>*</Text>
            </Text>

            <FormInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số điện thoại <Text style={styles.required}>*</Text>
            </Text>

            <FormInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 6 }]}>
            Địa chỉ <Text style={styles.required}>*</Text>
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tỉnh / Thành phố</Text>

            <SelectBox
              value={selectedProvince?.name}
              placeholder="Nhập hoặc chọn Tỉnh / Thành phố"
              onPress={() => setShowProvinceModal(true)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quận / Huyện</Text>

            <SelectBox
              value={selectedDistrict?.name}
              placeholder="Nhập hoặc chọn Quận / Huyện"
              disabled={!selectedProvince}
              onPress={() => {
                if (!selectedProvince) {
                  Toast.show({
                    type: "info",
                    text1: "Lưu ý",
                    text2: "Vui lòng chọn Tỉnh / Thành phố trước",
                  });
                  return;
                }

                setShowDistrictModal(true);
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phường / Xã</Text>

            <SelectBox
              value={selectedWard?.name}
              placeholder="Nhập hoặc chọn Phường / Xã"
              disabled={!selectedDistrict}
              onPress={() => {
                if (!selectedDistrict) {
                  Toast.show({
                    type: "info",
                    text1: "Lưu ý",
                    text2: "Vui lòng chọn Quận / Huyện trước",
                  });
                  return;
                }

                setShowWardModal(true);
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Địa chỉ cụ thể (Số nhà, đường...)
            </Text>

            <FormInput
              value={addressDetail}
              onChangeText={setAddressDetail}
              placeholder="Ví dụ: Số nhà 12, Ngõ 10"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.72 }]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>

      <SelectModal
        visible={showProvinceModal}
        title="Chọn Tỉnh / Thành phố"
        data={provincesData}
        selectedCode={selectedProvince?.code}
        searchValue={provinceQuery}
        onSearchChange={setProvinceQuery}
        searchPlaceholder="Gõ để tìm Tỉnh / Thành phố"
        emptyText="Không tìm thấy Tỉnh / Thành phố phù hợp"
        onSelect={handleSelectProvince}
        onClose={() => {
          setProvinceQuery(selectedProvince?.name || "");
          setShowProvinceModal(false);
        }}
      />

      <SelectModal
        visible={showDistrictModal}
        title="Chọn Quận / Huyện"
        data={districtsData}
        selectedCode={selectedDistrict?.code}
        searchValue={districtQuery}
        onSearchChange={setDistrictQuery}
        searchPlaceholder="Gõ để tìm Quận / Huyện"
        emptyText="Không tìm thấy Quận / Huyện phù hợp"
        onSelect={handleSelectDistrict}
        onClose={() => {
          setDistrictQuery(selectedDistrict?.name || "");
          setShowDistrictModal(false);
        }}
      />

      <SelectModal
        visible={showWardModal}
        title="Chọn Phường / Xã"
        data={wardsData}
        selectedCode={selectedWard?.code}
        searchValue={wardQuery}
        onSearchChange={setWardQuery}
        searchPlaceholder="Gõ để tìm Phường / Xã"
        emptyText="Không tìm thấy Phường / Xã phù hợp"
        onSelect={handleSelectWard}
        onClose={() => {
          setWardQuery(selectedWard?.name || "");
          setShowWardModal(false);
        }}
      />
    </View>
  );
}

/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: PRIMARY,
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
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },

  formCard: {
    padding: 16,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "700",
  },

  required: {
    color: "#EF4444",
  },

  inputContainer: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  inputContainerMultiline: {
    minHeight: 76,
    paddingVertical: 12,
    alignItems: "flex-start",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
    padding: 0,
  },

  inputMultiline: {
    textAlignVertical: "top",
  },

  selectBox: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    paddingRight: 10,
  },

  selectPlaceholder: {
    color: "#94A3B8",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  saveBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    maxHeight: "80%",
    minHeight: "50%",
    padding: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 15,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },

  modalSearchWrap: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
  },

  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
    paddingVertical: 0,
    marginLeft: 8,
  },

  modalListContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalItemLast: {
    borderBottomWidth: 0,
  },

  modalItemText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "700",
  },

  modalEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  modalEmptyText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
});
*/
