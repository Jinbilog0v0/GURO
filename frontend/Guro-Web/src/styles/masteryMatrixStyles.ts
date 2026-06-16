export const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    width: '100%',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
    textAlign: 'left' as const,
  },
  th: {
    padding: '14px 18px',
    backgroundColor: 'var(--bg-main)',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-muted)',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },
  stickyCol: {
    position: 'sticky' as const,
    left: 0,
    zIndex: 1,
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
  },
  td: {
    padding: '12px 18px',
    color: 'var(--text-main)',
    whiteSpace: 'nowrap' as const,
  },
  studentCell: {
    fontWeight: 600,
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  cellBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 12px',
    borderRadius: '8px',
    minWidth: '55px',
    fontSize: '12px',
  },
};
