import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "./CustomButton";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../constants/theme";

const toneConfig = {
  danger: {
    color: COLORS.error,
    backgroundColor: COLORS.errorBg,
    iconName: "warning",
  },
  warning: {
    color: COLORS.warningText,
    backgroundColor: COLORS.warningBg,
    iconName: "alert-circle",
  },
  info: {
    color: COLORS.primary,
    backgroundColor: COLORS.secondaryLight,
    iconName: "help-circle",
  },
  success: {
    color: COLORS.successAccent,
    backgroundColor: COLORS.successBg,
    iconName: "checkmark-circle",
  },
};

export default function ConfirmModal({
  visible,
  title,
  description,
  cancelText = "Hủy",
  confirmText = "Đồng ý",
  tone = "danger",
  iconName,
  confirmLoading = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  const config = toneConfig[tone] || toneConfig.danger;
  const actionColor = config.color;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: config.backgroundColor },
            ]}
          >
            <Ionicons
              name={iconName || config.iconName}
              size={32}
              color={actionColor}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          <View style={styles.actions}>
            <CustomButton
              title={cancelText}
              variant="outline"
              style={styles.action}
              onPress={onCancel}
              disabled={confirmLoading}
            />
            <CustomButton
              title={confirmText}
              style={[
                styles.action,
                { backgroundColor: actionColor, borderColor: actionColor },
              ]}
              onPress={onConfirm}
              loading={confirmLoading}
              disabled={confirmDisabled}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.inputWrapperBg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  content: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.md,
  },
  iconWrap: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textMain,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.md,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  action: {
    flex: 1,
  },
});
