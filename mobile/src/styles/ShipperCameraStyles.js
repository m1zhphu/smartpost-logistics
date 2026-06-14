import { StyleSheet, Dimensions, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const { width } = Dimensions.get("window");

const ShipperCameraStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  flex1: {
    flex: 1,
  },

  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  permissionText: {
    marginTop: 10,
    color: "#666",
    marginBottom: 20,
  },

  btnPermission: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  btnPermissionText: {
    color: "white",
    fontWeight: "bold",
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 10,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },

  headerBackGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    zIndex: 20,
  },

  headerIconButton: {
    padding: 8,
    paddingHorizontal: 12,
  },

  headerVerticalDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  listButton: {
    flexDirection: "row",
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },

  ocrConfigButton: {
    zIndex: 20,
    marginRight: 8,
  },

  ocrConfigButtonActive: {
    backgroundColor: COLORS.primary,
  },

  ocrConfigButtonInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  configIcon: {
    marginRight: 4,
  },

  configButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },

  queueButton: {
    zIndex: 20,
  },

  queueButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  badge: {
    backgroundColor: "#a5d6a7",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  focusIndicator: {
    position: "absolute",
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "transparent",
    zIndex: 10,
  },

  scanFrameContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingBottom: 100,
    position: "relative",
  },

  scanFrame: {
    width: width * 0.8,
    height: width * 1.2,
    zIndex: 10,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#fff",
    borderWidth: 5,
    zIndex: 11,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },

  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  maskBase: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 1,
  },

  maskTop: {
    bottom: "100%",
    left: -1000,
    right: -1000,
    height: 1900,
  },

  maskBottom: {
    top: "100%",
    left: -1000,
    right: -1000,
    height: 2000,
  },

  maskLeft: {
    right: "100%",
    top: 0,
    bottom: 0,
    width: 1000,
  },

  maskRight: {
    left: "100%",
    top: 0,
    bottom: 0,
    width: 1000,
  },

  scanHintText: {
    color: "white",
    marginTop: 15,
    padding: 8,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 13,
    zIndex: 10,
  },

  captureFloatingContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    zIndex: 20,
  },

  shutterBtnOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  shutterBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
  },

  disabledOpacity: {
    opacity: 0.5,
  },

  cancelScanButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },

  cancelScanButtonText: {
    color: "#333",
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    padding: 20,
  },

  menuContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignSelf: "center",
    elevation: 2,
  },

  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  menuText: {
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 5,
  },

  logoutIconBox: {
    backgroundColor: "#ffebee",
  },

  logoutMenuText: {
    color: COLORS.logOut,
  },

  accountModalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 50,
    backgroundColor: "white",
  },

  accountHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },

  accountBody: {
    padding: 20,
  },

  accountProfile: {
    alignItems: "center",
    marginBottom: 30,
  },

  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    elevation: 2,
  },

  avatarText: {
    fontSize: 30,
    color: "white",
    fontWeight: "bold",
  },

  accountUsername: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },

  secondaryText: {
    color: "#666",
  },

  sectionBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },

  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  rowLabel: {
    color: "#666",
    fontSize: 16,
  },

  rowValue: {
    fontWeight: "bold",
    fontSize: 16,
  },

  configBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "flex-end",
  },

  configSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },

  configHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectText: {
    flex: 1,
  },

  selectTextSelected: {
    color: "#333",
  },

  selectTextPlaceholder: {
    color: "#999",
  },

  bagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  bagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    marginRight: 10,
  },

  barcodeButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  chooseBagLink: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  primaryLinkText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  doneButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  doneButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  modalPage: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  modalPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  backButtonSmall: {
    padding: 4,
  },

  modalPageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginRight: 32,
  },

  modalPagePadding: {
    padding: 16,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  searchInput: {
    flex: 1,
    padding: 12,
  },

  loadingTop: {
    marginTop: 20,
  },

  listContent: {
    padding: 16,
  },

  customerCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },

  cardMeta: {
    color: "#666",
    marginTop: 4,
  },

  emptyBagBox: {
    padding: 20,
    alignItems: "center",
  },

  bagCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bagCodeText: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.primary,
  },

  toastHost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 2,
    pointerEvents: "box-none",
  },
});

export default ShipperCameraStyles;
