import { StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { BORDER_RADIUS, SPACING, TOUCH_TARGET } from "../constants/theme";

const ScanTaskStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutralDark, position: "relative" },
  backBtn: {
    position: "absolute",
    top: SPACING.xl,
    left: SPACING.md,
    width: TOUCH_TARGET.androidMin,
    height: TOUCH_TARGET.androidMin,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.inputWrapperBg,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});

export default ScanTaskStyles;
