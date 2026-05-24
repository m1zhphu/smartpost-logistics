import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const getVariantStyles = (variant, disabled) => {
  if (disabled) {
    return {
      container: {
        backgroundColor: COLORS.inputBg,
        borderColor: COLORS.borderLight,
      },
      text: {
        color: COLORS.textMuted,
      },
      indicator: COLORS.textMuted,
    };
  }

  if (variant === "secondary") {
    return {
      container: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary,
      },
      text: {
        color: COLORS.white,
      },
      indicator: COLORS.white,
    };
  }

  if (variant === "outline") {
    return {
      container: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary,
      },
      text: {
        color: COLORS.primary,
      },
      indicator: COLORS.primary,
    };
  }

  return {
    container: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    text: {
      color: COLORS.white,
    },
    indicator: COLORS.white,
  };
};

const renderIconNode = (icon, color) => {
  if (!icon) {
    return null;
  }

  if (typeof icon === "function") {
    return icon({ color });
  }

  return icon;
};

const CustomButton = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  contentStyle,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(variant, isDisabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles.container,
        style,
        pressed && !isDisabled ? styles.pressed : null,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.indicator} size="small" />
      ) : (
        <View style={[styles.content, contentStyle]}>
          {leftIcon ? (
            <View style={styles.iconLeft}>{renderIconNode(leftIcon, variantStyles.text.color)}</View>
          ) : null}

          <Text style={[styles.title, variantStyles.text, textStyle]} numberOfLines={1}>
            {title}
          </Text>

          {rightIcon ? (
            <View style={styles.iconRight}>{renderIconNode(rightIcon, variantStyles.text.color)}</View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRight: {
    marginLeft: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default CustomButton;
