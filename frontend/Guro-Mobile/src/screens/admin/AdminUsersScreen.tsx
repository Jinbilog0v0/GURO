import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Users,
  Search,
  KeyRound,
  Trash2,
  Edit3,
  X,
  School,
  Lock,
  UserCheck,
  ArrowLeft,
} from 'lucide-react-native';
import { adminService, UserRecord } from '../../services/adminService';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { toast } from '../../components';

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  teacher: { bg: 'rgba(17,66,142,0.1)', text: '#11428E', label: 'Teacher' },
  parent: { bg: 'rgba(22,163,74,0.1)', text: '#16A34A', label: 'Parent' },
  student: { bg: 'rgba(232,137,12,0.1)', text: '#E8890C', label: 'Student' },
  admin: { bg: 'rgba(160,19,34,0.1)', text: '#A01322', label: 'Admin' },
  developer: { bg: 'rgba(147,51,234,0.1)', text: '#9333EA', label: 'Developer' },
  'lesson-builder': { bg: 'rgba(79,70,229,0.1)', text: '#4F46E5', label: 'Lesson Builder' },
};

export function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');
  const [search, setSearch] = useState('');

  // Role Edit Modal
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState('teacher');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Password Reset Modal
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const loadUsers = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const result = await adminService.getUsers(selectedRole, search);
    if (result.success) {
      setUsers(result.users || []);
    } else {
      toast.error(result.error || 'Failed to load user accounts.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers(true);
  };

  const handleSearchSubmit = () => {
    loadUsers();
  };

  const openRoleModal = (user: UserRecord) => {
    setEditingUser(user);
    setNewRole(user.role);
    setRoleModalVisible(true);
  };

  const submitUpdateRole = async () => {
    if (!editingUser) return;
    setUpdatingRole(true);
    const res = await adminService.updateUserRole(editingUser.id, newRole);
    setUpdatingRole(false);
    if (res.success) {
      toast.success(`User role updated to ${newRole}.`);
      setRoleModalVisible(false);
      loadUsers(true);
    } else {
      toast.error(res.error || 'Failed to update user role.');
    }
  };

  const openResetModal = (user: UserRecord) => {
    setResettingUser(user);
    setNewPassword('');
    setResetModalVisible(true);
  };

  const submitResetPassword = async () => {
    if (!resettingUser) return;
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) {
      toast.error('Password must be at least 8 chars with letters, numbers, & symbols.');
      return;
    }
    setSubmittingReset(true);
    const res = await adminService.resetUserPassword(resettingUser.id, newPassword);
    setSubmittingReset(false);
    if (res.success) {
      toast.success(`Password reset for ${resettingUser.name}.`);
      setResetModalVisible(false);
    } else {
      toast.error(res.error || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = (user: UserRecord) => {
    Alert.alert(
      'Delete User Account',
      `Are you sure you want to permanently delete ${user.name} (${user.email})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteUser(user.id);
            if (res.success) {
              toast.success(`User ${user.name} deleted.`);
              loadUsers(true);
            } else {
              toast.error(res.error || 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Overview')}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Users size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>User Directory</Text>
            <Text style={styles.subtitle}>Manage student, teacher, and parent accounts</Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email, or user ID…"
            placeholderTextColor={Colors.textDark}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadUsers(); }} style={styles.clearSearchBtn}>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Role Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'teacher', label: 'Teachers' },
          { id: 'parent', label: 'Parents' },
          { id: 'student', label: 'Students' },
          { id: 'admin', label: 'Admins' },
        ].map((tab) => {
          const isActive = selectedRole === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setSelectedRole(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Loading directory…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accentSecondary} />}
        >
          {users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={36} color={Colors.textDark} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>No accounts match the current filter or search criteria.</Text>
            </View>
          ) : (
            users.map((item) => {
              const roleMeta = ROLE_COLORS[item.role] || {
                bg: 'rgba(91,97,112,0.1)',
                text: Colors.textMuted,
                label: item.role,
              };

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: roleMeta.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: roleMeta.text }]}>
                        {roleMeta.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>ID: {item.userId}</Text>
                    {item.classroomId && (
                      <View style={styles.classBadge}>
                        <School size={11} color={Colors.accentPrimary} />
                        <Text style={styles.classBadgeText}>{item.classroomId}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openRoleModal(item)}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={13} color={Colors.textMain} />
                      <Text style={styles.actionBtnText}>Change Role</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openResetModal(item)}
                      activeOpacity={0.7}
                    >
                      <KeyRound size={13} color={Colors.textMain} />
                      <Text style={styles.actionBtnText}>Reset Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteUser(item)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Edit Role Modal */}
      <Modal visible={roleModalVisible} transparent animationType="fade" onRequestClose={() => setRoleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setRoleModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconBox}>
                  <Edit3 size={18} color={Colors.accentPrimary} />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle}>Change Role</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>{editingUser?.name}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close role dialog"
              >
                <X size={18} color={Colors.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDesc}>Select new security and access role:</Text>

              <View style={styles.roleOptions}>
                {['student', 'teacher', 'parent', 'admin', 'developer'].map((r) => {
                  const isSelected = newRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                      onPress={() => setNewRole(r)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.roleOptionText, isSelected && styles.roleOptionTextSelected]}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                      {isSelected && <UserCheck size={16} color={Colors.accentPrimary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setRoleModalVisible(false)}
                  disabled={updatingRole}
                >
                  <Text style={styles.modalDismissText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, updatingRole && { opacity: 0.6 }]}
                  onPress={submitUpdateRole}
                  disabled={updatingRole}
                >
                  {updatingRole ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Role</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Reset Modal */}
      <Modal visible={resetModalVisible} transparent animationType="fade" onRequestClose={() => setResetModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setResetModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconBox}>
                  <KeyRound size={18} color={Colors.accentPrimary} />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle}>Reset Password</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>{resettingUser?.email}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setResetModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close password dialog"
              >
                <X size={18} color={Colors.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDesc}>
                Enter a new temporary password (min 8 characters, letters, numbers, and symbols):
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="e.g., TempPass#2026!"
                placeholderTextColor={Colors.textDark}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setResetModalVisible(false)}
                  disabled={submittingReset}
                >
                  <Text style={styles.modalDismissText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, submittingReset && { opacity: 0.6 }]}
                  onPress={submitResetPassword}
                  disabled={submittingReset}
                >
                  {submittingReset ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backBtn: {
    padding: 6,
    marginRight: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(160,19,34,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    height: 38,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterTabsRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  filterTab: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  filterTabActive: {
    backgroundColor: 'rgba(160,19,34,0.1)',
    borderColor: 'rgba(160,19,34,0.3)',
  },
  filterTabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  emptyContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    fontWeight: '700',
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  userName: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  userEmail: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(17,66,142,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  classBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.accentPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  actionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(17,66,142,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalInput: {
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    height: 42,
  },
  roleOptions: {
    gap: 6,
    marginVertical: Spacing.xs,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgMain,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionSelected: {
    borderColor: Colors.accentPrimary,
    backgroundColor: 'rgba(17,66,142,0.06)',
  },
  roleOptionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
  },
  roleOptionTextSelected: {
    color: Colors.accentPrimary,
    fontWeight: '700',
  },
  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  modalDismissBtn: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalDismissText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
  },
  modalSaveBtn: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
