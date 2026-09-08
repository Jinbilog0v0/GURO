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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  School,
  Trash2,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { adminService, TeacherVerificationRecord } from '../../services/adminService';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { toast } from '../../components';

export function AdminTeacherVerificationsScreen() {
  const [verifications, setVerifications] = useState<TeacherVerificationRecord[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherVerificationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Document / Details Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<TeacherVerificationRecord | null>(null);

  const loadVerifications = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const result = await adminService.getTeacherVerifications(statusFilter, search);
    if (result.success) {
      setVerifications(result.verifications || []);
      if (result.counts) setCounts(result.counts);
    } else {
      toast.error(result.error || 'Failed to load teacher verification queue.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadVerifications();
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadVerifications(true);
  };

  const handleSearchSubmit = () => {
    loadVerifications();
  };

  const handleApprove = async (teacher: TeacherVerificationRecord) => {
    const res = await adminService.reviewTeacherVerification(teacher.id, 'approve');
    if (res.success) {
      toast.success(`Account for ${teacher.name} approved.`);
      loadVerifications(true);
    } else {
      toast.error(res.error || 'Failed to approve application.');
    }
  };

  const openRejectModal = (teacher: TeacherVerificationRecord) => {
    setSelectedTeacher(teacher);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!selectedTeacher) return;
    if (!rejectionReason.trim()) {
      toast.warning('Please enter a rejection reason.');
      return;
    }
    setSubmittingReject(true);
    const res = await adminService.reviewTeacherVerification(selectedTeacher.id, 'reject', rejectionReason.trim());
    setSubmittingReject(false);
    if (res.success) {
      toast.success(`Account for ${selectedTeacher.name} rejected.`);
      setRejectModalVisible(false);
      loadVerifications(true);
    } else {
      toast.error(res.error || 'Failed to reject application.');
    }
  };

  const handleDelete = (teacher: TeacherVerificationRecord) => {
    Alert.alert(
      'Delete Teacher Application',
      `Are you sure you want to delete the registration request for ${teacher.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await adminService.deleteTeacherVerification(teacher.id);
            if (res.success) {
              toast.success(`Verification record deleted.`);
              loadVerifications(true);
            } else {
              toast.error(res.error || 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  const openDetails = (teacher: TeacherVerificationRecord) => {
    setViewingTeacher(teacher);
    setDetailModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ShieldCheck size={22} color={Colors.accentSecondary} />
          <View>
            <Text style={styles.title}>Teacher Verifications</Text>
            <Text style={styles.subtitle}>Review institutional educator credentials</Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or school…"
            placeholderTextColor={Colors.textDark}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadVerifications(); }}>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => {
          const isActive = statusFilter === tab;
          const count = tab === 'pending' ? counts.pending : tab === 'approved' ? counts.approved : tab === 'rejected' ? counts.rejected : counts.total;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setStatusFilter(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Loading queue…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accentSecondary} />}
        >
          {verifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ShieldCheck size={36} color={Colors.textDark} />
              <Text style={styles.emptyTitle}>No verification requests</Text>
              <Text style={styles.emptyText}>
                {statusFilter === 'pending'
                  ? 'There are no teacher accounts currently awaiting verification.'
                  : 'No records match the current filter.'}
              </Text>
            </View>
          ) : (
            verifications.map((item) => {
              const isPending = item.verificationStatus === 'pending';
              const isApproved = item.verificationStatus === 'approved';
              const isRejected = item.verificationStatus === 'rejected';

              return (
                <View key={item.id} style={styles.card}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.teacherName}>{item.name}</Text>
                      <Text style={styles.teacherEmail}>{item.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isPending && styles.statusPending,
                        isApproved && styles.statusApproved,
                        isRejected && styles.statusRejected,
                      ]}
                    >
                      {isPending && <Clock size={11} color={Colors.warning} />}
                      {isApproved && <CheckCircle2 size={11} color={Colors.success} />}
                      {isRejected && <XCircle size={11} color={Colors.danger} />}
                      <Text
                        style={[
                          styles.statusText,
                          isPending && { color: Colors.warning },
                          isApproved && { color: Colors.success },
                          isRejected && { color: Colors.danger },
                        ]}
                      >
                        {item.verificationStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* School & ID Info */}
                  <View style={styles.infoRow}>
                    <School size={13} color={Colors.textMuted} />
                    <Text style={styles.infoText}>
                      {item.schoolName || 'School Name Not Provided'}
                    </Text>
                  </View>
                  {item.schoolIdNumber && (
                    <View style={styles.infoRow}>
                      <FileText size={13} color={Colors.textMuted} />
                      <Text style={styles.infoText}>ID: {item.schoolIdNumber}</Text>
                    </View>
                  )}

                  {/* Rejection Note if any */}
                  {isRejected && item.rejectionReason && (
                    <View style={styles.rejectionBox}>
                      <AlertCircle size={13} color={Colors.danger} />
                      <Text style={styles.rejectionText}>Reason: {item.rejectionReason}</Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => openDetails(item)}
                      activeOpacity={0.7}
                    >
                      <Eye size={13} color={Colors.textMain} />
                      <Text style={styles.detailBtnText}>View Details</Text>
                    </TouchableOpacity>

                    {isPending && (
                      <>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => openRejectModal(item)}
                          activeOpacity={0.7}
                        >
                          <XCircle size={13} color={Colors.danger} />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleApprove(item)}
                          activeOpacity={0.7}
                        >
                          <CheckCircle2 size={13} color="#FFFFFF" />
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color={Colors.textDark} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Teacher Application</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Specify why the application for {selectedTeacher?.name} is being rejected. The applicant will be notified.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Unclear DepEd ID photo, invalid school ID number…"
              placeholderTextColor={Colors.textDark}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={submittingReject}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRejectBtn, submittingReject && { opacity: 0.6 }]}
                onPress={submitReject}
                disabled={submittingReject}
              >
                {submittingReject ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalRejectText}>Reject Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details & Document Modal */}
      <Modal visible={detailModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Educator Credentials</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {viewingTeacher && (
              <View style={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailVal}>{viewingTeacher.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailVal}>{viewingTeacher.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>School Name:</Text>
                  <Text style={styles.detailVal}>{viewingTeacher.schoolName || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>School ID Number:</Text>
                  <Text style={styles.detailVal}>{viewingTeacher.schoolIdNumber || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID Document File:</Text>
                  <Text style={styles.detailVal}>
                    {viewingTeacher.idDocumentPath || 'No document uploaded'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailVal, { fontWeight: '700' }]}>
                    {viewingTeacher.verificationStatus.toUpperCase()}
                  </Text>
                </View>

                {viewingTeacher.verificationStatus === 'pending' && (
                  <View style={[styles.modalActions, { marginTop: Spacing.md }]}>
                    <TouchableOpacity
                      style={styles.modalRejectBtn}
                      onPress={() => {
                        setDetailModalVisible(false);
                        openRejectModal(viewingTeacher);
                      }}
                    >
                      <Text style={styles.modalRejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalApproveBtn}
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleApprove(viewingTeacher);
                      }}
                    >
                      <Text style={styles.modalApproveText}>Approve Account</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
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
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
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
  filterCountBadge: {
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountBadgeActive: {
    backgroundColor: Colors.accentSecondary,
  },
  filterCountText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.textMuted,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
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
  teacherName: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  teacherEmail: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusPending: {
    backgroundColor: 'rgba(232,137,12,0.1)',
  },
  statusApproved: {
    backgroundColor: 'rgba(22,163,74,0.1)',
  },
  statusRejected: {
    backgroundColor: 'rgba(160,19,34,0.1)',
  },
  statusText: {
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
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(160,19,34,0.08)',
    padding: Spacing.xs,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  rejectionText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.danger,
    flex: 1,
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
  detailBtn: {
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
  detailBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(160,19,34,0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  rejectBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '700',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  approveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  modalInput: {
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  modalCancelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  modalRejectBtn: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRejectText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalApproveBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalApproveText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detailContent: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  detailVal: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMain,
    maxWidth: '60%',
    textAlign: 'right',
  },
});
