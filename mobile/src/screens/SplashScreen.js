import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, ImageBackground, Image } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen({ navigation }) {
    const { autoLogin, isWarehouseStaff } = useUser();

    useEffect(() => {
        const attemptAutoLogin = async () => {
            try {
                const result = await autoLogin();
                if (result && result.success) {
                    const tutorialDone = await AsyncStorage.getItem("tutorial_done");
                    const isTutorialCompleted = tutorialDone === "true";

                    let nextScreen = "Tutorial";

                    if (isTutorialCompleted) {
                        const userRoles = result.profileData.roles || [];
                        const latestPermissions = [];

                        userRoles.forEach((role) => {
                            (role.permissions || []).forEach((p) => {
                                if (!latestPermissions.includes(p.code)) {
                                    latestPermissions.push(p.code);
                                }
                            });
                        });

                        const hasWarehousePerms = isWarehouseStaff(latestPermissions);

                        if (result.userType === "customer") {
                            nextScreen = "CustomerHome";
                        } else if (result.userType === "admin") {
                            nextScreen = "Home";
                        } else if (hasWarehousePerms) {
                            nextScreen = "WarehouseHome";
                        } else {
                            nextScreen = "Home";
                        }
                    }

                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: nextScreen }],
                        })
                    );
                } else {
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        })
                    );
                }
            } catch (error) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    })
                );
            }
        };

        attemptAutoLogin();
    }, []);

    return (
        <ImageBackground
            source={require('../../assets/DongSon2.png')}
            style={styles.backgroundImage}
            imageStyle={{ opacity: 0.08, resizeMode: 'cover' }}
        >
            <StatusBar style="dark" />
            <View style={styles.container}>
                <Image
                    source={require('../../assets/CompanyLogo4.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <ActivityIndicator size="large" color="#1b5e20" style={{ marginTop: 20 }} />
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 250,
        height: 100,
    }
});
