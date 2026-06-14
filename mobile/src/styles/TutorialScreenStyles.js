import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";
const { width } = Dimensions.get("window");

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  slideContainer: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  slideImage: {
    width: width * 0.8,
    borderRadius: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 40,
    textAlign: "center",
  },
  slideText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    marginBottom: 30,
    justifyContent: "center",
  },
  dot: {
    height: 10,
    marginHorizontal: 6,
    borderRadius: 5,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    height: 54,
    borderRadius: 27,
    width: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
