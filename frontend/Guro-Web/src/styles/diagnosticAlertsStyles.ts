export const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    width: '100%',
  },
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    height: '100%',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    overflowY: 'auto' as const,
    maxHeight: '220px',
  },
  empty: {
    padding: '16px',
    color: '#10B981',
    fontSize: '13px',
    fontWeight: 600,
  },
  alertItem: {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
  },
  alertText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
  },
  alertTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  alertDesc: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '15px',
  },
};
