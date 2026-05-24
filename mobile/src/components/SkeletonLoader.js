import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
import { BORDER_RADIUS } from "../constants/theme";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const SkeletonLoader = ({
  width = "100%",
  height = 16,
  borderRadius = BORDER_RADIUS.md,
  style,
}) => {
  const shimmerTranslate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerTranslate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [shimmerTranslate]);

  const shimmerStyle = {
    transform: [
      {
        translateX: shimmerTranslate.interpolate({
          inputRange: [-1, 1],
          outputRange: [-220, 220],
        }),
      },
    ],
  };

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <AnimatedGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.shimmer, shimmerStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: COLORS.inputBg,
  },
  shimmer: {
    width: "45%",
    height: "100%",
  },
});

export default SkeletonLoader;
