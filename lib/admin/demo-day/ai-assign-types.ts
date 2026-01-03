// Types for AI Track Assignment

export interface SubmissionForAssignment {
  id: string;
  submission_number: string;
  app_name: string;
  category: string | null;
  description: string | null;
  user_name: string | null;
  institution: string | null;
  current_track_id: string | null;
  current_track_name: string | null;
}

export interface TrackSuggestion {
  submission_id: string;
  suggested_track_id: string;
  suggested_track_name: string;
  suggested_theme: string;
  confidence: number; // 0-100
  reasoning: string;
  current_track_id: string | null;
  needs_change: boolean;
}

export interface TrackInfo {
  id: string;
  name: string;
  theme: string;
  submission_count: number;
}

export interface AIAssignmentResult {
  suggestions: TrackSuggestion[];
  track_stats: TrackInfo[];
  total_processed: number;
  high_confidence_count: number;
  needs_review_count: number;
}

export interface PanelSplit {
  track_id: string;
  track_name: string;
  panel_count: number;
  submissions_per_panel: number[];
}

export const TRACK_THEMES = {
  healthcare: {
    name: 'Healthcare + AI',
    keywords: ['health', 'medical', 'hospital', 'patient', 'doctor', 'nurse', 'medicine', 'drug', 'pharmacy', 'dental', 'clinic', 'diagnosis', 'treatment', 'disease', 'therapy', 'wellness', 'fitness', 'mental health', 'healthcare', 'nursing'],
  },
  education: {
    name: 'Education + AI',
    keywords: ['education', 'learning', 'school', 'college', 'university', 'student', 'teacher', 'classroom', 'course', 'training', 'study', 'exam', 'test', 'tutorial', 'quiz', 'curriculum', 'academic', 'research', 'library', 'knowledge'],
  },
  agriculture: {
    name: 'Agriculture + AI',
    keywords: ['agriculture', 'farm', 'crop', 'soil', 'plant', 'harvest', 'irrigation', 'livestock', 'organic', 'fertilizer', 'pest', 'seed', 'weather', 'yield', 'food production', 'dairy', 'poultry', 'aquaculture', 'horticulture', 'agri'],
  },
  environment: {
    name: 'Environment + AI',
    keywords: ['environment', 'climate', 'pollution', 'waste', 'recycle', 'sustainability', 'green', 'energy', 'solar', 'carbon', 'water', 'air quality', 'conservation', 'ecosystem', 'biodiversity', 'renewable', 'eco-friendly', 'nature'],
  },
  community: {
    name: 'Community + AI',
    keywords: ['community', 'social', 'volunteer', 'NGO', 'welfare', 'charity', 'public', 'civic', 'local', 'neighborhood', 'safety', 'transport', 'traffic', 'emergency', 'disaster', 'housing', 'employment', 'accessibility', 'inclusion'],
  },
  myjkkn: {
    name: 'MyJKKN Data Apps',
    keywords: ['jkkn', 'myjkkn', 'campus', 'attendance', 'timetable', 'schedule', 'fee', 'exam results', 'marks', 'grade', 'faculty', 'department', 'hostel', 'canteen', 'library system', 'placement', 'alumni', 'event management', 'internal'],
  },
} as const;

export type TrackTheme = keyof typeof TRACK_THEMES;
