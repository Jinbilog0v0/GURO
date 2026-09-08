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
  School,
  Search,
  Lock,
  Unlock,
  Users,
  Trash2,
  Edit3,
  Calculator,
  BookOpen,
  X,
  UserCheck,
  ArrowLeft,
} from 'lucide-react-native';
import { adminService, ClassroomRecord } from '../../services/adminService';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { toast } from '../../components';

export function AdminClassroomsScreen() {
  const navigation = useNavigation<any>();
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [search, setSearch] = useState('');

  // Reassign Modal
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomRecord | null>(null);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  const loadClassrooms = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const result = await adminService.getClassrooms(selectedSubject, search);
    if (result.success) {
      setClassrooms(result.classrooms || []);
    } else {
      toast.error(result.error || 'Failed to load school classrooms.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadClassrooms();
  }, [selectedSubject]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadClassrooms(true);
  };

  const handleSearchSubmit = () => {
    loadClassrooms();
  };

  const handleToggleLock = async (c: ClassroomRecord) => {
    const res = await adminService.toggleLockClassroom(c.id);
    if (res.success) {
      toast.success(res.message || 'Classroom lock status updated.');
      loadClassrooms(true);
    } else {
      toast.error(res.error || 'Failed to toggle lock.');
    }
  };

  const openReassignModal = (c: ClassroomRecord) => {
    setSelectedClassroom(c);
    setNewTeacherName(c.teacherName || '');
    setReassignModalVisible(true);
  };

  const submitReassign = async () => {
    if (!selectedClassroom || !newTeacherName.trim()) {
      toast.warning('Please enter the teacher name.');
      return;
    }
    setSubmittingReassign(true);
    const res = await adminService.reassignClassroom(selectedClassroom.id, newTeacherName.trim());
    setSubmittingReassign(false);
    if (res.success) {
      toast.success(res.message || 'Teacher reassigned successfully.');
      setReassignModalVisible(false);
      loadClassrooms(true);
    } else {
      toast.error(res.error || 'Failed to reassign teacher.');
    }
  };

  const handleDeleteClassroom = (c: ClassroomRecord) => {
    Alert.alert(
      'Delete Classroom Section',
      `Are you sure you want to permanently delete section "${c.classroomId}"? All student rosters and pairings for this section will be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteClassroom(c.id);
            if (res.success) {
              toast.success(`Classroom ${c.classroomId} deleted.`);
              loadClassrooms(true);
            } else {
              toast.error(res.error || 'Failed to delete classroom.');
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
            <School size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>School Classrooms</Text>
            <Text style={styles.subtitle}>Manage sections, teacher assignments, and locks</Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classroom code or teacher name…"
            placeholderTextColor={Colors.textDark}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadClassrooms(); }} style={styles.clearSearchBtn}>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subject Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {[
          { id: 'all', label: 'All Subjects' },
          { id: 'Mathematics', label: 'Mathematics' },
          { id: 'English', label: 'English' },
        ].map((tab) => {
          const isActive = selectedSubject === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setSelectedSubject(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Classroom List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Loading classrooms…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accentSecondary} />}
        >
          {classrooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <School size={36} color={Colors.textDark} />
              <Text style={styles.emptyTitle}>No classrooms found</Text>
              <Text style={styles.emptyText}>No sections match the current filter or search criteria.</Text>
            </View>
          ) : (
            classrooms.map((item) => {
              const isLocked = item.isLocked;
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.classCode}>{item.classroomId}</Text>
                      <View style={styles.subjectRow}>
                        {item.subject === 'Mathematics' ? (
                          <Calculator size={12} color={Colors.accentPrimary} />
                        ) : (
                          <BookOpen size={12} color={Colors.success} />
                        )}
                        <Text style={styles.subjectText}>
                          Grade {item.gradeLevel} · {item.subject}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.lockBadge,
                        isLocked ? styles.lockBadgeLocked : styles.lockBadgeOpen,
                      ]}
                    >
                      {isLocked ? (
                        <Lock size={11} color={Colors.danger} />
                      ) : (
                        <Unlock size={11} color={Colors.success} />
                      )}
                      <Text
                        style={[
                          styles.lockBadgeText,
                          { color: isLocked ? Colors.danger : Colors.success },
                        ]}
                      >
                        {isLocked ? 'LOCKED' : 'OPEN'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <UserCheck size={13} color={Colors.textMuted} />
                    <Text style={styles.infoText}>Teacher: {item.teacherName || 'Unassigned'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Users size={13} color={Colors.textMuted} />
                    <Text style={styles.infoText}>{item.enrolledStudents || 0} Enrolled Students</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleToggleLock(item)}
                      activeOpacity={0.7}
                    >
                      {isLocked ? (
                        <Unlock size={13} color={Colors.success} />
                      ) : (
                        <Lock size={13} color={Colors.danger} />
                      )}
                      <Text style={styles.actionBtnText}>
                        {isLocked ? 'Unlock' : 'Lock'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openReassignModal(item)}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={13} color={Colors.textMain} />
                      <Text style={styles.actionBtnText}>Reassign</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteClassroom(item)}
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

      {/* Reassign Teacher Modal */}
      <Modal visible={reassignModalVisible} transparent animationType="fade" onRequestClose={() => setReassignModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setReassignModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconBox}>
                  <Edit3 size={18} color={Colors.accentPrimary} />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle}>Reassign Classroom</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>{selectedClassroom?.classroomId}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setReassignModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close reassign dialog"
              >
                <X size={18} color={Colors.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDesc}>
                Transfer section {selectedClassroom?.classroomId} to another registered educator:
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Prof. Maria Santos"
                placeholderTextColor={Colors.textDark}
                value={newTeacherName}
                onChangeText={setNewTeacherName}
              />

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setReassignModalVisible(false)}
                  disabled={submittingReassign}
                >
                  <Text style={styles.modalDismissText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, submittingReassign && { opacity: 0.6 }]}
                  onPress={submitReassign}
                  disabled={submittingReassign}
                >
                  {submittingReassign ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Reassign Teacher</Text>
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
    flexDirection: 'row',
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
  classCode: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subjectText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  lockBadgeLocked: {
    backgroundColor: 'rgba(160,19,34,0.1)',
  },
  lockBadgeOpen: {
    backgroundColor: 'rgba(22,163,74,0.1)',
  },
  lockBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  infoText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
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
