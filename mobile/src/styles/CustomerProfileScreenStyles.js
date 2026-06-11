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
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark || PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: WHITE,
    fontSize: 28,
    fontWeight: "900",
  },
  userName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  userRole: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  editBtn: {
    marginTop: 16,
    backgroundColor: PRIMARY,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editBtnText: {
    color: WHITE,
    fontWeight: "900",
    fontSize: 13,
  },
  infoSection: {
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
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: SURFACE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
});
