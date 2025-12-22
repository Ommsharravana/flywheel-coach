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
  Plus,
  Save,
  Trash2,
  Trophy,
  Upload,
  Users,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AppathonSubmissionProps {
  cycle: Cycle;
}

interface TeamMember {
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

  // Participation type
  const [participationType, setParticipationType] = useState<'individual' | 'team'>('individual');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: '', email: '', institution: '', department: '', year: '' },
  ]);

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

  // Pitch materials
  const [elevatorPitch, setElevatorPitch] = useState('');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>(['']);

  // Competition
  const [category, setCategory] = useState('');
  const [facultyMentor, setFacultyMentor] = useState('');

  // Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Word count for elevator pitch
  const pitchWordCount = elevatorPitch.trim().split(/\s+/).filter(Boolean).length;

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
          setParticipationType(submissionData.participation_type || 'individual');
          setTeamName(submissionData.team_name || '');
          setTeamMembers(
            submissionData.team_members?.length > 0
              ? submissionData.team_members
              : [{ name: '', email: '', institution: '', department: '', year: '' }]
          );
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
          setElevatorPitch(submissionData.elevator_pitch || '');
          setDemoVideoUrl(submissionData.demo_video_url || '');
          setScreenshots(
            submissionData.screenshots?.length > 0 ? submissionData.screenshots : ['']
          );
          setCategory(submissionData.category || '');
          setFacultyMentor(submissionData.faculty_mentor || '');
          setDeclarationAccepted(submissionData.declaration_accepted || false);
        } else {
          // Auto-fill from cycle data
          setAppName(cycle.name || '');
          setProblemStatement(cycle.problem?.statement || cycle.problem?.refinedStatement || '');
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

  // Team member management
  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      { name: '', email: '', institution: '', department: '', year: '' },
    ]);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  // Screenshot management
  const addScreenshot = () => {
    setScreenshots([...screenshots, '']);
  };

  const updateScreenshot = (index: number, value: string) => {
    const updated = [...screenshots];
    updated[index] = value;
    setScreenshots(updated);
  };

  const removeScreenshot = (index: number) => {
    if (screenshots.length > 1) {
      setScreenshots(screenshots.filter((_, i) => i !== index));
    }
  };

  // Validation
  const isValid = () => {
    if (!applicantName || !applicantEmail || !appName || !problemStatement || !category) {
      return false;
    }
    if (participationType === 'team' && !teamName) {
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
        participation_type: participationType,
        team_name: participationType === 'team' ? teamName : null,
        team_members:
          participationType === 'team' ? teamMembers.filter((m) => m.name.trim()) : [],
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
        elevator_pitch: elevatorPitch || null,
        demo_video_url: demoVideoUrl || null,
        screenshots: screenshots.filter((s) => s.trim()),
        category,
        faculty_mentor: facultyMentor || null,
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
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
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
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit. Please try again.');
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
                submitted to {activeEvent?.name || 'the Appathon'}. We'll review your submission
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
                <Label className="text-stone-500 text-sm">Participation</Label>
                <p className="text-stone-200 capitalize">
                  {participationType}
                  {participationType === 'team' && teamName && ` - ${teamName}`}
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

      {/* Participation Type */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Participation Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={participationType === 'individual' ? 'default' : 'outline'}
              onClick={() => setParticipationType('individual')}
              className={participationType === 'individual' ? 'bg-amber-500 text-stone-900' : ''}
            >
              Individual
            </Button>
            <Button
              variant={participationType === 'team' ? 'default' : 'outline'}
              onClick={() => setParticipationType('team')}
              className={participationType === 'team' ? 'bg-amber-500 text-stone-900' : ''}
            >
              Team
            </Button>
          </div>

          <AnimatePresence>
            {participationType === 'team' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-stone-300">Team Name *</Label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Your team name"
                    className="bg-stone-800/50 border-stone-700 mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-stone-300">Team Members</Label>
                  {teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 bg-stone-800/30 rounded-lg border border-stone-700 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400 text-sm">Member {index + 1}</span>
                        {teamMembers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          value={member.name}
                          onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                          placeholder="Name"
                          className="bg-stone-800/50 border-stone-700"
                        />
                        <Input
                          value={member.email}
                          onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          placeholder="Email"
                          className="bg-stone-800/50 border-stone-700"
                        />
                        <Input
                          value={member.institution}
                          onChange={(e) => updateTeamMember(index, 'institution', e.target.value)}
                          placeholder="Institution"
                          className="bg-stone-800/50 border-stone-700"
                        />
                        <Input
                          value={member.department}
                          onChange={(e) => updateTeamMember(index, 'department', e.target.value)}
                          placeholder="Department"
                          className="bg-stone-800/50 border-stone-700"
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addTeamMember} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            {participationType === 'team' ? 'Primary contact for the team' : 'Your details'}
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

      {/* Pitch Materials */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-400" />
            Pitch Materials
          </CardTitle>
          <CardDescription>Help judges understand your solution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-stone-300">Elevator Pitch (max 150 words)</Label>
              <span
                className={`text-sm ${pitchWordCount > 150 ? 'text-red-400' : 'text-stone-500'}`}
              >
                {pitchWordCount}/150 words
              </span>
            </div>
            <Textarea
              value={elevatorPitch}
              onChange={(e) => setElevatorPitch(e.target.value)}
              placeholder="In 150 words or less, pitch your app. What problem does it solve? Who is it for? Why is it better than alternatives?"
              className="bg-stone-800/50 border-stone-700"
              rows={4}
            />
            {pitchWordCount > 150 && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please keep your pitch under 150 words
              </p>
            )}
          </div>

          <div>
            <Label className="text-stone-300">Demo Video URL</Label>
            <Input
              value={demoVideoUrl}
              onChange={(e) => setDemoVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or Loom link"
              className="bg-stone-800/50 border-stone-700 mt-1"
            />
            <p className="text-stone-500 text-sm mt-1">
              A 2-3 minute video showing your app in action
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-stone-300">Screenshots</Label>
            {screenshots.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateScreenshot(index, e.target.value)}
                  placeholder="Screenshot URL"
                  className="flex-1 bg-stone-800/50 border-stone-700"
                />
                {screenshots.length > 1 && (
                  <Button variant="outline" size="icon" onClick={() => removeScreenshot(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addScreenshot} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Add Screenshot URL
            </Button>
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

          <div>
            <Label className="text-stone-300">Faculty Mentor (optional)</Label>
            <Input
              value={facultyMentor}
              onChange={(e) => setFacultyMentor(e.target.value)}
              placeholder="Name of faculty who guided you"
              className="bg-stone-800/50 border-stone-700 mt-1"
            />
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
