import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

const ShipperCreateBillStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  contentWrapper: {
    flex: 1,
    padding: 16,
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  permissionText: {
    fontSize: 16,
    color: "#475569",
    marginVertical: 15,
    fontWeight: "700",
  },

  btnPermission: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  btnPermissionText: {
    color: "white",
    fontWeight: "900",
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
    shadowColor: "#ebebeb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },

  headerRightPlaceholder: {
    width: 38,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },

  activeTab: {
    borderBottomColor: "white",
  },

  tabText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "800",
    fontSize: 14,
  },

  activeTabText: {
    color: "white",
    fontWeight: "900",
  },

  cameraContainer: {
    height: 250,
    backgroundColor: "black",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },

  camera: {
    flex: 1,
  },

  cameraOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scanTarget: {
    width: 250,
    height: 100,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 8,
  },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  processingText: {
    color: "white",
    marginTop: 10,
    fontWeight: "700",
  },

  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  inputRow: {
    flexDirection: "row",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontWeight: "600",
  },

  scanBtn: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
  },

  scanBtnText: {
    color: "white",
    fontWeight: "900",
    marginLeft: 6,
  },

  listCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#64748B",
    textAlign: "center",
    fontWeight: "600",
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  listIndex: {
    backgroundColor: "#EF4444",
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  listIndexText: {
    color: "white",
    fontWeight: "900",
    fontSize: 11,
  },

  listCode: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  removeButton: {
    padding: 4,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  secondaryBtnText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 15,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 15,
  },
});

export default ShipperCreateBillStyles;
