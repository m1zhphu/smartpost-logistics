import { Platform, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const SECONDARY = COLORS.secondary || "#0F766E";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft || "#F3F4F6",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.white || "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  searchSection: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.surface || "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSoft || "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary || "#0F172A",
    fontWeight: "700",
  },
  searchBtn: {
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: {
    color: COLORS.white || "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContentInline: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconBox: {
    marginBottom: 10,
  },
  placeholderText: {
    color: COLORS.textSecondary || "#64748B",
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    color: COLORS.textSecondary || "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  resultContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface || "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.borderSoft || "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: SECONDARY,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted || "#F1F5F9",
    paddingBottom: 7,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: SECONDARY,
    marginLeft: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  label: {
    color: COLORS.textSecondary || "#64748B",
    fontSize: 14,
    flex: 1,
    fontWeight: "700",
  },
  value: {
    color: COLORS.textPrimary || "#1E293B",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
    fontWeight: "700",
  },
  valueBold: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },
  timelineItem: {
    flexDirection: "row",
  },
  timelineColumn: {
    width: 20,
    alignItems: "center",
    marginRight: 15,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.borderMuted || "#CBD5E1",
    zIndex: 2,
    marginTop: 4,
  },
  activeDot: {
    backgroundColor: PRIMARY,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.borderSoft || "#E2E8F0",
    marginVertical: -4,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 25,
  },
  logStatus: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary || "#0F172A",
  },
  logTime: {
    fontSize: 12,
    color: COLORS.textSecondary || "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },
  logLocation: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    fontWeight: "700",
  },
  logNote: {
    fontSize: 13,
    color: COLORS.danger || "#EF4444",
    marginTop: 4,
    fontStyle: "italic",
    fontWeight: "700",
  },
});
