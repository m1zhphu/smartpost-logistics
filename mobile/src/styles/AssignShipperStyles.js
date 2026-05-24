import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const AssignShipperStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutralDark,
  },
  scannerWrapper: {
    flex: 0.45,
    position: "relative",
  },

  camHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? SPACING.xxl : SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: TOUCH_TARGET.iosMin,
    height: TOUCH_TARGET.iosMin,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.inputWrapperBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.inputBorderColor,
  },
  liveBadge: {
    minHeight: TOUCH_TARGET.androidMin,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md_sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  liveBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: SPACING.xs / SPACING.xs,
  },

  bottomSheet: {
    flex: 0.55,
    backgroundColor: COLORS.backgroundSoft,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    paddingBottom: SPACING.xs,
  },

  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subTitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.md,
  },

  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  radioOption: {
    flex: 1,
    minHeight: TOUCH_TARGET.androidMin,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md_sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.inputBorderColor,
    ...SHADOWS.sm,
  },
  radioOptionActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  radioCircle: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  radioCircleSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  radioLabel: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  searchInputContainer: {
    marginBottom: SPACING.md,
  },
  shipperListContent: {
    gap: SPACING.md,
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  shipperItem: {
    minHeight: TOUCH_TARGET.androidMin,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.inputBorderColor,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md_sm,
    ...SHADOWS.sm,
  },
  shipperItemActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  shipperAvatar: {
    width: TOUCH_TARGET.iosMin,
    height: TOUCH_TARGET.iosMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md_sm,
  },
  shipperInfo: {
    flex: 1,
  },
  shipperName: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  shipperPhone: {
    marginTop: SPACING.xs,
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  pickerWrap: {
    minHeight: TOUCH_TARGET.androidMin,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.inputBorderColor,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  listTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  badgeCount: {
    minHeight: TOUCH_TARGET.androidMin,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.md_sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
  },
  badgeCountText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  listContent: {
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  pickupCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.inputBorderColor,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  pickupCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  pickupCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: SPACING.xl,
    height: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md_sm,
  },
  pickupCardContent: {
    flex: 1,
  },
  pickupTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
  },
  pickupMeta: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    marginBottom: SPACING.sm,
  },
  pickupInfoRow: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickupInfoLabel: {
    color: COLORS.textGray,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  pickupInfoValue: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.backgroundSoft,
    borderTopWidth: SPACING.xs / SPACING.xs,
    borderTopColor: COLORS.inputBorderColor,
  },
  footerSafe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backgroundSoft,
  },
});

export default AssignShipperStyles;
