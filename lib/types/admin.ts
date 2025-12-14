// Admin-specific types for Flywheel Coach Super Admin Dashboard

export type UserRole = 'learner' | 'facilitator' | 'admin' | 'superadmin';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  institution: string;
  department: string | null;
  yearOfStudy: number | null;
  role: UserRole;
  onboardingCompleted: boolean;
  language: 'en' | 'ta';
  createdAt: string;
  updatedAt: string;
  // Computed fields for admin view
  cycleCount?: number;
  activeCycleCount?: number;
  lastActiveAt?: string;
}

export interface AdminCycle {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  name: string | null;
  status: 'active' | 'completed' | 'abandoned';
  currentStep: number;
  startedAt: string;
  completedAt: string | null;
  impactScore: number | null;
  createdAt: string;
  updatedAt: string;
  // Related data
  problem?: {
    refinedStatement: string | null;
    painLevel: number | null;
  };
  workflow?: {
    type: string | null;
  };
  review?: CycleReview | null;
}

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'needs_revision' | 'flagged';

export interface CycleReview {
  id: string;
  cycleId: string;
  status: ReviewStatus;
  reviewedBy: string | null;
  reviewerName?: string | null;
  notes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCycleNote {
  id: string;
  cycleId: string;
  adminId: string;
  adminName?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpersonationLog {
  id: string;
  adminId: string;
  adminName?: string | null;
  targetUserId: string;
  targetUserEmail?: string;
  targetUserName?: string | null;
  action: 'start' | 'end';
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

// Stats types for dashboard
export interface UserStats {
  role: UserRole;
  count: number;
  onboarded: number;
  newThisWeek: number;
  newThisMonth: number;
}

export interface CycleStats {
  status: 'active' | 'completed' | 'abandoned';
  count: number;
  avgStep: number;
  completedAllSteps: number;
  avgImpactScore: number | null;
}

export interface StepFunnelItem {
  currentStep: number;
  usersAtStep: number;
  percentage: number;
}

export interface WorkflowPopularity {
  workflowType: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalCycles: number;
  activeCycles: number;
  completedCycles: number;
  averageStep: number;
  usersByRole: UserStats[];
  cyclesByStatus: CycleStats[];
  stepFunnel: StepFunnelItem[];
  workflowPopularity: WorkflowPopularity[];
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUsersResponse extends PaginatedResponse<AdminUser> {}
export interface AdminCyclesResponse extends PaginatedResponse<AdminCycle> {}
export interface AdminActivityResponse extends PaginatedResponse<AdminActivityLog> {}

// Filter types
export interface UserFilters {
  role?: UserRole;
  search?: string;
  onboarded?: boolean;
  sortBy?: 'created_at' | 'name' | 'email' | 'role';
  sortOrder?: 'asc' | 'desc';
}

export interface CycleFilters {
  status?: 'active' | 'completed' | 'abandoned';
  userId?: string;
  step?: number;
  reviewStatus?: ReviewStatus;
  search?: string;
  sortBy?: 'created_at' | 'current_step' | 'impact_score';
  sortOrder?: 'asc' | 'desc';
}

// Form types
export interface CreateUserForm {
  email: string;
  name: string;
  role: UserRole;
  institution?: string;
  department?: string;
}

export interface UpdateUserForm {
  name?: string;
  role?: UserRole;
  institution?: string;
  department?: string;
  onboardingCompleted?: boolean;
}

// Impersonation state
export interface ImpersonationState {
  isImpersonating: boolean;
  originalAdminId: string | null;
  targetUserId: string | null;
  targetUserEmail: string | null;
  startedAt: string | null;
  expiresAt: string | null;
}
