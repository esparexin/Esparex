import { StyleSheet } from 'react-native';
import { base, semantic } from '@esparex/design-tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: base.slate[50],
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
    color: base.slate[500],
  },
  card: {
    backgroundColor: base.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: base.slate[200],
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: base.slate[500],
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
    backgroundColor: semantic.light['info-subtle'],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.light.action,
  },
  statusBadge: {
    backgroundColor: semantic.light['success-subtle'],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  expiredBadge: {
    backgroundColor: base.brand[50],
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: semantic.light.success,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: base.slate[900],
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: semantic.light.action,
    marginTop: 4,
  },
  emptySubContainer: {
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: base.slate[900],
  },
  emptySubtext: {
    fontSize: 12,
    color: base.slate[500],
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    backgroundColor: base.slate[50],
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: base.slate[100],
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: base.slate[500],
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '900',
    color: base.slate[900],
    marginVertical: 4,
  },
  tileSub: {
    fontSize: 10,
    color: base.slate[400],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: base.slate[100],
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: base.slate[900],
  },
  itemSub: {
    fontSize: 12,
    color: base.slate[500],
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: semantic.light.action,
  },
  itemDate: {
    fontSize: 10,
    color: base.slate[400],
    marginTop: 2,
  },
});
