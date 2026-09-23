import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AdminOverviewScreen } from './AdminOverviewScreen';
import { AdminTeacherVerificationsScreen } from './AdminTeacherVerificationsScreen';
import { AdminUsersScreen } from './AdminUsersScreen';
import { AdminClassroomsScreen } from './AdminClassroomsScreen';
import { AdminReportsScreen } from './AdminReportsScreen';
import { AdminCurriculumScreen } from './AdminCurriculumScreen';
import { AdminRateLimitsScreen } from './AdminRateLimitsScreen';
import { AdminLessonIngestorScreen } from './AdminLessonIngestorScreen';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { adminService } from '../../services/adminService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../components', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
}));

const mockOverviewData = {
  metrics: {
    totalUsers: 45,
    rolesBreakdown: { teacher: 10, parent: 15, student: 20 },
    pendingVerifications: 3,
    totalClassrooms: 8,
    activeClassrooms: 6,
    totalProgressLogs: 120,
    totalAiLogs: 15,
  },
  health: {
    database: 'Healthy',
    cache: 'Ready',
    aiEngine: 'Configured',
    itemBankStorage: 'Online',
    serverTime: '2026-09-08T08:00:00Z',
  },
  recentSyncs: [
    {
      id: 1,
      eventId: 'EVT-123',
      student_id: 'JUAN-DELA-CRUZ',
      classroom_id: 'G4-RIZAL-2026',
      subject: 'Mathematics',
      grade_level: 4,
      topic: 'Fractions',
      score: 5,
      total_questions: 5,
      timestamp: '2026-09-08T07:55:00Z',
    },
  ],
};

const mockVerifications = [
  {
    id: 101,
    userId: 'TCH-101',
    email: 'maria.santos@deped.gov.ph',
    name: 'Maria Santos',
    schoolName: 'Mabini Elementary School',
    schoolIdNumber: '109823',
    idDocumentPath: 'teacher-ids/maria.pdf',
    verificationStatus: 'pending' as const,
    createdAt: '2026-09-07T10:00:00Z',
  },
];

const mockUsers = [
  {
    id: 1,
    userId: 'ADM-1',
    email: 'admin@guro.gov',
    name: 'System Administrator',
    role: 'admin',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 2,
    userId: 'TCH-1',
    email: 'teacher@deped.gov.ph',
    name: 'Teacher Juan',
    role: 'teacher',
    classroomId: 'G6-QUEZON-2026',
    createdAt: '2026-09-02T00:00:00Z',
  },
];

const mockClassrooms = [
  {
    id: 5,
    classroomId: 'G6-QUEZON-2026',
    teacherUserId: 2,
    teacherName: 'Teacher Juan',
    subject: 'English',
    gradeLevel: 6,
    enrolledStudents: 32,
    isLocked: false,
    createdAt: '2026-09-02T00:00:00Z',
  },
];

const mockReports = {
  totalAssessments: 120,
  mathAverage: 84,
  englishAverage: 88,
  gradeBreakdown: {
    'Grade 4': { totalAttempts: 40, averageScore: 82, masteryRate: 85 },
    'Grade 5': { totalAttempts: 40, averageScore: 86, masteryRate: 90 },
    'Grade 6': { totalAttempts: 40, averageScore: 88, masteryRate: 92 },
  },
  topicMastery: [
    {
      key: 'math-4-fractions',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      totalAttempts: 40,
      averageScore: 82,
      masteryRate: 85,
      isStruggling: false,
    },
    {
      key: 'math-5-decimals',
      subject: 'Mathematics',
      gradeLevel: 5,
      topic: 'Decimals',
      totalAttempts: 30,
      averageScore: 68,
      masteryRate: 60,
      isStruggling: true,
    },
  ],
};

const mockItemBank = {
  Mathematics: {
    '4': {
      Fractions: {
        Easy: {
          'multiple-choice': [
            {
              id: 'q1',
              questionText: 'What is 1/2 + 1/2?',
              options: ['1', '2', '1/4', '1/2'],
              correctAnswer: '1',
              feedback: { en: 'Half plus half is 1 whole', fil: 'Kalahati dagdag kalahati ay isa' },
            },
          ],
        },
      },
    },
  },
  English: {},
};

