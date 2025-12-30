'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ExternalLink,
  Send,
  CheckCircle2,
  Award,
  XCircle,
  Clock,
  FileText,
  Building2,
  Star,
  User,
  Users,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Github,
  Video,
  ImageIcon,
  Loader2,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SubmissionDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

interface Submission {
  id: string;
  cycle_id: string;
  event_id: string;
  user_id: string;
  participation_type: string;
  team_name: string;
  team_members: Array<{ id: string; name: string; email: string }>;
  senior_learner: { id: string; name: string; email: string } | null;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  department: string;
  year_of_study: string;
  app_name: string;
  problem_statement: string;
  solution_summary: string;
  live_url: string;
  lovable_url: string;
  github_url: string;
  elevator_pitch: string;
  demo_video_url: string;
  screenshots: string[];
  category: string;
  faculty_mentor: string;
  declaration_accepted: boolean;
  impact_metrics: { users_reached?: number; time_saved_minutes?: number; satisfaction_score?: number };
  status: string;
  submission_number: string;
  review_notes: string;
  reviewed_by: string;
  reviewed_at: string;
  score: number | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  institution?: { name: string; short_name: string };
  reviewer?: { name: string; email: string };
  cycle?: { name: string; current_step: number };
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'text-blue-400' },
  { value: 'under_review', label: 'Under Review', color: 'text-amber-400' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'text-purple-400' },
  { value: 'winner', label: 'Winner', color: 'text-green-400' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400' },
];

const CATEGORY_LABELS: Record<string, string> = {
  healthcare: 'Healthcare',
  education: 'Education',
  operations: 'Operations',
  productivity: 'Productivity',
  other: 'Other',
};

