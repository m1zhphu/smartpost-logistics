import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  checkNetworkConnection,
  checkNetworkConnectionWithoutToast,
} from "../utils/networkUtils";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import Toast from "react-native-toast-message";
import { inventoryService } from "../services/inventory";
import { COLORS } from "../constants/colors";
import { customerService } from "../services/customer";
import { shipperService } from "../services/shipper";
import { viTriKhoService } from "../services/vi_tri_kho";
import { productService } from "../services/product";
import { vehicleService } from "../services/vehicle";
import NoiBoApproveList from "../components/NoiBoApproveList";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function WarehouseActionScreen({ route, navigation }) {
  const { actionConfig } = route.params;
  const { id: currentAction, mode: customerMode, title, perm } = actionConfig;
  const { user, updateUserVehicle } = useUser();

  const [cartItems, setCartItems] = useState([]);
  const [itemMode, setItemMode] = useState("VIP_NEW");
  const [selectedCustomerForInternal, setSelectedCustomerForInternal] =
    useState(null);

  const insets = useSafeAreaInsets();

  const [isShipperNetworkError, setIsShipperNetworkError] = useState(false);
  const [isCustomerNetworkError, setIsCustomerNetworkError] = useState(false);
  const [isInventoryNetworkError, setIsInventoryNetworkError] = useState(false);
  const [isLocationNetworkError, setIsLocationNetworkError] = useState(false);
  const [isVehicleNetworkError, setIsVehicleNetworkError] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [customers, setCustomers] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchInventory, setSearchInventory] = useState("");
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const [selectedItemDisplay, setSelectedItemDisplay] = useState("");
  const [customerNameDisplay, setCustomerNameDisplay] = useState("");

  const [shippers, setShippers] = useState([]);
  const [searchShipper, setSearchShipper] = useState("");
  const [showShipperModal, setShowShipperModal] = useState(false);
  const [isLoadingShippers, setIsLoadingShippers] = useState(false);
  const [shipperNameDisplay, setShipperNameDisplay] = useState("");

  const [locations, setLocations] = useState([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationDisplay, setLocationDisplay] = useState("");

  const [vehicles, setVehicles] = useState([]);
  const [searchVehicle, setSearchVehicle] = useState("");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessingScan = useRef(false);

  const [form, setForm] = useState({
    ma_kho_spl: user?.ma_kho_spl || "HCM",
    ma_bill: "",
    ma_san_pham: "",
    ten_san_pham: "",
    ma_may: "",
    serial: "",
    so_luong: "1",
    so_kien: "1",
    ghi_chu: "",
    pxk_kho_tsb: "",
    pxk_vp_tsb: "",
    customer_id: "",
    nv_giao_hang: user?.bien_so_xe ? user?.full_name : "",
    bien_so_xe: user?.bien_so_xe || "",
    tinh_thanh: "",
    dia_chi_giao_hang: "",
  });

  const isCurrentUserShipper = !!user?.is_shipper;
  const [selectedShipperObj, setSelectedShipperObj] = useState(null);
  const isLockedBienSoXe = !selectedShipperObj
    ? true
    : !!selectedShipperObj.bien_so_xe;

  useEffect(() => {
    const verifyNetworkOnLoad = async () => {
      await checkNetworkConnection();
    };
    verifyNetworkOnLoad();
  }, []);

  useEffect(() => {
    if (isCurrentUserShipper && user) {
      setSelectedShipperObj(user);
      updateForm("nv_giao_hang", user.username);
      updateForm("bien_so_xe", user.bien_so_xe || "");
      setShipperNameDisplay(user.full_name || user.username);
    }
  }, [user, isCurrentUserShipper]);

  const handleOpenScanner = async (targetField) => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Cần cấp quyền Camera để quét mã vạch!",
        });
        return;
      }
    }
    isProcessingScan.current = false;
    setScanTarget(targetField);
    setIsScanning(true);
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    setIsScanning(false);

    if (scanTarget === "ma_san_pham") {
      updateForm("ma_san_pham", data);
      handleLookupProductCode(data);
      setScanTarget(null);
      return;
    }

    if (scanTarget === "ma_bill") {
      updateForm("ma_bill", data);
      setScanTarget(null);
      return;
    }

    if (scanTarget === "serial" || currentAction === "NOIBO_EXPORT") {
      try {
        Toast.show({
          type: "info",
          text1: "Đang tra cứu...",
          text2: `Tìm kiếm mã: ${data}`,
        });
        const response = await inventoryService.scanVipSerial(data);
        const foundItem = response.data.data;

        if (currentAction === "NOIBO_EXPORT") {
          if (itemMode === "VIP_NEW" && foundItem.loai_hien_thi !== "MỚI") {
            Toast.show({
              type: "error",
              text1: "Sai luồng thao tác",
              text2: "Bạn đang ở tab VIP Mới nhưng lại quét trúng máy Cũ!",
            });
            return;
          }
          if (
            itemMode === "VIP_OLD" &&
            foundItem.loai_hien_thi !== "CŨ (TRẢ)"
          ) {
            Toast.show({
              type: "error",
              text1: "Sai luồng thao tác",
              text2: "Bạn đang ở tab VIP Cũ nhưng lại quét trúng máy Mới!",
            });
            return;
          }

          if (
            cartItems.some(
              (c) => c.id_ton_kho === foundItem.id && c.loai_khach === itemMode,
            )
          ) {
            Toast.show({
              type: "info",
              text1: "Đã có trong giỏ",
              text2: "Máy này đã được quét vào phiếu!",
            });
            return;
          }

          const itemToCart = { ...foundItem, loai_khach: itemMode };
          handleSelectInventoryItem(itemToCart);
        } else {
          if (
            currentAction === "VIP_EXPORT_NEW" &&
            foundItem.loai_hien_thi !== "MỚI"
          ) {
            Toast.show({
              type: "error",
              text1: "Sai loại máy",
              text2: "Đây là Phiếu xuất Mới, không được quét máy Cũ!",
            });
            return;
          }
          if (
            currentAction === "VIP_EXPORT_OLD" &&
            foundItem.loai_hien_thi !== "CŨ (TRẢ)"
          ) {
            Toast.show({
              type: "error",
              text1: "Sai loại máy",
              text2: "Đây là Phiếu trả hàng Cũ, không được quét máy Mới!",
            });
            return;
          }

          updateForm("serial", foundItem.serial);
          handleSelectInventoryItem(foundItem);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          Toast.show({
            type: "error",
            text1: "Không tìm thấy",
            text2: error.response?.data?.detail,
          });
          if (currentAction.includes("IMPORT")) {
            updateForm("serial", data);
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Lỗi tra cứu",
            text2: "Lỗi mạng hoặc máy chủ không phản hồi",
          });
        }
      } finally {
        setScanTarget(null);
      }
    }
  };

  const fetchShippers = async () => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsShipperNetworkError(true);
      return;
    }
    setIsShipperNetworkError(false);
    setIsLoadingShippers(true);
    try {
      const res = await shipperService.getShippers();
      setShippers(res.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải danh sách tài xế" });
    } finally {
      setIsLoadingShippers(false);
    }
  };

  const handleOpenShipperModal = () => {
    setShowShipperModal(true);
    fetchShippers();
  };

  const handleSelectShipper = (shipper) => {
    setSelectedShipperObj(shipper);
    updateForm("nv_giao_hang", shipper.username);
    setShipperNameDisplay(shipper.full_name || shipper.username);

    if (shipper.bien_so_xe) {
      updateForm("bien_so_xe", shipper.bien_so_xe);
    } else {
      updateForm("bien_so_xe", "");
    }
    setShowShipperModal(false);
  };

  const fetchVehiclesData = async (keyword = "") => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsVehicleNetworkError(true);
      return;
    }
    setIsVehicleNetworkError(false);
    setIsLoadingVehicles(true);
    try {
      const res = await vehicleService.getVehicles(keyword, "AVAILABLE");
      setVehicles(res.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải danh sách xe rảnh" });
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleOpenVehicleModal = () => {
    setShowVehicleModal(true);
    fetchVehiclesData("");
  };

  const handleSelectVehicle = (xe) => {
    updateForm("bien_so_xe", xe.bien_so_xe);
    setShowVehicleModal(false);
  };

  useEffect(() => {
    if (!showVehicleModal) return;
    const delayDebounceFn = setTimeout(() => {
      fetchVehiclesData(searchVehicle);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchVehicle, showVehicleModal]);

  const filteredShippers = shippers.filter(
    (s) =>
      (s.full_name || "").toLowerCase().includes(searchShipper.toLowerCase()) ||
      (s.username || "").toLowerCase().includes(searchShipper.toLowerCase()) ||
      (s.bien_so_xe || "").toLowerCase().includes(searchShipper.toLowerCase()),
  );

  const fetchLocations = async () => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsLocationNetworkError(true);
      return;
    }
    setIsLocationNetworkError(false);
    setIsLoadingLocations(true);
    try {
      const res = await viTriKhoService.getViTriKho();
      setLocations(res.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải danh sách kho" });
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleOpenLocationModal = () => {
    setShowLocationModal(true);
    fetchLocations();
  };

  const handleSelectLocation = (loc) => {
    if (currentAction === "NOIBO_EXPORT") {
      updateForm("kho_nhan", loc.ma_kho);
    } else {
      updateForm("kho_tra_hang", loc.ma_kho);
    }
    setLocationDisplay(`[${loc.ma_kho}] - ${loc.ten_kho}`);
    setShowLocationModal(false);
  };

  const filteredLocations = locations.filter(
    (loc) =>
      (loc.ma_kho || "").toLowerCase().includes(searchLocation.toLowerCase()) ||
      (loc.ten_kho || "").toLowerCase().includes(searchLocation.toLowerCase()),
  );

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCartItem = (index, field, value) => {
    const newCart = [...cartItems];
    newCart[index][field] = value;
    setCartItems(newCart);
  };

  const handleLookupProductCode = async (scannedCode) => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;
    try {
      const productData = await productService(scannedCode);
      if (productData) {
        updateForm("ten_san_pham", productData.ten_san_pham);
        if (customerMode === "VIP" && productData.ma_may) {
          updateForm("ma_may", productData.ma_may);
        }
        Toast.show({
          type: "success",
          text1: "Đã tìm thấy sản phẩm",
          text2: `Điền thông tin cho mã: ${productData.ma_san_pham}`,
        });
      }
    } catch (error) {
      if (error.status === 404) {
        Toast.show({
          type: "info",
          text1: "Sản phẩm mới",
          text2: "Mã chưa có trong danh mục, vui lòng tự nhập.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi tra cứu",
          text2: "Không thể kết nối đến máy chủ.",
        });
      }
    }
  };

  const fetchCustomersData = async (keyword = "") => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsCustomerNetworkError(true);
      return;
    }
    setIsCustomerNetworkError(false);
    setIsLoadingCustomers(true);
    try {
      const res = await customerService.getCustomers(0, 100, keyword);
      setCustomers(res.data.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải danh sách khách hàng" });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleOpenCustomerModal = () => {
    setShowCustomerModal(true);
    fetchCustomersData("");
  };

  useEffect(() => {
    if (!showCustomerModal) return;
    const delayDebounceFn = setTimeout(() => {
      fetchCustomersData(searchCustomer);
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [searchCustomer, showCustomerModal]);

  const handleSelectCustomer = (customer) => {
    if (currentAction === "NOIBO_EXPORT") {
      setSelectedCustomerForInternal(customer);
      setShowCustomerModal(false);
      return;
    }
    updateForm("customer_id", customer.id);
    setCustomerNameDisplay(
      `[${customer.ma_khach_hang}] - ${customer.ten_khach_hang}`,
    );
    setShowCustomerModal(false);
  };

  const fetchCustomerInventory = async () => {
    const isConnected = await checkNetworkConnectionWithoutToast();
    if (!isConnected) {
      setIsInventoryNetworkError(true);
      return;
    }
    setIsInventoryNetworkError(false);
    setIsLoadingInventory(true);
    setInventoryItems([]);
    try {
      let res;
      if (currentAction === "NOIBO_EXPORT") {
        if (itemMode === "VIP_NEW") {
          const resNew = await inventoryService.getVipAvailableExportNew(
            user?.ma_kho_spl || "",
          );
          const dataNew = (resNew.data?.data || []).map((i) => ({
            ...i,
            loai_hien_thi: "MỚI",
          }));
          setInventoryItems(dataNew);
        } else if (itemMode === "VIP_OLD") {
          const resOld = await inventoryService.getVipAvailableExportOld(
            user?.ma_kho_spl || "",
          );
          const dataOld = (resOld.data?.data || []).map((i) => ({
            ...i,
            loai_hien_thi: "CŨ (TRẢ)",
          }));
          setInventoryItems(dataOld);
        } else if (itemMode === "THUONG" && selectedCustomerForInternal) {
          res = await inventoryService.getRegularAvailableExport(
            selectedCustomerForInternal.id,
            user?.ma_kho_spl || "",
          );
          if (res && res.data && res.data.data) {
            setInventoryItems(res.data.data);
          }
        }
        setIsLoadingInventory(false);
        return;
      }
      if (customerMode === "VIP") {
        if (currentAction === "VIP_EXPORT_NEW") {
          res = await inventoryService.getVipAvailableExportNew(
            form.ma_kho_spl,
          );
        } else if (currentAction === "VIP_IMPORT_OLD") {
          res = await inventoryService.getVipAvailableImportOld();
        } else if (currentAction === "VIP_EXPORT_OLD") {
          res = await inventoryService.getVipAvailableExportOld(
            form.ma_kho_spl,
          );
        }
      } else if (customerMode === "THUONG" && form.customer_id) {
        res = await inventoryService.getRegularAvailableExport(
          form.customer_id,
          form.ma_kho_spl,
        );
      } else if (customerMode === "LE" && form.customer_id) {
        res = await inventoryService.getRetailAvailableExport(
          form.customer_id,
          form.ma_kho_spl,
        );
      }
      if (res && res.data && res.data.data) {
        setInventoryItems(res.data.data);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách hàng hóa có sẵn",
      });
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const handleOpenInventoryModal = () => {
    if (currentAction === "NOIBO_EXPORT") {
      if (itemMode === "THUONG" && !selectedCustomerForInternal) {
        Toast.show({
          type: "error",
          text1: "Lưu ý",
          text2: "Vui lòng chọn khách hàng trước!",
        });
        return;
      }
    } else if (
      (customerMode === "THUONG" || customerMode === "LE") &&
      !form.customer_id
    ) {
      Toast.show({
        type: "error",
        text1: "Lưu ý",
        text2: "Vui lòng chọn khách Hàng trước!",
      });
      return;
    }

    setShowInventoryModal(true);
    fetchCustomerInventory();
  };

  const handleSelectInventoryItem = (item) => {
    if (currentAction === "NOIBO_EXPORT") {
      if (
        cartItems.some(
          (c) => c.id_ton_kho === item.id && c.loai_khach === itemMode,
        )
      ) {
        Alert.alert(
          "Trùng lặp",
          "Mặt hàng này đã có trong danh sách hàng hoá nội bộ",
          [{ text: "Hủy", style: "cancel" }],
        );
        return;
      }

      const extractedMaMay =
        item.ma_may ||
        (item.ten_san_pham
          ? item.ten_san_pham.replace("Mã máy: ", "").trim()
          : "");

      const newItem = {
        id_ton_kho: item.id,
        loai_khach: itemMode,
        customer_id:
          itemMode === "THUONG" ? selectedCustomerForInternal.id : null,
        ten_san_pham:
          itemMode === "THUONG" ? item.ten_san_pham : "Hàng Toshiba",
        ma_may: itemMode.includes("VIP") ? extractedMaMay : "",
        so_luong: item.ton_kho || 1,
        so_kien: item.so_kien || 1,
        trong_luong: 0,
        ma_sp_hoac_id: item.ma_san_pham ? item.ma_san_pham : "N/A",
        serial: item.serial || "",
        ma_bill_item: item.ma_bill,
        kich_thuoc: "",
        tinh_thanh: item.tinh_thanh,
        dia_chi_giao_hang: item.dia_chi_giao_hang,
        ghi_chu: itemMode.includes("VIP") ? item.loai_hien_thi : item.ghi_chu,
      };

      setCartItems((prev) => [...prev, newItem]);
      setShowInventoryModal(false);
      Toast.show({
        type: "success",
        text1: "Đã thêm",
        text2: item.ten_san_pham,
      });
      return;
    }
    updateForm("id", item.id);
    updateForm("ma_kho_spl", item.ma_kho_spl || form.ma_kho_spl);
    updateForm(
      "dia_chi_giao_hang",
      item.dia_chi_giao_hang || form.dia_chi_giao_hang,
    );
    updateForm("tinh_thanh", item.tinh_thanh || form.tinh_thanh);

    const d = new Date(item.ngay_nhap_gan_nhat);
    const formattedDate = !isNaN(d)
      ? `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
      : "";

    updateForm("ngay_nhap_kho_hien_thi", formattedDate);
    if (item.ma_bill) updateForm("ma_bill", item.ma_bill);
    if (item.ghi_chu) updateForm("ghi_chu", item.ghi_chu);

    if (customerMode === "VIP") {
      updateForm("ma_may", item.ten_san_pham.replace("Mã máy: ", "").trim());
      updateForm(
        "ma_san_pham",
        item.ma_san_pham !== "N/A" ? item.ma_san_pham : "",
      );
      updateForm("serial", item.serial);
      setSelectedItemDisplay(`${item.ten_san_pham}`);
    } else {
      updateForm("ten_san_pham", item.ten_san_pham);
      if (currentAction === "THUONG_EXPORT" || currentAction === "LE_EXPORT") {
        updateForm(
          "ma_san_pham",
          item.ma_san_pham !== "N/A" ? item.ma_san_pham : "",
        );
      }
      setSelectedItemDisplay(`${item.ten_san_pham} (Tồn: ${item.ton_kho})`);
    }
    setShowInventoryModal(false);
  };

  const filteredInventoryItems = inventoryItems.filter((item) => {
    const q = searchInventory.toLowerCase();
    return (
      String(item.id || "")
        .toLowerCase()
        .includes(q) ||
      String(item.ten_san_pham || "")
        .toLowerCase()
        .includes(q) ||
      String(item.ma_san_pham || "")
        .toLowerCase()
        .includes(q) ||
      String(item.serial || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const isExportAction = currentAction.includes("EXPORT");
  const isInventoryLocked =
    (customerMode === "THUONG" || customerMode === "LE") && !form.customer_id;

  const handleSubmit = async () => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) return;

    const sanitizeText = (text) => {
      if (!text) return "";
      return String(text).trim().replace(/\s+/g, " ");
    };

    const sanitizedForm = {
      ...form,
      ten_san_pham: sanitizeText(form.ten_san_pham),
      ma_san_pham: sanitizeText(form.ma_san_pham),
      ma_may: sanitizeText(form.ma_may),
      serial: sanitizeText(form.serial),
      ma_bill: sanitizeText(form.ma_bill),
      nv_giao_hang: sanitizeText(form.nv_giao_hang),
      bien_so_xe: sanitizeText(form.bien_so_xe),
      nguoi_nhan: sanitizeText(form.nguoi_nhan),
      tinh_thanh: sanitizeText(form.tinh_thanh),
      dia_chi_giao_hang: sanitizeText(form.dia_chi_giao_hang),
    };

    setForm(sanitizedForm);

    if (currentAction === "NOIBO_EXPORT") {
      if (!sanitizedForm.kho_nhan) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Chưa chọn kho đích nhận!",
        });
        return;
      }
      if (!sanitizedForm.nv_giao_hang || !sanitizedForm.bien_so_xe) {
        Toast.show({
          type: "error",
          text1: "Thiếu thông tin",
          text2: "Vui lòng chọn Tài xế và Biển số xe!",
        });
        return;
      }
      if (cartItems.length === 0) {
        Toast.show({
          type: "error",
          text1: "Giỏ hàng trống",
          text2: "Vui lòng chọn ít nhất 1 sản phẩm!",
        });
        return;
      }

      for (let i = 0; i < cartItems.length; i++) {
        if (!cartItems[i].tinh_thanh || !cartItems[i].dia_chi_giao_hang) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: `Sản phẩm #${i + 1} thiếu Tỉnh Thành hoặc Địa Chỉ Giao Hàng!`,
          });
          return;
        }
        if (!cartItems[i].so_kien) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: `Sản phẩm #${i + 1} thiếu Số Kiện!`,
          });
          return;
        }
        if (!cartItems[i].ma_bill_item) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: `Sản phẩm #${i + 1} thiếu Mã Bill!`,
          });
          return;
        }
      }
    } else {
      if (currentAction === "VIP_IMPORT_NEW") {
        if (
          !sanitizedForm.ma_may ||
          !sanitizedForm.ma_san_pham ||
          !sanitizedForm.serial
        ) {
          Toast.show({
            type: "error",
            text1: "Thiếu thông tin",
            text2: "Mã Máy, Mã Sản Phẩm và Số Serial không được để trống!",
          });
          return;
        }
      } else if (currentAction === "VIP_EXPORT_NEW") {
        if (
          !sanitizedForm.id ||
          !sanitizedForm.ma_bill ||
          !sanitizedForm.nv_giao_hang ||
          !sanitizedForm.bien_so_xe
        ) {
          Toast.show({
            type: "error",
            text1: "Thiếu thông tin",
            text2: "Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!",
          });
          return;
        }
      } else if (currentAction === "VIP_IMPORT_OLD") {
        if (
          !sanitizedForm.ma_may ||
          !sanitizedForm.serial ||
          !sanitizedForm.ma_bill ||
          !sanitizedForm.ma_san_pham
        ) {
          Toast.show({
            type: "error",
            text1: "Thiếu thông tin",
            text2: "Vui lòng điền đầy đủ thông tin",
          });
          return;
        }
      } else if (currentAction === "VIP_EXPORT_OLD") {
        if (
          !sanitizedForm.id ||
          !sanitizedForm.kho_tra_hang ||
          !sanitizedForm.nguoi_nhan ||
          !sanitizedForm.ma_bill ||
          !sanitizedForm.nv_giao_hang ||
          !sanitizedForm.ma_may
        ) {
          Toast.show({
            type: "error",
            text1: "Thiếu thông tin",
            text2: "Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!",
          });
          return;
        }
      } else if (
        currentAction === "THUONG_IMPORT" ||
        currentAction === "LE_IMPORT"
      ) {
        if (
          !sanitizedForm.customer_id ||
          !sanitizedForm.ten_san_pham ||
          !sanitizedForm.so_luong ||
          !sanitizedForm.so_kien
        ) {
          Toast.show({
            type: "error",
            text1: "Thiếu thông tin",
            text2: "Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!",
          });
          return;
        }
      } else if (
        currentAction === "THUONG_EXPORT" ||
        currentAction === "LE_EXPORT"
      ) {
        if (
          !sanitizedForm.id ||
          !sanitizedForm.nv_giao_hang ||
          !sanitizedForm.bien_so_xe ||
          !sanitizedForm.ten_san_pham ||
          !sanitizedForm.ma_bill ||
          !sanitizedForm.so_kien
        ) {
          Toast.show({
            type: "error",
            text1: "Thiếu thông tin",
            text2: "Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!",
          });
          return;
        }
      }

      if (isExportAction && currentAction !== "NOIBO_EXPORT") {
        if (!sanitizedForm.tinh_thanh || !sanitizedForm.dia_chi_giao_hang) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: "Vui lòng nhập Tỉnh Thành và Địa Chỉ Giao Hàng!",
          });
          return;
        }
        if (!sanitizedForm.nv_giao_hang || !sanitizedForm.bien_so_xe) {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: "Vui lòng chọn Tài xế và Biển số xe!",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);

    if (
      (isExportAction || currentAction === "NOIBO_EXPORT") &&
      !isLockedBienSoXe &&
      sanitizedForm.bien_so_xe &&
      selectedShipperObj
    ) {
      try {
        await vehicleService.assignVehicle(
          sanitizedForm.bien_so_xe,
          selectedShipperObj.username,
        );
        if (isCurrentUserShipper) {
          updateUserVehicle(sanitizedForm.bien_so_xe);
        }
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "Lỗi gán xe",
          text2:
            e.response?.data?.detail ||
            "Xe này vừa bị người khác nhận. Vui lòng chọn xe khác!",
        });
        setIsSubmitting(false);
        return;
      }
    }

    let payload = {};

    try {
      if (currentAction === "NOIBO_EXPORT") {
        const payloadNoiBo = {
          kho_xuat: user?.ma_kho_spl || "UNKNOWN",
          kho_nhan: sanitizedForm.kho_nhan,
          tai_xe: sanitizedForm.nv_giao_hang,
          bien_so_xe: sanitizedForm.bien_so_xe,
          doi_tac_van_chuyen: "",
          ghi_chu: sanitizedForm.ghi_chu,
          items: cartItems.map((item) => ({
            ...item,
            loai_khach: item.loai_khach.includes("VIP")
              ? "VIP"
              : item.loai_khach,
          })),
        };

        const response = await inventoryService.createNoiBoExport(payloadNoiBo);

        navigation.navigate("Success", {
          trackingNumber: response.data?.ma_bill || payloadNoiBo.ma_bill,
          returnScreen: "WarehouseHome",
          hideDetailButton: true,
        });
        return;
      }

      if (currentAction === "VIP_IMPORT_NEW") {
        payload = {
          ma_may: sanitizedForm.ma_may,
          ma_kho_spl: sanitizedForm.ma_kho_spl,
          ma_san_pham: sanitizedForm.ma_san_pham,
          ma_bill: sanitizedForm.ma_bill,
          ghi_chu: sanitizedForm.ghi_chu,
          pxk_kho_tsb: sanitizedForm.pxk_kho_tsb,
          pxk_vp_tsb: sanitizedForm.pxk_vp_tsb,
          username: user?.username,
          serial_moi: sanitizedForm.serial,
          tinh_thanh: sanitizedForm.tinh_thanh,
          dia_chi_giao_hang: sanitizedForm.dia_chi_giao_hang,
        };
        await inventoryService.importNewVip(payload);
      } else if (currentAction === "VIP_EXPORT_NEW") {
        payload = {
          id: sanitizedForm.id,
          ma_may: sanitizedForm.ma_may,
          ma_kho_spl: sanitizedForm.ma_kho_spl,
          nv_giao_hang: sanitizedForm.nv_giao_hang,
          bien_so_xe: sanitizedForm.bien_so_xe,
          ma_bill: sanitizedForm.ma_bill,
          ghi_chu: sanitizedForm.ghi_chu,
          serial_moi: sanitizedForm.serial,
          tinh_thanh: sanitizedForm.tinh_thanh,
          dia_chi_giao_hang: sanitizedForm.dia_chi_giao_hang,
        };
        await inventoryService.exportNewVip(payload);
      } else if (currentAction === "VIP_IMPORT_OLD") {
        payload = {
          ma_may: sanitizedForm.ma_may,
          ma_kho_spl: sanitizedForm.ma_kho_spl,
          ma_bill: sanitizedForm.ma_bill,
          ghi_chu: sanitizedForm.ghi_chu,
          serial_cu: sanitizedForm.serial,
          username: user?.username,
          ma_san_pham: sanitizedForm.ma_san_pham,
          tinh_thanh: sanitizedForm.tinh_thanh,
          dia_chi_giao_hang: sanitizedForm.dia_chi_giao_hang,
        };
        await inventoryService.importOldVip(payload);
      } else if (currentAction === "VIP_EXPORT_OLD") {
        payload = {
          id: sanitizedForm.id,
          ma_may: sanitizedForm.ma_may,
          ma_kho_spl: sanitizedForm.ma_kho_spl,
          ma_san_pham: sanitizedForm.ma_san_pham,
          ma_bill: sanitizedForm.ma_bill,
          nv_giao_hang: sanitizedForm.nv_giao_hang,
          bien_so_xe: sanitizedForm.bien_so_xe,
          kho_tra_hang: sanitizedForm.kho_tra_hang,
          nguoi_nhan: sanitizedForm.nguoi_nhan,
          ghi_chu: sanitizedForm.ghi_chu,
          serial_cu: sanitizedForm.serial,
          tinh_thanh: sanitizedForm.tinh_thanh,
          dia_chi_giao_hang: sanitizedForm.dia_chi_giao_hang,
        };
        await inventoryService.exportOldVip(payload);
      } else if (
        currentAction === "THUONG_IMPORT" ||
        currentAction === "LE_IMPORT"
      ) {
        payload = {
          id: 0,
          customer_id: sanitizedForm.customer_id,
          ma_kho_spl: sanitizedForm.ma_kho_spl,
          ten_san_pham: sanitizedForm.ten_san_pham,
          ma_san_pham: sanitizedForm.ma_san_pham,
          so_luong: parseInt(sanitizedForm.so_luong) || 1,
          so_kien: parseInt(sanitizedForm.so_kien) || 1,
          ma_bill: sanitizedForm.ma_bill,
          ghi_chu: sanitizedForm.ghi_chu,
          tinh_thanh: sanitizedForm.tinh_thanh,
          dia_chi_giao_hang: sanitizedForm.dia_chi_giao_hang,
        };

        if (currentAction === "THUONG_IMPORT")
          await inventoryService.importRegular(payload);
        else await inventoryService.importRetail(payload);
      } else if (
        currentAction === "THUONG_EXPORT" ||
        currentAction === "LE_EXPORT"
      ) {
        payload = {
          id: sanitizedForm.id,
          customer_id: sanitizedForm.customer_id,
          ma_kho_spl: sanitizedForm.ma_kho_spl,
          ten_san_pham: sanitizedForm.ten_san_pham,
          ma_san_pham: sanitizedForm.ma_san_pham,
          so_luong: parseInt(sanitizedForm.so_luong) || 1,
          so_kien: parseInt(sanitizedForm.so_kien) || 1,
          nv_giao_hang: sanitizedForm.nv_giao_hang,
          bien_so_xe: sanitizedForm.bien_so_xe,
          ma_bill: sanitizedForm.ma_bill,
          ghi_chu: sanitizedForm.ghi_chu,
          tinh_thanh: sanitizedForm.tinh_thanh,
          dia_chi_giao_hang: sanitizedForm.dia_chi_giao_hang,
        };

        if (currentAction === "THUONG_EXPORT")
          await inventoryService.exportRegular(payload);
        else await inventoryService.exportRetail(payload);
      }

      navigation.navigate("Success", {
        trackingNumber:
          sanitizedForm.ma_san_pham ||
          sanitizedForm.ma_bill ||
          sanitizedForm.ten_san_pham ||
          "Hoàn tất",
        returnScreen: "WarehouseHome",
        hideDetailButton: true,
      });
    } catch (error) {
      let errorMsg = "Gửi yêu cầu thất bại! Vui lòng thử lại.";

      if (error.response && error.response.data && error.response.data.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail
            .map((err) => {
              const fieldName = err.loc[err.loc.length - 1];
              return `Lỗi ô [${fieldName}]: ${err.msg}`;
            })
            .join("\n");
        } else if (typeof detail === "string") {
          errorMsg = detail;
        }
      }

      Toast.show({
        type: "error",
        text1: "Lỗi từ máy chủ",
        text2: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* HEADER CHUẨN FORM */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {currentAction === "NOIBO_APPROVE" ||
      currentAction === "NOIBO_APPROVE_EXPORT" ? (
        <NoiBoApproveList
          navigation={navigation}
          currentAction={currentAction}
        />
      ) : currentAction === "NOIBO_EXPORT" ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông Tin Điều Phối</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mã Phiếu Luân Chuyển</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputDisabled,
                    { textAlign: "center", fontWeight: "bold" },
                  ]}
                  placeholder="Hệ thống tạo tự động"
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kho Phát Hành</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputDisabled,
                    { fontWeight: "bold" },
                  ]}
                  placeholder={user?.ma_kho_spl}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nhân Viên Thao Tác</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputDisabled,
                    { fontWeight: "bold" },
                  ]}
                  placeholder={user?.username}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Kho Đích Nhận <Text style={styles.textDanger}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={handleOpenLocationModal}
                >
                  <Text
                    style={{
                      color: locationDisplay ? "#0f172a" : "#94a3b8",
                      fontWeight: locationDisplay ? "bold" : "normal",
                    }}
                  >
                    {locationDisplay || "Chạm để chọn kho đích"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#94a3b8"
                    style={{ position: "absolute", right: 15 }}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Nhân Viên Giao Hàng <Text style={styles.textDanger}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    { justifyContent: "center" },
                    isCurrentUserShipper && styles.inputDisabled,
                  ]}
                  onPress={isCurrentUserShipper ? null : handleOpenShipperModal}
                  activeOpacity={isCurrentUserShipper ? 1 : 0.7}
                >
                  <Text
                    style={{
                      color:
                        isCurrentUserShipper || shipperNameDisplay
                          ? "#0f172a"
                          : "#94a3b8",
                      fontWeight: "bold",
                    }}
                  >
                    {shipperNameDisplay || "Chạm để chọn tài xế"}
                  </Text>
                  {!isCurrentUserShipper && (
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="#94a3b8"
                      style={{ position: "absolute", right: 15 }}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Biển Số Xe <Text style={styles.textDanger}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    { justifyContent: "center" },
                    isLockedBienSoXe && styles.inputDisabled,
                  ]}
                  onPress={isLockedBienSoXe ? null : handleOpenVehicleModal}
                  activeOpacity={isLockedBienSoXe ? 1 : 0.7}
                >
                  <Text
                    style={{
                      color:
                        isLockedBienSoXe || form.bien_so_xe
                          ? "#0f172a"
                          : "#f59e0b",
                      fontWeight: "bold",
                    }}
                  >
                    {form.bien_so_xe || "Chạm để chọn xe trống"}
                  </Text>
                  {!isLockedBienSoXe && (
                    <Ionicons
                      name="car-outline"
                      size={20}
                      color="#f59e0b"
                      style={{ position: "absolute", right: 15 }}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* GIỎ HÀNG LUÂN CHUYỂN NỘI BỘ */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Danh Sách Luân Chuyển ({cartItems.length})
              </Text>

              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    itemMode === "VIP_NEW" && styles.tabBtnActive,
                  ]}
                  onPress={() => {
                    setItemMode("VIP_NEW");
                    setSelectedCustomerForInternal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      itemMode === "VIP_NEW" && styles.tabTextActive,
                    ]}
                  >
                    Toshiba Mới
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    itemMode === "VIP_OLD" && styles.tabBtnActive,
                  ]}
                  onPress={() => {
                    setItemMode("VIP_OLD");
                    setSelectedCustomerForInternal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      itemMode === "VIP_OLD" && styles.tabTextActive,
                    ]}
                  >
                    Toshiba Cũ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    itemMode === "THUONG" && styles.tabBtnActive,
                  ]}
                  onPress={() => setItemMode("THUONG")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      itemMode === "THUONG" && styles.tabTextActive,
                    ]}
                  >
                    Hàng Nội Bộ
                  </Text>
                </TouchableOpacity>
              </View>

              {itemMode === "THUONG" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Chọn Khách Hàng <Text style={styles.textDanger}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        justifyContent: "center",
                        borderColor: "#10b981",
                        borderWidth: 1.5,
                      },
                    ]}
                    onPress={handleOpenCustomerModal}
                  >
                    <Text
                      style={{
                        color: selectedCustomerForInternal
                          ? "#0f172a"
                          : "#94a3b8",
                        fontWeight: selectedCustomerForInternal
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {selectedCustomerForInternal
                        ? selectedCustomerForInternal.ten_khach_hang
                        : "Chạm để chọn khách hàng"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color="#10b981"
                      style={{ position: "absolute", right: 15 }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                {(itemMode === "VIP_NEW" || itemMode === "VIP_OLD") && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                    onPress={() => handleOpenScanner("serial")}
                  >
                    <Ionicons name="barcode-outline" size={18} color="#FFF" />
                    <Text style={styles.actionBtnText}>MÃ SERIAL</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#0284C7" }]}
                  onPress={handleOpenInventoryModal}
                >
                  <Ionicons name="search" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>TÌM TRONG KHO</Text>
                </TouchableOpacity>
              </View>

              {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>
                    Giỏ hàng luân chuyển đang trống
                  </Text>
                </View>
              ) : (
                cartItems.map((item, index) => (
                  <View key={index} style={styles.detailedCartCard}>
                    <View style={styles.cartCardHeader}>
                      <Text style={styles.cartCardIndex}>
                        #{index + 1} -{" "}
                        <Text
                          style={{
                            color: item.loai_khach.includes("VIP")
                              ? "#db2777"
                              : "#059669",
                          }}
                        >
                          [{item.loai_khach}]
                        </Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const newCart = [...cartItems];
                          newCart.splice(index, 1);
                          setCartItems(newCart);
                        }}
                        style={styles.removeCartBtn}
                      >
                        <Text style={styles.removeCartText}>Xóa Khỏi Giỏ</Text>
                      </TouchableOpacity>
                    </View>

                    {item.loai_khach === "THUONG" && (
                      <View style={styles.formGroup}>
                        <Text style={styles.cartLabel}>Tên Sản Phẩm</Text>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputDisabled,
                            { fontWeight: "bold" },
                          ]}
                          value={item.ten_san_pham}
                          editable={false}
                        />
                      </View>
                    )}

                    {item.loai_khach.includes("VIP") && (
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.cartLabel}>Mã Máy (Model)</Text>
                        <TextInput
                          style={[styles.input, styles.inputDisabled]}
                          value={item.ma_may}
                          editable={false}
                        />
                      </View>
                    )}
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.cartLabel}>Mã SP</Text>
                      <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={item.ma_sp_hoac_id}
                        editable={false}
                      />
                    </View>

                    {item.loai_khach.includes("VIP") && (
                      <View style={styles.formGroup}>
                        <Text style={styles.cartLabel}>Mã Serial</Text>
                        <TextInput
                          style={[styles.input, styles.inputDisabled]}
                          value={item.serial}
                          editable={false}
                        />
                      </View>
                    )}
                    <View style={[styles.formGroup, { flex: 1.5 }]}>
                      <Text style={styles.cartLabel}>
                        Mã Bill <Text style={styles.textDanger}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        placeholder="Nhập mã bill..."
                        value={item.ma_bill_item}
                        editable={false}
                      />
                    </View>

                    <View style={styles.rowInput}>
                      <View style={[styles.formGroup, { flex: 0.48 }]}>
                        <Text style={styles.cartLabel}>
                          Số Lượng <Text style={styles.textDanger}>*</Text>
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputDisabled,
                            { textAlign: "center", fontWeight: "bold" },
                          ]}
                          value={String(item.so_luong)}
                          editable={false}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.cartLabel}>
                          Số Kiện <Text style={styles.textDanger}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(item.so_kien)}
                          onChangeText={(val) =>
                            updateCartItem(index, "so_kien", val)
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.cartLabel}>
                        Tỉnh Thành <Text style={styles.textDanger}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        placeholder="Nhập tỉnh thành..."
                        value={item.tinh_thanh}
                        editable={false}
                      />
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={styles.cartLabel}>
                        Địa Chỉ Giao Hàng{" "}
                        <Text style={styles.textDanger}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        placeholder="Nhập địa chỉ giao hàng..."
                        value={item.dia_chi_giao_hang}
                        editable={false}
                      />
                    </View>

                    <View style={[styles.formGroup, { marginBottom: 0 }]}>
                      <Text style={styles.cartLabel}>Ghi chú</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ghi chú thêm..."
                        value={item.ghi_chu}
                        onChangeText={(val) =>
                          updateCartItem(index, "ghi_chu", val)
                        }
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* BOTTOM DOCK */}
          <View style={styles.bottomDock}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>TẠO PHIẾU LUÂN CHUYỂN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // 3. CÁC LUỒNG CÒN LẠI (VIP MỚI, VIP CŨ, THƯỜNG)
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mã Lô / Thiết Bị (ID)</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputDisabled,
                    { fontWeight: "bold" },
                  ]}
                  value={
                    [
                      "VIP_IMPORT_NEW",
                      "VIP_IMPORT_OLD",
                      "THUONG_IMPORT",
                    ].includes(currentAction)
                      ? "Hệ thống tự động khởi tạo"
                      : String(form.id || "")
                  }
                  placeholder="Tự động điền khi chọn hàng..."
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Vị Trí Kho (SPL)</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={form.ma_kho_spl}
                  editable={false}
                />
              </View>

              {!isExportAction ? (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ngày Nhập</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputDisabled,
                      { fontWeight: "bold" },
                    ]}
                    value="Hệ thống tự động khởi tạo"
                    editable={false}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Ngày Nhập Kho</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputDisabled,
                        { fontWeight: "bold", color: COLORS.primary },
                      ]}
                      value={
                        form.ngay_nhap_kho_hien_thi ||
                        "Tự động điền khi chọn hàng"
                      }
                      editable={false}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Ngày Xuất Kho</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputDisabled,
                        { fontWeight: "bold" },
                      ]}
                      value="Hệ thống tự động khởi tạo"
                      editable={false}
                    />
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nhân viên thao tác</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={user?.username}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.card}>
              {isExportAction && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    <Ionicons
                      name="cube"
                      size={16}
                      color={isInventoryLocked ? "#9CA3AF" : "#0284C7"}
                    />{" "}
                    Hàng Hóa Có Sẵn <Text style={styles.textDanger}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: isInventoryLocked ? "#E5E7EB" : "#0284C7",
                        backgroundColor: isInventoryLocked
                          ? "#F3F4F6"
                          : "#F0F9FF",
                      },
                    ]}
                    disabled={isInventoryLocked}
                    onPress={handleOpenInventoryModal}
                  >
                    <Text
                      style={{
                        color: isInventoryLocked
                          ? "#9CA3AF"
                          : selectedItemDisplay
                            ? "#0F172A"
                            : "#0284C7",
                        fontWeight: "bold",
                      }}
                    >
                      {isInventoryLocked
                        ? "Phải chọn khách hàng trước"
                        : selectedItemDisplay || "Chạm để tìm và chọn hàng"}
                    </Text>
                    <Ionicons
                      name={isInventoryLocked ? "lock-closed" : "search"}
                      size={20}
                      color={isInventoryLocked ? "#9CA3AF" : "#0284C7"}
                      style={{ position: "absolute", right: 15 }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {(customerMode === "THUONG" || customerMode === "LE") && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Khách Hàng <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        {
                          justifyContent: "center",
                          borderColor: "#10B981",
                          borderWidth: 1.5,
                        },
                      ]}
                      onPress={handleOpenCustomerModal}
                    >
                      <Text
                        style={{
                          color: customerNameDisplay ? "#0F172A" : "#94A3B8",
                          fontWeight: customerNameDisplay ? "bold" : "normal",
                        }}
                      >
                        {customerNameDisplay || "Chạm để chọn khách hàng"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#10B981"
                        style={{ position: "absolute", right: 15 }}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Tên Sản Phẩm <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        isExportAction && styles.inputDisabled,
                      ]}
                      placeholder={
                        isExportAction
                          ? "Tự động điền khi chọn hàng..."
                          : "Nhập tên hàng hóa"
                      }
                      value={form.ten_san_pham}
                      editable={!isExportAction}
                      onChangeText={(val) => updateForm("ten_san_pham", val)}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Mã Sản Phẩm</Text>
                    <TextInput
                      style={[styles.input, { fontWeight: "bold" }]}
                      placeholder="Không bắt buộc (Để trống nếu không có)"
                      value={form.ma_san_pham}
                      onChangeText={(val) => updateForm("ma_san_pham", val)}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={[styles.formGroup, { flex: 0.48 }]}>
                      <Text style={styles.label}>
                        Số Lượng <Text style={styles.textDanger}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          { textAlign: "center", fontWeight: "bold" },
                        ]}
                        placeholder="SL"
                        keyboardType="numeric"
                        value={String(form.so_luong || "")}
                        onChangeText={(val) => updateForm("so_luong", val)}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 0.48 }]}>
                      <Text style={styles.label}>
                        Số Kiện <Text style={styles.textDanger}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập số kiện"
                        keyboardType="numeric"
                        value={String(form.so_kien || "")}
                        onChangeText={(val) => updateForm("so_kien", val)}
                      />
                    </View>
                  </View>
                </>
              )}

              {customerMode === "VIP" && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Mã Máy (Model) <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        !["VIP_IMPORT_NEW", "VIP_IMPORT_OLD"].includes(
                          currentAction,
                        ) && styles.inputDisabled,
                        { fontWeight: "bold" },
                      ]}
                      placeholder={
                        ["VIP_IMPORT_NEW", "VIP_IMPORT_OLD"].includes(
                          currentAction,
                        )
                          ? "Nhập mã máy..."
                          : "Tự động điền mã máy"
                      }
                      value={form.ma_may}
                      editable={["VIP_IMPORT_NEW", "VIP_IMPORT_OLD"].includes(
                        currentAction,
                      )}
                      onChangeText={(val) => updateForm("ma_may", val)}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Mã Sản Phẩm{" "}
                      {["VIP_IMPORT_NEW", "VIP_IMPORT_OLD"].includes(
                        currentAction,
                      ) && <Text style={styles.textDanger}> *</Text>}
                    </Text>
                    {["VIP_IMPORT_NEW", "VIP_IMPORT_OLD"].includes(
                      currentAction,
                    ) ? (
                      <View style={styles.rowInput}>
                        <TextInput
                          style={[
                            styles.input,
                            { flex: 1, marginBottom: 0, fontWeight: "bold" },
                          ]}
                          placeholder="Quét hoặc nhập mã SP..."
                          value={form.ma_san_pham}
                          onChangeText={(val) => updateForm("ma_san_pham", val)}
                        />
                        <TouchableOpacity
                          style={styles.scanBtn}
                          onPress={() => handleOpenScanner("ma_san_pham")}
                        >
                          <Ionicons
                            name="barcode-outline"
                            size={24}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputDisabled,
                          { fontWeight: "bold" },
                        ]}
                        placeholder="Tự động điền mã sản phẩm"
                        value={form.ma_san_pham}
                        editable={false}
                      />
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Số Serial <Text style={styles.textDanger}>*</Text>
                    </Text>
                    {["VIP_IMPORT_NEW", "VIP_IMPORT_OLD"].includes(
                      currentAction,
                    ) ? (
                      <View style={styles.rowInput}>
                        <TextInput
                          style={[
                            styles.input,
                            { flex: 1, marginBottom: 0, fontWeight: "bold" },
                          ]}
                          placeholder="Nhập hoặc quét mã vạch Serial..."
                          value={form.serial}
                          onChangeText={(val) => updateForm("serial", val)}
                        />
                        <TouchableOpacity
                          style={styles.scanBtn}
                          onPress={() => handleOpenScanner("serial")}
                        >
                          <Ionicons
                            name="barcode-outline"
                            size={24}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TextInput
                        style={[
                          styles.input,
                          styles.inputDisabled,
                          { fontWeight: "bold" },
                        ]}
                        placeholder="Tự động điền mã serial"
                        value={form.serial}
                        editable={false}
                      />
                    )}
                  </View>

                  {currentAction === "VIP_IMPORT_NEW" && (
                    <>
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>PXK Kho TSB</Text>
                        <TextInput
                          style={styles.input}
                          value={form.pxk_kho_tsb}
                          onChangeText={(val) => updateForm("pxk_kho_tsb", val)}
                          placeholder="Phiếu xuất kho TSB"
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>PXK VP TSB</Text>
                        <TextInput
                          style={styles.input}
                          value={form.pxk_vp_tsb}
                          onChangeText={(val) => updateForm("pxk_vp_tsb", val)}
                          placeholder="Phiếu xuất VP TSB"
                        />
                      </View>
                    </>
                  )}
                </>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Mã Vận Đơn / Bill{" "}
                  {[
                    "VIP_IMPORT_OLD",
                    "VIP_EXPORT_NEW",
                    "VIP_EXPORT_OLD",
                    "THUONG_EXPORT",
                  ].includes(currentAction) && (
                    <Text style={styles.textDanger}> *</Text>
                  )}
                </Text>
                <View style={styles.rowInput}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Quét hoặc nhập mã Bill..."
                    placeholderTextColor="#9CA3AF"
                    value={form.ma_bill}
                    onChangeText={(val) => updateForm("ma_bill", val)}
                  />
                  <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={() => handleOpenScanner("ma_bill")}
                  >
                    <Ionicons name="barcode-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {isExportAction && currentAction !== "VIP_IMPORT_OLD" && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Nhân Viên Giao Hàng{" "}
                      <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        { justifyContent: "center" },
                        isCurrentUserShipper && styles.inputDisabled,
                      ]}
                      onPress={
                        isCurrentUserShipper ? null : handleOpenShipperModal
                      }
                      activeOpacity={isCurrentUserShipper ? 1 : 0.7}
                    >
                      <Text
                        style={{
                          color:
                            isCurrentUserShipper || shipperNameDisplay
                              ? "#0F172A"
                              : "#94A3B8",
                          fontWeight: shipperNameDisplay ? "bold" : "normal",
                        }}
                      >
                        {shipperNameDisplay || "Chạm để chọn tài xế"}
                      </Text>
                      {!isCurrentUserShipper && (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#94A3B8"
                          style={{ position: "absolute", right: 15 }}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Biển Số Xe <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        { justifyContent: "center" },
                        isLockedBienSoXe && styles.inputDisabled,
                      ]}
                      onPress={isLockedBienSoXe ? null : handleOpenVehicleModal}
                      activeOpacity={isLockedBienSoXe ? 1 : 0.7}
                    >
                      <Text
                        style={{
                          color:
                            isLockedBienSoXe || form.bien_so_xe
                              ? "#0F172A"
                              : "#F59E0B",
                          fontWeight: "bold",
                        }}
                      >
                        {form.bien_so_xe || "Chạm để chọn xe trống"}
                      </Text>
                      {!isLockedBienSoXe && (
                        <Ionicons
                          name="car-outline"
                          size={20}
                          color="#F59E0B"
                          style={{ position: "absolute", right: 15 }}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {currentAction === "VIP_EXPORT_OLD" && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Kho Trả Hàng <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={[styles.input, { justifyContent: "center" }]}
                      onPress={handleOpenLocationModal}
                    >
                      <Text
                        style={{
                          color: locationDisplay ? "#0F172A" : "#94A3B8",
                          fontWeight: locationDisplay ? "bold" : "normal",
                        }}
                      >
                        {locationDisplay || "Chạm để chọn kho nhận trả"}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#94A3B8"
                        style={{ position: "absolute", right: 15 }}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Người Nhận <Text style={styles.textDanger}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Tên người nhận..."
                      value={form.nguoi_nhan}
                      onChangeText={(val) => updateForm("nguoi_nhan", val)}
                    />
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Tỉnh Thành{" "}
                  {isExportAction && <Text style={styles.textDanger}> *</Text>}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tỉnh thành"
                  value={form.tinh_thanh}
                  onChangeText={(val) => updateForm("tinh_thanh", val)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Địa Chỉ Giao Hàng{" "}
                  {isExportAction && <Text style={styles.textDanger}> *</Text>}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ giao hàng"
                  value={form.dia_chi_giao_hang}
                  onChangeText={(val) => updateForm("dia_chi_giao_hang", val)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ghi Chú</Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 80, textAlignVertical: "top" },
                  ]}
                  placeholder="Ghi chú thêm nếu có..."
                  numberOfLines={3}
                  value={form.ghi_chu}
                  onChangeText={(val) => updateForm("ghi_chu", val)}
                />
              </View>
            </View>
          </ScrollView>

          {/* BOTTOM DOCK */}
          <View style={styles.bottomDock}>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.submitBtnText}>ĐANG XỬ LÝ...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitBtnText}>XÁC NHẬN YÊU CẦU</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODALS */}
      {currentAction !== "NOIBO_APPROVE" && (
        <>
          {/* CUSTOMER MODAL */}
          <Modal
            visible={showCustomerModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowCustomerModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn Khách Hàng</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomerModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#94A3B8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholderTextColor="#9CA3AF"
                  placeholder="Tìm tên hoặc mã KH..."
                  value={searchCustomer}
                  onChangeText={setSearchCustomer}
                />
              </View>
              {isLoadingCustomers ? (
                <ActivityIndicator
                  size="large"
                  color={PRIMARY}
                  style={{ marginTop: 30 }}
                />
              ) : isCustomerNetworkError ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorIconBox}>
                    <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                    <View style={styles.errorCross}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </View>
                  </View>
                  <Text style={styles.errorTitle}>Lỗi kết nối</Text>
                  <Text style={styles.errorDesc}>
                    Không thể tải danh sách khách hàng lúc này. Vui lòng kiểm
                    tra lại kết nối Internet.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={customers}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modernListItem}
                      onPress={() => handleSelectCustomer(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.modernListIcon,
                          { backgroundColor: "#E0F2FE" },
                        ]}
                      >
                        <Ionicons name="business" size={22} color="#0284C7" />
                      </View>
                      <View style={styles.modernListTextContainer}>
                        <Text style={styles.modernListTitle} numberOfLines={3}>
                          {item.ten_khach_hang}
                        </Text>
                        <Text style={styles.modernListSubtitle}>
                          Mã KH:{" "}
                          <Text
                            style={{ fontWeight: "bold", color: "#64748B" }}
                          >
                            {item.ma_khach_hang}
                          </Text>
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="people-outline"
                        size={40}
                        color="#CBD5E1"
                      />
                      <Text style={styles.emptyText}>
                        Không tìm thấy khách hàng nào
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </Modal>

          {/* INVENTORY MODAL */}
          <Modal
            visible={showInventoryModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowInventoryModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hàng Hóa Có Sẵn</Text>
                <TouchableOpacity
                  onPress={() => setShowInventoryModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#94A3B8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholderTextColor="#9CA3AF"
                  placeholder="Tìm theo mã, tên, serial..."
                  value={searchInventory}
                  onChangeText={setSearchInventory}
                />
              </View>
              {isLoadingInventory ? (
                <ActivityIndicator
                  size="large"
                  color="#0284C7"
                  style={{ marginTop: 30 }}
                />
              ) : isInventoryNetworkError ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorIconBox}>
                    <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                    <View style={styles.errorCross}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </View>
                  </View>
                  <Text style={styles.errorTitle}>Lỗi kết nối</Text>
                  <Text style={styles.errorDesc}>
                    Không thể tải danh sách hàng hoá lúc này. Vui lòng kiểm tra
                    lại kết nối Internet.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredInventoryItems}
                  keyExtractor={(item, index) => String(item.id || index)}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => {
                    const isVipItem =
                      (currentAction === "NOIBO_EXPORT" &&
                        itemMode.includes("VIP")) ||
                      (currentAction !== "NOIBO_EXPORT" &&
                        customerMode === "VIP");
                    return (
                      <TouchableOpacity
                        style={styles.modernInventoryCard}
                        onPress={() => handleSelectInventoryItem(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.invCardHeader}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              flex: 1,
                              paddingRight: 10,
                            }}
                          >
                            <Ionicons
                              name="cube"
                              size={18}
                              color={isVipItem ? "#db2777" : "#0284C7"}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[
                                styles.invCardTitle,
                                isVipItem && { color: "#db2777" },
                              ]}
                              numberOfLines={3}
                            >
                              {item.ten_san_pham}
                            </Text>
                          </View>
                          <Text style={styles.invCardId}>ID: {item.id}</Text>
                        </View>
                        <View style={styles.invCardBody}>
                          {isVipItem ? (
                            <>
                              <Text style={styles.invDetailText}>
                                Mã SP:{" "}
                                <Text style={styles.invDetailHighlight}>
                                  {item.ma_san_pham &&
                                  item.ma_san_pham !== "N/A"
                                    ? item.ma_san_pham
                                    : "---"}
                                </Text>
                              </Text>
                              <Text style={styles.invDetailText}>
                                Serial:{" "}
                                <Text
                                  style={{
                                    fontWeight: "bold",
                                    color: "#db2777",
                                  }}
                                >
                                  {item.serial || "---"}
                                </Text>
                              </Text>
                              {item.loai_hien_thi && (
                                <Text style={styles.invDetailText}>
                                  Phân loại:{" "}
                                  <Text
                                    style={{
                                      fontWeight: "bold",
                                      color: "#0F3D26",
                                    }}
                                  >
                                    {item.loai_hien_thi}
                                  </Text>
                                </Text>
                              )}
                            </>
                          ) : (
                            <Text style={styles.invDetailText}>
                              Mã SP:{" "}
                              <Text style={styles.invDetailHighlight}>
                                {item.ma_san_pham && item.ma_san_pham !== "N/A"
                                  ? item.ma_san_pham
                                  : "---"}
                              </Text>
                            </Text>
                          )}
                          <Text style={styles.invDetailText}>
                            NV Nhập:{" "}
                            <Text style={styles.invDetailHighlight}>
                              {item.nv_nhap_lieu || "---"}
                            </Text>
                          </Text>
                          <Text style={styles.invDetailText}>
                            Ngày Nhập:{" "}
                            <Text style={styles.invDetailHighlight}>
                              {item.ngay_nhap_gan_nhat || "---"}
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.invCardFooter}>
                          <View style={styles.invLocationBadge}>
                            <Ionicons
                              name="location"
                              size={12}
                              color="#059669"
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#059669",
                                marginLeft: 4,
                                fontWeight: "bold",
                              }}
                            >
                              {item.ma_kho_spl}
                            </Text>
                          </View>
                          <Text style={styles.invStockBadge}>
                            Tồn kho: {item.ton_kho}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="layers-outline"
                        size={40}
                        color="#CBD5E1"
                      />
                      <Text style={styles.emptyText}>
                        Không có hàng hóa nào phù hợp
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </Modal>

          {/* SHIPPER MODAL */}
          <Modal
            visible={showShipperModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowShipperModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn Tài Xế</Text>
                <TouchableOpacity
                  onPress={() => setShowShipperModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={[styles.searchBox]}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#94A3B8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholderTextColor="#9CA3AF"
                  placeholder="Tìm theo tên hoặc biển số..."
                  value={searchShipper}
                  onChangeText={setSearchShipper}
                />
              </View>
              {isLoadingShippers ? (
                <ActivityIndicator
                  size="large"
                  color={PRIMARY}
                  style={{ marginTop: 30 }}
                />
              ) : isShipperNetworkError ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorIconBox}>
                    <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                    <View style={styles.errorCross}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </View>
                  </View>
                  <Text style={styles.errorTitle}>Lỗi kết nối</Text>
                  <Text style={styles.errorDesc}>
                    Không thể tải danh sách tài xế lúc này. Vui lòng kiểm tra
                    lại kết nối Internet.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredShippers}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modernListItem}
                      onPress={() => handleSelectShipper(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.modernListIcon,
                          { backgroundColor: "#FEF3C7" },
                        ]}
                      >
                        <Ionicons name="person" size={22} color="#D97706" />
                      </View>
                      <View style={styles.modernListTextContainer}>
                        <Text style={styles.modernListTitle} numberOfLines={3}>
                          {item.full_name || item.username}
                        </Text>
                        <Text style={styles.modernListSubtitle}>
                          Biển số xe:{" "}
                          <Text
                            style={{ fontWeight: "bold", color: "#64748B" }}
                          >
                            {item.bien_so_xe || "Chưa gán xe"}
                          </Text>
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="bicycle-outline"
                        size={40}
                        color="#CBD5E1"
                      />
                      <Text style={styles.emptyText}>
                        Không tìm thấy tài xế nào
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </Modal>

          {/* LOCATION MODAL */}
          <Modal
            visible={showLocationModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowLocationModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn Kho Trả Hàng</Text>
                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={[styles.searchBox]}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#94A3B8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholderTextColor="#9CA3AF"
                  placeholder="Tìm kiếm kho..."
                  value={searchLocation}
                  onChangeText={setSearchLocation}
                />
              </View>
              {isLoadingLocations ? (
                <ActivityIndicator
                  size="large"
                  color={PRIMARY}
                  style={{ marginTop: 30 }}
                />
              ) : isLocationNetworkError ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorIconBox}>
                    <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                    <View style={styles.errorCross}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </View>
                  </View>
                  <Text style={styles.errorTitle}>Lỗi kết nối</Text>
                  <Text style={styles.errorDesc}>
                    Không thể tải danh sách kho lúc này. Vui lòng kiểm tra lại
                    kết nối Internet.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredLocations}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modernListItem}
                      onPress={() => handleSelectLocation(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.modernListIcon,
                          { backgroundColor: "#ECFDF5" },
                        ]}
                      >
                        <Ionicons name="home" size={22} color="#059669" />
                      </View>
                      <View style={styles.modernListTextContainer}>
                        <Text style={styles.modernListTitle} numberOfLines={3}>
                          {item.ten_kho}
                        </Text>
                        <Text style={styles.modernListSubtitle}>
                          Mã kho:{" "}
                          <Text
                            style={{ fontWeight: "bold", color: "#64748B" }}
                          >
                            {item.ma_kho}
                          </Text>
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="map-outline" size={40} color="#CBD5E1" />
                      <Text style={styles.emptyText}>
                        Không tìm thấy kho nào
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </Modal>

          {/* VEHICLE MODAL */}
          <Modal
            visible={showVehicleModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowVehicleModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn Biển Số Xe</Text>
                <TouchableOpacity
                  onPress={() => setShowVehicleModal(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#64748B"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={{ flex: 1, fontSize: 16 }}
                  placeholderTextColor="#9CA3AF"
                  placeholder="Tìm biển số xe..."
                  value={searchVehicle}
                  onChangeText={setSearchVehicle}
                />
              </View>
              {isLoadingVehicles ? (
                <ActivityIndicator
                  size="large"
                  color={PRIMARY}
                  style={{ marginTop: 20 }}
                />
              ) : isVehicleNetworkError ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorIconBox}>
                    <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                    <View style={styles.errorCross}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </View>
                  </View>
                  <Text style={styles.errorTitle}>Lỗi kết nối</Text>
                  <Text style={styles.errorDesc}>
                    Không thể tải danh sách biển số xe lúc này. Vui lòng kiểm
                    tra lại kết nối Internet.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={vehicles}
                  keyExtractor={(item) => item.bien_so_xe}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.simpleVehicleItem}
                      onPress={() => handleSelectVehicle(item)}
                    >
                      <Ionicons
                        name="car-sport-outline"
                        size={26}
                        color="#10b981"
                        style={{ marginRight: 15 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.simplePlateText}>
                          {item.bien_so_xe}
                        </Text>
                        <Text style={styles.simpleVehicleDesc}>
                          {item.mo_ta || "Xe tải"} • Tải trọng:{" "}
                          {item.trong_luong || 0}kg
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10b981"
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#10b981",
                            marginTop: 2,
                          }}
                        >
                          Rảnh
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={{ alignItems: "center", padding: 30 }}>
                      <Ionicons name="car-outline" size={40} color="#cbd5e1" />
                      <Text
                        style={{
                          textAlign: "center",
                          color: "#94a3b8",
                          marginTop: 10,
                        }}
                      >
                        Không tìm thấy xe nào đang rảnh
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </Modal>

          {/* CAMERA MODAL */}
          {isScanning && (
            <View style={styles.fullScreenCameraContainer}>
              <StatusBar style="light" />
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
                }}
              />
              <SafeAreaView
                style={styles.cameraOverlay}
                pointerEvents="box-none"
              >
                <View
                  style={[
                    styles.cameraHeader,
                    { paddingTop: Math.max(insets.top, 20) },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setIsScanning(false)}
                    style={styles.closeCameraBtn}
                  >
                    <Ionicons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>Quét Mã Vạch</Text>
                  <View style={{ width: 40 }} />
                </View>
                <View style={styles.scanFrameContainer} pointerEvents="none">
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    <View style={[styles.maskBase, styles.maskTop]} />
                    <View style={[styles.maskBase, styles.maskBottom]} />
                    <View style={[styles.maskBase, styles.maskLeft]} />
                    <View style={[styles.maskBase, styles.maskRight]} />
                  </View>
                  <Text style={styles.scanHintText}>
                    Điều chỉnh mã barcode vào khung ảnh
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          )}
        </>
      )}

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          elevation: 9999,
          pointerEvents: "box-none",
        }}
      >
        <Toast position="top" topOffset={Platform.OS === "android" ? 40 : 60} />
      </View>
    </KeyboardAvoidingView>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 16, paddingBottom: 100 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  headerRightPlaceholder: { width: 38 },

  // Card Phẳng Chuẩn DNA
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginLeft: 8,
  },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: "#475569", marginBottom: 8, fontWeight: "700" },
  textDanger: { color: "#EF4444" },

  inputWrapper: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  inputDisabled: { backgroundColor: "#F1F5F9", color: "#9CA3AF" },
  rowInput: { flexDirection: "row", alignItems: "center", gap: 10 },

  scanBtn: {
    backgroundColor: PRIMARY,
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  submitBtn: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { color: "white", fontWeight: "900", fontSize: 15 },

  // Tabs trong Modal Luân chuyển
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { color: "#64748B", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#0F172A", fontWeight: "900" },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "900",
    marginLeft: 6,
    fontSize: 13,
  },

  // Item Giỏ hàng Luân chuyển
  detailedCartCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cartCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
    marginBottom: 12,
  },
  cartCardIndex: { fontWeight: "900", fontSize: 15, color: "#0F172A" },
  removeCartBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeCartText: { color: "#EF4444", fontWeight: "800", fontSize: 12 },
  cartLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },

  // Modal Style Chuẩn Form
  modalContent: { backgroundColor: "#F8FAFC", padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  closeModalBtn: { padding: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // Error Component cho Modal
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  errorIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorCross: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 2,
  },
  errorTitle: {
    textAlign: "center",
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  errorDesc: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },

  // Item List Chuẩn Modal
  modernListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modernListIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  modernListTextContainer: { flex: 1, justifyContent: "center" },
  modernListTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  modernListSubtitle: { fontSize: 13, color: "#64748B" },

  // Inventory Card
  modernInventoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  invCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  invCardTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", flex: 1 },
  invCardId: { fontSize: 12, color: "#64748B", fontWeight: "700" },
  invCardBody: { padding: 14 },
  invDetailText: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  invDetailHighlight: { color: "#0F172A", fontWeight: "700" },
  invCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  invLocationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  invStockBadge: { fontSize: 13, fontWeight: "900", color: "#0284C7" },

  // Vehicle Item
  simpleVehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  simplePlateText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  simpleVehicleDesc: { fontSize: 13, color: "#64748B" },

  // Empty State Chung
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },

  // CAMERA XUYÊN ĐỀU
  fullScreenCameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 9999,
    elevation: 9999,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 10,
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 20,
  },
  closeCameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  scanFrameContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    position: "relative",
  },
  scanFrame: { width: 250, height: 150, zIndex: 10, position: "relative" },
  scanHintText: {
    color: "white",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "white",
    borderWidth: 4,
    zIndex: 11,
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  maskBase: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1,
  },
  maskTop: { bottom: "100%", left: -1000, right: -1000, height: 1900 },
  maskBottom: { top: "100%", left: -1000, right: -1000, height: 2000 },
  maskLeft: { right: "100%", top: 0, bottom: 0, width: 1000 },
  maskRight: { left: "100%", top: 0, bottom: 0, width: 1000 },
});
