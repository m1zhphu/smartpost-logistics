import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UpdateStatusStyles from '../styles/UpdateStatusStyles';
import { deliveryService } from '../services/deliveryService';
import { uploadService } from '../services/uploadService';
import { useUser } from '../context/UserContext';
import { COLORS } from '../constants/colors';
import { isRouteAllowed } from '../utils/roleUtils';

export default function UpdateStatusScreen({ route, navigation }) {
    const { user } = useUser();
    const { waybill, podUri } = route.params || {};
    const [statusType, setStatusType] = useState('SUCCESS');
    const expectedCod = Number(waybill?.cod_amount) || 0;
    const [codMode, setCodMode] = useState('FULL');
    const [actualCod, setActualCod] = useState(expectedCod.toString());
    const [successNote, setSuccessNote] = useState('');
    const [failureNote, setFailureNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isRouteAllowed(user, 'UpdateStatus')) {
            Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền truy cập trang này.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [user]);

    useEffect(() => {
        if (codMode === 'FULL') setActualCod(expectedCod.toString());
        if (codMode === 'ZERO') setActualCod('0');
    }, [codMode, expectedCod]);

    if (!waybill) {
        return <View style={{ flex: 1 }} />;
    }

    const formatMoney = (value) => {
        const num = Number(String(value).replace(/[^0-9]/g, ''));
        return num.toLocaleString('vi-VN');
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            if (statusType === 'FAILED') {
                if (!failureNote.trim()) {
                    Alert.alert('Lỗi', 'Vui lòng nhập lý do giao thất bại.');
                    return;
                }

                await deliveryService.reportFailure(user.token, {
                    waybill_code: waybill.waybill_code,
                    reason_code: 'DELIVERY_FAILED',
                    note: failureNote.trim(),
                });

                Alert.alert('Ghi nhận', 'Đã báo cáo giao thất bại.');
            } else {
                if (!podUri) {
                    Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh kiện hàng (POD).');
                    return;
                }

                const uploadedUrl = await uploadService.uploadPOD(user.token, podUri);

                await deliveryService.confirmSuccess(user.token, {
                    waybill_code: waybill.waybill_code,
                    actual_cod_collected: Number(String(actualCod).replace(/[^0-9]/g, '')),
                    pod_image_url: uploadedUrl,
                    note: successNote.trim(),
                });

                Alert.alert('Thành công', `Chốt đơn ${waybill.waybill_code} thành công.`);
            }

            navigation.navigate('TaskList');
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Lỗi hệ thống.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={UpdateStatusStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

            <View style={UpdateStatusStyles.headerArea}>
                <View style={UpdateStatusStyles.headerCircleDecoration} />
                <View style={UpdateStatusStyles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={UpdateStatusStyles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={UpdateStatusStyles.headerSubTitle}>CẬP NHẬT TRẠNG THÁI</Text>
                        <Text style={UpdateStatusStyles.headerTitle}>{waybill.waybill_code}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <View style={UpdateStatusStyles.customerBar}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                <Text style={UpdateStatusStyles.custName} numberOfLines={1}>{waybill.receiver_name}</Text>
                <Text style={UpdateStatusStyles.custPhone}>{waybill.receiver_phone}</Text>
                <View style={UpdateStatusStyles.codBadge}>
                    <Text style={UpdateStatusStyles.codBadgeText}>COD: {expectedCod >= 1000 ? `${expectedCod / 1000}k` : expectedCod}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={UpdateStatusStyles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={UpdateStatusStyles.statusToggleCard}>
                    <TouchableOpacity
                        style={[UpdateStatusStyles.toggleBtn, statusType === 'SUCCESS' && UpdateStatusStyles.toggleBtnActiveSuccess]}
                        onPress={() => setStatusType('SUCCESS')}
                    >
                        <Ionicons
                            name={statusType === 'SUCCESS' ? 'checkmark' : 'checkmark-outline'}
                            size={20}
                            color={statusType === 'SUCCESS' ? '#FFF' : '#7b867e'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[UpdateStatusStyles.toggleText, statusType === 'SUCCESS' && { color: '#FFF' }]}>Giao thành công</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[UpdateStatusStyles.toggleBtn, statusType === 'FAILED' && UpdateStatusStyles.toggleBtnActiveFail]}
                        onPress={() => setStatusType('FAILED')}
                    >
                        <Ionicons
                            name={statusType === 'FAILED' ? 'close' : 'close-outline'}
                            size={20}
                            color={statusType === 'FAILED' ? '#FFF' : '#7b867e'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[UpdateStatusStyles.toggleText, statusType === 'FAILED' && { color: '#FFF' }]}>Giao thất bại</Text>
                    </TouchableOpacity>
                </View>

                {statusType === 'SUCCESS' ? (
                    <>
                        <View style={UpdateStatusStyles.card}>
                            <View style={UpdateStatusStyles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={UpdateStatusStyles.dotWarning} />
                                    <Text style={UpdateStatusStyles.cardTitleWarning}>TIỀN COD THU THỰC TẾ</Text>
                                </View>
                                <Text style={UpdateStatusStyles.expectedText}>Dự kiến: {expectedCod.toLocaleString('vi-VN')} đ</Text>
                            </View>

                            <View style={UpdateStatusStyles.codInputWrapper}>
                                <TextInput
                                    style={UpdateStatusStyles.codInput}
                                    keyboardType="numeric"
                                    value={formatMoney(actualCod)}
                                    onChangeText={(text) => {
                                        setActualCod(text.replace(/[^0-9]/g, ''));
                                        setCodMode('MANUAL');
                                    }}
                                    editable={codMode === 'MANUAL'}
                                />
                                <Text style={UpdateStatusStyles.codCurrency}>đ</Text>
                            </View>

                            <View style={UpdateStatusStyles.quickActionRow}>
                                <TouchableOpacity style={[UpdateStatusStyles.quickBtn, codMode === 'FULL' && UpdateStatusStyles.quickBtnActive]} onPress={() => setCodMode('FULL')}>
                                    <Text style={[UpdateStatusStyles.quickBtnText, codMode === 'FULL' && UpdateStatusStyles.quickBtnTextActive]}>Đủ tiền</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[UpdateStatusStyles.quickBtn, codMode === 'MANUAL' && UpdateStatusStyles.quickBtnActive]} onPress={() => setCodMode('MANUAL')}>
                                    <Text style={[UpdateStatusStyles.quickBtnText, codMode === 'MANUAL' && UpdateStatusStyles.quickBtnTextActive]}>Nhập tay</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[UpdateStatusStyles.quickBtn, codMode === 'ZERO' && UpdateStatusStyles.quickBtnActive]} onPress={() => setCodMode('ZERO')}>
                                    <Text style={[UpdateStatusStyles.quickBtnText, codMode === 'ZERO' && UpdateStatusStyles.quickBtnTextActive]}>Không thu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={UpdateStatusStyles.card}>
                            <View style={UpdateStatusStyles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={UpdateStatusStyles.dotPrimary} />
                                    <Text style={UpdateStatusStyles.cardTitlePrimary}>ẢNH BẰNG CHỨNG POD</Text>
                                </View>
                                <View style={UpdateStatusStyles.requiredBadge}>
                                    <Text style={UpdateStatusStyles.requiredText}>Bắt buộc</Text>
                                </View>
                            </View>

                            {podUri ? (
                                <View style={{ position: 'relative', marginBottom: 15 }}>
                                    <Image source={{ uri: podUri }} style={UpdateStatusStyles.podImage} />
                                    <TouchableOpacity style={UpdateStatusStyles.reCamBtn} onPress={() => navigation.navigate('CameraPOD', { waybill })}>
                                        <Ionicons name="camera-reverse" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={UpdateStatusStyles.cameraBox} onPress={() => navigation.navigate('CameraPOD', { waybill })}>
                                    <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                                    <Text style={UpdateStatusStyles.cameraBoxTitle}>Chụp ảnh kiện hàng</Text>
                                    <Text style={UpdateStatusStyles.cameraBoxSub}>Ảnh phải thấy rõ mã vận đơn</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={UpdateStatusStyles.galleryBtn} onPress={() => navigation.navigate('CameraPOD', { waybill })}>
                                <Ionicons name="image-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={UpdateStatusStyles.galleryBtnText}>Mở lại camera POD</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={UpdateStatusStyles.card}>
                            <View style={UpdateStatusStyles.cardHeaderRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={UpdateStatusStyles.dotGray} />
                                    <Text style={UpdateStatusStyles.cardTitleGray}>GHI CHÚ THÊM</Text>
                                </View>
                            </View>
                            <TextInput
                                style={UpdateStatusStyles.inputNotePlain}
                                multiline
                                placeholder="Nhập thêm thông tin nếu cần..."
                                value={successNote}
                                onChangeText={setSuccessNote}
                            />
                        </View>
                    </>
                ) : (
                    <View style={UpdateStatusStyles.card}>
                        <View style={UpdateStatusStyles.cardHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={UpdateStatusStyles.dotDanger} />
                                <Text style={UpdateStatusStyles.cardTitleDanger}>LÝ DO THẤT BẠI</Text>
                            </View>
                            <View style={UpdateStatusStyles.requiredBadge}>
                                <Text style={UpdateStatusStyles.requiredText}>Bắt buộc</Text>
                            </View>
                        </View>
                        <TextInput
                            style={UpdateStatusStyles.inputNoteArea}
                            multiline
                            placeholder="Khách không nghe máy, boom hàng, sai địa chỉ..."
                            value={failureNote}
                            onChangeText={setFailureNote}
                        />
                    </View>
                )}
            </ScrollView>

            <View style={UpdateStatusStyles.footer}>
                {statusType === 'SUCCESS' ? (
                    <View style={UpdateStatusStyles.summaryBanner}>
                        <Text style={UpdateStatusStyles.summaryBannerText}>Tổng thu: {formatMoney(actualCod)} đ</Text>
                        <Ionicons name="checkmark" size={18} color={COLORS.secondary} />
                    </View>
                ) : null}
                <TouchableOpacity
                    style={[
                        UpdateStatusStyles.submitBtn,
                        { backgroundColor: statusType === 'FAILED' ? COLORS.error : COLORS.secondary },
                    ]}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons
                                name={statusType === 'SUCCESS' ? 'checkbox-outline' : 'close-circle-outline'}
                                size={22}
                                color="#FFF"
                                style={{ marginRight: 8 }}
                            />
                            <Text style={UpdateStatusStyles.submitText}>Xác nhận chốt đơn</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
