import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  ArrowLeft,
} from 'lucide-react-native';
import { adminService, TeacherVerificationRecord } from '../../services/adminService';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { toast } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isImageDoc = (path?: string | null): boolean => {
  if (!path) return false;
  return (
    path.startsWith('data:image') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(path)
  );
};

export function AdminTeacherVerificationsScreen() {
  const navigation = useNavigation<any>();
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
  const [submittingApprove, setSubmittingApprove] = useState(false);

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
    setSubmittingApprove(true);
    const res = await adminService.reviewTeacherVerification(teacher.id, 'approve');
    setSubmittingApprove(false);
    if (res.success) {
      toast.success(`Account for ${teacher.name} approved.`);
      if (detailModalVisible) setDetailModalVisible(false);
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
          <TouchableOpacity
            onPress={() => navigation.navigate('Overview')}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <ShieldCheck size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
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
            <TouchableOpacity onPress={() => { setSearch(''); loadVerifications(); }} style={styles.clearSearchBtn}>
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => {
          const isActive = statusFilter === tab;
          const count =
            tab === 'pending'
              ? counts.pending
              : tab === 'approved'
              ? counts.approved
              : tab === 'rejected'
              ? counts.rejected
              : counts.total;
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
                      <Text style={styles.infoText}>ID Number: {item.schoolIdNumber}</Text>
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
                      <Text style={styles.detailBtnText}>View ID &amp; Details</Text>
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

      {/* Details & ID Document Modal */}
      <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setDetailModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconBox}>
                  <FileText size={18} color={Colors.accentPrimary} />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {viewingTeacher?.name || 'Teacher Verification'}
                  </Text>
                  <Text style={styles.modalSubtitle}>Institutional Credential Review</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close modal"
              >
                <X size={18} color={Colors.textMain} />
              </TouchableOpacity>
            </View>

            {viewingTeacher && (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                {/* Meta details list */}
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name</Text>
                    <Text style={styles.detailVal}>{viewingTeacher.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email Address</Text>
                    <Text style={styles.detailVal}>{viewingTeacher.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>School Name</Text>
                    <Text style={styles.detailVal}>{viewingTeacher.schoolName || 'Not specified'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>School ID Number</Text>
                    <Text style={styles.detailVal}>{viewingTeacher.schoolIdNumber || 'Not specified'}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Current Status</Text>
                    <Text
                      style={[
                        styles.detailVal,
                        {
                          fontWeight: '800',
                          color:
                            viewingTeacher.verificationStatus === 'approved'
                              ? Colors.success
                              : viewingTeacher.verificationStatus === 'rejected'
                              ? Colors.danger
                              : Colors.warning,
                        },
                      ]}
                    >
                      {viewingTeacher.verificationStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* ID Document Visual Viewer */}
                <View style={styles.docSection}>
                  <View style={styles.docSectionHeader}>
                    <FileText size={15} color={Colors.accentPrimary} />
                    <Text style={styles.docSectionTitle}>Attached ID / Credential Document</Text>
                  </View>

                  {viewingTeacher.idDocumentPath ? (
                    isImageDoc(viewingTeacher.idDocumentPath) ? (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: viewingTeacher.idDocumentPath }}
                          style={styles.documentImage}
                          resizeMode="contain"
                        />
                        <View style={styles.imageBadge}>
                          <ShieldCheck size={12} color="#FFFFFF" />
                          <Text style={styles.imageBadgeText}>Official Verification Image</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.pdfContainer}>
                        <FileText size={32} color={Colors.accentPrimary} />
                        <Text style={styles.pdfTitle}>Credential Document File</Text>
                        <Text style={styles.pdfPath} numberOfLines={2}>
                          {viewingTeacher.idDocumentPath}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.noDocContainer}>
                      <AlertCircle size={24} color={Colors.textDark} />
                      <Text style={styles.noDocText}>No ID document attached to this application.</Text>
                    </View>
                  )}
                </View>

                {/* Modal Footer Controls */}
                <View style={styles.modalFooterActions}>
                  <TouchableOpacity
                    style={styles.modalDismissBtn}
                    onPress={() => setDetailModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalDismissText}>Close</Text>
                  </TouchableOpacity>

                  {viewingTeacher.verificationStatus === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={styles.modalRejectBtn}
                        onPress={() => {
                          setDetailModalVisible(false);
                          openRejectModal(viewingTeacher);
                        }}
                        activeOpacity={0.7}
                      >
                        <XCircle size={14} color={Colors.danger} />
                        <Text style={styles.modalRejectText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalApproveBtn, submittingApprove && { opacity: 0.6 }]}
                        onPress={() => handleApprove(viewingTeacher)}
                        disabled={submittingApprove}
                        activeOpacity={0.7}
                      >
                        {submittingApprove ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <CheckCircle2 size={14} color="#FFFFFF" />
                            <Text style={styles.modalApproveText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setRejectModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={[styles.modalIconBox, { backgroundColor: 'rgba(160,19,34,0.1)' }]}>
                  <XCircle size={18} color={Colors.danger} />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle}>Reject Application</Text>
                  <Text style={styles.modalSubtitle}>Provide explanation for applicant</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close reject dialog"
              >
                <X size={18} color={Colors.textMain} />
              </TouchableOpacity>
            </View>

            <Text style={styles.rejectDesc}>
              State why the verification for {selectedTeacher?.name} is being rejected:
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

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={submittingReject}
              >
                <Text style={styles.modalDismissText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalRejectConfirmBtn, submittingReject && { opacity: 0.6 }]}
                onPress={submitReject}
                disabled={submittingReject}
              >
                {submittingReject ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalRejectConfirmText}>Confirm Rejection</Text>
                )}
              </TouchableOpacity>
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
    fontWeight: '600',
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
    maxHeight: '90%',
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
  modalScroll: {
    maxHeight: 520,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  detailCard: {
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    maxWidth: '65%',
    textAlign: 'right',
  },
  docSection: {
    gap: Spacing.xs,
  },
  docSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  docSectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    fontWeight: '700',
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 200,
  },
  documentImage: {
    width: SCREEN_WIDTH - 80,
    height: 220,
    borderRadius: Radius.lg,
    backgroundColor: '#F8FAFC',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17,66,142,0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
  },
  pdfContainer: {
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pdfTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    fontWeight: '700',
  },
  pdfPath: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  noDocContainer: {
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noDocText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
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
  modalRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(160,19,34,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.25)',
  },
  modalRejectText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.danger,
    fontWeight: '700',
  },
  modalApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  modalApproveText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rejectDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
    minHeight: 80,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    textAlignVertical: 'top',
  },
  modalRejectConfirmBtn: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRejectConfirmText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
