import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const HomeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    zIndex: 10,
  },

  headerTextGroup: {
    flex: 1,
  },

  greeting: {
    fontSize: Platform.OS === "ios" ? 14 : 11,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },

  userName: {
    fontSize: Platform.OS === "ios" ? 18 : 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 8,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  roleText: {
    fontSize: Platform.OS === "ios" ? 13 : 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  appleCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  menuButtonSpacing: {
    marginLeft: 12,
  },

  appleBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  appleBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  content: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },

  rowWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  gridCard: {
    width: "48%",
    minHeight: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 14,
  },

  cardBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  gridIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  gridCardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 20,
  },

  gridCardDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "600",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "ios" ? 96 : 76,
    paddingRight: 16,
  },

  dropdownMenu: {
    width: 230,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuText: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },

  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  logoutMenuIconBox: {
    backgroundColor: "#FEF2F2",
  },

  logoutMenuText: {
    color: "#EF4444",
    fontWeight: "700",
  },
});

export default HomeScreenStyles;
