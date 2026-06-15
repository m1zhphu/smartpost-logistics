import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

export default StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },

  // ─── HEADER ───────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  // ─── SCROLL ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  // ─── HERO CARD ────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarLetter: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: "center",
  },
  rolePill: {
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 22,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  btnSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  btnSecondaryText: {
    color: "#334155",
    fontSize: 13.5,
    fontWeight: "700",
  },

  // ─── SECTION ──────────────────────────────────────────────
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // ─── INFO CARD ────────────────────────────────────────────
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  divider: {
    height: 0.5,
    backgroundColor: "#F1F5F9",
    marginLeft: 68,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoValueEmpty: {
    color: "#CBD5E1",
    fontStyle: "italic",
    fontWeight: "500",
  },

  // ─── QUICK CARDS ──────────────────────────────────────────
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  quickSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },
  
  // ─── DROPDOWN MENU ─────────────────────────────────────────
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: 200,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  menuDivider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
});
