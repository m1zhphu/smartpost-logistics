import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { waybillService } from "../services/waybillService";
import { COLORS } from "../constants/colors";

export default function TimelineTracker({ waybillRef }) {
  const { user } = useUser();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!waybillRef || !user?.token) {
      setTimeline([]);
      return;
    }

    const loadTimeline = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await waybillService.getTimeline(user.token, waybillRef);
        setTimeline(data.timeline || []);
      } catch (err) {
        setError(err.message || "Không thể tải hành trình.");
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [user?.token, waybillRef]);

  if (!waybillRef) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>
          Chưa có mã định danh vận đơn để tải hành trình.
        </Text>
        <Text style={styles.emptyMessage}>
          Vui lòng mở từ màn hình chi tiết đã có mã vận đơn.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Đang tải hành trình...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Không thể tải hành trình</Text>
        <Text style={styles.emptyMessage}>{error}</Text>
      </View>
    );
  }

  if (!timeline.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Chưa có thông tin hành trình</Text>
        <Text style={styles.emptyMessage}>
          Vận đơn này chưa có ghi nhận lịch sử.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={timeline}
      keyExtractor={(item, index) => `${item.time}-${index}`}
      scrollEnabled={false}
      renderItem={({ item, index }) => (
        <View style={styles.stepRow}>
          <View style={styles.stepLineWrapper}>
            <View
              style={[styles.stepDot, index === 0 && styles.stepDotActive]}
            />
            {index !== timeline.length - 1 && <View style={styles.stepLine} />}
          </View>

          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepAction}>
                {item.action || "Hoạt động"}
              </Text>
              <Text style={styles.stepTime}>{item.time || "-"}</Text>
            </View>
            <Text style={styles.stepMeta}>
              {item.location || "Không xác định"}
            </Text>
            <Text style={styles.stepMeta}>
              Người thực hiện: {item.actor || "Hệ thống"}
            </Text>
            {item.note ? (
              <Text style={styles.stepNote}>{item.note}</Text>
            ) : null}
          </View>
        </View>
      )}
      contentContainerStyle={styles.timelineList}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 16,
    padding: 18,
    marginTop: 10,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  emptyTitle: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 6,
  },
  emptyMessage: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  timelineList: {
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  stepLineWrapper: {
    width: 24,
    alignItems: "center",
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.borderLight,
    marginTop: 2,
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.borderLight,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepAction: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    flex: 1,
  },
  stepTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  stepMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  stepNote: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: "italic",
  },
});
