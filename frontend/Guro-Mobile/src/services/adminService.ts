import { useAppStore, resolveServerUrl } from '../store/useAppStore';

function getAdminHeaders(): HeadersInit {
  const token = useAppStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getBaseUrl(): string {
  const rawUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  return resolveServerUrl(rawUrl).replace(/\/+$/, '');
}

export interface OverviewMetrics {
  totalUsers: number;
  rolesBreakdown: Record<string, number>;
  pendingVerifications?: number;
  totalClassrooms: number;
  activeClassrooms: number;
  totalProgressLogs: number;
  totalAiLogs: number;
}

export interface SystemHealth {
  database: string;
  cache: string;
  aiEngine: string;
  itemBankStorage: string;
  serverTime: string;
}

export interface RecentSync {
  id: number;
  eventId: string;
  student_id: string;
  classroom_id: string | null;
  subject: string;
  grade_level: number;
  topic: string;
  score: number;
  total_questions: number;
  timestamp: string;
}

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

export interface UserRecord {
  id: number;
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  classroomId?: string | null;
  parentAccessToken?: string | null;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  schoolName?: string | null;
  schoolIdNumber?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
}

export interface ClassroomRecord {
  id: number;
  classroomId: string;
  teacherUserId?: number | null;
  teacherName: string;
  subject: string;
  gradeLevel: number;
  sectionName?: string | null;
  schoolYear?: string;
  term?: string;
  enrolledStudents: number;
  isLocked: boolean;
  expiresAt?: string | null;
  createdAt?: string | null;
}

export interface GradeMetrics {
  totalAttempts: number;
  averageScore: number;
  masteryRate: number;
}

export interface RateLimitConfig {
  id?: number;
  role: string;
  max_requests: number;
  window_minutes: number;
  is_enabled: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsageUser {
  user_id: number | string;
  name: string;
  email: string;
  count: number;
  over_limit: boolean;
}

export interface RoleUsage {
  role: string;
  max_requests: number;
  window_minutes: number;
  users: UsageUser[];
}

export interface TopicMastery {
  key: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  totalAttempts: number;
  averageScore: number;
  masteryRate: number;
  isStruggling: boolean;
}

export interface ReportsData {
  totalAssessments: number;
  mathAverage: number;
  englishAverage: number;
  gradeBreakdown: Record<string, GradeMetrics>;
  topicMastery: TopicMastery[];
}

export const adminService = {
  async getOverview(): Promise<{ success: boolean; data?: { metrics: OverviewMetrics; health: SystemHealth; recentSyncs: RecentSync[] }; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/overview`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to fetch overview.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error fetching overview.' };
    }
  },

  async purgeCache(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/cache-purge`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message || 'Cache purged successfully.' };
      }
      return { success: false, message: data.error || data.message || 'Failed to purge cache.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error during cache purge.' };
    }
  },

  async getTeacherVerifications(status: string = 'all', search: string = ''): Promise<{
    success: boolean;
    verifications?: TeacherVerificationRecord[];
    counts?: { pending: number; approved: number; rejected: number; total: number };
    error?: string;
  }> {
    try {
      const q = new URLSearchParams();
      if (status !== 'all') q.set('status', status);
      if (search.trim()) q.set('search', search.trim());

      const res = await fetch(`${getBaseUrl()}/api/admin/teacher-verifications?${q.toString()}`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          verifications: data.verifications || [],
          counts: data.counts || { pending: 0, approved: 0, rejected: 0, total: 0 },
        };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load teacher verifications.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading verifications.' };
    }
  },

  async reviewTeacherVerification(id: number, action: 'approve' | 'reject', reason?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/teacher-verifications/${id}/review`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to review verification.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error reviewing verification.' };
    }
  },

  async deleteTeacherVerification(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/teacher-verifications/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to delete verification.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error deleting verification.' };
    }
  },

  async getUsers(role: string = 'all', search: string = ''): Promise<{
    success: boolean;
    users?: UserRecord[];
    counts?: { all: number; teacher: number; parent: number; student: number; admin: number };
    error?: string;
  }> {
    try {
      const q = new URLSearchParams();
      if (role !== 'all') q.set('role', role);
      if (search.trim()) q.set('search', search.trim());

      const res = await fetch(`${getBaseUrl()}/api/admin/users?${q.toString()}`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, users: data.users || [], counts: data.counts };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load users.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading users.' };
    }
  },

  async updateUserRole(id: number, role: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/users/${id}/update-role`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to update user role.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error updating user role.' };
    }
  },

  async resetUserPassword(id: number, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/users/${id}/reset-password`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to reset user password.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error resetting user password.' };
    }
  },

  async deleteUser(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to delete user.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error deleting user.' };
    }
  },

  async getClassrooms(subject: string = 'all', search: string = ''): Promise<{ success: boolean; classrooms?: ClassroomRecord[]; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (subject !== 'all') q.set('subject', subject);
      if (search.trim()) q.set('search', search.trim());

      const res = await fetch(`${getBaseUrl()}/api/admin/classrooms?${q.toString()}`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, classrooms: data.classrooms || [] };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load classrooms.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading classrooms.' };
    }
  },

  async toggleLockClassroom(id: number): Promise<{ success: boolean; message?: string; isLocked?: boolean; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/classrooms/${id}/toggle-lock`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message, isLocked: data.isLocked };
      }
      return { success: false, error: data.error || data.message || 'Failed to toggle classroom lock.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error toggling lock.' };
    }
  },

  async reassignClassroom(id: number, teacherName: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/classrooms/${id}/reassign`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ teacher_name: teacherName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to reassign classroom.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error reassigning classroom.' };
    }
  },

  async deleteClassroom(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/classrooms/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || data.message || 'Failed to delete classroom.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error deleting classroom.' };
    }
  },

  async getReportsSummary(): Promise<{ success: boolean; data?: ReportsData; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/reports/summary`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load reports summary.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading reports.' };
    }
  },

  async getItemBank(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/item-bank`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load master item bank.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading item bank.' };
    }
  },

  async getRateLimits(): Promise<{ success: boolean; configs?: RateLimitConfig[]; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/dev/rate-limits`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const configs = await res.json();
        return { success: true, configs };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load rate limit configs.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading rate limits.' };
    }
  },

  async getRateLimitsUsage(): Promise<{ success: boolean; usage?: RoleUsage[]; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/dev/rate-limits/usage`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const usage = await res.json();
        return { success: true, usage };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || err.message || 'Failed to load rate limit usage.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error loading rate limit usage.' };
    }
  },

  async updateRateLimit(role: string, values: Partial<RateLimitConfig>): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/dev/rate-limits/${encodeURIComponent(role)}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: data.message || `Rate limit for ${role} updated.` };
      }
      return { success: false, error: data.message || data.error || 'Failed to update rate limit.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error updating rate limit.' };
    }
  },
};

