import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { BORDER_RADIUS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../constants/theme';

const SuccessStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
  iconContainer: { marginBottom: SPACING.lg },
  circleBg: { width: SPACING.xxl * 2, height: SPACING.xxl * 2, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  contentBox: { width: '100%', alignItems: 'center', gap: SPACING.sm },
  title: { color: COLORS.successAccent, fontSize: TYPOGRAPHY.fontSize.headingSm, lineHeight: TYPOGRAPHY.lineHeight.headingSm, fontWeight: TYPOGRAPHY.fontWeight.bold, textAlign: 'center' },
  subtitle: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.fontSize.body, lineHeight: TYPOGRAPHY.lineHeight.body, textAlign: 'center', fontWeight: TYPOGRAPHY.fontWeight.regular },
  ticketContainer: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.md, ...SHADOWS.sm },
  ticketHeader: { backgroundColor: COLORS.greenSubtle, padding: SPACING.sm, alignItems: 'center' },
  ticketLabel: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.caption, lineHeight: TYPOGRAPHY.lineHeight.caption, fontWeight: TYPOGRAPHY.fontWeight.bold, textTransform: 'uppercase' },
  ticketBody: { padding: SPACING.lg, alignItems: 'center' },
  trackingCode: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.heading, lineHeight: TYPOGRAPHY.lineHeight.heading, fontWeight: TYPOGRAPHY.fontWeight.bold },
  ticketFooter: { flexDirection: 'row', padding: SPACING.sm, justifyContent: 'center', alignItems: 'center', gap: SPACING.xs, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  ticketFooterText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.fontSize.caption, lineHeight: TYPOGRAPHY.lineHeight.caption, fontWeight: TYPOGRAPHY.fontWeight.medium },
  buttonGroup: { width: '100%', marginTop: SPACING.md, gap: SPACING.md },
  btnPrimary: { minHeight: TOUCH_TARGET.androidMin },
  btnOutline: { minHeight: TOUCH_TARGET.androidMin },
});

export default SuccessStyles;
