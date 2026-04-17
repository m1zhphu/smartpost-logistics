export const AppColors = {
  light: {
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#1f2937',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    primary: '#2563eb',
    primaryText: '#ffffff',
    success: '#16a34a',
    successText: '#ffffff',
    danger: '#dc2626',
    warning: '#d97706',
    border: '#e5e7eb',
    shadow: '#6b7280',
  },
  dark: {
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    primary: '#3b82f6',
    primaryText: '#ffffff',
    success: '#22c55e',
    successText: '#ffffff',
    danger: '#ef4444',
    warning: '#f59e0b',
    border: '#374151',
    shadow: '#000',
  }
};

export type Theme = typeof AppColors.light;