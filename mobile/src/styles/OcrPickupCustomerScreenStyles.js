import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

const PRIMARY = COLORS.primary || '#1B5E20';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingHorizontal: 20, paddingBottom: 22,
    alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 42, borderBottomRightRadius: 42,
    shadowColor: '#ebebeb', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 5, zIndex: 10,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  headerButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    marginBottom: 4, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },
  emptyIconBox: {
    width: 66, height: 66, borderRadius: 22,
    backgroundColor: '#F1F5F9', alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
  },
  emptyText: { color: '#0F172A', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySubtext: { color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: `${PRIMARY}15`, alignItems: 'center',
    justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: `${PRIMARY}30`,
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: PRIMARY },
  cardInfo: { flex: 1, marginRight: 8 },
  customerName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  customerCode: { fontSize: 12, fontWeight: '700', color: PRIMARY, marginBottom: 2 },
  customerPhone: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  cardFooter: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 8,
    paddingVertical: 5, borderWidth: 1, borderColor: '#E2E8F0',
  },
  statText: { fontSize: 11, fontWeight: '800' },
});
