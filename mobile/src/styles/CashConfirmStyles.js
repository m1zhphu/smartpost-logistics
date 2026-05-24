import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const CashConfirmStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  headerArea: {
    backgroundColor: COLORS.headerBg,
    paddingTop: Platform.OS === "ios" ? SPACING.xxl : SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  headerCircleDecoration: {
    position: "absolute",
    top: -SPACING.lg,
    right: -SPACING.xl,
    width: SPACING.xxl * 3,
    height: SPACING.xxl * 3,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
  },
  backBtn: {
    width: TOUCH_TARGET.iosMin,
    height: TOUCH_TARGET.iosMin,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.inputWrapperBg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerSpacer: {
    width: TOUCH_TARGET.iosMin,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
    marginTop: -SPACING.lg,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: SPACING.md_sm,
    marginBottom: SPACING.md_sm,
    borderBottomWidth: SPACING.xs / SPACING.xs,
    borderBottomColor: COLORS.borderLight,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.sm,
  },
  avatar: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.secondaryLight,
  },
  shipperInfo: {
    marginLeft: SPACING.md_sm,
    flex: 1,
  },
  shipperName: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  shipperSub: {
    marginTop: SPACING.xs,
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  badgeCount: {
    minHeight: TOUCH_TARGET.androidMin,
    paddingHorizontal: SPACING.md_sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  cardBody: {
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  codAmountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  codAmount: {
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  codCurrency: {
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  outlineButton: {
    flex: 1,
    minHeight: TOUCH_TARGET.androidMin,
  },
  confirmButton: {
    flex: 1,
    minHeight: TOUCH_TARGET.androidMin,
  },
});

export default CashConfirmStyles;
