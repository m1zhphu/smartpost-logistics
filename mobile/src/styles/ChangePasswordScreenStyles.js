import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft || "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
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
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white || "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    backgroundColor: COLORS.surface || "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary || "#475569",
    marginBottom: 8,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft || "#F8FAFC",
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
    borderRadius: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 15,
    color: COLORS.textPrimary || "#0F172A",
    fontWeight: "700",
  },
  eyeIcon: {
    padding: 14,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface || "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft || "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: COLORS.white || "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
