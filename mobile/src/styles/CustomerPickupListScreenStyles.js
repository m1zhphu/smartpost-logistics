import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F0F2F5" 
  },
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
  headerCenter: { 
    flex: 1, 
    alignItems: "center", 
    paddingHorizontal: 10 
  },
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
  headerButtonInner: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 120 
  },
  emptyIconBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
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
    borderBottomWidth: 0.5,
    borderBottomColor: "#E8EDF2",
    paddingBottom: 12,
    marginBottom: 12,
  },
  codeBlock: { 
    flex: 1, 
    paddingRight: 10 
  },
  waybillCode: { 
    fontWeight: "800", 
    fontSize: 16, 
    color: PRIMARY 
  },
  requestCode: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusText: {
    fontWeight: "800",
    fontSize: 11,
    textAlign: "right",
  },
  cardBody: {},
  infoLine: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 8 
  },
  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#F1F5F9",
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    fontWeight: "600",
    lineHeight: 18,
  },
  priceSection: { 
    flexDirection: "row", 
    marginTop: 10 
  },
  pricePill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
    backgroundColor: "#F8FAFC",
    marginRight: 8,
  },
  pricePillLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
  },
  pricePillValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "800",
  },
  priceSuccess: { color: COLORS.success || "#10B981" },
  priceDanger: { color: COLORS.danger || "#EF4444" },
  priceHintBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
    justifyContent: "center",
  },
  priceHint: { 
    fontSize: 12, 
    color: "#64748B", 
    fontWeight: "600" 
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#E8EDF2",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
});
