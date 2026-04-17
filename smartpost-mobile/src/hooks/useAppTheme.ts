import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeType } from './theme/colors';

export const useAppTheme = (): ThemeType => {
  const colorScheme = useColorScheme();

  // Tự động nhận diện giao diện hệ thống đang là Sáng hay Tối
  if (colorScheme === 'dark') {
    return darkColors;
  }

  // Mặc định trả về giao diện Sáng
  return lightColors;
};