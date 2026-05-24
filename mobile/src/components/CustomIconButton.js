import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BORDER_RADIUS } from "../constants/theme";

const CustomIconButton = ({
  onPress,
  icon,
  size = 40,
  hitSlop = { top: 12, bottom: 12, left: 12, right: 12 },
  disabled = false,
  style,
  contentStyle,
  accessibilityLabel,
  accessibilityRole = "button",
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{icon}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CustomIconButton;
