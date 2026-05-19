import React, { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Animated, StatusBar, StyleSheet, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { CommonActions } from '@react-navigation/native';
import styles from '../styles/SuccessStyles';
import { useQueue } from '../context/QueueContext';
import { checkNetworkConnection } from '../utils/networkUtils';


const { width } = Dimensions.get('window');

export default function SuccessScreen({ navigation, route }) {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    const { removeQueueItem } = useQueue();

    const { trackingNumber } = route.params || {};

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();

        navigation.setOptions({
            gestureEnabled: false,
        });

        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
                navigation.navigate('Home');
            }
        });

        return unsubscribe;
    }, [navigation]);

    const handleViewDetails = async () => {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
            return;
        }
        navigation.navigate('OrderDetail', { trackingNumber });
    };


    const goHome = () => {
        navigation.navigate('Home');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f3d26" />

            <View style={styles.iconContainer}>
                <Animated.View style={[styles.circleBg, { transform: [{ scale: scaleValue }] }]}>
                    <Ionicons name="checkmark" size={60} color="white" />
                </Animated.View>
            </View>

            <Animated.View style={[styles.contentBox, { opacity: opacityValue, transform: [{ translateY }] }]}>
                <Text style={styles.title}>Thành công!</Text>
                <Text style={styles.subtitle}>Đơn hàng đã được khởi tạo trên hệ thống.</Text>

                <View style={styles.ticketContainer}>
                    <View style={styles.ticketHeader}>
                        <Text style={styles.ticketLabel}>MÃ VẬN ĐƠN</Text>
                    </View>
                    <View style={styles.ticketBody}>
                        <Text style={styles.trackingCode}>{trackingNumber || '---'}</Text>
                    </View>
                    <View style={styles.dashedLine} />
                    <View style={styles.ticketFooter}>
                        <Ionicons name="cube-outline" size={14} color="#666" />
                        <Text style={styles.ticketFooterText}>Sẵn sàng giao hàng</Text>
                    </View>
                </View>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={handleViewDetails}
                    >
                        <Text style={styles.btnOutlineText}>Xem chi tiết</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnPrimary} onPress={goHome}>
                        <Text style={styles.btnPrimaryText}>VỀ TRANG CHỦ</Text>
                        <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                </View>
            </Animated.View>
            <Toast />
        </View>
    );
}

