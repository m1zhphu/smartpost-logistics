import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../constants/theme";

const CreateOrderStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  backButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
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
  headerRightPlaceholder: {
    width: SPACING.xxl,
    height: SPACING.xxl,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    textTransform: "uppercase",
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  fieldGroup: {
    gap: SPACING.sm,
  },
  strongInputText: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  multilineWrapper: {
    alignItems: "flex-start",
  },
  multilineInput: {
    minHeight: SPACING.xxl,
    textAlignVertical: "top",
  },
  bottomDock: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
});

export default CreateOrderStyles;
