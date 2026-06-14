import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

const ChangePasswordScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    zIndex: 10,
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSubTitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  headerRightPlaceholder: {
    width: 38,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardIconBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  cardDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },

  formGroup: {
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "800",
    marginBottom: 7,
  },

  inputWrapper: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "600",
  },

  eyeIcon: {
    width: 48,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 2,
  },

  noteText: {
    flex: 1,
    marginLeft: 8,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  saveBtn: {
    backgroundColor: PRIMARY,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  saveBtnDisabled: {
    opacity: 0.7,
  },

  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
});

export default ChangePasswordScreenStyles;
