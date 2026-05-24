import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { BORDER_RADIUS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../constants/theme";

const OrderDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  header: {
    backgroundColor: COLORS.headerBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerBtn: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  heroLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: "uppercase",
  },
  trackingNumber: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  timelineTitle: {
    color: COLORS.secondary,
  },
  sectionBody: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  infoLabel: {
    width: SPACING.xxl,
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  infoValue: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  homeBtn: {
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.sm,
  },
  homeBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.body,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  skeletonWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  skeletonSpacingSm: {
    marginTop: SPACING.sm,
  },
  skeletonSpacingMd: {
    marginTop: SPACING.md,
  },
});

export default OrderDetailStyles;
