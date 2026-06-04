import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const WarehouseMenuStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  mainHeader: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hubInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  hubIconWrap: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  hubName: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  headerSubTitle: {
    color: COLORS.greenSubtleText,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.heading,
    lineHeight: TYPOGRAPHY.lineHeight.heading,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  statLabel: {
    color: COLORS.greenSubtleText,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statUnit: {
    color: COLORS.greenSubtleText,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.neutralDark,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: "uppercase",
  },
  mainGridRow: {
    gap: SPACING.md,
  },
  mainGridItem: {
    width: "48%",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  mainCardButton: {
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  mainCardContent: {
    justifyContent: "flex-start",
    width: "100%",
  },
  mainCardSub: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  footerContainer: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  otherList: {
    gap: SPACING.sm,
  },
  otherItemButton: {
    minHeight: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.sm,
  },
  otherItemContent: {
    justifyContent: "space-between",
    width: "100%",
  },
});

export default WarehouseMenuStyles;
