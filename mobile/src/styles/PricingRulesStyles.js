import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { BORDER_RADIUS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../constants/theme";

const PricingRulesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  flex: {
    flex: 1,
  },
  headerArea: {
    backgroundColor: COLORS.headerBg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
  },
  backBtn: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerRightPlaceholder: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
  },
  bodyWrap: {
    flex: 1,
    marginTop: -SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  listHeaderWrap: {
    gap: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  noticeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  noticeText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  tabActive: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: TOUCH_TARGET.androidMin,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  serviceCode: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  serviceBadge: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  serviceBadgeText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  priceText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statusBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  statusActive: {
    backgroundColor: COLORS.successBg,
  },
  statusInactive: {
    backgroundColor: COLORS.errorBg,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusTextActive: {
    color: COLORS.successAccent,
  },
  statusTextInactive: {
    color: COLORS.error,
  },
  actionGroup: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  actionButton: {
    minWidth: TOUCH_TARGET.androidMin,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonSpacing: {
    marginTop: SPACING.sm,
  },
  fab: {
    position: "absolute",
    right: SPACING.md,
    bottom: SPACING.xl,
    width: TOUCH_TARGET.androidMin + SPACING.sm,
    height: TOUCH_TARGET.androidMin + SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.inputWrapperBg,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  formContent: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  col: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  optionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  optionBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  optionBtnActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  optionBtnText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  optionBtnTextActive: {
    color: COLORS.white,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  switchLabel: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default PricingRulesStyles;
