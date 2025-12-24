'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Lightbulb,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { PROBLEM_THEMES, type ProblemTheme } from '@/lib/types/problem-bank';

export default function SubmitProblemPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    theme: 'other' as ProblemTheme | 'other',
    who_affected: '',
    when_occurs: '',
    where_occurs: '',
    current_workaround: '',
    severity_rating: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          severity_rating: formData.severity_rating ? parseInt(formData.severity_rating) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit problem');
      }

      setSuccess('Problem submitted successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/problem-bank/${data.problem_id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/problem-bank"
            className="text-stone-400 hover:text-stone-100 text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Problem Bank
          </Link>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-400" />
            Submit a Problem
          </h1>
          <p className="text-stone-400 mt-1">
            Share a problem you&apos;ve discovered. Others can fork it and build solutions.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="bg-green-900/30 border-green-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-300">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-900/30 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Problem Details</CardTitle>
            <CardDescription>
              Describe the problem you want to share with the community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-stone-200">
                Problem Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Hospital nurses spend too much time on medication documentation"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="bg-stone-800 border-stone-700"
                required
                maxLength={200}
              />
              <p className="text-xs text-stone-500">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Problem Statement */}
            <div className="space-y-2">
              <Label htmlFor="problem_statement" className="text-stone-200">
                Problem Statement <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="problem_statement"
                placeholder="Describe the problem in detail. What's the pain? Who experiences it? What happens when it's not solved?"
                value={formData.problem_statement}
                onChange={(e) => updateField('problem_statement', e.target.value)}
                className="bg-stone-800 border-stone-700 min-h-[150px]"
                required
              />
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-stone-200">
                Theme
              </Label>
              <Select
                value={formData.theme}
                onValueChange={(value) => updateField('theme', value)}
              >
                <SelectTrigger className="bg-stone-800 border-stone-700">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROBLEM_THEMES).map(([key, { label, emoji }]) => (
                    <SelectItem key={key} value={key}>
                      {emoji} {label}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Context Fields */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="who_affected" className="text-stone-200">
                  Who is affected?
                </Label>
                <Input
                  id="who_affected"
                  placeholder="e.g., Hospital nurses"
                  value={formData.who_affected}
                  onChange={(e) => updateField('who_affected', e.target.value)}
                  className="bg-stone-800 border-stone-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="when_occurs" className="text-stone-200">
                  When does it occur?
                </Label>
                <Input
                  id="when_occurs"
                  placeholder="e.g., During shift changes"
                  value={formData.when_occurs}
                  onChange={(e) => updateField('when_occurs', e.target.value)}
                  className="bg-stone-800 border-stone-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="where_occurs" className="text-stone-200">
                  Where does it happen?
                </Label>
                <Input
                  id="where_occurs"
                  placeholder="e.g., Hospital wards"
                  value={formData.where_occurs}
                  onChange={(e) => updateField('where_occurs', e.target.value)}
                  className="bg-stone-800 border-stone-700"
                />
              </div>
            </div>

            {/* Current Workaround */}
            <div className="space-y-2">
              <Label htmlFor="current_workaround" className="text-stone-200">
                Current Workaround
              </Label>
              <Textarea
                id="current_workaround"
                placeholder="How do people currently deal with this problem?"
                value={formData.current_workaround}
                onChange={(e) => updateField('current_workaround', e.target.value)}
                className="bg-stone-800 border-stone-700 min-h-[80px]"
              />
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity_rating" className="text-stone-200">
                Severity (1-10)
              </Label>
              <Select
                value={formData.severity_rating}
                onValueChange={(value) => updateField('severity_rating', value)}
              >
                <SelectTrigger className="bg-stone-800 border-stone-700 w-32">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} - {n <= 3 ? 'Low' : n <= 6 ? 'Medium' : n <= 8 ? 'High' : 'Critical'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.title || !formData.problem_statement}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Problem
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Info Card */}
      <Card className="bg-stone-900/30 border-stone-800">
        <CardContent className="pt-6">
          <h3 className="font-medium text-stone-200 mb-2">What happens next?</h3>
          <ul className="text-sm text-stone-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">1.</span>
              Your problem will appear in the Problem Bank with &quot;Unvalidated&quot; status
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">2.</span>
              Other learners can see it and fork it to build solutions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">3.</span>
              As people work on it, validation status will update based on their findings
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
