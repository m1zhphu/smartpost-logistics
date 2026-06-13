import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser, apiClient } from "../context/UserContext";
import NetInfo from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";
import { COLORS } from "../constants/colors";

const PRIMARY = COLORS.primary || "#1B5E20";

export default function GlobalChat() {
  const { user, permissions } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [isNetworkAlive, setIsNetworkAlive] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const ws = useRef(null);
  const appState = useRef(AppState.currentState);
  const flatListRef = useRef(null);

  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [showEula, setShowEula] = useState(false);
  const [isBanned, setIsBanned] = useState(user?.is_chat_banned || false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("user_type").then((type) =>
      setUserType(type || "employee"),
    );
  }, []);

  const handleOpenChat = async () => {
    setIsOpen(true);
    setUnreadCount(0);

    const hasAccepted = await AsyncStorage.getItem(
      `chat_eula_accepted_${user.id}`,
    );
    if (!hasAccepted) {
      setShowEula(true);
    }
  };

  const acceptEula = async () => {
    await AsyncStorage.setItem(`chat_eula_accepted_${user.id}`, "true");
    setShowEula(false);
  };

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // 1. LẮNG NGHE MẠNG
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const connected =
        state.isConnected && state.isInternetReachable !== false;
      setIsNetworkAlive(connected);

      if (connected) {
        retryCountRef.current = 0;
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
        connectWS();
      } else {
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
        if (ws.current) {
          ws.current.onclose = null;
          ws.current.close();
          ws.current = null;
        }
      }
    });
    return () => {
      unsubscribeNetInfo();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // 2. KẾT NỐI WEBSOCKET
  const connectWS = async () => {
    if (!isNetworkAlive || isBanned) return;

    const uType = await AsyncStorage.getItem("user_type");
    if (uType === "customer" || uType === "admin") return;

    if (
      isConnectingRef.current ||
      (ws.current && ws.current.readyState === WebSocket.OPEN)
    )
      return;

    isConnectingRef.current = true;
    setIsConnecting(true);

    try {
      const res = await apiClient.get(
        "https://warehouse.speedlight.com.vn/api/chat/history",
        { ignore401: true },
      );
      if (res.data && res.data.data) {
        setMessages(res.data.data.reverse());
        setNextCursor(res.data.next_cursor);
        setHasMore(res.data.next_cursor !== null);
      }

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        setIsConnecting(false);
        isConnectingRef.current = false;
        return;
      }

      const wsBaseUrl = "https://warehouse.speedlight.com.vn/api".replace(
        /^http/,
        "ws",
      );
      ws.current = new WebSocket(`${wsBaseUrl}/ws/chat?token=${token}`);

      ws.current.onopen = () => {
        setIsConnecting(false);
        isConnectingRef.current = false;
        retryCountRef.current = 0;
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "new_message") {
          setMessages((prev) => {
            if (prev.find((m) => m.id === data.id)) return prev;
            const filtered = prev.filter(
              (m) =>
                !(
                  m.is_pending &&
                  m.content === data.content &&
                  data.user_id === user.id
                ),
            );
            return [data, ...filtered];
          });

          if (!isOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        } else if (data.type === "delete_message") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.id
                ? { ...m, is_deleted: true, content: "Tin nhắn đã bị thu hồi" }
                : m,
            ),
          );
        } else if (data.type === "report_message") {
          if (permissions.includes("FUNC_ADMIN_ALL")) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === data.id) {
                  const currentCount = Number(m.report_count) || 0;
                  return { ...m, report_count: currentCount + 1 };
                }
                return m;
              }),
            );
          }
        } else if (data.type === "error") {
          setMessages((prev) => prev.filter((m) => !m.is_pending));

          if (data.message.toLowerCase().includes("cấm chat")) {
            setIsBanned(true);
          }
          setMessages([]);
          Alert.alert("Hệ thống", data.message);
        }
      };

      ws.current.onerror = () => {
        setIsConnecting(false);
        isConnectingRef.current = false;
        ws.current = null;
      };

      ws.current.onclose = () => {
        setIsConnecting(false);
        isConnectingRef.current = false;
        ws.current = null;

        const baseDelay = 2000;
        const maxDelay = 30000;
        const exponentialDelay = Math.min(
          baseDelay * Math.pow(2, retryCountRef.current),
          maxDelay,
        );
        const jitter = Math.floor(Math.random() * 1000);
        const finalDelay = exponentialDelay + jitter;

        if (appState.current === "active" && isNetworkAlive) {
          reconnectTimeoutRef.current = setTimeout(() => {
            retryCountRef.current += 1;
            connectWS();
          }, finalDelay);
        }
      };
    } catch (error) {
      setIsConnecting(false);
      isConnectingRef.current = false;
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !nextCursor || !isNetworkAlive) return;

    setIsLoadingMore(true);
    try {
      const res = await apiClient.get(
        `https://warehouse.speedlight.com.vn/api/chat/history?cursor=${nextCursor}`,
        { ignore401: true },
      );

      if (res.data && res.data.data) {
        const olderMessages = res.data.data.reverse();
        setMessages((prev) => [...prev, ...olderMessages]);
        setNextCursor(res.data.next_cursor);
        setHasMore(res.data.next_cursor !== null);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Lỗi tải thêm tin nhắn" });
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (isNetworkAlive) {
          retryCountRef.current = 0;
          if (reconnectTimeoutRef.current)
            clearTimeout(reconnectTimeoutRef.current);
          connectWS();
        }
      } else if (nextAppState === "background") {
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
        if (ws.current) {
          ws.current.onclose = null;
          ws.current.close();
          ws.current = null;
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isNetworkAlive]);

  const sendMessage = () => {
    if (!isNetworkAlive) {
      Alert.alert("Mất kết nối", "Vui lòng kiểm tra lại mạng Wifi/4G.");
      return;
    }
    if (
      !inputText.trim() ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    ) {
      Alert.alert(
        "Đang kết nối",
        "Hệ thống đang kết nối lại, vui lòng đợi vài giây.",
      );
      return;
    }

    const messageText = inputText.trim();
    setInputText("");

    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      user_id: user.id,
      sender_name: user.username || "Bạn",
      content: messageText,
      time: "Đang gửi...",
      is_pending: true,
      report_count: 0,
    };

    setMessages((prev) => [tempMessage, ...prev]);
    ws.current.send(messageText);
  };

  const handleLongPress = (msg) => {
    if (msg.is_deleted) return;

    if (!isNetworkAlive) {
      Alert.alert(
        "Mất kết nối WiFi hoặc 4G/5G",
        "Bạn cần có mạng để thực hiện thao tác với tin nhắn này.",
      );
      return;
    }

    const isMine = msg.user_id === user.id;
    const isAdmin = permissions.includes("FUNC_ADMIN_ALL");
    const buttons = [];

    if (isMine || isAdmin) {
      buttons.push({
        text: isMine ? "Thu hồi tin nhắn" : "Xóa tin nhắn (Admin)",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(
              `https://warehouse.speedlight.com.vn/api/chat/${msg.id}`,
              { ignore401: true },
            );
          } catch (e) {
            Alert.alert("Lỗi", "Không thể xóa tin nhắn lúc này.");
          }
        },
      });
    }

    if (isAdmin && !isMine) {
      buttons.push({
        text: "Cấm user này chat (Admin)",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Xác nhận cấm",
            `Bạn có chắc chắn muốn cấm tài khoản "${msg.sender_name}" gửi tin nhắn trên toàn hệ thống không?`,
            [
              { text: "Hủy", style: "cancel" },
              {
                text: "Cấm Chat",
                style: "destructive",
                onPress: async () => {
                  try {
                    await apiClient.post(
                      "https://warehouse.speedlight.com.vn/api/chat/ban-user",
                      {
                        target_user_id: msg.user_id,
                      },
                      { ignore401: true },
                    );

                    await apiClient.delete(
                      `https://warehouse.speedlight.com.vn/api/chat/${msg.id}`,
                      { ignore401: true },
                    );
                    Alert.alert(
                      "Thành công",
                      `Đã khóa quyền chat của ${msg.sender_name}.`,
                    );
                  } catch (e) {
                    Alert.alert("Lỗi", "Không thể thao tác lúc này.");
                  }
                },
              },
            ],
          );
        },
      });
    }

    if (!isAdmin && !isMine) {
      buttons.push({
        text: "Báo cáo vi phạm",
        onPress: async () => {
          try {
            await apiClient.post(
              "https://warehouse.speedlight.com.vn/api/chat/report",
              { message_id: msg.id, reason: "Nội dung không phù hợp" },
              { ignore401: true },
            );
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            Alert.alert(
              "Đã báo cáo",
              "Tin nhắn này đã bị báo cáo và ẩn khỏi màn hình của bạn.",
            );
          } catch (e) {
            Alert.alert("Lỗi", "Không thể gửi báo cáo lúc này.");
          }
        },
      });

      buttons.push({
        text: "Ẩn người này",
        onPress: async () => {
          try {
            await apiClient.post(
              "https://warehouse.speedlight.com.vn/api/chat/block",
              { blocked_id: msg.user_id },
              { ignore401: true },
            );
            setMessages((prev) =>
              prev.filter((m) => m.user_id !== msg.user_id),
            );
            Alert.alert(
              "Thành công",
              "Bạn sẽ không thấy tin nhắn của người này nữa.",
            );
          } catch (e) {
            Alert.alert("Lỗi", "Không thể ẩn người dùng này.");
          }
        },
      });
    }

    buttons.push({ text: "Hủy", style: "cancel" });
    Alert.alert("Tùy chọn tin nhắn", `Từ: ${msg.sender_name}`, buttons);
  };

  if (userType && userType !== "employee") return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleOpenChat}
      >
        <Ionicons name="chatbubbles" size={28} color="#FFF" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={Platform.OS === "ios" ? false : true}
        presentationStyle={
          Platform.OS === "ios" ? "pageSheet" : "overFullScreen"
        }
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View style={styles.chatWindow}>
            {/* HEADER CHAT CHUẨN FORM MODAL */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Kênh Điều Phối</Text>
                <Text style={styles.headerSub}>
                  Tuân thủ quy tắc ứng xử nội bộ
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {showEula ? (
              <View style={styles.eulaContainer}>
                <View style={styles.eulaBox}>
                  <Ionicons
                    name="shield-checkmark"
                    size={48}
                    color={PRIMARY}
                    style={{ marginBottom: 12, alignSelf: "center" }}
                  />
                  <Text style={styles.eulaTitle}>Điều khoản sử dụng</Text>
                  <Text style={styles.eulaText}>
                    Kênh điều phối chung là môi trường liên lạc công việc. Bằng
                    việc sử dụng tính năng này, bạn đồng ý tuân thủ quy định của
                    công ty,{" "}
                    <Text style={{ fontWeight: "bold", color: "#EF4444" }}>
                      nghiêm cấm gửi nội dung phản cảm, quấy rối, xúc phạm hoặc
                      lăng mạ người khác
                    </Text>
                    . Mọi vi phạm sẽ bị xử lý theo nội quy.
                  </Text>
                  <View style={styles.eulaDivider} />
                  <Text style={styles.eulaTitleEn}>Terms of Use (EULA)</Text>
                  <Text style={styles.eulaTextEn}>
                    This is a corporate communication channel. By using this
                    feature, you agree to{" "}
                    <Text style={{ fontWeight: "bold", color: "#EF4444" }}>
                      not post objectionable, abusive, harassing, or offensive
                      content
                    </Text>
                    . Violations will result in public chat suspension.
                  </Text>
                  <View style={{ flexDirection: "column", gap: 10 }}>
                    <TouchableOpacity
                      style={styles.agreeBtn}
                      onPress={acceptEula}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.agreeBtnText}>
                        TÔI ĐỒNG Ý / I AGREE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => setIsOpen(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.declineBtnText}>
                        Đóng lại / Decline
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {!isNetworkAlive ? (
                  <View style={styles.offlineBanner}>
                    <Ionicons
                      name="wifi-outline"
                      size={14}
                      color="#FFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.offlineText}>
                      Không có kết nối mạng
                    </Text>
                  </View>
                ) : isConnecting ? (
                  <View style={styles.connectingBanner}>
                    <ActivityIndicator
                      size="small"
                      color="#D97706"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.connectingText}>Đang kết nối...</Text>
                  </View>
                ) : null}

                <FlatList
                  ref={flatListRef}
                  data={messages}
                  inverted={true}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  onEndReached={loadMoreMessages}
                  onEndReachedThreshold={0.2}
                  ListFooterComponent={
                    isLoadingMore ? (
                      <View
                        style={{ paddingVertical: 15, alignItems: "center" }}
                      >
                        <ActivityIndicator size="small" color={PRIMARY} />
                      </View>
                    ) : null
                  }
                  renderItem={({ item }) => {
                    const isMine = item.user_id === user.id;
                    const isAdmin = permissions.includes("FUNC_ADMIN_ALL");
                    const hasReport = isAdmin && item.report_count > 0;

                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onLongPress={() => handleLongPress(item)}
                        style={[
                          styles.msgRow,
                          isMine ? styles.msgRight : styles.msgLeft,
                        ]}
                      >
                        {!isMine && (
                          <Text style={styles.senderName}>
                            {item.kho} • {item.sender_name}
                          </Text>
                        )}

                        <View
                          style={[
                            styles.bubble,
                            isMine ? styles.bubbleMine : styles.bubbleOther,
                            item.is_deleted && styles.bubbleDeleted,
                            hasReport && styles.bubbleReported,
                            item.is_pending && { opacity: 0.7 },
                          ]}
                        >
                          {hasReport && (
                            <Text style={styles.reportWarning}>
                              Bị báo cáo ({item.report_count} lần)
                            </Text>
                          )}
                          <Text
                            style={[
                              styles.msgText,
                              isMine ? { color: "#FFF" } : { color: "#0F172A" },
                              item.is_deleted && {
                                fontStyle: "italic",
                                color: "#64748B",
                              },
                            ]}
                          >
                            {item.content}
                          </Text>
                        </View>
                        <Text style={styles.timeText}>{item.time}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                {isBanned ? (
                  <View style={styles.bannedFooter}>
                    <Ionicons
                      name="lock-closed"
                      size={24}
                      color="#EF4444"
                      style={{ marginBottom: 4 }}
                    />
                    <Text style={styles.bannedTitle}>Bạn đã bị hạn chế</Text>
                    <Text style={styles.bannedText}>
                      Tài khoản của bạn đã bị vô hiệu hóa quyền gửi tin nhắn do
                      vi phạm quy định.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.footer}>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        isNetworkAlive
                          ? "Nhập tin nhắn..."
                          : "Chờ mạng để nhắn..."
                      }
                      value={inputText}
                      placeholderTextColor="#94A3B8"
                      onChangeText={setInputText}
                      onSubmitEditing={sendMessage}
                      editable={isNetworkAlive}
                      multiline
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
                        (!inputText.trim() || !isNetworkAlive) && {
                          backgroundColor: "#E2E8F0",
                        },
                      ]}
                      onPress={sendMessage}
                      disabled={!inputText.trim() || !isNetworkAlive}
                    >
                      <Ionicons
                        name="send"
                        size={18}
                        color={
                          !inputText.trim() || !isNetworkAlive
                            ? "#94A3B8"
                            : "#FFF"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// STYLES CHUẨN DNA
const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFF",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },

  modalContainer: {
    flex: 1,
    backgroundColor: Platform.OS === "ios" ? "#F8FAFC" : "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  chatWindow: {
    flex: Platform.OS === "ios" ? 1 : undefined,
    height: Platform.OS === "ios" ? undefined : "85%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: Platform.OS === "ios" ? 0 : 24,
    borderTopRightRadius: Platform.OS === "ios" ? 0 : 24,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === "ios" ? 20 : 20, // Page Sheet ko cần insets lớn
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#ebebeb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 10,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  headerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  msgRow: { marginBottom: 16, maxWidth: "85%" },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end", alignItems: "flex-end" },

  senderName: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: "600",
  },
  bubble: { padding: 14, borderRadius: 18 },
  bubbleMine: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  // Chat Bubble Other chuẩn thẻ Card
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleDeleted: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },

  msgText: { fontSize: 15, lineHeight: 22, fontWeight: "500" },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 6,
    marginHorizontal: 4,
    fontWeight: "600",
  },

  // Footer Chuẩn
  footer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    maxHeight: 100,
    color: "#0F172A",
    fontWeight: "600",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    alignSelf: "flex-end",
  },

  bubbleReported: {
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  reportWarning: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 6,
  },

  offlineBanner: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  offlineText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  connectingBanner: {
    backgroundColor: "#FEF3C7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  connectingText: { color: "#D97706", fontSize: 13, fontWeight: "700" },

  // EULA CHUẨN FORM
  eulaContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  eulaBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  eulaTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
  },
  eulaText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    textAlign: "justify",
    fontWeight: "600",
  },
  eulaDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  eulaTitleEn: {
    fontSize: 15,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 8,
    textAlign: "center",
  },
  eulaTextEn: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "justify",
    marginBottom: 24,
    fontWeight: "600",
  },
  agreeBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  agreeBtnText: { color: "#FFF", fontWeight: "900", fontSize: 15 },
  declineBtn: { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  declineBtnText: { color: "#64748B", fontWeight: "800", fontSize: 15 },

  bannedFooter: {
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  bannedTitle: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  bannedText: {
    color: "#7F1D1D",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});
