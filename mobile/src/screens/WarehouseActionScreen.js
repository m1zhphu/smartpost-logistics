import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView,
    TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { checkNetworkConnection, checkNetworkConnectionWithoutToast } from '../utils/networkUtils';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import Toast from 'react-native-toast-message';
import { inventoryService } from '../services/inventory';
import { COLORS } from '../constants/colors';
import { customerService } from '../services/customer';
import { shipperService } from '../services/shipper';
import { viTriKhoService } from '../services/vi_tri_kho';
import { productService } from '../services/product';
import { vehicleService } from '../services/vehicle';
import NoiBoApproveList from '../components/NoiBoApproveList';


export default function WarehouseActionScreen({ route, navigation }) {
    // Nhận thông tin cấu hình từ màn hình Home
    const { actionConfig } = route.params;
    const { id: currentAction, mode: customerMode, title, perm } = actionConfig;
    const { user, updateUserVehicle } = useUser();

    const [cartItems, setCartItems] = useState([]);
    const [itemMode, setItemMode] = useState('VIP_NEW');
    const [selectedCustomerForInternal, setSelectedCustomerForInternal] = useState(null);

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
    const [searchCustomer, setSearchCustomer] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

    const [inventoryItems, setInventoryItems] = useState([]);
    const [searchInventory, setSearchInventory] = useState('');
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [isLoadingInventory, setIsLoadingInventory] = useState(false);

    const [selectedItemDisplay, setSelectedItemDisplay] = useState('');

    const [customerNameDisplay, setCustomerNameDisplay] = useState('');

    const [shippers, setShippers] = useState([]);
    const [searchShipper, setSearchShipper] = useState('');
    const [showShipperModal, setShowShipperModal] = useState(false);
    const [isLoadingShippers, setIsLoadingShippers] = useState(false);
    const [shipperNameDisplay, setShipperNameDisplay] = useState('');

    const [locations, setLocations] = useState([]);
    const [searchLocation, setSearchLocation] = useState('');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationDisplay, setLocationDisplay] = useState('');

    // State cho Modal Xe
    const [vehicles, setVehicles] = useState([]);
    const [searchVehicle, setSearchVehicle] = useState('');
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

    // Biến trạng thái
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isProcessingScan = useRef(false);
    const [form, setForm] = useState({
        ma_kho_spl: user?.ma_kho_spl || 'HCM',
        ma_bill: '',
        ma_san_pham: '',
        ten_san_pham: '',
        ma_may: '',
        serial: '',
        so_luong: '1',
        so_kien: '1',
        ghi_chu: '',
        pxk_kho_tsb: '',
        pxk_vp_tsb: '',
        customer_id: '',
        nv_giao_hang: user?.bien_so_xe ? user?.full_name : '',
        bien_so_xe: user?.bien_so_xe || '',
        tinh_thanh: '',
        dia_chi_giao_hang: '',
    });

    const isCurrentUserShipper = !!user?.is_shipper;
    const [selectedShipperObj, setSelectedShipperObj] = useState(null);

    const isLockedBienSoXe = !selectedShipperObj ? true : !!selectedShipperObj.bien_so_xe;

    useEffect(() => {
        const verifyNetworkOnLoad = async () => {
            await checkNetworkConnection();
        };

        verifyNetworkOnLoad();
    }, []); // Mảng rỗng [] giúp nó chỉ chạy đúng 1 lần khi vừa mở trang

    useEffect(() => {
        if (isCurrentUserShipper && user) {
            setSelectedShipperObj(user);
            updateForm('nv_giao_hang', user.username);
            updateForm('bien_so_xe', user.bien_so_xe || '');
            setShipperNameDisplay(user.full_name || user.username);
        }
    }, [user, isCurrentUserShipper]);

    // Hàm mở Camera, nhận tham số là tên ô cần điền mã vào
    const handleOpenScanner = async (targetField) => {
        if (!permission?.granted) {
            const { status } = await requestPermission();
            if (status !== 'granted') {
                Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Cần cấp quyền Camera để quét mã vạch!' });
                return;
            }
        }
        isProcessingScan.current = false;
        setScanTarget(targetField); // Lưu lại xem đang quét cho ô nào
        setIsScanning(true);
    };



    const handleBarCodeScanned = async ({ type, data }) => {
        if (isProcessingScan.current) return;

        // KHÓA LẠI NGAY LẬP TỨC
        isProcessingScan.current = true;
        setIsScanning(false); // Tắt màn hình camera ngay lập tức

        // NẾU Ô QUÉT LÀ "MÃ SẢN PHẨM" (Khác với quét Serial máy)
        if (scanTarget === 'ma_san_pham') {
            updateForm('ma_san_pham', data);
            handleLookupProductCode(data);
            setScanTarget(null);
            return;
        }

        // NẾU Ô QUÉT LÀ "MÃ BILL"
        if (scanTarget === 'ma_bill') {
            updateForm('ma_bill', data);
            setScanTarget(null);
            return;
        }

        // ===============================================
        // NẾU Ô QUÉT LÀ "SERIAL" (Cho VIP_EXPORT_NEW, VIP_EXPORT_OLD, HOẶC NỘI BỘ)
        // ===============================================
        if (scanTarget === 'serial' || currentAction === 'NOIBO_EXPORT') {
            try {
                Toast.show({ type: 'info', text1: 'Đang tra cứu...', text2: `Tìm kiếm mã: ${data}` });

                // Gọi API tra cứu (Server vẫn tìm cả 2 kho)
                const response = await inventoryService.scanVipSerial(data);
                const foundItem = response.data.data;

                console.log("Kết quả tra cứu serial:", foundItem); // Log kết quả tra cứu

                // 1. NẾU ĐANG LẬP PHIẾU NỘI BỘ
                if (currentAction === 'NOIBO_EXPORT') {

                    if (itemMode === 'VIP_NEW' && foundItem.loai_hien_thi !== 'MỚI') {
                        Toast.show({ type: 'error', text1: 'Sai luồng thao tác', text2: 'Bạn đang ở tab VIP Mới nhưng lại quét trúng máy Cũ!' });
                        return;
                    }
                    if (itemMode === 'VIP_OLD' && foundItem.loai_hien_thi !== 'CŨ (TRẢ)') {
                        Toast.show({ type: 'error', text1: 'Sai luồng thao tác', text2: 'Bạn đang ở tab VIP Cũ nhưng lại quét trúng máy Mới!' });
                        return;
                    }

                    // CHỐNG QUÉT TRÙNG VÀO GIỎ HÀNG
                    if (cartItems.some(c => c.id_ton_kho === foundItem.id && c.loai_khach === itemMode)) {
                        Toast.show({ type: 'info', text1: 'Đã có trong giỏ', text2: 'Máy này đã được quét vào phiếu!' });
                        return;
                    }

                    // đẩy vào giỏ hàng
                    // (Gắn đè loai_khach bằng itemMode để hàm handleSelectInventoryItem phía sau nhận diện đúng tab)
                    const itemToCart = { ...foundItem, loai_khach: itemMode };
                    handleSelectInventoryItem(itemToCart);
                }

                // 2. NẾU ĐANG LẬP PHIẾU XUẤT LẺ BÌNH THƯỜNG
                else {
                    // CHẶN LUÔN CHO CÁC MÀN HÌNH XUẤT KHÁC ĐỂ TRÁNH NHẦM LẪN
                    if (currentAction === 'VIP_EXPORT_NEW' && foundItem.loai_hien_thi !== 'MỚI') {
                        Toast.show({ type: 'error', text1: 'Sai loại máy', text2: 'Đây là Phiếu xuất Mới, không được quét máy Cũ!' });
                        return;
                    }
                    if (currentAction === 'VIP_EXPORT_OLD' && foundItem.loai_hien_thi !== 'CŨ (TRẢ)') {
                        Toast.show({ type: 'error', text1: 'Sai loại máy', text2: 'Đây là Phiếu trả hàng Cũ, không được quét máy Mới!' });
                        return;
                    }

                    updateForm('serial', foundItem.serial);
                    handleSelectInventoryItem(foundItem);
                }

            } catch (error) {
                // Nếu backend trả về 404 (Không tìm thấy)
                if (error.response?.status === 404) {
                    Toast.show({ type: 'error', text1: 'Không tìm thấy', text2: error.response?.data?.detail });
                    // Điền tạm mã vừa quét vào ô (nếu user đang dùng luồng Nhập Hàng mới tinh thì họ cần ô này)
                    if (currentAction.includes('IMPORT')) {
                        updateForm('serial', data);
                    }
                } else {
                    Toast.show({ type: 'error', text1: 'Lỗi tra cứu', text2: 'Lỗi mạng hoặc máy chủ không phản hồi' });
                }
            } finally {
                setScanTarget(null);
            }
        }
    };

    // --- HÀM CHO SHIPPER ---
    const fetchShippers = async () => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsShipperNetworkError(true); // Đánh dấu lỗi mạng
            return;
        }
        setIsShipperNetworkError(false);
        setIsLoadingShippers(true);
        try {
            const res = await shipperService.getShippers();
            setShippers(res.data);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi tải danh sách tài xế' });
        } finally {
            setIsLoadingShippers(false);
        }
    };

    const handleOpenShipperModal = () => {
        setShowShipperModal(true);
        fetchShippers();
    };

    // 2. Sửa lại hàm chọn Shipper (Dành cho Admin)
    const handleSelectShipper = (shipper) => {
        setSelectedShipperObj(shipper);
        updateForm('nv_giao_hang', shipper.username);
        setShipperNameDisplay(shipper.full_name || shipper.username);

        if (shipper.bien_so_xe) {
            updateForm('bien_so_xe', shipper.bien_so_xe);
        } else {
            updateForm('bien_so_xe', ''); // Mở khóa ô xe
        }
        setShowShipperModal(false);
    };

    // 3. Hàm xử lý API tìm Xe rảnh
    const fetchVehiclesData = async (keyword = '') => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsVehicleNetworkError(true); // Đánh dấu lỗi mạng
            return;
        }
        setIsVehicleNetworkError(false)
        setIsLoadingVehicles(true);
        try {
            const res = await vehicleService.getVehicles(keyword, 'AVAILABLE');
            setVehicles(res.data);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi tải danh sách xe rảnh' });
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    const handleOpenVehicleModal = () => {
        setShowVehicleModal(true);
        fetchVehiclesData('');
    };

    const handleSelectVehicle = (xe) => {
        updateForm('bien_so_xe', xe.bien_so_xe);
        setShowVehicleModal(false);
    };

    // Hiệu ứng Debounce khi tìm xe
    useEffect(() => {
        if (!showVehicleModal) return;
        const delayDebounceFn = setTimeout(() => {
            fetchVehiclesData(searchVehicle);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchVehicle, showVehicleModal]);

    const filteredShippers = shippers.filter(s =>
        (s.full_name || '').toLowerCase().includes(searchShipper.toLowerCase()) ||
        (s.username || '').toLowerCase().includes(searchShipper.toLowerCase()) ||
        (s.bien_so_xe || '').toLowerCase().includes(searchShipper.toLowerCase())
    );

    // --- HÀM CHO LOCATION ---
    const fetchLocations = async () => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsLocationNetworkError(true); // Đánh dấu lỗi mạng
            return;
        }
        setIsLocationNetworkError(false);
        setIsLoadingLocations(true);
        try {
            const res = await viTriKhoService.getViTriKho();
            setLocations(res.data);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi tải danh sách kho' });
        } finally {
            setIsLoadingLocations(false);
        }
    };

    const handleOpenLocationModal = () => {
        setShowLocationModal(true);
        fetchLocations();
    };

    const handleSelectLocation = (loc) => {
        if (currentAction === 'NOIBO_EXPORT') {
            updateForm('kho_nhan', loc.ma_kho);
        } else {
            updateForm('kho_tra_hang', loc.ma_kho);
        }
        setLocationDisplay(`[${loc.ma_kho}] - ${loc.ten_kho}`);
        setShowLocationModal(false);
    };

    const filteredLocations = locations.filter(loc =>
        (loc.ma_kho || '').toLowerCase().includes(searchLocation.toLowerCase()) ||
        (loc.ten_kho || '').toLowerCase().includes(searchLocation.toLowerCase())
    );

    // Hàm cập nhật Form
    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
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

            // Tự động điền dữ liệu vào form nếu có
            if (productData) {
                updateForm('ten_san_pham', productData.ten_san_pham);

                // Nếu là khách VIP và data có mã máy thì điền luôn mã máy
                if (customerMode === 'VIP' && productData.ma_may) {
                    updateForm('ma_may', productData.ma_may);
                }

                Toast.show({
                    type: 'success',
                    text1: 'Đã tìm thấy sản phẩm',
                    text2: `Điền thông tin cho mã sản phẩm: ${productData.ma_san_pham}`
                });
            }
        } catch (error) {
            // ---> XỬ LÝ LỖI KIỂU MỚI Ở ĐÂY <---

            // Bắt chính xác lỗi 404 từ Service ném ra
            if (error.status === 404) {
                Toast.show({
                    type: 'info',
                    text1: 'Sản phẩm mới',
                    text2: 'Mã chưa có trong danh mục, vui lòng tự nhập.'
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi tra cứu',
                    text2: 'Không thể kết nối đến máy chủ.'
                });
            }
        }
    };

    // 1. Hàm gọi API tìm kiếm trực tiếp trên Server (Luôn lấy tối đa 100 kết quả)
    const fetchCustomersData = async (keyword = '') => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsCustomerNetworkError(true); // Đánh dấu lỗi mạng
            return;
        }
        setIsCustomerNetworkError(false);
        setIsLoadingCustomers(true);
        try {
            // Truyền skip=0, limit=100, và keyword lên server
            const res = await customerService.getCustomers(0, 100, keyword);
            setCustomers(res.data.data); // Ghi đè lại mảng kết quả mới
        } catch (error) {
            // console.error("Lỗi lấy KH:", error);
            Toast.show({ type: 'error', text1: 'Lỗi tải danh sách khách hàng' });
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    // 2. Mở Modal
    const handleOpenCustomerModal = () => {
        setShowCustomerModal(true);
        // Nếu lần đầu mở mà chưa có data thì tải danh sách mặc định (không từ khóa)
        fetchCustomersData('');

    };

    // 3. Hiệu ứng Debounce (Tự động tìm khi gõ phím)
    useEffect(() => {
        if (!showCustomerModal) return;

        // Đợi người dùng ngừng gõ 500ms thì mới gọi API
        const delayDebounceFn = setTimeout(() => {
            fetchCustomersData(searchCustomer);
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchCustomer, showCustomerModal]);

    // Hàm chọn Khách hàng
    const handleSelectCustomer = (customer) => {
        if (currentAction === 'NOIBO_EXPORT') {
            setSelectedCustomerForInternal(customer);
            setShowCustomerModal(false);
            return; // Dừng, không chạy code cũ bên dưới
        }
        updateForm('customer_id', customer.id);
        setCustomerNameDisplay(`[${customer.ma_khach_hang}] - ${customer.ten_khach_hang}`);
        setShowCustomerModal(false);
    };

    const fetchCustomerInventory = async () => {
        const isConnected = await checkNetworkConnectionWithoutToast();
        if (!isConnected) {
            setIsInventoryNetworkError(true); // Đánh dấu lỗi mạng
            return;
        }
        setIsInventoryNetworkError(false);
        setIsLoadingInventory(true);
        setInventoryItems([]);
        try {
            let res;
            if (currentAction === 'NOIBO_EXPORT') {
                if (itemMode === 'VIP_NEW') {
                    const resNew = await inventoryService.getVipAvailableExportNew(user?.ma_kho_spl || '');
                    const dataNew = (resNew.data?.data || []).map(i => ({ ...i, loai_hien_thi: 'MỚI' }));
                    setInventoryItems(dataNew);
                }
                else if (itemMode === 'VIP_OLD') {
                    const resOld = await inventoryService.getVipAvailableExportOld(user?.ma_kho_spl || '');
                    const dataOld = (resOld.data?.data || []).map(i => ({ ...i, loai_hien_thi: 'CŨ (TRẢ)' }));
                    setInventoryItems(dataOld);
                }
                else if (itemMode === 'THUONG' && selectedCustomerForInternal) {
                    res = await inventoryService.getRegularAvailableExport(selectedCustomerForInternal.id, user?.ma_kho_spl || '');
                    if (res && res.data && res.data.data) {
                        setInventoryItems(res.data.data);
                    }
                }
                setIsLoadingInventory(false);
                return; // XONG LUỒNG NỘI BỘ -> KẾT THÚC HÀM
            }
            if (customerMode === 'VIP') {
                if (currentAction === 'VIP_EXPORT_NEW') {
                    res = await inventoryService.getVipAvailableExportNew(form.ma_kho_spl);
                }
                else if (currentAction === 'VIP_IMPORT_OLD') {
                    res = await inventoryService.getVipAvailableImportOld();
                }
                else if (currentAction === 'VIP_EXPORT_OLD') {
                    res = await inventoryService.getVipAvailableExportOld(form.ma_kho_spl);
                }
            } else if (customerMode === 'THUONG' && form.customer_id) {
                res = await inventoryService.getRegularAvailableExport(form.customer_id, form.ma_kho_spl);
            } else if (customerMode === 'LE' && form.customer_id) {
                res = await inventoryService.getRetailAvailableExport(form.customer_id, form.ma_kho_spl);
            }
            if (res && res.data && res.data.data) {
                setInventoryItems(res.data.data);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể tải danh sách hàng hóa có sẵn' });
        } finally {
            setIsLoadingInventory(false);
        }
    };

    const handleOpenInventoryModal = () => {
        if (currentAction === 'NOIBO_EXPORT') {
            if (itemMode === 'THUONG' && !selectedCustomerForInternal) {
                Toast.show({ type: 'error', text1: 'Lưu ý', text2: 'Vui lòng chọn khách hàng trước!' });
                return;
            }
        }
        // --- VALIDATION CHO CÁC LUỒNG CŨ ---
        else if ((customerMode === 'THUONG' || customerMode === 'LE') && !form.customer_id) {
            Toast.show({ type: 'error', text1: 'Lưu ý', text2: 'Vui lòng chọn khách Hàng trước!' });
            return;
        }

        setShowInventoryModal(true);
        fetchCustomerInventory();
    };

    // Hàm khi User click chọn 1 dòng hàng trong Modal (Auto-Fill)
    const handleSelectInventoryItem = (item) => {
        // ==========================================
        // XỬ LÝ CHO LUỒNG NỘI BỘ (THÊM VÀO GIỎ HÀNG)
        // ==========================================
        if (currentAction === 'NOIBO_EXPORT') {
            if (cartItems.some(c => c.id_ton_kho === item.id && c.loai_khach === itemMode)) {
                Alert.alert(
                    "Trùng lặp",
                    "Mặt hàng này đã có trong danh sách hàng hoá nội bộ",
                    [
                        { text: "Hủy", style: "cancel" }
                    ]);
                return;
            }

            const extractedMaMay = item.ma_may || (item.ten_san_pham ? item.ten_san_pham.replace('Mã máy: ', '').trim() : '');

            const newItem = {

                id_ton_kho: item.id,
                loai_khach: itemMode,
                customer_id: itemMode === 'THUONG' ? selectedCustomerForInternal.id : null,
                ten_san_pham: itemMode === 'THUONG' ? item.ten_san_pham : 'Hàng Toshiba',
                ma_may: itemMode.includes('VIP') ? extractedMaMay : '',
                so_luong: item.ton_kho || 1,
                so_kien: item.so_kien || 1,
                trong_luong: 0,
                ma_sp_hoac_id: item.ma_san_pham ? item.ma_san_pham : 'N/A',
                serial: item.serial || '',
                ma_bill_item: item.ma_bill,
                kich_thuoc: '',
                tinh_thanh: item.tinh_thanh,
                dia_chi_giao_hang: item.dia_chi_giao_hang,
                ghi_chu: itemMode.includes('VIP') ? item.loai_hien_thi : item.ghi_chu
            }

            setCartItems(prev => [...prev, newItem]);
            setShowInventoryModal(false);
            Toast.show({ type: 'success', text1: 'Đã thêm', text2: item.ten_san_pham });
            return; // Dừng lại, KHÔNG CHẠY code cập nhật form cũ bên dưới
        }
        updateForm('id', item.id);
        updateForm('ma_kho_spl', item.ma_kho_spl || form.ma_kho_spl);
        updateForm('dia_chi_giao_hang', item.dia_chi_giao_hang || form.dia_chi_giao_hang);
        updateForm('tinh_thanh', item.tinh_thanh || form.tinh_thanh);


        // Hàm formatDate tạm (bạn có thể đưa ra file utils)
        const d = new Date(item.ngay_nhap_gan_nhat);
        const formattedDate = !isNaN(d) ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : '';

        // set vào State tạm để nếu cần hiển thị ngày nhập kho cũ
        updateForm('ngay_nhap_kho_hien_thi', formattedDate);

        if (item.ma_bill) updateForm('ma_bill', item.ma_bill);

        if (item.ghi_chu) updateForm('ghi_chu', item.ghi_chu);

        // if (item.nv_nhap_lieu && !isCurrentUserShipper) {
        //     updateForm('nv_giao_hang', item.nv_nhap_lieu);
        //     setShipperNameDisplay(item.nv_nhap_lieu);
        // }

        if (customerMode === 'VIP') {
            updateForm('ma_may', item.ten_san_pham.replace('Mã máy: ', '').trim());
            updateForm('ma_san_pham', item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '');
            updateForm('serial', item.serial);
            setSelectedItemDisplay(`${item.ten_san_pham}`);
        } else {
            updateForm('ten_san_pham', item.ten_san_pham);
            if (currentAction === 'THUONG_EXPORT' || currentAction === 'LE_EXPORT') {
                updateForm('ma_san_pham', item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '');
            }

            setSelectedItemDisplay(`${item.ten_san_pham} (Tồn: ${item.ton_kho})`);
        }
        setShowInventoryModal(false);
    };

    // Lọc tìm kiếm
    const filteredInventoryItems = inventoryItems.filter(item => {
        const q = searchInventory.toLowerCase();
        return String(item.id || '').toLowerCase().includes(q) ||
            String(item.ten_san_pham || '').toLowerCase().includes(q) ||
            String(item.ma_san_pham || '').toLowerCase().includes(q) ||
            String(item.serial || '').toLowerCase().includes(q);
    });

    // Check xem có phải hành động Export không
    // Kiểm tra xem ID của hành động hiện tại có chứa chữ 'EXPORT' hay không
    const isExportAction = currentAction.includes('EXPORT');

    // THÊM BIẾN NÀY: Nút kho hàng sẽ bị khóa NẾU là Khách Thường/Lẻ MÀ CHƯA chọn Khách Hàng
    const isInventoryLocked = (customerMode === 'THUONG' || customerMode === 'LE') && !form.customer_id;

    const sanitizeText = (text) => {
        if (!text) return '';
        // Loại bỏ khoảng trắng 2 đầu và đổi nhiều khoảng trắng liên tiếp thành 1 khoảng trắng
        return String(text).trim().replace(/\s+/g, ' ');
    };

    const handleSubmit = async () => {
        // 1. Kiểm tra kết nối Internet trước tiên
        const isConnected = await checkNetworkConnection();
        if (!isConnected) return;

        const sanitizeText = (text) => {
            if (!text) return '';
            // Loại bỏ khoảng trắng 2 đầu và đổi nhiều khoảng trắng liên tiếp thành 1 khoảng trắng
            return String(text).trim().replace(/\s+/g, ' ');
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

        // ================================================================
        // BƯỚC 2: VALIDATION TRƯỚC KHI SUBMIT (CHƯA BẬT LOADING)
        // ================================================================

        // 2.1 LUỒNG NỘI BỘ
        if (currentAction === 'NOIBO_EXPORT') {
            if (!sanitizedForm.kho_nhan) {
                Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Chưa chọn kho đích nhận!' });
                return;
            }
            if (!sanitizedForm.nv_giao_hang || !sanitizedForm.bien_so_xe) {
                Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng chọn Tài xế và Biển số xe!' });
                return;
            }
            if (cartItems.length === 0) {
                Toast.show({ type: 'error', text1: 'Giỏ hàng trống', text2: 'Vui lòng chọn ít nhất 1 sản phẩm!' });
                return;
            }

            for (let i = 0; i < cartItems.length; i++) {
                if (!cartItems[i].tinh_thanh || !cartItems[i].dia_chi_giao_hang) {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: `Sản phẩm #${i + 1} thiếu Tỉnh Thành hoặc Địa Chỉ Giao Hàng!` });
                    return;
                }
                if (!cartItems[i].so_kien) {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: `Sản phẩm #${i + 1} thiếu Số Kiện!` });
                    return;
                }
                if (!cartItems[i].ma_bill_item) {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: `Sản phẩm #${i + 1} thiếu Mã Bill!` });
                    return;
                }
            }
        }
        // 2.2 CÁC LUỒNG KHÁC (GIỮ NGUYÊN NHƯ CŨ)
        else {
            if (currentAction === 'VIP_IMPORT_NEW') {
                if (!sanitizedForm.ma_may || !sanitizedForm.ma_san_pham || !sanitizedForm.serial) {
                    Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Mã Máy, Mã Sản Phẩm và Số Serial không được để trống!' });
                    return;
                }
            }
            else if (currentAction === 'VIP_EXPORT_NEW') {
                if (!sanitizedForm.id || !sanitizedForm.ma_bill || !sanitizedForm.nv_giao_hang || !sanitizedForm.bien_so_xe) {
                    Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!' });
                    return;
                }
            }
            else if (currentAction === 'VIP_IMPORT_OLD') {
                if (!sanitizedForm.ma_may || !sanitizedForm.serial || !sanitizedForm.ma_bill || !sanitizedForm.ma_san_pham) {
                    Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đầy đủ thông tin' });
                    return;
                }
            }
            else if (currentAction === 'VIP_EXPORT_OLD') {
                if (!sanitizedForm.id || !sanitizedForm.kho_tra_hang || !sanitizedForm.nguoi_nhan || !sanitizedForm.ma_bill || !sanitizedForm.nv_giao_hang || !sanitizedForm.ma_may) {
                    Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!' });
                    return;
                }
            }
            else if (currentAction === 'THUONG_IMPORT' || currentAction === 'LE_IMPORT') {
                if (!sanitizedForm.customer_id || !sanitizedForm.ten_san_pham || !sanitizedForm.so_luong || !sanitizedForm.so_kien) {
                    Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!' });
                    return;
                }
            }
            else if (currentAction === 'THUONG_EXPORT' || currentAction === 'LE_EXPORT') {
                if (!sanitizedForm.id || !sanitizedForm.nv_giao_hang || !sanitizedForm.bien_so_xe || !sanitizedForm.ten_san_pham || !sanitizedForm.ma_bill || !sanitizedForm.so_kien) {
                    Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng điền đầy đủ thông tin (chỉ Ghi chú được trống)!' });
                    return;
                }
            }

            // Xử lý Validate gán xe (Cho các trường hợp KHÔNG PHẢI NỘI BỘ)
            if (isExportAction && currentAction !== 'NOIBO_EXPORT') {
                if (!sanitizedForm.tinh_thanh || !sanitizedForm.dia_chi_giao_hang) {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng nhập Tỉnh Thành và Địa Chỉ Giao Hàng!' });
                    return;
                }
                if (!sanitizedForm.nv_giao_hang || !sanitizedForm.bien_so_xe) {
                    Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Vui lòng chọn Tài xế và Biển số xe!' });
                    return;
                }
            }
        }

        // ================================================================
        // BƯỚC 3: SAU KHI QUA HẾT VALIDATE -> BẬT LOADING BẮT ĐẦU SUBMIT
        // ================================================================
        setIsSubmitting(true);

        // --- LOGIC GÁN XE CHUNG CHO TẤT CẢ CÁC LUỒNG XUẤT ---
        if ((isExportAction || currentAction === 'NOIBO_EXPORT') && !isLockedBienSoXe && sanitizedForm.bien_so_xe && selectedShipperObj) {
            try {
                await vehicleService.assignVehicle(
                    sanitizedForm.bien_so_xe,
                    selectedShipperObj.username
                );
                if (isCurrentUserShipper) {
                    updateUserVehicle(sanitizedForm.bien_so_xe);
                }
            } catch (e) {
                Toast.show({ type: 'error', text1: 'Lỗi gán xe', text2: e.response?.data?.detail || 'Xe này vừa bị người khác nhận. Vui lòng chọn xe khác!' });
                setIsSubmitting(false); // Bị lỗi thì tắt loading
                return; // Dừng lập phiếu
            }
        }

        let payload = {};

        try {
            // --- GỌI API TÙY THEO ACTION ---
            if (currentAction === 'NOIBO_EXPORT') {
                const payloadNoiBo = {
                    kho_xuat: user?.ma_kho_spl || 'UNKNOWN',
                    kho_nhan: sanitizedForm.kho_nhan,
                    tai_xe: sanitizedForm.nv_giao_hang,
                    bien_so_xe: sanitizedForm.bien_so_xe,
                    doi_tac_van_chuyen: '',
                    ghi_chu: sanitizedForm.ghi_chu,
                    items: cartItems.map(item => ({
                        ...item,
                        loai_khach: item.loai_khach.includes('VIP') ? 'VIP' : item.loai_khach
                    }))
                };

                // Gọi API backend (Ở phía server FastApi bạn đã viết sẽ tự bỏ cái ma_bill này đi và sinh PXK)
                const response = await inventoryService.createNoiBoExport(payloadNoiBo);

                // Chuyển hướng thành công
                navigation.navigate('Success', {
                    trackingNumber: response.data?.ma_bill || payloadNoiBo.ma_bill, // Ưu tiên lấy mã PXK từ server trả về
                    returnScreen: 'WarehouseHome',
                    hideDetailButton: true
                });
                return; // Dừng hàm
            }

            // Xử lý các luồng cũ (Giữ nguyên)
            if (currentAction === 'VIP_IMPORT_NEW') {
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
            }
            else if (currentAction === 'VIP_EXPORT_NEW') {
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
            }
            else if (currentAction === 'VIP_IMPORT_OLD') {
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
            }
            else if (currentAction === 'VIP_EXPORT_OLD') {
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
            }
            else if (currentAction === 'THUONG_IMPORT' || currentAction === 'LE_IMPORT') {
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

                if (currentAction === 'THUONG_IMPORT') await inventoryService.importRegular(payload);
                else await inventoryService.importRetail(payload);
            }
            else if (currentAction === 'THUONG_EXPORT' || currentAction === 'LE_EXPORT') {
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

                if (currentAction === 'THUONG_EXPORT') await inventoryService.exportRegular(payload);
                else await inventoryService.exportRetail(payload);
            }

            // Xử lý chuyển trang sau khi luồng cũ hoàn tất
            navigation.navigate('Success', {
                trackingNumber: sanitizedForm.ma_san_pham || sanitizedForm.ma_bill || sanitizedForm.ten_san_pham || 'Hoàn tất',
                returnScreen: 'WarehouseHome',
                hideDetailButton: true
            });

        } catch (error) {
            let errorMsg = 'Gửi yêu cầu thất bại! Vui lòng thử lại.';

            if (error.response && error.response.data && error.response.data.detail) {
                const detail = error.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMsg = detail.map(err => {
                        const fieldName = err.loc[err.loc.length - 1];
                        return `Lỗi ô [${fieldName}]: ${err.msg}`;
                    }).join('\n');
                } else if (typeof detail === 'string') {
                    errorMsg = detail;
                }
            }

            Toast.show({
                type: 'error',
                text1: 'Lỗi từ máy chủ',
                text2: errorMsg
            });
        } finally {
            setIsSubmitting(false); // Dù thành công hay lỗi cũng phải tắt cờ
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar style="light" />

            {/* HEADER GIỮ NGUYÊN (Dùng chung cho tất cả các màn) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
                </View>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* ======================================================= */}
            {/* ĐỊNH TUYẾN GIAO DIỆN (CHỈ HIỂN THỊ 1 TRONG 3 LUỒNG)       */}
            {/* ======================================================= */}

            {currentAction === 'NOIBO_APPROVE' || currentAction === 'NOIBO_APPROVE_EXPORT' ? (
                // 1. LUỒNG DUYỆT PHIẾU NỘI BỘ (Checker)
                <NoiBoApproveList navigation={navigation} currentAction={currentAction} />

            ) : currentAction === 'NOIBO_EXPORT' ? (

                // 2. LUỒNG LẬP PHIẾU NỘI BỘ (Maker - Giỏ hàng)
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* THÔNG TIN KHO & TÀI XẾ (Tái sử dụng) */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Thông Tin Điều Phối</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Mã Phiếu Luân Chuyển</Text>
                                <TextInput style={[styles.input, styles.inputDisabled, { textAlign: 'center', fontWeight: 'bold' }]} placeholder="Hệ thống tạo tự động" editable={false} />
                            </View>


                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Kho Phát Hành</Text>
                                <TextInput style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]} placeholder={user?.ma_kho_spl} editable={false} />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nhân Viên Thao Tác</Text>
                                <TextInput style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]} placeholder={user?.username} editable={false} />
                            </View>



                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Kho Đích Nhận <Text style={styles.textDanger}>*</Text></Text>
                                <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={handleOpenLocationModal}>
                                    <Text style={{ color: locationDisplay ? '#0f172a' : '#94a3b8', fontWeight: locationDisplay ? 'bold' : 'normal' }}>
                                        {locationDisplay || "Chạm để chọn kho đích"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#94a3b8" style={{ position: 'absolute', right: 15 }} />
                                </TouchableOpacity>
                            </View>

                            {/* REUSE LOGIC TÀI XẾ CỦA BẠN */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nhân Viên Giao Hàng <Text style={styles.textDanger}>*</Text></Text>
                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center' }, isCurrentUserShipper && styles.inputDisabled]}
                                    onPress={isCurrentUserShipper ? null : handleOpenShipperModal}
                                    activeOpacity={isCurrentUserShipper ? 1 : 0.7}
                                >
                                    <Text style={{ color: (isCurrentUserShipper || shipperNameDisplay) ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}>
                                        {shipperNameDisplay || "Chạm để chọn tài xế"}
                                    </Text>
                                    {!isCurrentUserShipper && <Ionicons name="chevron-down" size={20} color="#94a3b8" style={{ position: 'absolute', right: 15 }} />}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Biển Số Xe <Text style={styles.textDanger}>*</Text></Text>
                                <TouchableOpacity
                                    style={[styles.input, { justifyContent: 'center' }, isLockedBienSoXe && styles.inputDisabled]}
                                    onPress={isLockedBienSoXe ? null : handleOpenVehicleModal}
                                    activeOpacity={isLockedBienSoXe ? 1 : 0.7}
                                >
                                    <Text style={{ color: (isLockedBienSoXe || form.bien_so_xe) ? '#0f172a' : '#f59e0b', fontWeight: 'bold' }}>
                                        {form.bien_so_xe || "Chạm để chọn xe trống"}
                                    </Text>
                                    {!isLockedBienSoXe && <Ionicons name="car-outline" size={20} color="#f59e0b" style={{ position: 'absolute', right: 15 }} />}
                                </TouchableOpacity>
                            </View>

                            {/* <View style={styles.formGroup}>
                                <Text style={styles.label}>Ghi Chú</Text>
                                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Ghi chú thêm nếu có" numberOfLines={3} value={form.ghi_chu} onChangeText={(val) => updateForm('ghi_chu', val)} />
                            </View> */}
                        </View>

                        {/* KHU VỰC GIỎ HÀNG */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Danh Sách Luân Chuyển ({cartItems.length})</Text>

                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tabBtn, itemMode === 'VIP_NEW' && styles.tabBtnActive]}
                                    onPress={() => { setItemMode('VIP_NEW'); setSelectedCustomerForInternal(null) }}
                                >
                                    <Text style={[styles.tabText, itemMode === 'VIP_NEW' && styles.tabTextActive]}>Toshiba Mới</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.tabBtn, itemMode === 'VIP_OLD' && styles.tabBtnActive]}
                                    onPress={() => { setItemMode('VIP_OLD'); setSelectedCustomerForInternal(null) }}
                                >
                                    <Text style={[styles.tabText, itemMode === 'VIP_OLD' && styles.tabTextActive]}>Toshiba Cũ</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.tabBtn, itemMode === 'THUONG' && styles.tabBtnActive]}
                                    onPress={() => setItemMode('THUONG')}
                                >
                                    <Text style={[styles.tabText, itemMode === 'THUONG' && styles.tabTextActive]}>Hàng Nội Bộ</Text>
                                </TouchableOpacity>
                            </View>

                            {itemMode === 'THUONG' && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Chọn Khách Hàng <Text style={styles.textDanger}>*</Text></Text>
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center', borderColor: '#10b981', borderWidth: 1.5 }]} onPress={handleOpenCustomerModal}>
                                        <Text style={{ color: selectedCustomerForInternal ? '#0f172a' : '#94a3b8', fontWeight: selectedCustomerForInternal ? 'bold' : 'normal' }}>
                                            {selectedCustomerForInternal ? selectedCustomerForInternal.ten_khach_hang : "Chạm để chọn khách hàng"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#10b981" style={{ position: 'absolute', right: 15 }} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                                {(itemMode === 'VIP_NEW' || itemMode === 'VIP_OLD') && (
                                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={handleOpenScanner}>
                                        <Ionicons name="barcode-outline" size={18} color="#FFF" />
                                        <Text style={styles.actionBtnText}>MÃ SERIAL</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0284C7' }]} onPress={handleOpenInventoryModal}>
                                    <Ionicons name="search" size={18} color="#FFF" />
                                    <Text style={styles.actionBtnText}>TÌM TRONG KHO</Text>
                                </TouchableOpacity>
                            </View>

                            {cartItems.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>Giỏ hàng luân chuyển đang trống</Text>
                                </View>
                            ) : (
                                cartItems.map((item, index) => (
                                    <View key={index} style={styles.detailedCartCard}>
                                        {/* Header Card: Số thứ tự + Loại Khách + Nút Xóa */}
                                        <View style={styles.cartCardHeader}>
                                            <Text style={styles.cartCardIndex}>
                                                #{index + 1} - <Text style={{ color: item.loai_khach.includes('VIP') ? '#db2777' : '#059669' }}>[{item.loai_khach}]</Text>
                                            </Text>
                                            <TouchableOpacity onPress={() => {
                                                const newCart = [...cartItems]; newCart.splice(index, 1); setCartItems(newCart);
                                            }} style={styles.removeCartBtn}>
                                                <Text style={styles.removeCartText}>Xóa Khỏi Giỏ</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {item.loai_khach === 'THUONG' && (
                                            <View style={styles.formGroup}>
                                                <Text style={styles.cartLabel}>Tên Sản Phẩm</Text>
                                                <TextInput style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]} value={item.ten_san_pham} editable={false} />
                                            </View>
                                        )}

                                        {/* Hàng 2: Mã Máy (nếu VIP) & Mã SP */}
                                        {item.loai_khach.includes('VIP') && (
                                            <View style={[styles.formGroup, { flex: 1 }]}>
                                                <Text style={styles.cartLabel}>Mã Máy (Model)</Text>
                                                <TextInput style={[styles.input, styles.inputDisabled]} value={item.ma_may} editable={false} />
                                            </View>
                                        )}
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.cartLabel}>Mã SP</Text>
                                            <TextInput style={[styles.input, styles.inputDisabled]} value={item.ma_sp_hoac_id} editable={false} />
                                        </View>


                                        {/* Hàng 3: Mã Serial (nếu VIP) */}
                                        {item.loai_khach.includes('VIP') && (
                                            <View style={styles.formGroup}>
                                                <Text style={styles.cartLabel}>Mã Serial</Text>
                                                <TextInput style={[styles.input, styles.inputDisabled]} value={item.serial} editable={false} />
                                            </View>
                                        )}
                                        <View style={[styles.formGroup, { flex: 1.5 }]}>
                                            <Text style={styles.cartLabel}>Mã Bill <Text style={styles.textDanger}>*</Text></Text>
                                            <TextInput
                                                style={[styles.input, styles.inputDisabled]}
                                                placeholder="Nhập mã bill..."
                                                value={item.ma_bill_item}
                                                editable={false}
                                            // onChangeText={(val) => updateCartItem(index, 'ma_bill_item', val)}
                                            />
                                        </View>

                                        {/* Hàng 4: Số Lượng (Khóa) | Số Kiện (Mở) */}
                                        <View style={styles.rowInput}>
                                            <View style={[styles.formGroup, { flex: 0.8 }]}>
                                                <Text style={styles.cartLabel}>Số Lượng <Text style={styles.textDanger}>*</Text></Text>
                                                <TextInput style={[styles.input, styles.inputDisabled, { textAlign: 'center', fontWeight: 'bold' }]} value={String(item.so_luong)} editable={false} />
                                            </View>
                                            <View style={[styles.formGroup, { flex: 1 }]}>
                                                <Text style={styles.cartLabel}>Số Kiện <Text style={styles.textDanger}>*</Text></Text>
                                                <TextInput
                                                    style={styles.input}
                                                    keyboardType="numeric"
                                                    value={String(item.so_kien)}
                                                    onChangeText={(val) => updateCartItem(index, 'so_kien', val)}
                                                />
                                            </View>
                                        </View>

                                        {/* Tỉnh thành & Địa chỉ giao hàng (Bắt buộc cho Nội Bộ) */}
                                        <View style={styles.formGroup}>
                                            <Text style={styles.cartLabel}>Tỉnh Thành <Text style={styles.textDanger}>*</Text></Text>
                                            <TextInput
                                                style={[styles.input, styles.inputDisabled]}
                                                placeholder="Nhập tỉnh thành..."
                                                value={item.tinh_thanh}
                                                // onChangeText={(val) => updateCartItem(index, 'tinh_thanh', val)}
                                                editable={false}
                                            />
                                        </View>
                                        <View style={styles.formGroup}>
                                            <Text style={styles.cartLabel}>Địa Chỉ Giao Hàng <Text style={styles.textDanger}>*</Text></Text>
                                            <TextInput
                                                style={[styles.input, styles.inputDisabled]}
                                                placeholder="Nhập địa chỉ giao hàng..."
                                                value={item.dia_chi_giao_hang}
                                                // onChangeText={(val) => updateCartItem(index, 'dia_chi_giao_hang', val)}
                                                editable={false}
                                            />
                                        </View>

                                        {/* Hàng 5: Ghi chú */}
                                        <View style={[styles.formGroup, { marginBottom: 0 }]}>
                                            <Text style={styles.cartLabel}>Ghi chú</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Ghi chú thêm..."
                                                value={item.ghi_chu}
                                                onChangeText={(val) => updateCartItem(index, 'ghi_chu', val)}
                                            />
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>

                    {/* NÚT SUBMIT LUỒNG NỘI BỘ */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.submitBtn]} onPress={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>TẠO PHIẾU LUÂN CHUYỂN</Text>}
                        </TouchableOpacity>
                    </View>
                </View>

            ) : (

                // 3. CÁC LUỒNG CÒN LẠI (VIP MỚI, VIP CŨ, THƯỜNG - FORM GỐC CỦA BẠN)
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* --- CHUNG: Mã Lô / Thiết bị (ID) --- */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mã Lô / Thiết Bị (ID)</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]}
                                value={['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD', 'THUONG_IMPORT'].includes(currentAction) ? "Hệ thống tự động khởi tạo" : String(form.id || '')}
                                placeholder="Tự động điền khi chọn hàng..."
                                editable={false}
                            />
                        </View>

                        {/* --- CHUNG: Vị Trí Kho (SPL) --- */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Vị Trí Kho (SPL)</Text>
                            <TextInput style={[styles.input, styles.inputDisabled]} value={form.ma_kho_spl} editable={false} />
                        </View>

                        {/* --- CHUNG: Ngày Nhập / Ngày Xuất (Chỉ hiển thị, không sửa) --- */}
                        {(!isExportAction) ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Ngày Nhập</Text>
                                <TextInput style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]} value="Hệ thống tự động khởi tạo" editable={false} />
                            </View>
                        ) : (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Ngày Nhập Kho</Text>
                                    <TextInput style={[styles.input, styles.inputDisabled, { fontWeight: 'bold', color: COLORS.primary }]} value={form.ngay_nhap_kho_hien_thi || "Tự động điền khi chọn hàng"} editable={false} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Ngày Xuất Kho</Text>
                                    <TextInput style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]} value="Hệ thống tự động khởi tạo" editable={false} />
                                </View>
                            </>
                        )}

                        {/* --- CHUNG: Nhân viên thao tác --- */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nhân viên thao tác</Text>
                            <TextInput style={[styles.input, styles.inputDisabled]} value={user?.username} editable={false} />
                        </View>

                        {/* ====================================================== */}
                        {/* KHU VỰC THÔNG TIN SẢN PHẨM (TÙY BIẾN THEO LUỒNG)       */}
                        {/* ====================================================== */}

                        {/* NẾU LÀ XUẤT HÀNG: Nút Mở Giỏ Hàng Tồn Kho */}
                        {isExportAction && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>
                                    <Ionicons name="cube" size={16} color={isInventoryLocked ? "#9CA3AF" : "#0284c7"} />
                                    {" "}Hàng Hóa Có Sẵn <Text style={styles.textDanger}>*</Text>
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        styles.input,
                                        {
                                            justifyContent: 'center',
                                            borderWidth: 1.5,
                                            borderColor: isInventoryLocked ? '#E5E7EB' : '#0284c7',
                                            backgroundColor: isInventoryLocked ? '#F3F4F6' : '#f0f9ff'
                                        }
                                    ]}
                                    disabled={isInventoryLocked}
                                    onPress={handleOpenInventoryModal}
                                >
                                    <Text style={{
                                        color: isInventoryLocked ? '#9CA3AF' : (selectedItemDisplay ? '#0f172a' : '#0284c7'),
                                        fontWeight: 'bold'
                                    }}>
                                        {isInventoryLocked
                                            ? "Phải chọn khách hàng trước"
                                            : (selectedItemDisplay || "Chạm để tìm và chọn hàng")}
                                    </Text>
                                    <Ionicons name={isInventoryLocked ? "lock-closed" : "search"} size={20} color={isInventoryLocked ? "#9CA3AF" : "#0284c7"} style={{ position: 'absolute', right: 15 }} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* --- ĐẶC THÙ: Khách Thường / Lẻ --- */}
                        {(customerMode === 'THUONG' || customerMode === 'LE') && (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Khách Hàng <Text style={styles.textDanger}>*</Text></Text>
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center', borderColor: '#10b981', borderWidth: 1.5 }]} onPress={handleOpenCustomerModal}>
                                        <Text style={{ color: customerNameDisplay ? '#0f172a' : '#94a3b8', fontWeight: customerNameDisplay ? 'bold' : 'normal' }}>
                                            {customerNameDisplay || "Chạm để chọn khách hàng"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#10b981" style={{ position: 'absolute', right: 15 }} />
                                    </TouchableOpacity>
                                </View>

                                {/* Tên Sản Phẩm */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Tên Sản Phẩm <Text style={styles.textDanger}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, isExportAction && styles.inputDisabled]}
                                        placeholder={isExportAction ? "Tự động điền khi chọn hàng..." : "Nhập tên hàng hóa"}
                                        value={form.ten_san_pham}
                                        editable={!isExportAction}
                                        onChangeText={(val) => updateForm('ten_san_pham', val)}
                                    />
                                </View>

                                {/* Mã Sản Phẩm */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Mã Sản Phẩm</Text>
                                    <TextInput
                                        style={[styles.input, { fontWeight: 'bold' }]}
                                        placeholder="Không bắt buộc (Để trống nếu không có)"
                                        value={form.ma_san_pham}
                                        onChangeText={(val) => updateForm('ma_san_pham', val)}
                                    />
                                </View>

                                {/* Số lượng & Số Kiện */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={[styles.formGroup, { flex: 0.48 }]}>
                                        <Text style={styles.label}>Số Lượng <Text style={styles.textDanger}>*</Text></Text>
                                        <TextInput
                                            style={[styles.input, { textAlign: 'center', fontWeight: 'bold' }]}
                                            placeholder="SL"
                                            keyboardType="numeric"
                                            value={String(form.so_luong || '')}
                                            onChangeText={(val) => updateForm('so_luong', val)}
                                        />
                                    </View>
                                    <View style={[styles.formGroup, { flex: 0.48 }]}>
                                        <Text style={styles.label}>Số Kiện <Text style={styles.textDanger}>*</Text></Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nhập số kiện"
                                            keyboardType="numeric"
                                            value={String(form.so_kien || '')}
                                            onChangeText={(val) => updateForm('so_kien', val)}
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        {/* --- ĐẶC THÙ: Khách VIP --- */}
                        {customerMode === 'VIP' && (
                            <>
                                {/* Mã Máy (Model) */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Mã Máy (Model) <Text style={styles.textDanger}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, !['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction) && styles.inputDisabled, { fontWeight: 'bold' }]}
                                        placeholder={['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction) ? "Nhập mã máy..." : "Tự động điền mã máy"}
                                        value={form.ma_may}
                                        editable={['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction)}
                                        multiline={Platform.OS === 'android'}
                                        scrollEnabled={false}
                                        onChangeText={(val) => updateForm('ma_may', val)}
                                    />
                                </View>

                                {/* Mã Sản Phẩm */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Mã Sản Phẩm {['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction) && <Text style={styles.textDanger}> *</Text>}</Text>
                                    {['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction) ? (
                                        <View style={styles.rowInput}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginBottom: 0, fontWeight: 'bold' }]}
                                                placeholder="Quét hoặc nhập mã SP..."
                                                value={form.ma_san_pham}
                                                onChangeText={(val) => updateForm('ma_san_pham', val)}
                                                multiline={Platform.OS === 'android'}
                                                scrollEnabled={false}
                                            />
                                            <TouchableOpacity style={styles.scanBtn} onPress={() => handleOpenScanner('ma_san_pham')}>
                                                <Ionicons name="barcode-outline" size={24} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TextInput
                                            style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]}
                                            placeholder="Tự động điền mã sản phẩm"
                                            value={form.ma_san_pham}
                                            editable={false}
                                            multiline={Platform.OS === 'android'}
                                            scrollEnabled={false}
                                        />
                                    )}
                                </View>

                                {/* Số Serial */}
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Số Serial <Text style={styles.textDanger}>*</Text></Text>
                                    {['VIP_IMPORT_NEW', 'VIP_IMPORT_OLD'].includes(currentAction) ? (
                                        <View style={styles.rowInput}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginBottom: 0, fontWeight: 'bold' }]}
                                                placeholder="Nhập hoặc quét mã vạch Serial..."
                                                value={form.serial}
                                                onChangeText={(val) => updateForm('serial', val)}
                                                multiline={Platform.OS === 'android'}
                                                scrollEnabled={false}
                                            />
                                            <TouchableOpacity style={styles.scanBtn} onPress={() => handleOpenScanner('serial')}>
                                                <Ionicons name="barcode-outline" size={24} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TextInput
                                            style={[styles.input, styles.inputDisabled, { fontWeight: 'bold' }]}
                                            placeholder="Tự động điền mã serial"
                                            value={form.serial}
                                            editable={false}
                                            multiline={Platform.OS === 'android'}
                                            scrollEnabled={false}
                                        />
                                    )}
                                </View>

                                {/* Các trường bổ sung của VIP_IMPORT_NEW */}
                                {currentAction === 'VIP_IMPORT_NEW' && (
                                    <>
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>PXK Kho TSB</Text>
                                            <TextInput style={styles.input} value={form.pxk_kho_tsb} onChangeText={(val) => updateForm('pxk_kho_tsb', val)} placeholder="Phiếu xuất kho TSB" />
                                        </View>
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>PXK VP TSB</Text>
                                            <TextInput style={styles.input} value={form.pxk_vp_tsb} onChangeText={(val) => updateForm('pxk_vp_tsb', val)} placeholder="Phiếu xuất VP TSB" />
                                        </View>
                                    </>
                                )}
                            </>
                        )}

                        {/* ====================================================== */}
                        {/* KHU VỰC THÔNG TIN VẬN ĐƠN & TÀI XẾ                     */}
                        {/* ====================================================== */}

                        {/* HIỂN THỊ MÃ BILL (Hiển thị cho tất cả, riêng luồng Nhập thường thì không bắt buộc) */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mã Vận Đơn / Bill  {['VIP_IMPORT_OLD', 'VIP_EXPORT_NEW', 'VIP_EXPORT_OLD', 'THUONG_EXPORT'].includes(currentAction) && <Text style={styles.textDanger}> *</Text>}</Text>
                            <View style={styles.rowInput}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder="Quét hoặc nhập mã Bill..."
                                    placeholderTextColor="#9CA3AF"
                                    value={form.ma_bill}
                                    onChangeText={(val) => updateForm('ma_bill', val)}
                                />
                                <TouchableOpacity style={styles.scanBtn} onPress={() => handleOpenScanner('ma_bill')}>
                                    <Ionicons name="barcode-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isExportAction && currentAction !== 'VIP_IMPORT_OLD' && (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Nhân Viên Giao Hàng <Text style={styles.textDanger}>*</Text></Text>
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center' }, isCurrentUserShipper && styles.inputDisabled]} onPress={isCurrentUserShipper ? null : handleOpenShipperModal} activeOpacity={isCurrentUserShipper ? 1 : 0.7}>
                                        <Text style={{ color: (isCurrentUserShipper || shipperNameDisplay) ? '#0f172a' : '#94a3b8', fontWeight: shipperNameDisplay ? 'bold' : 'normal' }}>
                                            {shipperNameDisplay || "Chạm để chọn tài xế"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#94a3b8" style={{ position: 'absolute', right: 15 }} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Biển Số Xe <Text style={styles.textDanger}>*</Text></Text>
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center' }, isLockedBienSoXe && styles.inputDisabled]} onPress={isLockedBienSoXe ? null : handleOpenVehicleModal} activeOpacity={isLockedBienSoXe ? 1 : 0.7}>
                                        <Text style={{ color: (isLockedBienSoXe || form.bien_so_xe) ? '#0f172a' : '#f59e0b', fontWeight: 'bold' }}>
                                            {form.bien_so_xe || "Chạm để chọn xe trống"}
                                        </Text>
                                        {!isLockedBienSoXe && <Ionicons name="car-outline" size={20} color="#f59e0b" style={{ position: 'absolute', right: 15 }} />}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {currentAction === 'VIP_EXPORT_OLD' && (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Kho Trả Hàng <Text style={styles.textDanger}>*</Text></Text>
                                    <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={handleOpenLocationModal}>
                                        <Text style={{ color: locationDisplay ? '#0f172a' : '#94a3b8', fontWeight: locationDisplay ? 'bold' : 'normal' }}>
                                            {locationDisplay || "Chạm để chọn kho nhận trả"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#94a3b8" style={{ position: 'absolute', right: 15 }} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Người Nhận <Text style={styles.textDanger}>*</Text></Text>
                                    <TextInput style={styles.input} placeholder="Tên người nhận..." value={form.nguoi_nhan} onChangeText={(val) => updateForm('nguoi_nhan', val)} />
                                </View>
                            </>
                        )}

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tỉnh Thành {isExportAction && <Text style={styles.textDanger}> *</Text>}</Text>
                            <TextInput style={styles.input} placeholder="Nhập tỉnh thành" value={form.tinh_thanh} onChangeText={(val) => updateForm('tinh_thanh', val)} />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Địa Chỉ Giao Hàng {isExportAction && <Text style={styles.textDanger}> *</Text>}</Text>
                            <TextInput style={styles.input} placeholder="Nhập địa chỉ giao hàng" value={form.dia_chi_giao_hang} onChangeText={(val) => updateForm('dia_chi_giao_hang', val)} />
                        </View>

                        {/* --- CHUNG: Ghi chú --- */}
                        <View style={styles.formGroup} >
                            <Text style={styles.label}>Ghi Chú</Text>
                            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Ghi chú thêm nếu có..." numberOfLines={3} value={form.ghi_chu} onChangeText={(val) => updateForm('ghi_chu', val)} />
                        </View>

                    </ScrollView>

                    {/* NÚT SUBMIT LUỒNG CŨ */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={[styles.submitBtn]} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
                            {isSubmitting ? (
                                <>
                                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                                    <Text style={styles.submitBtnText}>ĐANG XỬ LÝ...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitBtnText}>XÁC NHẬN YÊU CẦU</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ========================================================= */}
            {/* ĐẶT TẤT CẢ CÁC MODAL Ở DƯỚI CÙNG (NGAY TRƯỚC THẺ ĐÓNG ROOT) */}
            {/* ========================================================= */}

            {currentAction !== 'NOIBO_APPROVE' && (
                <>

                    <Modal
                        visible={showCustomerModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setShowCustomerModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '100%', flex: 1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn Khách Hàng</Text>
                                <TouchableOpacity onPress={() => setShowCustomerModal(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.searchBox]}>
                                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                                <TextInput style={{ flex: 1, fontSize: 16 }} placeholderTextColor="#9CA3AF" placeholder="Tìm tên hoặc mã KH..." value={searchCustomer} onChangeText={setSearchCustomer} />
                            </View>

                            {isLoadingCustomers ? (
                                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 30 }} />
                            ) : isCustomerNetworkError ? (
                                /* GIAO DIỆN BÁO LỖI VÀ NÚT THỬ LẠI */
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                                        {/* Icon chéo nhỏ thể hiện đứt mạng */}
                                        <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 2 }}>
                                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                                        </View>
                                    </View>
                                    <Text style={{ textAlign: 'center', color: '#0F172A', fontSize: 18, fontWeight: '700' }}>
                                        Lỗi kết nối
                                    </Text>
                                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, fontSize: 14, lineHeight: 20, paddingHorizontal: 10 }}>
                                        Không thể tải danh sách khách hàng lúc này. Vui lòng kiểm tra lại kết nối Internet của bạn.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={customers}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modernListItem} onPress={() => handleSelectCustomer(item)} activeOpacity={0.7}>
                                            <View style={[styles.modernListIcon, { backgroundColor: '#E0F2FE' }]}>
                                                <Ionicons name="business" size={22} color="#0284C7" />
                                            </View>
                                            <View style={styles.modernListTextContainer}>
                                                <Text style={styles.modernListTitle} numberOfLines={3}>{item.ten_khach_hang}</Text>
                                                <Text style={styles.modernListSubtitle}>Mã KH: <Text style={{ fontWeight: 'bold', color: '#64748B' }}>{item.ma_khach_hang}</Text></Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="people-outline" size={40} color="#CBD5E1" />
                                            <Text style={styles.emptyText}>Không tìm thấy khách hàng nào</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </Modal>

                    {/* 2. MODAL CHỌN HÀNG TRONG KHO */}
                    <Modal
                        visible={showInventoryModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setShowInventoryModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '100%', flex: 1, backgroundColor: '#F8FAFC' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Hàng Hóa Có Sẵn</Text>
                                <TouchableOpacity onPress={() => setShowInventoryModal(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.searchBox]}>
                                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                                <TextInput style={{ flex: 1, fontSize: 16 }} placeholderTextColor="#9CA3AF" placeholder="Tìm theo mã, tên, serial..." value={searchInventory} onChangeText={setSearchInventory} />
                            </View>

                            {isLoadingInventory ? (
                                <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 30 }} />
                            ) : isInventoryNetworkError ? (
                                /* GIAO DIỆN BÁO LỖI VÀ NÚT THỬ LẠI */
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                                        {/* Icon chéo nhỏ thể hiện đứt mạng */}
                                        <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 2 }}>
                                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                                        </View>
                                    </View>
                                    <Text style={{ textAlign: 'center', color: '#0F172A', fontSize: 18, fontWeight: '700' }}>
                                        Lỗi kết nối
                                    </Text>
                                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, fontSize: 14, lineHeight: 20, paddingHorizontal: 10 }}>
                                        Không thể tải danh sách hàng hoá lúc này. Vui lòng kiểm tra lại kết nối Internet của bạn.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredInventoryItems}
                                    keyExtractor={(item, index) => String(item.id || index)}
                                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                                    renderItem={({ item }) => {
                                        // XÁC ĐỊNH XEM DÒNG NÀY CÓ PHẢI LÀ HÀNG VIP KHÔNG
                                        const isVipItem = (currentAction === 'NOIBO_EXPORT' && itemMode.includes('VIP')) ||
                                            (currentAction !== 'NOIBO_EXPORT' && customerMode === 'VIP');

                                        return (
                                            <TouchableOpacity style={styles.modernInventoryCard} onPress={() => handleSelectInventoryItem(item)} activeOpacity={0.7}>
                                                <View style={styles.invCardHeader}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                                                        <Ionicons
                                                            name="cube"
                                                            size={18}
                                                            color={isVipItem ? "#db2777" : "#0284C7"}
                                                            style={{ marginRight: 6 }}
                                                        />
                                                        {/* Tên SP cho hàng thường, Mã Máy cho hàng VIP */}
                                                        <Text style={[styles.invCardTitle, isVipItem && { color: '#db2777' }]} numberOfLines={3}>
                                                            {item.ten_san_pham}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.invCardId}>ID: {item.id}</Text>
                                                </View>

                                                <View style={styles.invCardBody}>
                                                    {/* GIAO DIỆN HIỂN THỊ DÀNH RIÊNG CHO TỪNG LOẠI */}
                                                    {isVipItem ? (
                                                        <>
                                                            <Text style={styles.invDetailText}>
                                                                Mã SP: <Text style={styles.invDetailHighlight}>{item.ma_san_pham && item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '---'}</Text>
                                                            </Text>
                                                            <Text style={styles.invDetailText}>
                                                                Serial: <Text style={{ fontWeight: 'bold', color: '#db2777' }}>{item.serial || '---'}</Text>
                                                            </Text>
                                                            {/* Hiện thêm nhãn MỚI / CŨ nếu đang ở luồng Nội bộ */}
                                                            {item.loai_hien_thi && (
                                                                <Text style={styles.invDetailText}>
                                                                    Phân loại: <Text style={{ fontWeight: 'bold', color: '#0F3D26' }}>{item.loai_hien_thi}</Text>
                                                                </Text>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Text style={styles.invDetailText}>
                                                            Mã SP: <Text style={styles.invDetailHighlight}>{item.ma_san_pham && item.ma_san_pham !== 'N/A' ? item.ma_san_pham : '---'}</Text>
                                                        </Text>
                                                    )}

                                                    {/* THÔNG TIN CHUNG */}
                                                    <Text style={styles.invDetailText}>NV Nhập: <Text style={styles.invDetailHighlight}>{item.nv_nhap_lieu || '---'}</Text></Text>
                                                    <Text style={styles.invDetailText}>Ngày Nhập: <Text style={styles.invDetailHighlight}>{item.ngay_nhap_gan_nhat || '---'}</Text></Text>
                                                </View>

                                                <View style={styles.invCardFooter}>
                                                    <View style={styles.invLocationBadge}>
                                                        <Ionicons name="location" size={12} color="#059669" />
                                                        <Text style={{ fontSize: 11, color: '#059669', marginLeft: 4, fontWeight: 'bold' }}>{item.ma_kho_spl}</Text>
                                                    </View>
                                                    <Text style={styles.invStockBadge}>Tồn kho: {item.ton_kho}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="layers-outline" size={40} color="#CBD5E1" />
                                            <Text style={styles.emptyText}>Không có hàng hóa nào phù hợp</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </Modal>

                    {/* 3. MODAL CHỌN TÀI XẾ (SHIPPER) */}
                    <Modal
                        visible={showShipperModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setShowShipperModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '100%', flex: 1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn Tài Xế</Text>
                                <TouchableOpacity onPress={() => setShowShipperModal(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.searchBox]}>
                                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                                <TextInput style={{ flex: 1, fontSize: 16 }} placeholderTextColor="#9CA3AF" placeholder="Tìm theo tên hoặc biển số..." value={searchShipper} onChangeText={setSearchShipper} />
                            </View>
                            {isLoadingShippers ? (
                                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 30 }} />
                            ) : isShipperNetworkError ? (
                                /* GIAO DIỆN BÁO LỖI VÀ NÚT THỬ LẠI */
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                                        {/* Icon chéo nhỏ thể hiện đứt mạng */}
                                        <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 2 }}>
                                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                                        </View>
                                    </View>
                                    <Text style={{ textAlign: 'center', color: '#0F172A', fontSize: 18, fontWeight: '700' }}>
                                        Lỗi kết nối
                                    </Text>
                                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, fontSize: 14, lineHeight: 20, paddingHorizontal: 10 }}>
                                        Không thể tải danh sách tài xế lúc này. Vui lòng kiểm tra lại kết nối Internet của bạn.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredShippers}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modernListItem} onPress={() => handleSelectShipper(item)} activeOpacity={0.7}>
                                            <View style={[styles.modernListIcon, { backgroundColor: '#FEF3C7' }]}>
                                                <Ionicons name="person" size={22} color="#D97706" />
                                            </View>
                                            <View style={styles.modernListTextContainer}>
                                                <Text style={styles.modernListTitle} numberOfLines={3}>{item.full_name || item.username}</Text>
                                                <Text style={styles.modernListSubtitle}>Biển số xe: <Text style={{ fontWeight: 'bold', color: '#64748B' }}>{item.bien_so_xe || 'Chưa gán xe'}</Text></Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="bicycle-outline" size={40} color="#CBD5E1" />
                                            <Text style={styles.emptyText}>Không tìm thấy tài xế nào</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </Modal>

                    {/* 4. MODAL CHỌN KHO NHẬN TRẢ (LOCATION) */}
                    <Modal
                        visible={showLocationModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setShowLocationModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '100%', flex: 1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn Kho Trả Hàng</Text>
                                <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.searchBox]}>
                                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                                <TextInput style={{ flex: 1, fontSize: 16 }} placeholderTextColor="#9CA3AF" placeholder="Tìm kiếm kho..." value={searchLocation} onChangeText={setSearchLocation} />
                            </View>

                            {isLoadingLocations ? (
                                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 30 }} />
                            ) : isLocationNetworkError ? (
                                /* GIAO DIỆN BÁO LỖI VÀ NÚT THỬ LẠI */
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                                        {/* Icon chéo nhỏ thể hiện đứt mạng */}
                                        <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 2 }}>
                                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                                        </View>
                                    </View>
                                    <Text style={{ textAlign: 'center', color: '#0F172A', fontSize: 18, fontWeight: '700' }}>
                                        Lỗi kết nối
                                    </Text>
                                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, fontSize: 14, lineHeight: 20, paddingHorizontal: 10 }}>
                                        Không thể tải danh sách kho lúc này. Vui lòng kiểm tra lại kết nối Internet của bạn.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredLocations}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.modernListItem} onPress={() => handleSelectLocation(item)} activeOpacity={0.7}>
                                            <View style={[styles.modernListIcon, { backgroundColor: '#ECFDF5' }]}>
                                                <Ionicons name="home" size={22} color="#059669" />
                                            </View>
                                            <View style={styles.modernListTextContainer}>
                                                <Text style={styles.modernListTitle} numberOfLines={3}>{item.ten_kho}</Text>
                                                <Text style={styles.modernListSubtitle}>Mã kho: <Text style={{ fontWeight: 'bold', color: '#64748B' }}>{item.ma_kho}</Text></Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="map-outline" size={40} color="#CBD5E1" />
                                            <Text style={styles.emptyText}>Không tìm thấy kho nào</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </Modal>
                    {/* 6. MODAL CHỌN XE VẬN CHUYỂN (TỐI GIẢN) */}
                    <Modal
                        visible={showVehicleModal}
                        animationType="slide"
                        presentationStyle="pageSheet"
                        onRequestClose={() => setShowVehicleModal(false)}
                    >
                        <View style={[styles.modalContent, { height: '100%', flex: 1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn Biển Số Xe</Text>
                                <TouchableOpacity onPress={() => setShowVehicleModal(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={20} color="#64748b" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={{ flex: 1, fontSize: 16 }}
                                    placeholderTextColor="#9CA3AF"
                                    placeholder="Tìm biển số xe..."
                                    value={searchVehicle}
                                    onChangeText={setSearchVehicle}
                                />
                            </View>

                            {isLoadingVehicles ? (
                                <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
                            ) : isVehicleNetworkError ? (
                                /* GIAO DIỆN BÁO LỖI VÀ NÚT THỬ LẠI */
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Ionicons name="wifi-outline" size={40} color="#94A3B8" />
                                        {/* Icon chéo nhỏ thể hiện đứt mạng */}
                                        <View style={{ position: 'absolute', bottom: 15, right: 15, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 2 }}>
                                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                                        </View>
                                    </View>
                                    <Text style={{ textAlign: 'center', color: '#0F172A', fontSize: 18, fontWeight: '700' }}>
                                        Lỗi kết nối
                                    </Text>
                                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, fontSize: 14, lineHeight: 20, paddingHorizontal: 10 }}>
                                        Không thể tải danh sách biển số xe lúc này. Vui lòng kiểm tra lại kết nối Internet của bạn.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={vehicles}
                                    keyExtractor={(item) => item.bien_so_xe}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.simpleVehicleItem}
                                            onPress={() => handleSelectVehicle(item)}
                                        >
                                            <Ionicons name="car-sport-outline" size={26} color="#10b981" style={{ marginRight: 15 }} />

                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.simplePlateText}>{item.bien_so_xe}</Text>
                                                <Text style={styles.simpleVehicleDesc}>
                                                    {item.mo_ta || 'Xe tải'} • Tải trọng: {item.trong_luong || 0}kg
                                                </Text>
                                            </View>

                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                                <Text style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>Rảnh</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={{ alignItems: 'center', padding: 30 }}>
                                            <Ionicons name="car-outline" size={30} color="#cbd5e1" />
                                            <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 10 }}>
                                                Không tìm thấy xe nào đang rảnh
                                            </Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </Modal>
                    {/* 5. MODAL QUÉT MÃ VẠCH (CAMERA) */}
                    {isScanning && (
                        <View style={styles.fullScreenCameraContainer}>
                            <StatusBar style="light" />

                            {/* Lớp dưới cùng: Camera */}
                            <CameraView
                                style={StyleSheet.absoluteFillObject}
                                facing="back"
                                onBarcodeScanned={handleBarCodeScanned} // Bỏ điều kiện isScanning ở đây vì View này chỉ hiện khi isScanning=true
                                barcodeScannerSettings={{
                                    barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
                                }}
                            />

                            {/* Lớp phủ bên trên (Overlay): Khung ngắm & Mask */}
                            <SafeAreaView style={styles.cameraOverlay} pointerEvents="box-none">

                                {/* Header của Camera - Sử dụng insets để tránh tai thỏ/StatusBar an toàn tuyệt đối */}
                                <View style={[styles.cameraHeader, { paddingTop: Math.max(insets.top, 20) }]}>
                                    <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeCameraBtn}>
                                        <Ionicons name="close" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                    <Text style={styles.cameraTitle}>Quét Mã Vạch</Text>
                                    <View style={{ width: 40 }} />
                                </View>

                                {/* Khu vực khung ngắm trung tâm */}
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

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // --- NỀN & BỐ CỤC CHUNG ---
    container: { flex: 1, backgroundColor: '#F4F6F8' }, // Nền xám nhạt công nghiệp, dịu mắt
    scrollContent: { padding: 20, paddingBottom: 40 },

    // --- HEADER MỚI ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Đẩy nút Back và Placeholder ra 2 biên
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: Platform.OS === 'ios' ? 55 : 35,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 42,
        borderBottomRightRadius: 42,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        zIndex: 10, // Giữ header đè lên shadow của ScrollView
    },
    backBtn: {
        width: 40, // Đặt chiều rộng cố định để dễ bấm
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Platform.OS === 'ios' ? 20 : 16,
        fontWeight: '700',
        color: '#fcfcfc',
        letterSpacing: 0.3,
    },
    headerRightPlaceholder: {
        width: 40, // Rộng bằng nút Back để title căn đúng chính giữa màn hình
    },

    // --- FORM NHẬP LIỆU ---
    formGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    textDanger: { color: '#EF4444' }, // Dấu * màu đỏ tươi

    // Ô input nền trắng, viền xám, khi nhập chữ màu đen
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#111827'
    },
    // Ô input bị khóa (disabled) hiển thị xám mờ để phân biệt rõ ràng
    inputDisabled: {
        backgroundColor: '#F3F4F6',
        color: '#9CA3AF',
        borderColor: '#E5E7EB',
        fontWeight: '500'
    },

    rowInput: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    // Nút quét mã vạch (Điểm nhấn màu)
    scanBtn: {
        backgroundColor: COLORS.primary || '#0284c7', // Dùng màu thương hiệu ở đây
        width: 50, height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },

    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        // Dùng Platform để chừa khoảng trống an toàn cho thanh vuốt Home của iPhone đời mới
        // paddingBottom: Platform.OS === 'ios' ? 14 : 5,
        // Tạo hiệu ứng đổ bóng HƯỚNG LÊN TRÊN để phân tách rõ với ScrollView
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    submitBtn: {
        backgroundColor: COLORS.primary, // Xanh lá cây (Màu tiêu chuẩn cho nút Hoàn thành)
        height: 54, // Chiều cao 54px chuẩn UX cho ngón tay dễ bấm
        flexDirection: 'row',
        borderRadius: 64, // Bo góc 12px hiện đại, không quá tròn cũng không quá vuông
        justifyContent: 'center',
        alignItems: 'center',
        // Đổ bóng màu xanh nhẹ cho nút để tạo cảm giác nổi 3D
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4
    },
    submitBtnDisabled: {
        backgroundColor: '#9CA3AF', // Chuyển xám khi đang loading
        shadowOpacity: 0, // Tắt đổ bóng khi bị disable
        elevation: 0
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5 // Căng khoảng cách chữ nhẹ để dễ đọc hơn
    },

    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 42, borderTopRightRadius: 42,
        padding: 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 15, paddingVertical: 12,
        marginBottom: 15
    },

    // --- ITEM KHÁCH HÀNG & TÀI XẾ ---
    customerItem: { paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    custCode: { color: COLORS.primary || '#0284C7', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
    custName: { color: '#111827', fontSize: 16, fontWeight: '500' },

    // --- THẺ DANH SÁCH HÀNG TỒN KHO ---
    inventoryCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12, marginBottom: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1
    },
    invTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
    invDesc: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
    invMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invMetaText: { fontSize: 12, color: '#4B5563' },
    invAction: { justifyContent: 'center', alignItems: 'flex-end', paddingLeft: 10, borderLeftWidth: 1, borderColor: '#F3F4F6' },

    // Nút "CHỌN" mềm mại nhưng nổi bật
    pickBtn: {
        backgroundColor: '#F0FDF4', // Xanh lá siêu nhạt
        borderWidth: 1, borderColor: '#BBF7D0',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 6
    },
    pickBtnText: { color: '#16A34A', fontSize: 12, fontWeight: 'bold' }, // Chữ xanh lá đậm

    // ==========================================
    // --- STYLES CHO CAMERA QUÉT MÃ VẠCH ---
    // ==========================================
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        zIndex: 10
    },
    cameraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 20,
    },
    closeCameraBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    cameraTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 5,
    },
    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingBottom: 50, // Đẩy khung ngắm lên một chút
        position: 'relative',
    },
    scanHintText: {
        color: 'white',
        marginTop: 20,
        fontSize: 14,
        fontWeight: '500',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.6)', // Thêm nền mờ sau chữ để dễ đọc
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },

    // --- KHUNG NGẮM (SCAN FRAME) ---
    scanFrame: {
        width: 250, // Mã vạch ngang nên khung hình chữ nhật nằm ngang hợp lý hơn
        height: 150,
        zIndex: 10,
        position: 'relative',
    },

    // --- 4 GÓC VUÔNG NHẤN MẠNH ---
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: 'white',
        borderWidth: 4,
        zIndex: 11,
    },
    topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
    topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },

    // --- LỚP PHỦ MỜ (MASK) CHE PHẦN CÒN LẠI ---
    maskBase: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Mờ 70%
        zIndex: 1,
    },
    maskTop: { bottom: '100%', left: -1000, right: -1000, height: 1900 },
    maskBottom: { top: '100%', left: -1000, right: -1000, height: 2000 },
    maskLeft: { right: '100%', top: 0, bottom: 0, width: 1000 },
    maskRight: { left: '100%', top: 0, bottom: 0, width: 1000 },

    // ==========================================
    // --- STYLES CHO CAMERA QUÉT MÃ VẠCH ---
    // ==========================================

    // Thêm class này:
    fullScreenCameraContainer: {
        position: 'absolute', // Đè lên mọi thứ
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 9999, // Z-index cực lớn để đè qua cả header và footer của màn hình hiện tại
        elevation: 9999, // Hỗ trợ Android
    },
    simpleVehicleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9', // Viền ngăn cách xám siêu nhạt
        backgroundColor: '#FFF',
    },
    simplePlateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    simpleVehicleDesc: {
        fontSize: 13,
        color: '#64748B',
    },

    modernListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#FFFFFF',
        padding: 14,
        // borderRadius: 14,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        // shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    modernListIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    modernListTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    modernListTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 3,
    },
    modernListSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
    },
    closeModalBtn: {
        backgroundColor: '#F1F5F9',
        padding: 6,
        borderRadius: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        marginTop: 12,
        fontSize: 15,
        fontWeight: '500'
    },

    // ==========================================
    // UI MỚI CHO MODAL HÀNG TỒN KHO (INVENTORY)
    // ==========================================
    modernInventoryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    invCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    invCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
    },
    invCardId: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    invCardBody: {
        padding: 14,
    },
    invDetailText: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4,
    },
    invDetailHighlight: {
        color: '#0F172A',
        fontWeight: '600',
    },
    invCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    invLocationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    invStockBadge: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0284C7',
    },

    // ==========================================
    // STYLES MỚI CHO GIAO DIỆN PHIẾU LUÂN CHUYỂN
    // ==========================================

    // Style cho Card bọc bên ngoài
    card: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 14,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12
    },

    // Style cho Tab (VIP / THƯỜNG)
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 4,
        marginBottom: 15
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6
    },
    tabBtnActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
    },
    tabText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13
    },
    tabTextActive: {
        color: '#0F172A',
        fontWeight: 'bold'
    },

    // Nút Bấm Action (Quét Mã / Chọn Kho)
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8
    },
    actionBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 13
    },

    // Hiển thị 1 sản phẩm trong Giỏ Hàng
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10
    },
    itemBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center'
    },
    itemBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0284C7'
    },

    // ==========================================
    // CẬP NHẬT LẠI MỘT CHÚT CỦA CAMERA ĐỂ TRÁNH LỖI (NẾU CÓ)
    // ==========================================
    modalWrapper: { flex: 1, backgroundColor: '#FFF', padding: 20 },

    // ==========================================
    // STYLES CHO DETAILED CART ITEM (GIỐNG VUE)
    // ==========================================
    detailedCartCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    cartCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        borderStyle: 'dashed',
        paddingBottom: 10,
        marginBottom: 12
    },
    cartCardIndex: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#475569'
    },
    removeCartBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    removeCartText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 12
    },
    cartLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 4
    }
});