import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 16,
  },
  contentBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#EEF2F6',
  },
  backButton: {
    backgroundColor: '#1E293B',
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 14,
  },
});
