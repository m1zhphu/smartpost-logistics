import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    Modal, KeyboardAvoidingView, Platform, AppState, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser, apiClient } from '../context/UserContext';
import { API_BASE_URL } from '../constants/customerEndpoints';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

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

    // HÀM KIỂM TRA EULA KHI MỞ CHAT
    const handleOpenChat = async () => {
        setIsOpen(true);
        setUnreadCount(0);

        // SỬA Ở ĐÂY: Gắn thêm user.id vào tên key
        const hasAccepted = await AsyncStorage.getItem(`chat_eula_accepted_${user.id}`);
        if (!hasAccepted) {
            setShowEula(true);
        }
    };

    // HÀM XÁC NHẬN ĐỒNG Ý
    const acceptEula = async () => {
        // SỬA Ở ĐÂY: Gắn thêm user.id vào tên key
        await AsyncStorage.setItem(`chat_eula_accepted_${user.id}`, 'true');
        setShowEula(false);
    };

    // DÙNG REF ĐỂ GIẢI QUYẾT BẪY CLOSURE CHO TRẠNG THÁI ĐÓNG/MỞ MODAL
    const isOpenRef = useRef(isOpen);
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // 1. LẮNG NGHE MẠNG
    useEffect(() => {
        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            const connected = state.isConnected && state.isInternetReachable !== false;
            setIsNetworkAlive(connected);

            if (connected) {
                retryCountRef.current = 0; // Reset số lần đếm
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                connectWS(); // Có mạng là kết nối WS luôn để đếm tin nhắn ngầm
            } else {
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                if (ws.current) {
                    ws.current.onclose = null;
                    ws.current.close();
                    ws.current = null;
                }
            }
        });
        return () => {
            unsubscribeNetInfo();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

    // 2. KẾT NỐI WEBSOCKET
    const connectWS = async () => {
        if (!isNetworkAlive || isBanned) return;

        // 1. CỔNG CHỐT CHẶN: Phải có dòng này thì mới chống đếm tin nhắn 2 lần được!
        if (isConnectingRef.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;

        isConnectingRef.current = true; // Khóa cửa lại
        setIsConnecting(true);

        try {
            const res = await apiClient.get('https://warehouse.speedlight.com.vn/api/chat/history');
            if (res.data && res.data.data) {
                setMessages(res.data.data.reverse());
                setNextCursor(res.data.next_cursor); // Lưu mốc ID cũ nhất
                setHasMore(res.data.next_cursor !== null);
            }

            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                setIsConnecting(false);
                isConnectingRef.current = false; // Mở cửa lại
                return;
            }

            const wsBaseUrl = 'https://warehouse.speedlight.com.vn/api'.replace(/^http/, 'ws');
            ws.current = new WebSocket(`${wsBaseUrl}/ws/chat?token=${token}`);

            ws.current.onopen = () => {
                setIsConnecting(false);
                isConnectingRef.current = false; // Mở cửa lại
                retryCountRef.current = 0; // Tái tạo bộ đếm khi kết nối thành công
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            };

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === "new_message") {
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.id)) return prev;
                        // Xoá tin nhắn ảo (Optimistic UI) nếu server trả về tin của chính mình
                        const filtered = prev.filter(m => !(m.is_pending && m.content === data.content && data.user_id === user.id));
                        return [data, ...filtered];
                    });

                    if (!isOpenRef.current) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
                else if (data.type === "delete_message") {
                    setMessages(prev => prev.map(m =>
                        m.id === data.id ? { ...m, is_deleted: true, content: "Tin nhắn đã bị thu hồi" } : m
                    ));
                }
                // 2. Bạn cũng quên dòng này để Admin thấy chữ đỏ cảnh báo realtime
                // SỬA Ở ĐÂY: Bắt sự kiện report_message chuẩn xác hơn
                else if (data.type === "report_message") {
                    // Chỉ chạy logic làm đỏ tin nhắn nếu user đang cầm máy là Admin
                    if (permissions.includes('FUNC_ADMIN_ALL')) {
                        setMessages(prev => prev.map(m => {
                            if (m.id === data.id) {
                                // Đảm bảo report_count luôn là số nguyên
                                const currentCount = Number(m.report_count) || 0;
                                return { ...m, report_count: currentCount + 1 };
                            }
                            return m;
                        }));
                    }
                }
                else if (data.type === "error") {
                    // Xóa tin nhắn ảo đang gửi
                    setMessages(prev => prev.filter(m => !m.is_pending));

                    // Nếu lỗi là do bị cấm chat, cập nhật state ngay lập tức
                    if (data.message.toLowerCase().includes("cấm chat")) {
                        setIsBanned(true);
                    }
                    setMessages([]);
                    Alert.alert("Hệ thống", data.message);
                }
            };

            ws.current.onerror = () => {
                setIsConnecting(false);
                isConnectingRef.current = false; // Mở cửa lại
                ws.current = null;
            };

            ws.current.onclose = () => {
                setIsConnecting(false);
                isConnectingRef.current = false; // Mở cửa lại
                ws.current = null;

                // THUẬT TOÁN EXPONENTIAL BACKOFF KÈM JITTER
                const baseDelay = 2000; // Khởi điểm 2 giây
                const maxDelay = 30000; // Tối đa 30 giây
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), maxDelay);
                const jitter = Math.floor(Math.random() * 1000); // Thêm độ lệch 0-1s
                const finalDelay = exponentialDelay + jitter;

                if (appState.current === 'active' && isNetworkAlive) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        retryCountRef.current += 1;
                        connectWS();
                    }, finalDelay);
                }
            };

        } catch (error) {
            setIsConnecting(false);
            isConnectingRef.current = false; // Mở cửa lại
        }
    };

    // 2. HÀM TẢI THÊM TIN NHẮN CŨ (INFINITE SCROLL)
    const loadMoreMessages = async () => {
        // Đang tải, hết mạng, hoặc hết lịch sử thì không chạy
        if (isLoadingMore || !hasMore || !nextCursor || !isNetworkAlive) return;

        setIsLoadingMore(true);
        try {
            const res = await apiClient.get(`https://warehouse.speedlight.com.vn/api/chat/history?cursor=${nextCursor}`);

            if (res.data && res.data.data) {
                const olderMessages = res.data.data.reverse();

                // Nối tin nhắn cũ vào CUỐI mảng hiện tại
                setMessages(prev => [...prev, ...olderMessages]);

                // Cập nhật lại con trỏ cho lần lướt tiếp theo
                setNextCursor(res.data.next_cursor);
                setHasMore(res.data.next_cursor !== null);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Lỗi tải thêm tin nhắn' });
        } finally {
            setIsLoadingMore(false);
        }
    };

    // 3. QUẢN LÝ APP STATE
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (isNetworkAlive) {
                    retryCountRef.current = 0;
                    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    connectWS();
                }
            } else if (nextAppState === 'background') {
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
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

    // 4. GỬI TIN NHẮN
    const sendMessage = () => {
        if (!isNetworkAlive) {
            Alert.alert("Mất kết nối", "Vui lòng kiểm tra lại mạng Wifi/4G.");
            return;
        }
        if (!inputText.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
            Alert.alert("Đang kết nối", "Hệ thống đang kết nối lại, vui lòng đợi vài giây.");
            return;
        }

        const messageText = inputText.trim();
        setInputText("");

        // OPTIMISTIC UI: Tạo tin nhắn ảo hiển thị ngay lập tức
        const tempId = `temp_${Date.now()}`;
        const tempMessage = {
            id: tempId,
            user_id: user.id,
            sender_name: user.username || "Bạn",
            content: messageText,
            time: "Đang gửi...", // Trạng thái gửi
            is_pending: true,
            report_count: 0
        };

        setMessages(prev => [tempMessage, ...prev]);
        ws.current.send(messageText);
    };

    // 5. MENU NHẤN GIỮ
    const handleLongPress = (msg) => {
        if (msg.is_deleted) return;

        // CHẶN NGAY LẬP TỨC NẾU KHÔNG CÓ MẠNG (Dùng Alert)
        if (!isNetworkAlive) {
            Alert.alert("Mất kết nối WiFi hoặc 4G/5G", "Bạn cần có mạng để thực hiện thao tác với tin nhắn này.");
            return;
        }

        const isMine = msg.user_id === user.id;
        const isAdmin = permissions.includes('FUNC_ADMIN_ALL');
        const buttons = [];

        // Nút Xóa/Thu hồi
        if (isMine || isAdmin) {
            buttons.push({
                text: isMine ? 'Thu hồi tin nhắn' : 'Xóa tin nhắn (Admin)',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await apiClient.delete(`https://warehouse.speedlight.com.vn/api/chat/${msg.id}`);
                    } catch (e) {
                        Alert.alert("Lỗi", "Không thể xóa tin nhắn lúc này.");
                    }
                }
            });
        }

        // TÍNH NĂNG MỚI: DÀNH RIÊNG CHO ADMIN ĐỂ BAN USER (Chuẩn Apple Guideline)
        if (isAdmin && !isMine) {
            buttons.push({
                text: 'Cấm user này chat (Admin)',
                style: 'destructive',
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
                                        // Gọi API tới Backend để cập nhật trạng thái user thành "banned_from_chat"
                                        await apiClient.post('https://warehouse.speedlight.com.vn/api/chat/ban-user', {
                                            target_user_id: msg.user_id
                                        });

                                        // (Tùy chọn) Xóa luôn tin nhắn vi phạm này
                                        await apiClient.delete(`https://warehouse.speedlight.com.vn/api/chat/${msg.id}`);

                                        Alert.alert("Thành công", `Đã khóa quyền chat của ${msg.sender_name}.`);
                                    } catch (e) {
                                        Alert.alert("Lỗi", "Không thể thao tác lúc này.");
                                    }
                                }
                            }
                        ]
                    );
                }
            });
        }

        if (!isAdmin && !isMine) {
            buttons.push({
                text: 'Báo cáo vi phạm',
                onPress: async () => {
                    try {
                        await apiClient.post('https://warehouse.speedlight.com.vn/api/chat/report', { message_id: msg.id, reason: "Nội dung không phù hợp" });
                        setMessages(prev => prev.filter(m => m.id !== msg.id));
                        Alert.alert("Đã báo cáo", "Tin nhắn này đã bị báo cáo và ẩn khỏi màn hình của bạn.");
                    } catch (e) {
                        Alert.alert("Lỗi", "Không thể gửi báo cáo lúc này.");
                    }
                }
            });

            buttons.push({
                text: 'Ẩn người này',
                onPress: async () => {
                    try {
                        await apiClient.post('https://warehouse.speedlight.com.vn/api/chat/block', { blocked_id: msg.user_id });
                        setMessages(prev => prev.filter(m => m.user_id !== msg.user_id));
                        Alert.alert("Thành công", "Bạn sẽ không thấy tin nhắn của người này nữa.");
                    } catch (e) {
                        Alert.alert("Lỗi", "Không thể ẩn người dùng này.");
                    }
                }
            });
        }

        buttons.push({ text: 'Hủy', style: 'cancel' });
        Alert.alert("Tùy chọn tin nhắn", `Từ: ${msg.sender_name}`, buttons);
    };

    return (
        <>
            <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleOpenChat}>
                <Ionicons name="chatbubbles" size={28} color="#FFF" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* CẤU HÌNH PAGE SHEET CHO iOS VÀ OVER FULLSCREEN CHO ANDROID */}
            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={Platform.OS === 'ios' ? false : true}
                presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"}
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
                    <View style={styles.chatWindow}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>Kênh Điều Phối</Text>
                                <Text style={styles.headerSub}>Tuân thủ quy tắc ứng xử nội bộ</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                                <Ionicons name="chevron-down" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* 2. CHIA NHÁNH: HIỂN THỊ EULA HOẶC CHAT */}
                        {showEula ? (
                            /* MÀN HÌNH EULA (CHE KÍN 100%, KHÔNG RENDER TIN NHẮN) */
                            <View style={styles.eulaContainer}>
                                <View style={styles.eulaBox}>
                                    <Ionicons name="shield-checkmark" size={40} color="#0F3D26" style={{ marginBottom: 10, alignSelf: 'center' }} />

                                    <Text style={styles.eulaTitle}>Điều khoản sử dụng</Text>
                                    <Text style={styles.eulaText}>
                                        Kênh điều phối chung là môi trường liên lạc công việc. Bằng việc sử dụng tính năng này, bạn đồng ý tuân thủ quy định của công ty, <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>nghiêm cấm gửi nội dung phản cảm, quấy rối, xúc phạm hoặc lăng mạ người khác</Text>. Mọi vi phạm sẽ bị xử lý theo nội quy.
                                    </Text>

                                    <View style={styles.eulaDivider} />

                                    <Text style={styles.eulaTitleEn}>Terms of Use (EULA)</Text>
                                    <Text style={styles.eulaTextEn}>
                                        This is a corporate communication channel. By using this feature, you agree to <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>not post objectionable, abusive, harassing, or offensive content</Text>. Violations will result in public chat suspension.
                                    </Text>

                                    <View style={{ flexDirection: 'column', gap: 10 }}>
                                        <TouchableOpacity style={styles.agreeBtn} onPress={acceptEula} activeOpacity={0.8}>
                                            <Text style={styles.agreeBtnText}>TÔI ĐỒNG Ý / I AGREE</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.declineBtn}
                                            onPress={() => setIsOpen(false)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.declineBtnText}>Đóng lại / Decline</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                {!isNetworkAlive ? (
                                    <View style={styles.offlineBanner}>
                                        <Ionicons name="wifi-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.offlineText}>Không có kết nối mạng</Text>
                                    </View>
                                ) : isConnecting ? (
                                    <View style={styles.connectingBanner}>
                                        <ActivityIndicator size="small" color="#D97706" style={{ marginRight: 6 }} />
                                        <Text style={styles.connectingText}>Đang kết nối...</Text>
                                    </View>
                                ) : null}

                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    inverted={true}
                                    keyExtractor={item => item.id.toString()}
                                    contentContainerStyle={{ padding: 15 }}

                                    onEndReached={loadMoreMessages}
                                    onEndReachedThreshold={0.2} // Gọi hàm loadMore khi người dùng cuộn còn cách đỉnh 20%
                                    ListFooterComponent={ // Vì inverted nên Footer sẽ nằm ở TRÊN CÙNG
                                        isLoadingMore ? (
                                            <View style={{ paddingVertical: 15, alignItems: 'center' }}>
                                                <ActivityIndicator size="small" color="#0F3D26" />
                                            </View>
                                        ) : null
                                    }

                                    renderItem={({ item }) => {
                                        const isMine = item.user_id === user.id;
                                        const isAdmin = permissions.includes('FUNC_ADMIN_ALL');
                                        const hasReport = isAdmin && item.report_count > 0;

                                        return (
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onLongPress={() => handleLongPress(item)}
                                                style={[styles.msgRow, isMine ? styles.msgRight : styles.msgLeft]}
                                            >
                                                {!isMine && (
                                                    <Text style={styles.senderName}>{item.kho} • {item.sender_name}</Text>
                                                )}

                                                <View style={[
                                                    styles.bubble,
                                                    isMine ? styles.bubbleMine : styles.bubbleOther,
                                                    item.is_deleted && styles.bubbleDeleted,
                                                    hasReport && styles.bubbleReported,
                                                    item.is_pending && { opacity: 0.7 }
                                                ]}>
                                                    {hasReport && (
                                                        <Text style={styles.reportWarning}>
                                                            Bị báo cáo ({item.report_count} lần)
                                                        </Text>
                                                    )}
                                                    <Text style={[
                                                        styles.msgText,
                                                        isMine ? { color: '#FFF' } : { color: '#1E293B' },
                                                        item.is_deleted && { fontStyle: 'italic', color: '#64748B' }
                                                    ]}>
                                                        {item.content}
                                                    </Text>
                                                </View>
                                                <Text style={styles.timeText}>{item.time}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />

                                {/* KIỂM TRA TRẠNG THÁI BANNED ĐỂ HIỂN THỊ FOOTER TƯƠNG ỨNG */}
                                {isBanned ? (
                                    <View style={styles.bannedFooter}>
                                        <Ionicons name="lock-closed" size={24} color="#EF4444" style={{ marginBottom: 4 }} />
                                        <Text style={styles.bannedTitle}>Bạn đã bị hạn chế</Text>
                                        <Text style={styles.bannedText}>
                                            Tài khoản của bạn đã bị vô hiệu hóa quyền gửi tin nhắn do vi phạm quy định.
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.footer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder={isNetworkAlive ? "Nhập tin nhắn..." : "Chờ 4G/5G hoặc WiFi để nhắn ..."}
                                            value={inputText}
                                            placeholderTextColor="#9CA3AF"
                                            onChangeText={setInputText}
                                            onSubmitEditing={sendMessage}
                                            editable={isNetworkAlive}
                                            multiline
                                        />
                                        <TouchableOpacity
                                            style={[styles.sendBtn, (!inputText.trim() || !isNetworkAlive) && { backgroundColor: '#94A3B8' }]}
                                            onPress={sendMessage}
                                            disabled={!inputText.trim() || !isNetworkAlive}
                                        >
                                            <Ionicons name="send" size={18} color="#FFF" />
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

const styles = StyleSheet.create({
    fab: {
        position: 'absolute', bottom: 25, right: 20,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#0F3D26',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
        zIndex: 999
    },
    badge: {
        position: 'absolute', top: -2, right: -2,
        backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF',
        minWidth: 22, height: 22, borderRadius: 11,
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    // SỬA CONTAINER VÀ WINDOW ĐỂ THÍCH ỨNG VỚI PAGE SHEET CỦA iOS
    modalContainer: {
        flex: 1,
        backgroundColor: Platform.OS === 'ios' ? '#F8FAFC' : 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    chatWindow: {
        flex: Platform.OS === 'ios' ? 1 : undefined,
        height: Platform.OS === 'ios' ? undefined : '85%',
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: Platform.OS === 'ios' ? 0 : 20,
        borderTopRightRadius: Platform.OS === 'ios' ? 0 : 20,
        overflow: 'hidden'
    },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F3D26', padding: 16 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

    msgRow: { marginBottom: 15, maxWidth: '85%' },
    msgLeft: { alignSelf: 'flex-start' },
    msgRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },

    senderName: { fontSize: 11, color: '#64748B', marginBottom: 4, marginLeft: 4 },
    bubble: { padding: 12, borderRadius: 16 },
    bubbleMine: { backgroundColor: '#0F3D26', borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    bubbleDeleted: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed' },

    msgText: { fontSize: 14, lineHeight: 20 },
    timeText: { fontSize: 10, color: '#94A3B8', marginTop: 4, marginHorizontal: 4 },

    footer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E2E8F0', paddingBottom: Platform.OS === 'ios' ? 25 : 12 },
    input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0F3D26', justifyContent: 'center', alignItems: 'center', marginLeft: 10, alignSelf: 'flex-end' },

    bubbleReported: { borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    reportWarning: { fontSize: 11, fontWeight: 'bold', color: '#EF4444', marginBottom: 4 },

    offlineBanner: {
        backgroundColor: '#EF4444',
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 4,
    },
    offlineText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    connectingBanner: {
        backgroundColor: '#FEF3C7',
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 4,
    },
    connectingText: { color: '#D97706', fontSize: 12, fontWeight: '600' },
    closeButton: {
        padding: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Tạo nền kính mờ nhẹ cho nút X
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },

    eulaContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Màu nền đục 100% che kín mọi thứ
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    eulaBox: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    eulaTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F3D26', marginBottom: 8, textAlign: 'center' },
    eulaText: { fontSize: 13, color: '#334155', lineHeight: 20, textAlign: 'justify' },
    eulaDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },
    eulaTitleEn: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 6, textAlign: 'center' },
    eulaTextEn: { fontSize: 12, color: '#64748B', lineHeight: 18, fontStyle: 'italic', textAlign: 'justify', marginBottom: 20 },
    agreeBtn: {
        backgroundColor: '#0F3D26',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    agreeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    declineBtn: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    declineBtnText: {
        color: '#64748B', // Màu xám nhạt cho nút phụ
        fontWeight: '600',
        fontSize: 14
    },

    bannedFooter: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderTopWidth: 1,
        borderColor: '#FCA5A5',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    },
    bannedTitle: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4
    },
    bannedText: {
        color: '#7F1D1D',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 12
    },
    appealBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EF4444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20
    },
    appealBtnText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600'
    }
});

