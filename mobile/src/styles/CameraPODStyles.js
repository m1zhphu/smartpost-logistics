import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../constants/theme";

const CameraPODStyles = StyleSheet.create({
  rootCameraBg: {
    flex: 1,
    backgroundColor: COLORS.neutralDark,
  },
  cameraFill: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSoft,
    paddingHorizontal: SPACING.xl,
  },

  authIconWrap: {
    width: SPACING.xxl + SPACING.xl,
    height: SPACING.xxl + SPACING.xl,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  authText: {
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: SPACING.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  authBtn: {
    minWidth: SPACING.xxl * 3,
  },

  topSafeArea: {
    zIndex: SPACING.sm,
  },
  topActions: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    width: SPACING.xxl - SPACING.sm,
    height: SPACING.xxl - SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.inputWrapperBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.inputBorderColor,
  },
  modeCenterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  modeCenterText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    backgroundColor: COLORS.inputWrapperBg,
    paddingHorizontal: SPACING.md_sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  rightControlsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: "84%",
    height: "58%",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: SPACING.xl,
    height: SPACING.xl,
    borderColor: COLORS.secondary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: SPACING.xs,
    borderLeftWidth: SPACING.xs,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: SPACING.xs,
    borderRightWidth: SPACING.xs,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: SPACING.xs,
    borderLeftWidth: SPACING.xs,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: SPACING.xs,
    borderRightWidth: SPACING.xs,
  },
  guideText: {
    marginTop: SPACING.lg,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.bodySm,
    lineHeight: TYPOGRAPHY.lineHeight.bodySm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    backgroundColor: COLORS.inputWrapperBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md_sm,
    borderRadius: BORDER_RADIUS.round,
    overflow: "hidden",
  },

  bottomActionsSafeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomActions: {
    alignItems: "center",
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  captureBtn: {
    width: SPACING.xxl + SPACING.lg,
    height: SPACING.xxl + SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.inputWrapperBg,
    borderWidth: SPACING.xs,
    borderColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.md,
  },
  captureInner: {
    width: SPACING.xxl + SPACING.md,
    height: SPACING.xxl + SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.white,
  },

  previewContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: COLORS.neutralDark,
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  watermark: {
    position: "absolute",
    left: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: COLORS.inputWrapperBg,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md_sm,
    paddingVertical: SPACING.md_sm,
  },
  watermarkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  watermarkRowNoMargin: {
    flexDirection: "row",
    alignItems: "center",
  },
  watermarkIcon: {
    marginRight: SPACING.sm,
  },
  watermarkText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.caption,
    lineHeight: TYPOGRAPHY.lineHeight.caption,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  previewActionsSafeArea: {
    backgroundColor: COLORS.neutralDark,
  },
  previewActions: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  previewButton: {
    flex: 1,
  },
});

export default CameraPODStyles;
