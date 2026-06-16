export const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: '12px',
    color: '#94A3B8',
    marginBottom: '8px',
  },
  gridWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    maxWidth: '220px',
  },
  cell: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'transform 0.1s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
    marginTop: '8px',
  },
  legendText: {
    fontSize: '10px',
    color: '#64748B',
    margin: '0 4px',
  },
};