export default function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ slug: string; id: string } | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewScore, setReviewScore] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Fetch submission
  useEffect(() => {
    if (!resolvedParams) return;

    async function fetchSubmission() {
      try {
        const response = await fetch(`/api/admin/submissions/${resolvedParams!.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Submission not found');
            router.push(`/admin/events/${resolvedParams!.slug}/submissions`);
            return;
          }
          throw new Error('Failed to fetch submission');
        }
        const data = await response.json();
        setSubmission(data.submission);
        setReviewStatus(data.submission.status || '');
        setReviewScore(data.submission.score?.toString() || '');
        setReviewNotes(data.submission.review_notes || '');
      } catch (error) {
        console.error('Error fetching submission:', error);
        toast.error('Error loading submission');
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [resolvedParams, router]);

  const handleSaveReview = async () => {
    if (!resolvedParams || !submission) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/submissions/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus || undefined,
          score: reviewScore ? parseFloat(reviewScore) : undefined,
          review_notes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save review');
      }

      const data = await response.json();
      setSubmission(prev => prev ? { ...prev, ...data.submission } : null);
      toast.success('Review saved successfully');
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  if (!resolvedParams || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6">
        <p className="text-stone-400">Submission not found</p>
      </div>
    );
  }

  const StatusIcon = {
    draft: Clock,
    submitted: Send,
    under_review: FileText,
    shortlisted: CheckCircle2,
    winner: Award,
    rejected: XCircle,
  }[submission.status] || Clock;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/admin/events/${resolvedParams.slug}/submissions`}
            className="inline-flex items-center text-stone-400 hover:text-stone-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Link>
          <h1 className="text-2xl font-bold text-stone-100">{submission.team_name || 'Unnamed Team'}</h1>
          <div className="flex items-center gap-3 mt-2">
            {submission.submission_number && (
              <Badge variant="outline" className="font-mono text-stone-400 border-stone-600">
                {submission.submission_number}
              </Badge>
            )}
            <Badge variant="outline" className={`${STATUS_OPTIONS.find(s => s.value === submission.status)?.color || 'text-stone-400'} border-stone-600`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {STATUS_OPTIONS.find(s => s.value === submission.status)?.label || submission.status}
            </Badge>
            {submission.category && (
              <Badge variant="outline" className="text-stone-300 border-stone-600">
                {CATEGORY_LABELS[submission.category] || submission.category}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {submission.live_url && (
            <a href={submission.live_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-stone-700">
                <Globe className="h-4 w-4 mr-2" />
                Live App
              </Button>
            </a>
          )}
          {submission.lovable_url && (
            <a href={submission.lovable_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-stone-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Lovable
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Submission Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* App Details */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">App Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-stone-400">App Name</Label>
                <p className="text-stone-100 font-medium">{submission.app_name || '—'}</p>
              </div>
              <div>
                <Label className="text-stone-400">Problem Statement</Label>
                <p className="text-stone-200 whitespace-pre-wrap">{submission.problem_statement || '—'}</p>
              </div>
              <div>
                <Label className="text-stone-400">Solution Summary</Label>
                <p className="text-stone-200 whitespace-pre-wrap">{submission.solution_summary || '—'}</p>
              </div>
              <div>
                <Label className="text-stone-400">Elevator Pitch</Label>
                <p className="text-stone-200 whitespace-pre-wrap italic">{submission.elevator_pitch || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Team</CardTitle>
              <CardDescription>
                {submission.participation_type === 'team' ? 'Team submission' : 'Individual submission'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Senior Learner */}
              {submission.senior_learner && (
                <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">Senior Learner (Mentor)</span>
                  </div>
                  <p className="text-stone-100">{submission.senior_learner.name}</p>
                  <p className="text-stone-400 text-sm">{submission.senior_learner.email}</p>
                </div>
              )}

              {/* Primary Applicant */}
              <div className="p-3 bg-stone-800/50 border border-stone-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-stone-400" />
                  <span className="text-sm font-medium text-stone-300">Primary Contact</span>
                </div>
                <p className="text-stone-100">{submission.applicant_name}</p>
                <div className="flex items-center gap-4 text-sm text-stone-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {submission.applicant_email}
                  </span>
                  {submission.applicant_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {submission.applicant_phone}
                    </span>
                  )}
                </div>
                {(submission.department || submission.year_of_study) && (
                  <p className="text-stone-500 text-sm mt-1">
                    {submission.department}{submission.year_of_study && ` • ${submission.year_of_study}`}
                  </p>
                )}
              </div>

              {/* Team Members */}
              {submission.team_members && submission.team_members.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-stone-400" />
                    <span className="text-sm font-medium text-stone-300">Team Members</span>
                  </div>
                  <div className="grid gap-2">
                    {submission.team_members.map((member, idx) => (
                      <div key={idx} className="p-2 bg-stone-800/30 border border-stone-700/50 rounded">
                        <p className="text-stone-200 text-sm">{member.name}</p>
                        <p className="text-stone-500 text-xs">{member.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Faculty Mentor */}
              {submission.faculty_mentor && (
                <div>
                  <Label className="text-stone-400">Faculty Mentor</Label>
                  <p className="text-stone-200">{submission.faculty_mentor}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Links & Media */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Links & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {submission.live_url && (
                  <a href={submission.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-stone-800/50 border border-stone-700 rounded-lg hover:bg-stone-800 transition-colors">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="text-stone-200">Live App</span>
                    <ExternalLink className="h-4 w-4 text-stone-500 ml-auto" />
                  </a>
                )}
                {submission.lovable_url && (
                  <a href={submission.lovable_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-stone-800/50 border border-stone-700 rounded-lg hover:bg-stone-800 transition-colors">
                    <ExternalLink className="h-5 w-5 text-purple-400" />
                    <span className="text-stone-200">Lovable Project</span>
                    <ExternalLink className="h-4 w-4 text-stone-500 ml-auto" />
                  </a>
                )}
                {submission.github_url && (
                  <a href={submission.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-stone-800/50 border border-stone-700 rounded-lg hover:bg-stone-800 transition-colors">
                    <Github className="h-5 w-5 text-stone-300" />
                    <span className="text-stone-200">GitHub</span>
                    <ExternalLink className="h-4 w-4 text-stone-500 ml-auto" />
                  </a>
                )}
                {submission.demo_video_url && (
                  <a href={submission.demo_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-stone-800/50 border border-stone-700 rounded-lg hover:bg-stone-800 transition-colors">
                    <Video className="h-5 w-5 text-red-400" />
                    <span className="text-stone-200">Demo Video</span>
                    <ExternalLink className="h-4 w-4 text-stone-500 ml-auto" />
                  </a>
                )}
              </div>

              {/* Screenshots */}
              {submission.screenshots && submission.screenshots.length > 0 && (
                <div>
                  <Label className="text-stone-400 flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4" />
                    Screenshots ({submission.screenshots.length})
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {submission.screenshots.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative h-32">
                        <Image
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          fill
                          className="rounded border border-stone-700 hover:opacity-80 transition-opacity object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          {submission.impact_metrics && Object.keys(submission.impact_metrics).length > 0 && (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100">Impact Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {submission.impact_metrics.users_reached !== undefined && (
                    <div className="text-center p-3 bg-stone-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-stone-100">{submission.impact_metrics.users_reached}</div>
                      <p className="text-xs text-stone-500">Users Reached</p>
                    </div>
                  )}
                  {submission.impact_metrics.time_saved_minutes !== undefined && (
                    <div className="text-center p-3 bg-stone-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-stone-100">{submission.impact_metrics.time_saved_minutes}</div>
                      <p className="text-xs text-stone-500">Minutes Saved</p>
                    </div>
                  )}
                  {submission.impact_metrics.satisfaction_score !== undefined && (
                    <div className="text-center p-3 bg-stone-800/50 rounded-lg">
                      <div className="text-2xl font-bold text-stone-100">{submission.impact_metrics.satisfaction_score}</div>
                      <p className="text-xs text-stone-500">Satisfaction Score</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Review Panel */}
        <div className="space-y-6">
          {/* Institution Info */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-stone-500" />
                <div>
                  <p className="font-medium text-stone-100">{submission.institution?.name || 'Unknown'}</p>
                  <p className="text-sm text-stone-500">{submission.institution?.short_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Review</CardTitle>
              <CardDescription>Score and update submission status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <Label className="text-stone-400">Status</Label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full mt-1 bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Score */}
              <div>
                <Label className="text-stone-400">Score (0-5)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-5 w-5 text-amber-400" />
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value)}
                    placeholder="0.0"
                    className="bg-stone-800 border-stone-700"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-stone-400">Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  className="mt-1 bg-stone-800 border-stone-700 min-h-[100px]"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveReview}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Review
                  </>
                )}
              </Button>

              {/* Last Review Info */}
              {submission.reviewed_at && (
                <div className="text-xs text-stone-500 text-center pt-2 border-t border-stone-700">
                  Last reviewed {new Date(submission.reviewed_at).toLocaleString()}
                  {submission.reviewer && ` by ${submission.reviewer.name}`}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-green-700 text-green-400 hover:bg-green-900/20"
                onClick={() => {
                  setReviewStatus('winner');
                  handleSaveReview();
                }}
                disabled={saving}
              >
                <Award className="h-4 w-4 mr-2" />
                Mark as Winner
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-purple-700 text-purple-400 hover:bg-purple-900/20"
                onClick={() => {
                  setReviewStatus('shortlisted');
                  handleSaveReview();
                }}
                disabled={saving}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Shortlist
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-red-700 text-red-400 hover:bg-red-900/20"
                onClick={() => {
                  setReviewStatus('rejected');
                  handleSaveReview();
                }}
                disabled={saving}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6 text-sm text-stone-500 space-y-1">
              <p>Created: {new Date(submission.created_at).toLocaleString()}</p>
              {submission.submitted_at && (
                <p>Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
              )}
              <p>Updated: {new Date(submission.updated_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
