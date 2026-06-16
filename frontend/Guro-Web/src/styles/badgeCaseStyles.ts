export const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  badgeCard: {
    display: 'flex',
    gap: '14px',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid',
    transition: 'all 0.2s ease',
  },
  unlockedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  lockedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.6,
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  emoji: {
    fontSize: '28px',
  },
  checkIcon: {
    position: 'absolute' as const,
    bottom: '-3px',
    right: '-3px',
    color: '#10B981',
    fill: '#060913',
  },
  lockIcon: {
    position: 'absolute' as const,
    bottom: '-3px',
    right: '-3px',
    color: '#64748B',
  },
  badgeInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
    flex: 1,
  },
  badgeName: {
    fontSize: '13px',
    fontWeight: 700,
  },
  badgeDesc: {
    fontSize: '11px',
    color: '#94A3B8',
    lineHeight: '15px',
  },
  statusText: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
};
