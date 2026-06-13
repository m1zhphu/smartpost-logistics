import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext";
import { COLORS } from "../constants/colors";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");
const PRIMARY = COLORS.primary || "#1B5E20";

const slides = [
  {
    title: "👋 Chào mừng bạn!",
    text: "Cảm ơn bạn đã sử dụng ứng dụng. Hãy cùng xem qua một vài mẹo nhỏ để quét mã vận đơn nhanh và chính xác nhất nhé!",
    image: require("../../assets/icon.png"),
  },
  {
    title: "Chụp vuông góc xuống",
    text: "Căn mã vận đơn nằm gọn vào trong khung ảnh",
    image: require("../../assets/HuongDan1.png"),
  },
  {
    title: "Ưu tiên chụp ảnh ngang",
    text: "Xoay ngang điện thoại giúp lấy trọn mã vận đơn, quét nhanh và chính xác hơn.",
    image: require("../../assets/HuongDan2.png"),
  },
  {
    title: "Bật thông báo",
    text: "Ứng dụng cần gửi thông báo để bạn nhận được trạng thái duyệt đơn hàng từ trưởng kho.",
    image: require("../../assets/HuongDan3.png"),
  },
];

export default function TutorialScreen({ navigation, route }) {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef(null);
  const username = route.params?.username;

  const { isWarehouseStaff, promptForPushPermission } = useUser();

  const finishTutorial = async () => {
    try {
      await AsyncStorage.setItem("tutorial_done", "true");

      if (isWarehouseStaff()) {
        navigation.replace("WarehouseHome", { username: username });
      } else {
        navigation.replace("Home", { username: username });
      }
    } catch (error) {
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
    // Ảnh số 2, 3, 4 (chỉ số 1, 2, 3) có viền
    const isBorderSlide = index === 1 || index === 2 || index === 3;

    return (
      <View style={styles.slideContainer}>
        <Image
          source={item.image}
          style={[
            styles.slideImage,
            {
              height: isBorderSlide ? width * 0.55 : width * 0.8,
              resizeMode: isBorderSlide ? "cover" : "contain",
              borderWidth: isBorderSlide ? 2 : 0,
              borderColor: PRIMARY,
            },
          ]}
        />
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
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

      <View style={styles.bottomSection}>
        <View style={styles.paginationContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: index === i ? 24 : 10,
                  backgroundColor: index === i ? PRIMARY : "#CBD5E1",
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={next}
          style={styles.primaryBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
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

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  slideContainer: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  slideImage: {
    width: width * 0.8,
    borderRadius: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 40,
    textAlign: "center",
  },
  slideText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 24,
    paddingHorizontal: 10,
  },

  bottomSection: {
    paddingBottom: 40,
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    marginBottom: 30,
    justifyContent: "center",
  },
  dot: {
    height: 10,
    marginHorizontal: 6,
    borderRadius: 5,
  },

  primaryBtn: {
    backgroundColor: PRIMARY,
    height: 54,
    borderRadius: 27,
    width: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
