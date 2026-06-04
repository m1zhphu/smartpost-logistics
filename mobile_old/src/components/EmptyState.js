import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const EmptyState = ({ icon, title, message, actionButton }) => {
  const renderActionButton = () => {
    if (!actionButton || !actionButton.label || !actionButton.onPress) {
      return null;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={actionButton.onPress}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaText}>{actionButton.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={icon || "inbox-outline"}
          size={88}
          color={COLORS.textMuted}
        />
      </View>

      <Text style={styles.title}>{title || "No data yet"}</Text>

      <Text style={styles.message}>
        {message || "Data will appear here when new information is available."}
      </Text>

      {renderActionButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.backgroundSoft,
  },
  title: {
    color: COLORS.textMain,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  message: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    textAlign: "center",
    maxWidth: 320,
  },
  ctaButton: {
    marginTop: SPACING.lg,
    minHeight: TOUCH_TARGET.androidMin,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default EmptyState;
