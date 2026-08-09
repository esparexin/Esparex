import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subDetailContainer: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0066CC',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  expiredBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginTop: 4,
  },
  emptySubContainer: {
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginVertical: 4,
  },
  tileSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0066CC',
  },
  itemDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
