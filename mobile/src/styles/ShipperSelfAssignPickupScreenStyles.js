import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

const ShipperSelfAssignPickupScreenStyles = StyleSheet.create({
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
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  searchPlaceholder: {
    color: "white",
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },

  barcodeIcon: {
    marginLeft: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "rgba(241,245,249,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },

  listContent: {
    padding: 16,
    paddingBottom: 140,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },

  cardSelected: {
    borderColor: PRIMARY,
    backgroundColor: "#F0FDF4",
  },

  cardHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  checkboxContainer: {
    marginRight: 12,
  },

  codeContainer: {
    flex: 1,
  },

  labelCode: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  valueCode: {
    fontSize: 15,
    fontWeight: "900",
    color: PRIMARY,
    marginTop: 2,
  },

  cardBody: {
    padding: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
    justifyContent: "center",
  },

  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
    fontWeight: "700",
  },

  infoValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },

  selectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  selectionText: {
    fontWeight: "900",
    color: PRIMARY,
    fontSize: 13,
  },

  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  secondaryBtnText: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 13,
  },

  primaryBtn: {
    flex: 1.5,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnDisabled: {
    opacity: 0.6,
  },

  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },
});

export default ShipperSelfAssignPickupScreenStyles;
