import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ShopStatementStyles from "../styles/ShopStatementStyles";
import { waybillService } from "../services/waybillService";
import { accountingService } from "../services/accountingService";
import { useUser } from "../context/UserContext";
import { isRouteAllowed } from "../utils/roleUtils";
import { COLORS } from "../constants/colors";

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
      Alert.alert(
        "Truy cập bị từ chối",
        "Bạn không có quyền truy cập trang này.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
      return;
    }
    fetchCustomers();
  }, [user.token]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchTxt.trim().toLowerCase();
    if (!keyword) {
      return customers;
    }

    return customers.filter((item) => {
      return (
        (item.name || "").toLowerCase().includes(keyword) ||
        (item.phone || "").includes(keyword)
      );
    });
  }, [customers, searchTxt]);

  const fetchCustomers = async () => {
    if (!user.token) {
      return;
    }

    try {
      const response = await waybillService.getCustomers(user.token);
      setCustomers(Array.isArray(response) ? response : []);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải danh sách khách hàng.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatement = async () => {
    if (!selectedShop) {
      Alert.alert("Lỗi", "Vui lòng chọn shop để đối soát.");
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
      const typeLabel = statementType === "COD" ? "Thu hộ" : "Cước";
      const codeLabel = response.statement_code || `#${response.statement_id}`;
      const totalAmount = Number(
        response.total_amount || response.grand_total || 0,
      ).toLocaleString("vi-VN");
      Alert.alert(
        "Thành công",
        `Đã tạo bảng kê ${typeLabel} ${codeLabel} với tổng tiền ${totalAmount} đ`,
      );
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.message || "Không có đơn hàng nào chờ đối soát cho shop này.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!statementResult || !user.token) {
      return;
    }

    const url = accountingService.getExportStatementUrl(
      statementResult.statement_id,
      statementType,
      user.token,
    );
    Linking.openURL(url);
  };

  const downloadCsv = () => {
    if (!statementResult || !user.token) {
      return;
    }

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
        <View style={ShopStatementStyles.headerCircleDecoration} />
        <View style={ShopStatementStyles.headerTop}>
          <TouchableOpacity
            style={ShopStatementStyles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={ShopStatementStyles.headerTitle}>
            Đối Soát Khách Hàng
          </Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={ShopStatementStyles.contentWrapper}>
        <View style={ShopStatementStyles.card}>
          <Text style={ShopStatementStyles.label}>
            Chọn Shop (Khách hàng){" "}
            <Text style={{ color: COLORS.error }}>*</Text>
          </Text>

          <TouchableOpacity
            style={ShopStatementStyles.mockInput}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  ShopStatementStyles.textMain,
                  !selectedShop && { color: "#7b867e", fontWeight: "normal" },
                ]}
                numberOfLines={1}
              >
                {selectedShop
                  ? selectedShop.name
                  : "Nhấn để tìm kiếm tên, SĐT..."}
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
          </TouchableOpacity>

          {selectedShop ? (
            <View style={ShopStatementStyles.infoCard}>
              <View style={ShopStatementStyles.infoRow}>
                <Ionicons
                  name="business"
                  size={18}
                  color="#7b867e"
                  style={{ marginRight: 10 }}
                />
                <Text style={ShopStatementStyles.infoText}>
                  Ngân hàng:{" "}
                  <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
                    {selectedShop.bank_name || "Chưa cập nhật"}
                  </Text>
                </Text>
              </View>
              <View
                style={[
                  ShopStatementStyles.infoRow,
                  { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
                ]}
              >
                <Ionicons
                  name="card"
                  size={18}
                  color="#7b867e"
                  style={{ marginRight: 10 }}
                />
                <Text style={ShopStatementStyles.infoText}>
                  Số TK:{" "}
                  <Text style={{ color: COLORS.secondary, fontWeight: "bold" }}>
                    {selectedShop.account_number || "Chưa cập nhật"}
                  </Text>
                </Text>
              </View>
            </View>
          ) : null}
          <View style={ShopStatementStyles.statementTypeRow}>
            {[
              { key: "DEBT", label: "Bảng kê Cước" },
              { key: "COD", label: "Bảng kê Thu hộ" },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  ShopStatementStyles.statementTypeButton,
                  statementType === option.key &&
                    ShopStatementStyles.statementTypeButtonActive,
                ]}
                onPress={() => setStatementType(option.key)}
                activeOpacity={0.8}
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
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[
              ShopStatementStyles.submitBtn,
              (!selectedShop || submitLoading) &&
                ShopStatementStyles.submitBtnDisabled,
            ]}
            disabled={!selectedShop || submitLoading}
            onPress={handleCreateStatement}
          >
            {submitLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name="calculator"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={ShopStatementStyles.submitBtnText}>
                  TẠO BẢNG KÊ ĐỐI SOÁT
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {statementResult ? (
          <View style={ShopStatementStyles.resultTicket}>
            <View style={ShopStatementStyles.ticketTop}>
              <View style={ShopStatementStyles.successCircle}>
                <Ionicons name="checkmark" size={32} color="#FFF" />
              </View>
              <Text style={ShopStatementStyles.resTitle}>
                Tạo Bảng Kê Thành Công
              </Text>
              <Text style={ShopStatementStyles.resCode}>
                Mã phiếu:{" "}
                {statementResult.statement_code ||
                  `#${statementResult.statement_id}`}
              </Text>
            </View>

            <View style={ShopStatementStyles.ticketDivider}>
              <View style={ShopStatementStyles.ticketNotchLeft} />
              <View style={ShopStatementStyles.ticketNotchRight} />
              <View style={ShopStatementStyles.dashedLine} />
            </View>

            <View style={ShopStatementStyles.ticketBottom}>
              <Text style={ShopStatementStyles.resAmountLabel}>
                TỔNG TIỀN ĐỐI SOÁT
              </Text>
              <Text style={ShopStatementStyles.resAmountValue}>
                {(
                  Number(
                    statementResult.total_amount || statementResult.grand_total,
                  ) || 0
                ).toLocaleString("vi-VN")}{" "}
                đ
              </Text>

              <View style={{ flexDirection: "row", marginTop: 14 }}>
                <TouchableOpacity
                  style={[
                    ShopStatementStyles.downloadBtn,
                    { flex: 1, marginRight: 8 },
                  ]}
                  onPress={downloadExcel}
                >
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={ShopStatementStyles.downloadText}>
                    TẢI EXCEL
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    ShopStatementStyles.downloadBtn,
                    { flex: 1, backgroundColor: "#15803d" },
                  ]}
                  onPress={downloadCsv}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={ShopStatementStyles.downloadText}>TẢI CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={showSearchModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={ShopStatementStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSearchModal(false)}
          >
            <View
              style={ShopStatementStyles.modalContainer}
              onStartShouldSetResponder={() => true}
            >
              <View style={ShopStatementStyles.modalHeader}>
                <Text style={ShopStatementStyles.modalTitle}>
                  Tìm Kiếm Shop (Khách hàng)
                </Text>
                <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                  <Ionicons name="close" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={ShopStatementStyles.searchWrap}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#7b867e"
                  style={{ marginHorizontal: 10 }}
                />
                <TextInput
                  style={ShopStatementStyles.searchInput}
                  placeholder="Nhập SĐT, Tên, Mã KH..."
                  placeholderTextColor="#7b867e"
                  value={searchTxt}
                  onChangeText={setSearchTxt}
                  autoFocus
                />
                {searchTxt ? (
                  <TouchableOpacity
                    onPress={() => setSearchTxt("")}
                    style={{ paddingHorizontal: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#c8d0ca" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {loading ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator color={COLORS.secondary} size="large" />
                </View>
              ) : (
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item, index) =>
                    String(item.customer_id || index)
                  }
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={ShopStatementStyles.searchItem}
                      onPress={() => {
                        setSelectedShop(item);
                        setShowSearchModal(false);
                        setStatementResult(null);
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View style={ShopStatementStyles.custIcon}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={COLORS.secondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontSize: 15,
                              color: COLORS.primary,
                            }}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={{
                              color: "#7b867e",
                              fontSize: 13,
                              marginTop: 2,
                            }}
                          >
                            {item.phone} | {item.customer_code}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{
                        textAlign: "center",
                        marginTop: 30,
                        color: "#7b867e",
                        fontStyle: "italic",
                      }}
                    >
                      Không tìm thấy khách hàng nào.
                    </Text>
                  }
                />
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
