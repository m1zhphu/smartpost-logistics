import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ShopStatementStyles from "../styles/ShopStatementStyles";
import { waybillService } from "../services/waybillService";
import { accountingService } from "../services/accountingService";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import SkeletonLoader from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";
import Toast from "react-native-toast-message";

const StatementSkeleton = () => (
  <View style={ShopStatementStyles.skeletonWrap}>
    {[1, 2, 3, 4].map((item) => (
      <View key={item} style={ShopStatementStyles.card}>
        <SkeletonLoader height={16} width="40%" />
        <SkeletonLoader
          height={20}
          width="100%"
          style={ShopStatementStyles.skeletonLine}
        />
        <SkeletonLoader
          height={20}
          width="80%"
          style={ShopStatementStyles.skeletonLine}
        />
      </View>
    ))}
  </View>
);

export default function ShopStatementScreen({ navigation }) {
  const { user } = useUser();
  const [customers, setCustomers] = useState([]);
  const [searchTxt, setSearchTxt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [statementResult, setStatementResult] = useState(null);
  const [statementType, setStatementType] = useState("DEBT");

  useEffect(() => {
    if (!isRouteAllowed(user, "ShopStatement")) {
      Toast.show({
        type: "error",
        text1: "Truy cập bị từ chối",
        text2: "Bạn không có quyền truy cập trang này.",
      });
      navigation.goBack();
      return;
    }
    fetchCustomers();
  }, [navigation, user.token]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchTxt.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(keyword) ||
        (item.phone || "").includes(keyword),
    );
  }, [customers, searchTxt]);

  const fetchCustomers = async () => {
    if (!user.token) return;

    setLoading(true);
    try {
      const response = await waybillService.getCustomers(user.token);
      setCustomers(Array.isArray(response) ? response : []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.message || "Không thể tải danh sách khách hàng.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatement = async () => {
    if (!selectedShop) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng chọn shop để đối soát.",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const response =
        statementType === "COD"
          ? await accountingService.createCodStatement(
              user.token,
              selectedShop.customer_id,
            )
          : await accountingService.createDebtStatement(
              user.token,
              selectedShop.customer_id,
            );

      setStatementResult(response);
      const typeLabel = statementType === "COD" ? "Thu h?" : "Cu?c";
      const codeLabel = response.statement_code || `#${response.statement_id}`;
      const totalAmount = Number(
        response.total_amount || response.grand_total || 0,
      ).toLocaleString("vi-VN");
      Toast.show({
        type: "success",
        text1: "Hoàn thành",
        text2: `Đã tạo bảng kê ${typeLabel} ${codeLabel} với tổng tiền ${totalAmount} d`,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          error.message ||
          "Không thể tạo bảng kê đối soát cho shop này lúc này.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!statementResult || !user.token) return;
    const url = accountingService.getExportStatementUrl(
      statementResult.statement_id,
      statementType,
      user.token,
    );
    Linking.openURL(url);
  };

  const downloadCsv = () => {
    if (!statementResult || !user.token) return;
    const url = accountingService.getExportStatementCsvUrl(
      statementResult.statement_id,
      user.token,
    );
    Linking.openURL(url);
  };

  return (
    <View style={ShopStatementStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      <View style={ShopStatementStyles.headerArea}>
        <View style={ShopStatementStyles.headerTop}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={ShopStatementStyles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={ShopStatementStyles.headerTitle}>
            Ðối soát khách hàng
          </Text>
          <View style={ShopStatementStyles.headerRightPlaceholder} />
        </View>
      </View>

      <View style={ShopStatementStyles.contentWrapper}>
        <View style={ShopStatementStyles.card}>
          <Text style={ShopStatementStyles.label}>Chọn Shop (khách hàng)</Text>

          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={ShopStatementStyles.mockInput}
            onPress={() => setShowSearchModal(true)}
          >
            <View style={ShopStatementStyles.flex1}>
              <Text
                style={[
                  ShopStatementStyles.textMain,
                  !selectedShop && ShopStatementStyles.selectorPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedShop
                  ? selectedShop.name
                  : "Nhận để tìm kiếm tên, SÐT..."}
              </Text>
              {selectedShop ? (
                <Text style={ShopStatementStyles.textSub}>
                  {selectedShop.phone} | {selectedShop.customer_code}
                </Text>
              ) : null}
            </View>
            <View style={ShopStatementStyles.searchIconWrap}>
              <Ionicons name="search" size={20} color={COLORS.secondary} />
            </View>
          </Pressable>

          {selectedShop ? (
            <View style={ShopStatementStyles.infoCard}>
              <View style={ShopStatementStyles.infoRow}>
                <Ionicons name="business" size={18} color={COLORS.textMuted} />
                <Text style={ShopStatementStyles.infoText}>
                  Ngân hàng:{" "}
                  <Text style={ShopStatementStyles.boldPrimary}>
                    {selectedShop.bank_name || "Chưa cập nhật"}
                  </Text>
                </Text>
              </View>
              <View style={ShopStatementStyles.infoRow}>
                <Ionicons name="card" size={18} color={COLORS.textMuted} />
                <Text style={ShopStatementStyles.infoText}>
                  Số TK:{" "}
                  <Text style={ShopStatementStyles.boldSecondary}>
                    {selectedShop.account_number || "Chưa cập nhật"}
                  </Text>
                </Text>
              </View>
            </View>
          ) : null}

          <View style={ShopStatementStyles.statementTypeRow}>
            {[
              { key: "DEBT", label: "Bảng kê công nợ" },
              { key: "COD", label: "Bảng kê thu hộ" },
            ].map((option) => (
              <Pressable
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                key={option.key}
                style={[
                  ShopStatementStyles.statementTypeButton,
                  statementType === option.key &&
                    ShopStatementStyles.statementTypeButtonActive,
                ]}
                onPress={() => setStatementType(option.key)}
              >
                <Text
                  style={[
                    ShopStatementStyles.statementTypeButtonLabel,
                    statementType === option.key &&
                      ShopStatementStyles.statementTypeButtonLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <CustomButton
            title="Tạo bảng kê đối soát"
            onPress={handleCreateStatement}
            loading={submitLoading}
            disabled={!selectedShop}
            style={ShopStatementStyles.submitBtn}
            leftIcon={
              <Ionicons name="calculator" size={20} color={COLORS.white} />
            }
          />
        </View>

        {loading ? <StatementSkeleton /> : null}

        {!loading && !statementResult ? (
          <EmptyState
            icon="file-document-outline"
            title="Chưa có dữ liệu đối soát"
            message="Shop chưa có dữ liệu đối soát trong khoảng thời gian hiện tại."
          />
        ) : null}

        {statementResult ? (
          <View style={ShopStatementStyles.resultTicket}>
            <View style={ShopStatementStyles.ticketTop}>
              <View style={ShopStatementStyles.successCircle}>
                <Ionicons name="checkmark" size={32} color={COLORS.white} />
              </View>
              <Text style={ShopStatementStyles.resTitle}>
                Tạo bảng kê thành công
              </Text>
              <Text style={ShopStatementStyles.resCode}>
                Mã phiếu:{" "}
                {statementResult.statement_code ||
                  `#${statementResult.statement_id}`}
              </Text>
            </View>

            <View style={ShopStatementStyles.ticketBottom}>
              <View style={ShopStatementStyles.rowMoney}>
                <Text style={ShopStatementStyles.moneyLabel}>
                  Tiền shop nhận
                </Text>
                <Text style={ShopStatementStyles.moneyCod}>
                  {(
                    Number(
                      statementResult.total_amount ||
                        statementResult.grand_total,
                    ) || 0
                  ).toLocaleString("vi-VN")}{" "}
                  d
                </Text>
              </View>
              <View style={ShopStatementStyles.rowMoney}>
                <Text style={ShopStatementStyles.moneyLabel}>
                  Phí vận chuyển
                </Text>
                <Text style={ShopStatementStyles.moneyFee}>
                  {Number(statementResult.fee_amount || 0).toLocaleString(
                    "vi-VN",
                  )}{" "}
                  d
                </Text>
              </View>

              <View style={ShopStatementStyles.downloadRow}>
                <CustomButton
                  title="Tải Excel"
                  onPress={downloadExcel}
                  style={ShopStatementStyles.downloadBtn}
                  leftIcon={
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={COLORS.white}
                    />
                  }
                />
                <CustomButton
                  title="Tải CSV"
                  onPress={downloadCsv}
                  variant="secondary"
                  style={ShopStatementStyles.downloadBtn}
                  leftIcon={
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={COLORS.white}
                    />
                  }
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={showSearchModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={ShopStatementStyles.flex1}
        >
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={ShopStatementStyles.modalOverlay}
            onPress={() => setShowSearchModal(false)}
          >
            <View
              style={ShopStatementStyles.modalContainer}
              onStartShouldSetResponder={() => true}
            >
              <View style={ShopStatementStyles.modalHeader}>
                <Text style={ShopStatementStyles.modalTitle}>
                  Tìm kiếm shop (khách hàng)
                </Text>
                <Pressable
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setShowSearchModal(false)}
                >
                  <Ionicons name="close" size={28} color={COLORS.primary} />
                </Pressable>
              </View>

              <CustomInput
                containerStyle={ShopStatementStyles.searchWrap}
                placeholder="Nhập SĐT, Tên, Mã KH..."
                value={searchTxt}
                onChangeText={setSearchTxt}
                leftIcon={
                  <Ionicons name="search" size={20} color={COLORS.textMuted} />
                }
                rightIcon={
                  searchTxt ? (
                    <Pressable
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      onPress={() => setSearchTxt("")}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={COLORS.textGray}
                      />
                    </Pressable>
                  ) : null
                }
              />

              {loading ? (
                <StatementSkeleton />
              ) : (
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item, index) =>
                    String(item.customer_id || index)
                  }
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={ShopStatementStyles.searchItem}
                      onPress={() => {
                        setSelectedShop(item);
                        setShowSearchModal(false);
                        setStatementResult(null);
                      }}
                    >
                      <View style={ShopStatementStyles.searchItemRow}>
                        <View style={ShopStatementStyles.custIcon}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={COLORS.secondary}
                          />
                        </View>
                        <View style={ShopStatementStyles.flex1}>
                          <Text style={ShopStatementStyles.searchName}>
                            {item.name}
                          </Text>
                          <Text style={ShopStatementStyles.searchMeta}>
                            {item.phone} | {item.customer_code}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={ShopStatementStyles.emptyText}>
                      Không tìm thấy khách hàng nào.
                    </Text>
                  }
                />
              )}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
