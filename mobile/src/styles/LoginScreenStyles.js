import { StyleSheet, Dimensions, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");
const PRIMARY = COLORS.primaryColorAuth || "#1B5E20";

const LoginScreenStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  topSpacer: {
    height: Platform.OS === "ios" ? 80 : 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoImage: {
    width: width * 0.75,
    height: 80,
  },
  formSection: {
    width: "100%",
    alignItems: "center",
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primaryColorAuth,
    marginBottom: 24,
  },
  loginBtn: {
    width: "100%",
    marginTop: 12,
  },
  registerRow: {
    flexDirection: "row",
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  registerTextNormal: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  registerTextBold: {
    color: COLORS.primaryColorAuth,
    fontWeight: "800",
    fontSize: 14,
  },
  footerLogosContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    marginTop: 40,
  },
  footerImage: {
    width: width * 0.35,
    height: 40,
  },
  footerDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalKeyboardWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBtnContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },

  // From localStyles
  keyboardAvoidingRoot: {
    flex: 1,
  },
  toggleContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
    width: "100%",
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#F1F5F9",
  },
  toggleText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: PRIMARY,
    fontWeight: "900",
  },
  inputWrapper: {
    minHeight: 56,
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  icon: {
    marginLeft: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 56,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
    paddingRight: 12,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: 96,
    paddingTop: 16,
    paddingBottom: 14,
  },
  eyeIcon: {
    width: 48,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  otpInput: {
    height: 60,
    width: "100%",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 8,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalCancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 15,
  },
  modalSubmitBtn: {
    backgroundColor: PRIMARY,
    justifyContent: "center",
  },
  modalSubmitText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
});

export default LoginScreenStyles;
