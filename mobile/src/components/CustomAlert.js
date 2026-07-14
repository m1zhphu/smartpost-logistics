import React, { useState, useImperativeHandle, forwardRef } from 'react';


import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const PRIMARY = COLORS.primary || "#1B5E20";
const { width } = Dimensions.get('window');

let alertRef;

export const CustomAlert = forwardRef((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [buttons, setButtons] = useState([]);
    const [options, setOptions] = useState({});

    useImperativeHandle(ref, () => ({
        show: (t, m, btns, opts) => {
            setTitle(t || 'Thông báo');
            setMessage(m || '');
            setButtons(btns && btns.length > 0 ? btns : [{ text: 'OK', onPress: () => {} }]);
            setOptions(opts || {});
            setVisible(true);
        },
        hide: () => setVisible(false)
    }));

    // Static methods to call without hooks
    CustomAlert.setRef = (r) => { alertRef = r; };
    CustomAlert.alert = (t, m, btns, opts) => {
        if (alertRef) {
            alertRef.show(t, m, btns, opts);
        } else {
            console.warn("CustomAlert reference is not set! Fallback to native Alert.");
            import('react-native').then(({ Alert }) => {
                CustomAlert.alert(t, m, btns, opts);
            });
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={() => {
                if (options.cancelable) setVisible(false);
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="information-circle-outline" size={36} color={PRIMARY} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}
                    
                    {(() => {
                        const shouldStackVertically = buttons.length > 2 || buttons.some(btn => btn.text && btn.text.length > 15);
                        const sortedButtons = shouldStackVertically
                            ? [...buttons].sort((a, b) => (a.style === 'cancel' ? 1 : b.style === 'cancel' ? -1 : 0))
                            : buttons;

                        return (
                            <View style={[
                                styles.buttonRow,
                                shouldStackVertically && { flexDirection: 'column' }
                            ]}>
                                {sortedButtons.map((btn, index) => {
                                    const isDestructive = btn.style === 'destructive';
                                    const isCancel = btn.style === 'cancel';
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.button,
                                                isCancel ? styles.buttonCancel : styles.buttonPrimary,
                                                isDestructive && styles.buttonDestructive,
                                                shouldStackVertically 
                                                    ? { width: '100%', marginBottom: index < sortedButtons.length - 1 ? 10 : 0 }
                                                    : { flex: 1, marginLeft: index > 0 ? 10 : 0 }
                                            ]}
                                            onPress={() => {
                                                setVisible(false);
                                                if (btn.onPress) btn.onPress();
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                styles.buttonText,
                                                isCancel ? styles.buttonTextCancel : styles.buttonTextPrimary,
                                                isDestructive && styles.buttonTextDestructive
                                            ]}>
                                                {btn.text || 'OK'}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        );
                    })()}
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertBox: {
        width: width - 60,
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: { elevation: 6 },
        }),
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: PRIMARY,
    },
    buttonCancel: {
        backgroundColor: '#F1F5F9',
    },
    buttonDestructive: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    buttonTextPrimary: {
        color: '#FFFFFF',
    },
    buttonTextCancel: {
        color: '#475569',
    },
    buttonTextDestructive: {
        color: '#FFFFFF',
    },
});
