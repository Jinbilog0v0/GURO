import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  School, 
  RefreshCw, 
  X,
  Trash2
} from 'lucide-react';
import { toast } from '../../utils/toast';

export interface TeacherVerificationRecord {
  id: number;
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  schoolName?: string | null;
  schoolIdNumber?: string | null;
  idDocumentPath?: string | null;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: number | null;
  createdAt?: string | null;
}

export function AdminTeacherVerifications() {
  const [verifications, setVerifications] = useState<TeacherVerificationRecord[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  // Document Viewer Modal
  const [viewingDocUser, setViewingDocUser] = useState<TeacherVerificationRecord | null>(null);

  // Reject Confirmation Modal
  const [rejectingUser, setRejectingUser] = useState<TeacherVerificationRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'all') q.set('status', statusFilter);
      if (search.trim()) q.set('search', search.trim());

      const res = await apiFetch(`/api/admin/teacher-verifications?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
        if (data.counts) setCounts(data.counts);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || errData.message || 'Failed to load teacher verification queue.');
      }
    } catch {
      toast.error('Network error loading teacher verifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerifications();
  };

  const handleApprove = async (user: TeacherVerificationRecord) => {
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/admin/teacher-verifications/${user.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        toast.success(`Teacher account for ${user.name} approved.`);
        if (viewingDocUser?.id === user.id) setViewingDocUser(null);
        fetchVerifications();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to approve application.');
      }
    } catch {
      toast.error('Error approving teacher account.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/admin/teacher-verifications/${rejectingUser.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectionReason.trim() || 'Institutional credentials could not be validated.',
        }),
      });
      if (res.ok) {
        toast.success(`Application for ${rejectingUser.name} marked as rejected.`);
        setRejectingUser(null);
        setRejectionReason('');
        if (viewingDocUser?.id === rejectingUser.id) setViewingDocUser(null);
        fetchVerifications();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to reject application.');
      }
    } catch {
      toast.error('Error processing application rejection.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteApplication = async (user: TeacherVerificationRecord) => {
    if (!window.confirm(`Are you sure you want to completely remove the teacher application for "${user.name}" (${user.email})? This allows the applicant to re-register from scratch.`)) {
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/admin/teacher-verifications/${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`Application for ${user.name} removed successfully.`);
        if (viewingDocUser?.id === user.id) setViewingDocUser(null);
        fetchVerifications();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to remove application.');
      }
    } catch {
      toast.error('Error removing application.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`bg-[var(--bg-card)] border rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-[var(--border-color)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{counts.pending}</span>
            <span className="text-xs text-[var(--text-muted)] font-medium">awaiting action</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('approved')}
          className={`bg-[var(--bg-card)] border rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[var(--border-color)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Approved Teachers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{counts.approved}</span>
            <span className="text-xs text-[var(--text-muted)] font-medium">verified staff</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`bg-[var(--bg-card)] border rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-[var(--border-color)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Rejected / Incomplete</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{counts.rejected}</span>
            <span className="text-xs text-[var(--text-muted)] font-medium">flagged</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-[var(--bg-card)] border rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
            statusFilter === 'all' ? 'border-[#11428E] ring-2 ring-[#11428E]/20' : 'border-[var(--border-color)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Applications</span>
            <div className="w-8 h-8 rounded-xl bg-[#11428E]/10 text-[#11428E] flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text-main)]">{counts.total}</span>
            <span className="text-xs text-[var(--text-muted)] font-medium">all records</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#11428E] text-white shadow-sm'
                  : 'bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
              }`}
            >
              {st === 'all' ? 'All Applications' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" />
            <input
              type="text"
              placeholder="Search by teacher name, email, school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-main)]/60 border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] focus:ring-1 focus:ring-[#11428E]"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary text-xs px-3.5 py-2 font-bold cursor-pointer shrink-0"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => { setSearch(''); fetchVerifications(); }}
            className="p-2 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]/40 text-[var(--text-muted)] uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3.5 px-4">Teacher Applicant</th>
                <th className="py-3.5 px-4">School / DepEd ID</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Credential Document</th>
                <th className="py-3.5 px-4">Date Registered</th>
                <th className="py-3.5 px-4 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    <RefreshCw className="size-6 animate-spin mx-auto text-[#11428E] mb-2" />
                    <span>Loading teacher verification records…</span>
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    <ShieldCheck className="size-8 mx-auto text-[var(--text-dark)] mb-2" />
                    <p className="font-bold m-0 text-sm text-[var(--text-main)]">No teacher verification submissions found.</p>
                    <p className="text-xs mt-1 text-[var(--text-muted)]">When teachers register and upload their DepEd credentials, they will appear here.</p>
                  </td>
                </tr>
              ) : (
                verifications.map((t) => {
                  const isPending = t.verificationStatus === 'pending';
                  const isApproved = t.verificationStatus === 'approved';
                  const isRejected = t.verificationStatus === 'rejected';

                  return (
                    <tr key={t.id} className="hover:bg-[var(--bg-main)]/30 transition-colors">
                      {/* Teacher Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#11428E]/10 text-[#11428E] border border-[#11428E]/20 flex items-center justify-center font-extrabold text-xs shrink-0">
                            {t.firstName?.[0] || t.name?.[0] || 'T'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[var(--text-main)] truncate">{t.name}</span>
                            <span className="text-[11px] text-[var(--text-muted)] truncate font-mono">{t.email}</span>
                            <span className="text-[10px] text-[var(--text-dark)] font-mono">{t.userId}</span>
                          </div>
                        </div>
                      </td>

                      {/* School & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                            <School size={12} className="text-[var(--text-muted)] shrink-0" />
                            <span>{t.schoolName || 'Not specified'}</span>
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono pl-4">
                            ID: {t.schoolIdNumber || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[11px] font-extrabold">
                            <Clock size={12} /> Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-extrabold w-fit">
                              <CheckCircle2 size={12} /> Verified &amp; Active
                            </span>
                            {t.verifiedAt && (
                              <span className="text-[10px] text-[var(--text-muted)] pl-1">
                                {new Date(t.verifiedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div className="flex flex-col gap-0.5 max-w-[200px]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/30 text-[11px] font-extrabold w-fit">
                              <XCircle size={12} /> Rejected
                            </span>
                            {t.rejectionReason && (
                              <span className="text-[10px] text-rose-500/90 truncate" title={t.rejectionReason}>
                                {t.rejectionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Credential Document */}
                      <td className="py-3.5 px-4">
                        {t.idDocumentPath ? (
                          <button
                            type="button"
                            onClick={() => setViewingDocUser(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[#11428E] text-[var(--text-main)] font-semibold text-xs transition-all cursor-pointer shadow-xs"
                          >
                            <Eye size={13} className="text-[#11428E]" />
                            <span>Preview ID Document</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--text-dark)] italic">No document attached</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono text-[11px]">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>

                      {/* Review Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={submittingReview}
                                onClick={() => handleApprove(t)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <CheckCircle2 size={13} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={submittingReview}
                                onClick={() => { setRejectingUser(t); setRejectionReason(''); }}
                                className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-600/20 font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              disabled={submittingReview}
                              onClick={() => { setRejectingUser(t); setRejectionReason(''); }}
                              className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-600/30 text-[11px] font-semibold transition-all cursor-pointer"
                              title="Revoke verification status"
                            >
                              Revoke
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              disabled={submittingReview}
                              onClick={() => handleApprove(t)}
                              className="px-3 py-1.5 rounded-xl bg-[#11428E] hover:bg-[#11428E]/90 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>Re-Approve</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={() => handleDeleteApplication(t)}
                            className="p-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-600/20 text-xs transition-all cursor-pointer shadow-xs"
                            title="Completely remove application (allows applicant to re-register)"
                            aria-label={`Remove application for ${t.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {viewingDocUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#11428E]/10 text-[#11428E] border border-[#11428E]/20 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)] m-0">
                    Credential Verification: {viewingDocUser.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] m-0">
                    {viewingDocUser.schoolName || 'School'} · ID: {viewingDocUser.schoolIdNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocUser(null)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Document Viewer */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[var(--bg-main)]/50 min-h-[300px]">
              {viewingDocUser.idDocumentPath?.startsWith('data:image') || viewingDocUser.idDocumentPath?.startsWith('http') || viewingDocUser.idDocumentPath?.includes('.png') || viewingDocUser.idDocumentPath?.includes('.jpg') || viewingDocUser.idDocumentPath?.includes('.jpeg') ? (
                <div className="max-w-full rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-md bg-white flex items-center justify-center p-2">
                  <img
                    src={viewingDocUser.idDocumentPath}
                    alt={'Identification for ' + viewingDocUser.name}
                    className="max-h-[55vh] max-w-full object-contain rounded-xl"
                  />
                </div>
              ) : viewingDocUser.idDocumentPath?.startsWith('data:application/pdf') ? (
                <div className="w-full h-[55vh] border border-[var(--border-color)] rounded-2xl overflow-hidden">
                  <iframe
                    src={viewingDocUser.idDocumentPath}
                    title="Uploaded PDF Credential"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center max-w-md">
                  <FileText className="size-12 mx-auto text-[#11428E] mb-3" />
                  <p className="text-xs font-bold text-[var(--text-main)] m-0">Document Credential Data</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono break-all">
                    {viewingDocUser.idDocumentPath || 'No direct image preview available.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Review Controls */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Status:</span>
                <span className="font-bold capitalize text-[var(--text-main)]">{viewingDocUser.verificationStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const u = viewingDocUser;
                    setViewingDocUser(null);
                    setRejectingUser(u);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-600/20 font-bold text-xs cursor-pointer transition-all"
                >
                  Reject with Reason
                </button>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => handleApprove(viewingDocUser)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Approve Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="glass-panel bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5 text-rose-600 font-extrabold text-sm">
                <XCircle size={18} />
                <span>Reject Teacher Application</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] m-0">
              Provide feedback for <strong className="text-[var(--text-main)]">{rejectingUser.name}</strong> ({rejectingUser.email}). This reason will be displayed on their dashboard.
            </p>

            <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">Reason for Rejection / Correction Request</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Uploaded identification is blurry or does not match DepEd/PRC records. Please re-upload a clear copy of your school ID."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="btn btn-secondary text-xs px-4 py-2 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                >
                  {submittingReview ? 'Submitting…' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

