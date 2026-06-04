import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { BORDER_RADIUS, SHADOWS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../constants/theme';

const WarehouseDashboardStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  headerArea: { paddingHorizontal: SPACING.md, paddingTop: SPACING.xl, paddingBottom: SPACING.lg, backgroundColor: COLORS.headerBg },
  headerTitle: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.headingSm, lineHeight: TYPOGRAPHY.lineHeight.headingSm, fontWeight: TYPOGRAPHY.fontWeight.bold },
  headerSubtitle: { color: COLORS.greenSubtleText, fontSize: TYPOGRAPHY.fontSize.bodySm, lineHeight: TYPOGRAPHY.lineHeight.bodySm, fontWeight: TYPOGRAPHY.fontWeight.medium },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  sectionTitle: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.body, lineHeight: TYPOGRAPHY.lineHeight.body, fontWeight: TYPOGRAPHY.fontWeight.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.sm },
  statCard: { width: '48%', backgroundColor: COLORS.cardBg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  statLabel: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.fontSize.caption, lineHeight: TYPOGRAPHY.lineHeight.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  statValue: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.headingSm, lineHeight: TYPOGRAPHY.lineHeight.headingSm, fontWeight: TYPOGRAPHY.fontWeight.bold },
  actionList: { gap: SPACING.sm },
  actionCard: { minHeight: TOUCH_TARGET.androidMin, backgroundColor: COLORS.cardBg, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.sm },
  iconWrap: { width: TOUCH_TARGET.androidMin, height: TOUCH_TARGET.androidMin, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.greenSubtle, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  actionLabel: { flex: 1, color: COLORS.textMain, fontSize: TYPOGRAPHY.fontSize.bodySm, lineHeight: TYPOGRAPHY.lineHeight.bodySm, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  activitySection: { gap: SPACING.sm },
  activityRow: { backgroundColor: COLORS.cardBg, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.sm },
  activityLabel: { color: COLORS.neutralMid, fontSize: TYPOGRAPHY.fontSize.bodySm, lineHeight: TYPOGRAPHY.lineHeight.bodySm, fontWeight: TYPOGRAPHY.fontWeight.medium },
  activityValue: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.body, lineHeight: TYPOGRAPHY.lineHeight.body, fontWeight: TYPOGRAPHY.fontWeight.bold },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.sm },
  skeletonCard: { width: '48%', backgroundColor: COLORS.cardBg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  skeletonLine: { marginTop: SPACING.sm },
});

export default WarehouseDashboardStyles;
