// Institution types for the multi-institution management system

export type InstitutionType = 'college' | 'school' | 'external';

export interface Institution {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  type: InstitutionType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionWithStats extends Institution {
  user_count: number;
  admin_count: number;
  new_users_this_week: number;
}

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InstitutionChangeRequest {
  id: string;
  user_id: string;
  from_institution_id: string | null;
  to_institution_id: string;
  status: ChangeRequestStatus;
  reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface InstitutionChangeRequestWithDetails extends InstitutionChangeRequest {
  user_email: string;
  user_name: string;
  from_institution: string | null;
  to_institution: string;
}

// User role types - extended to include event_admin and institution_admin
// Role = WHAT you can do (permissions)
// 'builder' = default role (aspirational - you're a builder in Solution Studio)
export type UserRole = 'builder' | 'facilitator' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';

// Category = WHO you are (identity)
export type UserCategory = 'learner' | 'senior_learner';

// Institution icons based on type/slug
export function getInstitutionIcon(institution: Institution): string {
  switch (institution.slug) {
    case 'jkkn-engineering':
      return '⚙️';
    case 'jkkn-arts-science':
      return '📚';
    case 'jkkn-nursing':
      return '🏥';
    case 'jkkn-dental':
      return '🦷';
    case 'jkkn-pharmacy':
      return '💊';
    case 'jkkn-ahs':
      return '🩺';
    case 'jkkn-education':
      return '🎓';
    case 'jkkn-matric':
    case 'nattraja-vidhyalaya':
      return '🏫';
    default:
      return institution.type === 'school' ? '🏫' : '🏛️';
  }
}

// Institution colors for UI styling
export function getInstitutionColor(slug: string): { bg: string; border: string; text: string } {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    'jkkn-engineering': { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400' },
    'jkkn-arts-science': { bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-400' },
    'jkkn-nursing': { bg: 'bg-pink-500/10', border: 'border-pink-500', text: 'text-pink-400' },
    'jkkn-dental': { bg: 'bg-cyan-500/10', border: 'border-cyan-500', text: 'text-cyan-400' },
    'jkkn-pharmacy': { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400' },
    'jkkn-ahs': { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' },
    'jkkn-education': { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-400' },
    'jkkn-matric': { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400' },
    'nattraja-vidhyalaya': { bg: 'bg-lime-500/10', border: 'border-lime-500', text: 'text-lime-400' },
  };
  return colors[slug] || { bg: 'bg-stone-500/10', border: 'border-stone-500', text: 'text-stone-400' };
}
