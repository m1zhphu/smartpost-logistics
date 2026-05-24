import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY,
} from "../constants/theme";

const AccountantMenuStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  mainHeader: {
    backgroundColor: COLORS.headerBg,
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl + SPACING.md,
    position: "relative",
    overflow: "hidden",
    zIndex: SPACING.xs,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  headerCircleDecoration: {
    position: "absolute",
    top: -SPACING.xl,
    right: -SPACING.xl,
    width: SPACING.xxl * 5,
    height: SPACING.xxl * 5,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSubTitle: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: SPACING.xs / SPACING.xs,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileAvatar: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.secondary,
  },
  avatarText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.subtitle,
    lineHeight: TYPOGRAPHY.lineHeight.subtitle,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  scrollView: {
    flex: 1,
    marginTop: -SPACING.xl,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  statsFloatingCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  divider: {
    width: SPACING.xs / SPACING.xs,
    backgroundColor: COLORS.inputBg,
    marginHorizontal: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statIconWrap: {
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
    letterSpacing: SPACING.xs / SPACING.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.headingSm,
    lineHeight: TYPOGRAPHY.lineHeight.headingSm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statUnit: {
    color: COLORS.textGray,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    letterSpacing: SPACING.xs / SPACING.xs,
    marginBottom: SPACING.md,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  mainCard: {
    width: "48%",
    minHeight: TOUCH_TARGET.androidMin,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: SPACING.xs / SPACING.xs,
    borderColor: COLORS.inputBg,
    ...SHADOWS.sm,
  },
  mainCardIconWrap: {
    width: SPACING.xxl + SPACING.xs,
    height: SPACING.xxl + SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  mainCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  mainCardSub: {
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default AccountantMenuStyles;
