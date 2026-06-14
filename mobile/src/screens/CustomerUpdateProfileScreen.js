import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useUser, apiClient } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import styles from "../styles/CustomerUpdateProfileScreenStyles";
import { CUSTOMER_ENDPOINTS } from "../constants/customerEndpoints";

const PRIMARY = COLORS.primary || "#1B5E20";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const HeaderButton = ({ icon, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={styles.headerButton}
    activeOpacity={0.7}
  >
    <View style={styles.headerButtonInner}>
      <Ionicons name={icon} size={20} color={COLORS.white} />
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
  <View
    style={[styles.inputContainer, multiline && styles.inputContainerMultiline]}
  >
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

const AutocompleteInput = ({
  value,
  onChangeText,
  placeholder,
  data,
  onSelect,
  disabled,
  emptyText,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const filteredData = data.filter((item) =>
    normalizeText(item.name).includes(normalizeText(value)),
  );
  const limitedData = filteredData.slice(0, 8);
  const shouldShowDropdown = isFocused && !disabled;
  const shouldShowEmpty =
    shouldShowDropdown && value.trim() && !limitedData.length;

  return (
    <View style={styles.autocompleteWrap}>
      <View
        style={[
          styles.inputContainer,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 180)}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          editable={!disabled}
          autoCorrect={false}
          underlineColorAndroid="transparent"
        />
        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
      </View>

      {shouldShowDropdown && !!limitedData.length && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {limitedData.map((item, index) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.dropdownItem,
                  index === limitedData.length - 1 && styles.dropdownItemLast,
                ]}
                onPress={() => {
                  onSelect(item);
                  setIsFocused(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {shouldShowEmpty && (
        <View style={styles.dropdownContainer}>
          <View style={[styles.dropdownItem, styles.dropdownItemLast]}>
            <Text style={styles.dropdownEmptyText}>
              {emptyText || "Không tìm thấy dữ liệu phù hợp"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

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
          wards.find(
            (item) => item.code == user?.ward_id || item.name === user?.ward,
          ) || null;
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

  const handleProvinceQueryChange = (text) => {
    setProvinceQuery(text);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setDistrictQuery("");
    setDistrictsData([]);
    setSelectedWard(null);
    setWardQuery("");
    setWardsData([]);
  };

  const handleDistrictQueryChange = (text) => {
    setDistrictQuery(text);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setWardQuery("");
    setWardsData([]);
  };

  const handleWardQueryChange = (text) => {
    setWardQuery(text);
    setSelectedWard(null);
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        enableOnAndroid
        enableAutomaticScroll
        enableResetScrollToCoords={false}
        extraHeight={Platform.OS === "ios" ? 140 : 100}
        extraScrollHeight={Platform.OS === "ios" ? 140 : 120}
        keyboardOpeningTime={0}
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

          <View style={[styles.inputGroup, styles.autocompleteGroupTop]}>
            <Text style={styles.label}>Tỉnh / Thành phố</Text>
            <AutocompleteInput
              value={provinceQuery}
              onChangeText={handleProvinceQueryChange}
              placeholder="Nhập hoặc chọn Tỉnh / Thành phố"
              data={provincesData}
              onSelect={handleSelectProvince}
              emptyText="Không tìm thấy Tỉnh / Thành phố phù hợp"
            />
          </View>

          <View style={[styles.inputGroup, styles.autocompleteGroupMiddle]}>
            <Text style={styles.label}>Quận / Huyện</Text>
            <AutocompleteInput
              value={districtQuery}
              onChangeText={handleDistrictQueryChange}
              placeholder="Nhập hoặc chọn Quận / Huyện"
              data={districtsData}
              disabled={!selectedProvince}
              onSelect={handleSelectDistrict}
              emptyText="Không tìm thấy Quận / Huyện phù hợp"
            />
          </View>

          <View style={[styles.inputGroup, styles.autocompleteGroupBottom]}>
            <Text style={styles.label}>Phường / Xã</Text>
            <AutocompleteInput
              value={wardQuery}
              onChangeText={handleWardQueryChange}
              placeholder="Nhập hoặc chọn Phường / Xã"
              data={wardsData}
              disabled={!selectedDistrict}
              onSelect={handleSelectWard}
              emptyText="Không tìm thấy Phường / Xã phù hợp"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ cụ thể (Số nhà, đường...)</Text>
            <FormInput
              value={addressDetail}
              onChangeText={setAddressDetail}
              placeholder="Ví dụ: Số nhà 12, Ngõ 10"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.72 }]}
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}


