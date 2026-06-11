import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const WHITE = COLORS.white || "#FFFFFF";
const SURFACE = COLORS.surface || "#FFFFFF";
const SURFACE_SOFT = COLORS.surfaceSoft || "#F8FAFC";
const SUCCESS_SOFT = "#F0FDF4";
const SUCCESS_BORDER = "#DCFCE7";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted || "#F3F4F6",
  },
  keyboardRoot: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: PRIMARY,
    ...Platform.select({
      ios: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  stepIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: SUCCESS_SOFT,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SUCCESS_BORDER,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textSecondary || "#475569",
    marginBottom: 20,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
  },
  instructionBold: {
    fontWeight: "900",
    color: COLORS.textPrimary || "#0F172A",
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary || "#475569",
    marginBottom: 8,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE_SOFT,
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 0,
    fontSize: 15,
    color: COLORS.textPrimary || "#0F172A",
    fontWeight: "600",
  },
  eyeIcon: {
    width: 46,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    borderRadius: 12,
    marginTop: 10,
    minHeight: 52,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "900",
  },
  resendBtn: {
    alignItems: "center",
    marginTop: 20,
  },
  resendText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 15,
  },
});
