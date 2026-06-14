import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const WHITE = COLORS.white || "#FFFFFF";
const SURFACE = COLORS.surface || "#FFFFFF";
const SURFACE_SOFT = COLORS.surfaceSoft || "#F8FAFC";
const SURFACE_MUTED = COLORS.surfaceMuted || "#F1F5F9";

const shadow = {
  ...Platform.select({
    ios: {
      shadowColor: COLORS.primaryDark || PRIMARY,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: {
      elevation: 5,
    },
  }),
};

const AdminPickupFlowScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_MUTED,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 52 : 38,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },

  headerOrbOne: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  headerOrbTwo: {
    position: "absolute",
    left: -35,
    bottom: -70,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  headerLine: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 32,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.36)",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  headerButtonInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "900",
  },

  headerSub: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: COLORS.borderSoft || "#E2E8F0",
  },

  tabButtonActive: {
    backgroundColor: PRIMARY,
  },

  tabText: {
    textAlign: "center",
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "800",
    fontSize: 13,
  },

  tabTextActive: {
    color: WHITE,
  },

  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    ...shadow,
  },

  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "700",
  },

  summaryValue: {
    fontSize: 28,
    color: PRIMARY,
    fontWeight: "900",
    marginTop: 2,
  },

  summaryHint: {
    fontSize: 12,
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "700",
    marginTop: 6,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyIconBox: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "800",
  },

  listContent: {
    padding: 16,
    paddingBottom: 120,
  },

  cardShadow: {
    borderRadius: 24,
    marginBottom: 14,
    ...shadow,
  },

  card: {
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.84)",
    marginBottom: 14,
    ...shadow,
  },

  cardChecked: {
    borderColor: "rgba(15,61,38,0.32)",
  },

  cardTopLine: {
    position: "absolute",
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },

  cardTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkboxIcon: {
    marginRight: 8,
  },

  cardTitleContent: {
    flex: 1,
  },

  requestCode: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary || "#0F172A",
  },

  subCode: {
    fontSize: 12,
    color: COLORS.textSecondary || "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },

  cardBadgeGroup: {
    alignItems: "flex-end",
    gap: 4,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  sourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 4,
  },

  sourcePillText: {
    fontSize: 11,
    fontWeight: "900",
  },

  metaRow: {
    marginTop: 8,
  },

  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "700",
    marginBottom: 2,
  },

  metaValue: {
    fontSize: 14,
    color: COLORS.textPrimary || "#0F172A",
    fontWeight: "700",
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: COLORS.borderMuted || "#CBD5E1",
  },

  secondaryActionText: {
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "900",
  },

  primaryActionWrap: {
    flex: 1.2,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryAction: {
    backgroundColor: PRIMARY,
  },

  rejectAction: {
    backgroundColor: "#EF4444",
  },

  primaryActionText: {
    color: WHITE,
    fontWeight: "900",
  },

  uploadActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  pickedPreviewImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 12,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    paddingBottom: Platform.OS === "ios" ? 24 : 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.88)",
    backgroundColor: "rgba(255,255,255,0.84)",
  },

  dispatchButtonWrap: {
    borderRadius: 18,
    overflow: "hidden",
  },

  dispatchButton: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
  },

  dispatchButtonText: {
    color: WHITE,
    fontWeight: "900",
    fontSize: 15,
  },

  disabledBtn: {
    opacity: 0.65,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.3)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    maxHeight: "70%",
    borderRadius: 22,
    backgroundColor: SURFACE,
    padding: 16,
  },

  rejectCard: {
    borderRadius: 22,
    backgroundColor: SURFACE,
    padding: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary || "#0F172A",
    marginBottom: 14,
  },

  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft || "#E2E8F0",
  },

  modalItemTitle: {
    fontSize: 15,
    color: COLORS.textPrimary || "#0F172A",
    fontWeight: "800",
  },

  modalItemSub: {
    fontSize: 12,
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "700",
    marginTop: 4,
  },

  emptyModalText: {
    color: COLORS.textSecondary || "#64748B",
    fontWeight: "700",
  },

  noteInput: {
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderMuted || "#CBD5E1",
    backgroundColor: SURFACE_SOFT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    color: COLORS.textPrimary || "#0F172A",
    marginBottom: 14,
  },
});

export default AdminPickupFlowScreenStyles;