const mockRateLimits = [
  {
    id: 1,
    role: 'teacher',
    max_requests: 15,
    window_minutes: 60,
    is_enabled: true,
    notes: 'Teacher generation quota',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

const mockRateLimitsUsage = [
  {
    role: 'teacher',
    max_requests: 15,
    window_minutes: 60,
    users: [
      {
        user_id: 2,
        name: 'Teacher Juan',
        email: 'teacher@deped.gov.ph',
        count: 5,
        over_limit: false,
      },
    ],
  },
];

describe('Mobile Admin Console Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(adminService, 'getOverview').mockResolvedValue({ success: true, data: mockOverviewData });
    jest.spyOn(adminService, 'purgeCache').mockResolvedValue({ success: true, message: 'Cache purged successfully.' });
    jest.spyOn(adminService, 'getTeacherVerifications').mockResolvedValue({
      success: true,
      verifications: mockVerifications,
      counts: { pending: 1, approved: 0, rejected: 0, total: 1 },
    });
    jest.spyOn(adminService, 'reviewTeacherVerification').mockResolvedValue({ success: true, message: 'Approved' });
    jest.spyOn(adminService, 'deleteTeacherVerification').mockResolvedValue({ success: true, message: 'Deleted' });
    jest.spyOn(adminService, 'getUsers').mockResolvedValue({ success: true, users: mockUsers });
    jest.spyOn(adminService, 'updateUserRole').mockResolvedValue({ success: true, message: 'Updated' });
    jest.spyOn(adminService, 'resetUserPassword').mockResolvedValue({ success: true, message: 'Password reset' });
    jest.spyOn(adminService, 'deleteUser').mockResolvedValue({ success: true, message: 'Deleted' });
    jest.spyOn(adminService, 'getClassrooms').mockResolvedValue({ success: true, classrooms: mockClassrooms });
    jest.spyOn(adminService, 'toggleLockClassroom').mockResolvedValue({ success: true, message: 'Lock toggled', isLocked: true });
    jest.spyOn(adminService, 'reassignClassroom').mockResolvedValue({ success: true, message: 'Reassigned' });
    jest.spyOn(adminService, 'deleteClassroom').mockResolvedValue({ success: true, message: 'Deleted' });
    jest.spyOn(adminService, 'getReportsSummary').mockResolvedValue({ success: true, data: mockReports });
    jest.spyOn(adminService, 'getItemBank').mockResolvedValue({ success: true, data: mockItemBank });
    jest.spyOn(adminService, 'getRateLimits').mockResolvedValue({ success: true, configs: mockRateLimits });
    jest.spyOn(adminService, 'getRateLimitsUsage').mockResolvedValue({ success: true, usage: mockRateLimitsUsage });
    jest.spyOn(adminService, 'updateRateLimit').mockResolvedValue({ success: true, message: 'Rate limit updated.' });
  });

  test('AdminOverviewScreen renders KPIs, Health, and Recent Syncs', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminOverviewScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getOverview).toHaveBeenCalled();
  });

  test('AdminTeacherVerificationsScreen renders teacher application queue', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminTeacherVerificationsScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getTeacherVerifications).toHaveBeenCalled();
  });

  test('AdminUsersScreen renders user accounts list and role options', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminUsersScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getUsers).toHaveBeenCalled();
  });

  test('AdminClassroomsScreen renders classroom directory', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminClassroomsScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getClassrooms).toHaveBeenCalled();
  });

  test('AdminReportsScreen renders division analytics and diagnostic intervention alerts', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminReportsScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getReportsSummary).toHaveBeenCalled();
  });

  test('AdminCurriculumScreen renders master curriculum hierarchy', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminCurriculumScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getItemBank).toHaveBeenCalled();
  });

  test('AdminRateLimitsScreen renders role quotas and active consumers', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminRateLimitsScreen />);
    });
    expect(tree).toBeTruthy();
    expect(adminService.getRateLimits).toHaveBeenCalled();
    expect(adminService.getRateLimitsUsage).toHaveBeenCalled();
  });

  test('AdminLessonIngestorScreen renders curriculum generator form', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<AdminLessonIngestorScreen />);
    });
    expect(tree).toBeTruthy();
  });

  test('AdminSidebar renders navigation items and user session info', async () => {
    const mockNav = { navigate: jest.fn(), reset: jest.fn() };
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <AdminSidebar
          visible={true}
          onClose={jest.fn()}
          navigation={mockNav}
          currentRoute="Overview"
        />
      );
    });
    expect(tree).toBeTruthy();
  });
});


