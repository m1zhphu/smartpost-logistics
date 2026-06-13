import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import Constants from "expo-constants";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function AccountModal({ visible, onClose }) {
  const { user } = useUser();
  const appVersion =
    Constants.expoConfig?.version || Constants.manifest?.version || "1.0.1";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet" // Hoạt động mượt trên iOS
      onRequestClose={onClose}
    >
      <View style={styles.dnaContainer}>
        {/* Header Chuẩn Modal */}
        <View style={styles.dnaHeader}>
          <Text style={styles.dnaHeaderTitle}>Tài khoản</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtnCircle}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Nội dung */}
        <View style={styles.dnaContent}>
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <View style={styles.avatarCircle}>
              <Text style={{ fontSize: 32, color: "white", fontWeight: "900" }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                marginTop: 12,
                color: "#0F172A",
              }}
            >
              {user?.username}
            </Text>
            <Text style={{ color: "#64748B", fontWeight: "600", marginTop: 4 }}>
              Thành viên Speed Light
            </Text>
          </View>

          {/* Card Phẳng Chuẩn DNA */}
          <View style={styles.sectionBox}>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Tên đăng nhập</Text>
              <Text style={styles.rowValue}>{user?.username}</Text>
            </View>

            <View style={styles.divider} />

            {user?.ma_kho_spl && (
              <>
                <View style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Mã kho làm việc</Text>
                  <Text style={styles.rowValue}>{user.ma_kho_spl}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Phiên bản App</Text>
              <Text style={styles.rowValue}>{appVersion}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Nền Modal chuẩn
  dnaContainer: { flex: 1, backgroundColor: "#F8FAFC" },

  dnaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 50,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dnaHeaderTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  dnaContent: { padding: 20 },

  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Card Phẳng Chuẩn DNA
  sectionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowLabel: { color: "#64748B", fontSize: 15, fontWeight: "600" },
  rowValue: { fontWeight: "900", fontSize: 15, color: "#0F172A" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 4 },
});
