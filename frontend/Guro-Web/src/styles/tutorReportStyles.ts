export const styles = {
  container: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
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
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  langBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  langHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  flag: {
    fontSize: '16px',
  },
  langName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  reportText: {
    fontSize: '13px',
    color: '#EEF2F6',
    lineHeight: '20px',
  },
  tipBox: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
    border: '1px solid rgba(236, 72, 153, 0.15)',
    borderRadius: '10px',
  },
  tipText: {
    fontSize: '12px',
    color: '#F9A8D4',
    lineHeight: '18px',
    fontWeight: 500,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    height: '100%',
    width: '100%',
  },
};
