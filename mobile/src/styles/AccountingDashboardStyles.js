import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../constants/theme";

const AccountingDashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  headerArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === "ios" ? SPACING.xxl + SPACING.sm : SPACING.xl + SPACING.sm,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.headerBg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  loadingWrap: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.headingLg,
    lineHeight: TYPOGRAPHY.lineHeight.headingLg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  actionCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  actionContent: {
    width: "100%",
    justifyContent: "space-between",
  },
});

export default AccountingDashboardStyles;
