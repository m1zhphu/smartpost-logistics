import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const WaybillListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  headerArea: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    minHeight: TOUCH_TARGET.androidMin,
    minWidth: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  searchInputWrap: {
    flex: 1,
  },
  filterButton: {
    minWidth: TOUCH_TARGET.androidMin,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  listContent: {
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  waybillCode: {
    flex: 1,
    color: COLORS.neutralDark,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successBg,
  },
  badgeSuccessText: {
    color: COLORS.successAccent,
  },
  badgeWarning: {
    backgroundColor: COLORS.warningBg,
  },
  badgeWarningText: {
    color: COLORS.warningText,
  },
  badgeDanger: {
    backgroundColor: COLORS.dangerAccentBg,
  },
  badgeDangerText: {
    color: COLORS.dangerAccent,
  },
  customerText: {
    color: COLORS.textMain,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
  },
  typeBadgeWrap: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  typeBadgeText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  codText: {
    color: COLORS.amberAccentText,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  menuButton: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    minHeight: TOUCH_TARGET.androidMin,
    minWidth: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonContainer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  fabWrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  fabSafe: {
    backgroundColor: COLORS.backgroundSoft,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.inputWrapperBg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: COLORS.neutralDark,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalScroll: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  label: {
    color: COLORS.neutralDark,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  optionGroup: {
    gap: SPACING.sm,
  },
  optionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  filterChip: {
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundSoft,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  actionList: {
    gap: SPACING.sm,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
  dangerButtonBorder: {
    borderColor: COLORS.error,
  },
  detailBox: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundSoft,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  detailText: {
    color: COLORS.neutralDark,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  weightActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  weightActionItem: {
    flex: 1,
  },
});

export default WaybillListStyles;
