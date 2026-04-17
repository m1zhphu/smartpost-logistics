import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function AppNavigator() {
  const token = useAuthStore((state: any) => state.token);
  const loadToken = useAuthStore((state: any) => state.loadToken);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F9' }}>
        {/* Đổi màu ActivityIndicator theo tone Deep Blue */}
        <ActivityIndicator size="large" color="#3151D8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}