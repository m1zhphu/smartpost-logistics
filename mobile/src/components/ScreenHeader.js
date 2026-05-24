import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const ScreenHeader = ({ navigation, options, route, back }) => {
  const title =
    options?.headerTitle ?? options?.title ?? route?.name ?? "";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.sideSlot}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={SPACING.xs}
              onPress={navigation.goBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed ? styles.backButtonPressed : null,
              ]}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={20}
                color={COLORS.textMain}
              />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <View style={styles.sideSlot} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
  },
  container: {
    minHeight: TOUCH_TARGET.androidMin + SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sideSlot: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  backButtonPlaceholder: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: COLORS.neutralDark,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    paddingHorizontal: SPACING.sm,
  },
});

export default ScreenHeader;
