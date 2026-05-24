import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const renderIconNode = (icon, color) => {
  if (!icon) {
    return null;
  }

  if (typeof icon === "function") {
    return icon({ color });
  }

  return icon;
};

const CustomInput = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  labelStyle,
  inputWrapperStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = useMemo(() => {
    if (error) {
      return COLORS.error;
    }

    if (isFocused) {
      return COLORS.primary;
    }

    return COLORS.borderLight;
  }, [error, isFocused]);

  const handleFocus = (event) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}

      <View style={[styles.inputWrapper, { borderColor }, inputWrapperStyle]}>
        {leftIcon ? <View style={styles.leftIcon}>{renderIconNode(leftIcon, COLORS.textMuted)}</View> : null}

        <TextInput
          {...rest}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.textGray}
          style={[styles.input, inputStyle]}
        />

        {rightIcon ? <View style={styles.rightIcon}>{renderIconNode(rightIcon, COLORS.textMuted)}</View> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: SPACING.xs,
    color: COLORS.textMain,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  inputWrapper: {
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    paddingVertical: SPACING.sm,
  },
  leftIcon: {
    marginRight: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rightIcon: {
    marginLeft: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: SPACING.xs,
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
});

export default CustomInput;
