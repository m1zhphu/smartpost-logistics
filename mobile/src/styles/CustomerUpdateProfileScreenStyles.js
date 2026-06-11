import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const WHITE = COLORS.white || "#FFFFFF";
const SURFACE = COLORS.surface || "#FFFFFF";
const SURFACE_SOFT = COLORS.surfaceSoft || "#F8FAFC";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted || "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 52 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  headerButtonInner: {
    flex: 1,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  formCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark || PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: PRIMARY,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  required: {
    color: COLORS.danger,
  },
  inputContainer: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: SURFACE_SOFT,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  inputContainerMultiline: {
    minHeight: 96,
    paddingVertical: 12,
    justifyContent: "flex-start",
  },
  input: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
    paddingVertical: 0,
  },
  inputMultiline: {
    textAlignVertical: "top",
    lineHeight: 20,
    minHeight: 72,
  },
  selectBox: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: SURFACE_SOFT,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  selectPlaceholder: {
    color: COLORS.textSecondary,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    paddingBottom: Platform.OS === "ios" ? 24 : 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },
  saveBtn: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: WHITE,
    fontWeight: "900",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "76%",
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderMuted,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  modalSearchWrap: {
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderRadius: 16,
    backgroundColor: SURFACE_SOFT,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  modalSearchInput: {
    minHeight: 46,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  modalListContent: {
    paddingBottom: 16,
  },
  modalEmptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },
  modalEmptyText: {
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  modalItemLast: {
    borderBottomWidth: 0,
  },
  modalItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});
