import { useColorScheme } from 'react-native';
import { AppColors } from './theme/colors';

export const useAppTheme = () => {
  const colorScheme = useColorScheme() || 'light';
  return AppColors[colorScheme];
};