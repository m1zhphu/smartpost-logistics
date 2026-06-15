import { StyleSheet, Platform } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F5" },

  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 55 : 44,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  headerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonInner: { justifyContent: "center", alignItems: "center" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },

  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  listContent: { padding: 16, paddingBottom: 30 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E8EDF2",
    paddingBottom: 12,
    marginBottom: 12,
  },
  codeBlock: { flex: 1, paddingRight: 10 },
  requestCode: { fontWeight: "800", fontSize: 16, color: PRIMARY },
  waybillCode: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  headerPills: {
    alignItems: "flex-end",
    gap: 8,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  bulkPill: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  singlePill: {
    backgroundColor: "#ECFDF5",
    borderColor: "#BBF7D0",
  },
  modePillText: {
    fontWeight: "800",
    fontSize: 11,
  },

  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusText: { fontWeight: "800", fontSize: 11, textAlign: "right" },

  cardBody: {},
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    fontWeight: "600",
    lineHeight: 18,
  },
  infoValueBold: {
    fontWeight: "800",
    color: "#0F172A",
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  metaPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
  },
  metaLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
});
