'use client';

import { useState, useEffect } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Save,
  Trophy,
  Users,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { UserSearchCombobox, UserMultiSelect, UserResult } from '@/components/user-search-combobox';

interface AppathonSubmissionProps {
  cycle: Cycle;
}

// Legacy interface for backward compatibility with existing submissions
interface LegacyTeamMember {
  name: string;
  email: string;
  institution: string;
  department: string;
  year: string;
}

interface Institution {
  id: string;
  slug: string;
  name: string;
  short_name: string;
}

interface Event {
  id: string;
  slug: string;
  name: string;
  config: {
    type?: string;
  };
}

const CATEGORIES = [
  { value: 'healthcare', label: 'Healthcare + AI', icon: '🏥' },
  { value: 'education', label: 'Education + AI', icon: '📚' },
  { value: 'operations', label: 'Operations + AI', icon: '⚙️' },
  { value: 'productivity', label: 'Productivity + AI', icon: '📈' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export function AppathonSubmission({ cycle }: AppathonSubmissionProps) {
  const router = useRouter();
  const supabase = createClient();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Event & Institution data
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string>('draft');
  const [submissionNumber, setSubmissionNumber] = useState<string | null>(null);

  // Team info (always team-based, no individual option)
  const [teamName, setTeamName] = useState('');
  const [seniorLearners, setSeniorLearners] = useState<UserResult[]>([]); // 1-3 senior learners required
  const [teamMembers, setTeamMembers] = useState<UserResult[]>([]);

  // Applicant details
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');

  // Project details (auto-filled from cycle)
  const [appName, setAppName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solutionSummary, setSolutionSummary] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [lovableUrl, setLovableUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Competition
  const [category, setCategory] = useState('');

  // Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get user profile with active event
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, active_event_id, institution_id')
          .eq('id', user.id)
          .single();

        if (userData) {
          setApplicantName(userData.name || '');
          setApplicantEmail(userData.email || user.email || '');
          if (userData.institution_id) {
            setInstitutionId(userData.institution_id);
          }

          // Get active event
          if (userData.active_event_id) {
            const { data: eventData } = await supabase
              .from('events')
              .select('id, slug, name, config')
              .eq('id', userData.active_event_id)
              .single();

            if (eventData) {
              setActiveEvent(eventData);
            }
          }
        }

        // Load institutions
        const { data: instData } = await supabase
          .from('institutions')
          .select('id, slug, name, short_name')
          .eq('is_active', true)
          .order('name');

        if (instData) {
          setInstitutions(instData);
        }

        // Load existing submission for this cycle
        const { data: submissionData } = await supabase
          .from('appathon_submissions')
          .select('*')
          .eq('cycle_id', cycle.id)
          .single();

        if (submissionData) {
          // Populate form with existing data
          setExistingSubmissionId(submissionData.id);
          setSubmissionStatus(submissionData.status);
          setSubmissionNumber(submissionData.submission_number);
          setTeamName(submissionData.team_name || '');

          // Handle senior learners (new format: array of UserResult objects)
          // Also support legacy format (single object) for backward compatibility
          if (submissionData.senior_learner) {
            if (Array.isArray(submissionData.senior_learner)) {
              setSeniorLearners(submissionData.senior_learner as UserResult[]);
            } else {
              // Legacy single object - convert to array
              setSeniorLearners([submissionData.senior_learner as UserResult]);
            }
          }

          // Handle team members (new format: array of UserResult objects)
          // Also support legacy format for backward compatibility
          if (submissionData.team_members?.length > 0) {
            const firstMember = submissionData.team_members[0];
            // Check if it's new format (has 'id' property) or legacy format
            if (firstMember && typeof firstMember === 'object' && 'id' in firstMember) {
              setTeamMembers(submissionData.team_members as UserResult[]);
            } else {
              // Legacy format - just log for now, can't convert without user lookup
              console.log('Legacy team members format detected');
              setTeamMembers([]);
            }
          }
          setApplicantName(submissionData.applicant_name || '');
          setApplicantEmail(submissionData.applicant_email || '');
          setApplicantPhone(submissionData.applicant_phone || '');
          setInstitutionId(submissionData.institution_id || '');
          setDepartment(submissionData.department || '');
          setYearOfStudy(submissionData.year_of_study || '');
          setAppName(submissionData.app_name || '');
          setProblemStatement(submissionData.problem_statement || '');
          setSolutionSummary(submissionData.solution_summary || '');
          setLiveUrl(submissionData.live_url || '');
          setLovableUrl(submissionData.lovable_url || '');
          setGithubUrl(submissionData.github_url || '');
          setCategory(submissionData.category || '');
          setDeclarationAccepted(submissionData.declaration_accepted || false);
        } else {
          // Auto-fill from cycle data
          setAppName(cycle.name || '');

          // Auto-fill problem statement with fallback to answers
          let problemText = cycle.problem?.statement || cycle.problem?.refinedStatement || '';
          if (!problemText && cycle.problem?.answers) {
            const answers = cycle.problem.answers;
            // Construct problem statement from answers if no explicit statement saved
            const parts: string[] = [];
            if (answers.question1) parts.push(answers.question1);
            if (answers.question2) parts.push(answers.question2);
            if (answers.question3) parts.push(answers.question3);
            if (answers.question4) parts.push(answers.question4);
            if (answers.question5) parts.push(answers.question5);
            // Use the most substantial answer as the problem statement
            problemText = parts.sort((a, b) => b.length - a.length)[0] || '';
          }
          setProblemStatement(problemText);

          setLiveUrl(cycle.build?.projectUrl || '');
          setLovableUrl(cycle.build?.lovableUrl || '');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load submission data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [cycle, supabase]);

  // Get total team size (senior learners + other team members)
  const totalTeamSize = seniorLearners.length + teamMembers.length;

  // Get all team member IDs for exclusion from search
  const allTeamMemberIds = [
    ...seniorLearners.map(s => s.id),
    ...teamMembers.map(m => m.id),
  ];

  // Validation
  const isValid = () => {
    // Basic required fields
    if (!applicantName || !applicantEmail || !appName || !problemStatement || !category) {
      return false;
    }
    // Team name is required
    if (!teamName) {
      return false;
    }
    // Must have 1-3 senior learners
    if (seniorLearners.length < 1 || seniorLearners.length > 3) {
      return false;
    }
    // Total team size must be at least 2 and max 10
    if (totalTeamSize < 2 || totalTeamSize > 10) {
      return false;
    }
    return true;
  };

  const canSubmit = () => {
    return isValid() && declarationAccepted && submissionStatus === 'draft';
  };

  // Save draft
  const saveDraft = async () => {
    setIsPending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's active event
      const { data: userData } = await supabase
        .from('users')
        .select('active_event_id')
        .eq('id', user.id)
        .single();

      if (!userData?.active_event_id) {
        throw new Error('No active Appathon event found');
      }

      const submissionData = {
        cycle_id: cycle.id,
        event_id: userData.active_event_id,
        user_id: user.id,
        participation_type: 'team', // Always team now
        team_name: teamName,
        senior_learner: seniorLearners, // Store array of UserResult objects (1-3 senior learners)
        team_members: teamMembers, // Store array of UserResult objects
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone || null,
        institution_id: institutionId || null,
        department: department || null,
        year_of_study: yearOfStudy || null,
        app_name: appName,
        problem_statement: problemStatement,
        solution_summary: solutionSummary || null,
        live_url: liveUrl || null,
        lovable_url: lovableUrl || null,
        github_url: githubUrl || null,
        elevator_pitch: null,
        demo_video_url: null,
        screenshots: [],
        category,
        faculty_mentor: null, // Removed - senior learners serve as mentors
        declaration_accepted: declarationAccepted,
        declaration_timestamp: declarationAccepted ? new Date().toISOString() : null,
        impact_metrics: {
          users_reached: cycle.impact?.usersReached || 0,
          time_saved_minutes: cycle.impact?.timeSavedMinutes || 0,
          satisfaction_score: cycle.impact?.satisfactionScore || 0,
        },
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      if (existingSubmissionId) {
        const { error } = await supabase
          .from('appathon_submissions')
          .update(submissionData)
          .eq('id', existingSubmissionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('appathon_submissions')
          .insert({ ...submissionData, created_at: new Date().toISOString() })
          .select('id')
          .single();
        if (error) throw error;
        if (data) setExistingSubmissionId(data.id);
      }

      toast.success('Draft saved!');
      router.refresh();
    } catch (error: unknown) {
      const supabaseError = error as { message?: string; code?: string; details?: string; hint?: string };
      console.error('Error saving draft:', error);
      console.error('Error details:', {
        message: supabaseError?.message,
        code: supabaseError?.code,
        details: supabaseError?.details,
        hint: supabaseError?.hint,
      });
      toast.error(`Failed to save draft: ${supabaseError?.message || 'Unknown error'}`);
    } finally {
      setIsPending(false);
    }
  };

  // Submit for review
  const submitForReview = async () => {
    if (!canSubmit()) {
      toast.error('Please complete all required fields and accept the declaration');
      return;
    }

    setIsPending(true);
    try {
      // First save the draft
      await saveDraft();

      // Then update status to submitted
      const { error } = await supabase
        .from('appathon_submissions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubmissionId);

      if (error) throw error;

      setSubmissionStatus('submitted');
      toast.success('Submission successful! Good luck! 🎉');
      router.refresh();
    } catch (error: unknown) {
      const supabaseError = error as { message?: string; code?: string; details?: string; hint?: string };
      console.error('Error submitting:', error);
      console.error('Submit error details:', {
        message: supabaseError?.message,
        code: supabaseError?.code,
        details: supabaseError?.details,
        hint: supabaseError?.hint,
      });
      toast.error(`Failed to submit: ${supabaseError?.message || 'Please try again.'}`);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Already submitted view
  if (submissionStatus === 'submitted' || submissionStatus === 'under_review') {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">Submission Received!</h2>
              {submissionNumber && (
                <Badge variant="outline" className="text-lg px-4 py-1 mb-4">
                  {submissionNumber}
                </Badge>
              )}
              <p className="text-stone-400 max-w-md">
                Your app <span className="text-stone-200 font-medium">{appName}</span> has been
                submitted to {activeEvent?.name || 'the Appathon'}. We&apos;ll review your submission
                and notify you of the results.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Submission Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-stone-500 text-sm">App Name</Label>
                <p className="text-stone-200">{appName}</p>
              </div>
              <div>
                <Label className="text-stone-500 text-sm">Category</Label>
                <p className="text-stone-200">
                  {CATEGORIES.find((c) => c.value === category)?.label || category}
                </p>
              </div>
              <div>
                <Label className="text-stone-500 text-sm">Team</Label>
                <p className="text-stone-200">
                  {teamName || 'Unnamed Team'}
                  <span className="text-stone-400 ml-2">({totalTeamSize} members)</span>
                </p>
              </div>
              <div>
                <Label className="text-stone-500 text-sm">Status</Label>
                <Badge
                  variant={submissionStatus === 'submitted' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {submissionStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            {liveUrl && (
              <div>
                <Label className="text-stone-500 text-sm">Live URL</Label>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 block"
                >
                  {liveUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/8`)}>
          Back to Impact Discovery
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Banner */}
      {activeEvent && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-amber-400 font-semibold text-lg">{activeEvent.name}</p>
                <p className="text-stone-400 text-sm">Submit your app to compete!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Details */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Team Details
          </CardTitle>
          <CardDescription>
            Build your team with 2-10 members. Every team requires 1-3 Senior Learners as mentors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Name */}
          <div>
            <Label className="text-stone-300">Team Name *</Label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Your team name"
              className="bg-stone-800/50 border-stone-700 mt-1"
            />
          </div>

          {/* Senior Learners (1-3 Required) */}
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <Label className="text-amber-300 font-medium">
                Senior Learners (1-3 Required)
                <span className="text-stone-400 font-normal ml-2">
                  ({seniorLearners.length}/3 selected)
                </span>
              </Label>
            </div>
            <p className="text-stone-400 text-sm">
              Every team must have 1-3 Senior Learners as mentors/guides.
            </p>
            <UserMultiSelect
              placeholder="Search for Senior Learners..."
              categoryFilter="senior_learner"
              eventId={activeEvent?.id}
              value={seniorLearners}
              onChange={setSeniorLearners}
              excludeIds={teamMembers.map(m => m.id)}
              minUsers={1}
              maxUsers={3}
            />
            {seniorLearners.length === 0 && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                At least 1 Senior Learner is required
              </p>
            )}
            {seniorLearners.length > 3 && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Maximum 3 Senior Learners allowed
              </p>
            )}
          </div>

          {/* Other Team Members */}
          <div className="space-y-3">
            <Label className="text-stone-300">
              Other Team Members
              <span className="text-stone-500 font-normal ml-2">
                (Current team size: {totalTeamSize}/10)
              </span>
            </Label>
            <p className="text-stone-400 text-sm">
              Add learners to your team. Total team size must be 2-10 members (including Senior Learners).
            </p>
            <UserMultiSelect
              placeholder="Search for team members..."
              eventId={activeEvent?.id}
              value={teamMembers}
              onChange={setTeamMembers}
              excludeIds={seniorLearners.map(s => s.id)}
              minUsers={0}
              maxUsers={10 - seniorLearners.length} // Dynamic max based on senior learners
            />
            {totalTeamSize < 2 && seniorLearners.length > 0 && (
              <p className="text-amber-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Add at least 1 more team member (or 1 more Senior Learner)
              </p>
            )}
            {totalTeamSize > 10 && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Maximum 10 team members allowed
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applicant Details */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Applicant Details
          </CardTitle>
          <CardDescription>
            Primary contact for the team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-300">Full Name *</Label>
              <Input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Your full name"
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-stone-300">Email *</Label>
              <Input
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-stone-300">Phone</Label>
              <Input
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-stone-300">Institution</Label>
              <Select value={institutionId} onValueChange={setInstitutionId}>
                <SelectTrigger className="bg-stone-800/50 border-stone-700 mt-1">
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.short_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-300">Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Computer Science"
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-stone-300">Year of Study</Label>
              <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                <SelectTrigger className="bg-stone-800/50 border-stone-700 mt-1">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="pg">Post Graduate</SelectItem>
                  <SelectItem value="faculty">Faculty/Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Project Details
          </CardTitle>
          <CardDescription>Tell us about your app (auto-filled from your cycle)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-stone-300">App Name *</Label>
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Your app's name"
              className="bg-stone-800/50 border-stone-700 mt-1"
            />
          </div>
          <div>
            <Label className="text-stone-300">Problem Statement *</Label>
            <Textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What problem does your app solve?"
              className="bg-stone-800/50 border-stone-700 mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-stone-300">Solution Summary</Label>
            <Textarea
              value={solutionSummary}
              onChange={(e) => setSolutionSummary(e.target.value)}
              placeholder="How does your app solve the problem?"
              className="bg-stone-800/50 border-stone-700 mt-1"
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-300">Live URL</Label>
              <Input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://your-app.vercel.app"
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-stone-300">Lovable URL</Label>
              <Input
                value={lovableUrl}
                onChange={(e) => setLovableUrl(e.target.value)}
                placeholder="https://lovable.dev/projects/..."
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-stone-300">GitHub URL (optional)</Label>
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="bg-stone-800/50 border-stone-700 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competition Details */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Competition Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-stone-300">Category *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? 'default' : 'outline'}
                  onClick={() => setCategory(cat.value)}
                  className={`justify-start ${category === cat.value ? 'bg-amber-500 text-stone-900' : ''}`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card className="glass-card border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-amber-400">Declaration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="declaration"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-stone-600 bg-stone-800/50 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-900"
            />
            <label htmlFor="declaration" className="text-stone-300 text-sm leading-relaxed cursor-pointer">
              I declare that this submission is my/our original work. I understand that the
              project may be shared with judges and JKKN faculty for evaluation purposes. I agree
              to the competition rules and accept the decisions of the judges as final.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/8`)}>
          Back to Impact Discovery
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={saveDraft} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
            Save Draft
          </Button>
          <Button
            onClick={submitForReview}
            disabled={!canSubmit() || isPending}
            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trophy className="mr-2 w-4 h-4" />
            )}
            Submit Entry
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
