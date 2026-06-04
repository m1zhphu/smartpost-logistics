import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// THÊM import SafeAreaView từ thư viện mới
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get("window");

const slides = [
    {
        title: "👋 Chào mừng bạn!",
        text: "Cảm ơn bạn đã sử dụng ứng dụng. Hãy cùng xem qua một vài mẹo nhỏ để quét mã vận đơn nhanh và chính xác nhất nhé!",
        image: require('../../assets/icon.png'),
    },
    {
        title: "Chụp vuông góc xuống",
        text: "Căn mã vận đơn nằm gọn vào trong khung ảnh",
        image: require('../../assets/HuongDan1.png'),
    },
    {
        title: "Ưu tiên chụp ảnh ngang",
        text: "Xoay ngang điện thoại giúp lấy trọn mã vận đơn, quét nhanh và chính xác hơn.",
        image: require('../../assets/HuongDan2.png'),
    },
    {
        title: "Bật thông báo",
        text: "Ứng dụng cần gửi thông báo để bạn nhận được trạng thái duyệt đơn hàng từ trưởng kho.",
        image: require('../../assets/HuongDan3.png'),
    },
];

export default function TutorialScreen({ navigation, route }) {
    const [index, setIndex] = useState(0);
    const flatListRef = useRef(null);
    const username = route.params?.username;

    const { isWarehouseStaff, promptForPushPermission } = useUser();

    const finishTutorial = async () => {
        try {
            await AsyncStorage.setItem('tutorial_done', 'true');

            // ---> LOGIC ĐÃ ĐƯỢC ĐƠN GIẢN HÓA <---
            if (isWarehouseStaff()) {
                // Có quyền vào kho
                navigation.replace("WarehouseHome", { username: username });
            } else {
                // Không có quyền vào kho -> Đẩy ra màn giao hàng
                navigation.replace("Home", { username: username });
            }

        } catch (error) {
            // console.log("Lỗi khi lưu trạng thái hướng dẫn:", error);
            navigation.replace("Home", { username: username });
        }
    };

    const next = async () => {
        if (index === slides.length - 1) {
            await promptForPushPermission();
            finishTutorial();
        } else {
            flatListRef.current.scrollToIndex({ index: index + 1 });
            setIndex(index + 1);
        }
    };

    const updateIndexOnSwipe = (e) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        setIndex(currentIndex);
    };

    const renderItem = ({ item, index }) => {
        // Xác định xem đây có phải là ảnh 2 (index 1) hoặc ảnh 3 (index 2) không
        const isBorderSlide = index === 1 || index === 2 || index === 3;

        return (
            <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
                <Image
                    source={item.image}
                    style={{
                        width: width * 0.8,
                        // Nếu là ảnh có viền (ảnh ngang), bóp chiều cao lại thành hình chữ nhật (0.55)
                        // Nếu là ảnh đầu tiên (icon vuông), giữ nguyên chiều cao (0.8)
                        height: isBorderSlide ? width * 0.55 : width * 0.8,

                        // Dùng 'cover' để ảnh tràn lấp đầy toàn bộ viền, không bị hở khoảng trắng
                        resizeMode: isBorderSlide ? "cover" : "contain",

                        borderWidth: isBorderSlide ? 2 : 0,
                        borderColor: '#0f3d26',
                        borderRadius: 12,
                    }}
                />
                <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 30, textAlign: "center" }}>
                    {item.title}
                </Text>
                <Text style={{ fontSize: 16, color: "#666", marginTop: 10, textAlign: "center" }}>
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <View style={{ flex: 1 }}>
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    onMomentumScrollEnd={updateIndexOnSwipe}
                />
            </View>

            <View style={{ paddingBottom: 40, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', marginBottom: 30, justifyContent: 'center' }}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                height: 10,
                                width: index === i ? 24 : 10,
                                backgroundColor: index === i ? "#0f3d26" : "#d3d3d3",
                                marginHorizontal: 6,
                                borderRadius: 5,
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={next}
                    style={{
                        backgroundColor: "#0f3d26",
                        paddingHorizontal: 40,
                        paddingVertical: 14,
                        borderRadius: 30,
                        width: width * 0.8,
                        alignItems: "center"
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                        {index === 0
                            ? "Xem mẹo nhỏ"
                            : index === slides.length - 1
                                ? "Bắt đầu ngay"
                                : "Tiếp theo"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}