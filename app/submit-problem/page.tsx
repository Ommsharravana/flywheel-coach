'use client';

import { useState } from 'react';
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
  Building2,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Users,
  IndianRupee,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PROBLEM_THEMES } from '@/lib/types/problem-bank';

export default function IndustrySubmitProblemPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    theme: 'other',
    who_affected: '',
    when_occurs: '',
    where_occurs: '',
    current_workaround: '',
    severity_rating: '',
    partner_name: '',
    partner_email: '',
    partner_company: '',
    partner_phone: '',
    budget_amount: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/problems/industry-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          severity_rating: formData.severity_rating ? parseInt(formData.severity_rating) : null,
          budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit problem');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-stone-900/50 border-green-500/30">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-stone-100 mb-4">
                Problem Submitted Successfully!
              </h2>
              <p className="text-stone-400 mb-8 max-w-md mx-auto">
                Thank you for submitting your problem. Our team will review it and get back to you
                at the email address you provided.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      title: '',
                      problem_statement: '',
                      theme: 'other',
                      who_affected: '',
                      when_occurs: '',
                      where_occurs: '',
                      current_workaround: '',
                      severity_rating: '',
                      partner_name: '',
                      partner_email: '',
                      partner_company: '',
                      partner_phone: '',
                      budget_amount: '',
                    });
                  }}
                  variant="outline"
                  className="border-stone-700 text-stone-300"
                >
                  Submit Another Problem
                </Button>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/jkkn-logo.png"
              alt="JKKN"
              width={40}
              height={40}
              className="rounded"
            />
            <div>
              <div className="font-display font-bold text-stone-100">JKKN Solution Studio</div>
              <div className="text-xs text-stone-400">Industry Problem Submission</div>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">For Industry Partners</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-stone-100 mb-4">
            Submit a Problem for Our Learners to Solve
          </h1>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Share real-world challenges from your organization. Our talented learners from JKKN
            institutions will build innovative solutions using AI-powered development tools.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-stone-900/30 border-stone-800">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-medium text-stone-200 mb-1">3000+ Learners</h3>
              <p className="text-sm text-stone-400">
                Access talent from 7 JKKN institutions
              </p>
            </CardContent>
          </Card>
          <Card className="bg-stone-900/30 border-stone-800">
            <CardContent className="pt-6 text-center">
              <Lightbulb className="h-8 w-8 text-amber-400 mx-auto mb-3" />
              <h3 className="font-medium text-stone-200 mb-1">AI-Powered Solutions</h3>
              <p className="text-sm text-stone-400">
                Rapid prototyping with cutting-edge tools
              </p>
            </CardContent>
          </Card>
          <Card className="bg-stone-900/30 border-stone-800">
            <CardContent className="pt-6 text-center">
              <IndianRupee className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-medium text-stone-200 mb-1">Cost-Effective</h3>
              <p className="text-sm text-stone-400">
                Get solutions at a fraction of market cost
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-900/30 border-red-500/50 mb-6">
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
          {/* Contact Information */}
          <Card className="bg-stone-900/50 border-stone-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                Your Information
              </CardTitle>
              <CardDescription>
                Tell us about yourself so we can get back to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partner_name" className="text-stone-200">
                    Your Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="partner_name"
                    placeholder="John Doe"
                    value={formData.partner_name}
                    onChange={(e) => handleChange('partner_name', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_email" className="text-stone-200">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="partner_email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.partner_email}
                    onChange={(e) => handleChange('partner_email', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partner_company" className="text-stone-200">
                    Company/Organization <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="partner_company"
                    placeholder="Acme Corp"
                    value={formData.partner_company}
                    onChange={(e) => handleChange('partner_company', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_phone" className="text-stone-200">
                    Phone (Optional)
                  </Label>
                  <Input
                    id="partner_phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.partner_phone}
                    onChange={(e) => handleChange('partner_phone', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem Details */}
          <Card className="bg-stone-900/50 border-stone-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Problem Details
              </CardTitle>
              <CardDescription>
                Describe the problem you want solved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-stone-200">
                  Problem Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Patient appointment scheduling system for rural clinics"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-stone-800 border-stone-700"
                  maxLength={200}
                  required
                />
                <p className="text-xs text-stone-500">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem_statement" className="text-stone-200">
                  Problem Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="problem_statement"
                  placeholder="Describe the problem in detail. What&apos;s the pain? Who experiences it? What happens when it&apos;s not solved?"
                  value={formData.problem_statement}
                  onChange={(e) => handleChange('problem_statement', e.target.value)}
                  className="bg-stone-800 border-stone-700 min-h-[150px]"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-stone-200">
                    Theme/Category
                  </Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) => handleChange('theme', value)}
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity_rating" className="text-stone-200">
                    Urgency (1-10)
                  </Label>
                  <Select
                    value={formData.severity_rating}
                    onValueChange={(value) => handleChange('severity_rating', value)}
                  >
                    <SelectTrigger className="bg-stone-800 border-stone-700">
                      <SelectValue placeholder="How urgent?" />
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
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="who_affected" className="text-stone-200">
                    Who is affected?
                  </Label>
                  <Input
                    id="who_affected"
                    placeholder="e.g., Nurses, patients"
                    value={formData.who_affected}
                    onChange={(e) => handleChange('who_affected', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="when_occurs" className="text-stone-200">
                    When does it occur?
                  </Label>
                  <Input
                    id="when_occurs"
                    placeholder="e.g., During peak hours"
                    value={formData.when_occurs}
                    onChange={(e) => handleChange('when_occurs', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="where_occurs" className="text-stone-200">
                    Where does it happen?
                  </Label>
                  <Input
                    id="where_occurs"
                    placeholder="e.g., Rural clinics"
                    value={formData.where_occurs}
                    onChange={(e) => handleChange('where_occurs', e.target.value)}
                    className="bg-stone-800 border-stone-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_workaround" className="text-stone-200">
                  Current Workaround (if any)
                </Label>
                <Textarea
                  id="current_workaround"
                  placeholder="How do people currently deal with this problem?"
                  value={formData.current_workaround}
                  onChange={(e) => handleChange('current_workaround', e.target.value)}
                  className="bg-stone-800 border-stone-700 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget (Optional) */}
          <Card className="bg-stone-900/50 border-stone-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-green-400" />
                Budget (Optional)
              </CardTitle>
              <CardDescription>
                If this is a paid project, specify your budget. Our learners earn 60% of the project fee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="budget_amount" className="text-stone-200">
                  Project Budget (INR)
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="budget_amount"
                    type="number"
                    placeholder="50000"
                    value={formData.budget_amount}
                    onChange={(e) => handleChange('budget_amount', e.target.value)}
                    className="bg-stone-800 border-stone-700 pl-9"
                  />
                </div>
                <p className="text-xs text-stone-500">
                  Leave empty for non-paid learning projects
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/">
              <Button
                type="button"
                variant="outline"
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-400 hover:to-green-500"
            >
              {isSubmitting ? (
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
        </form>

        {/* Footer Note */}
        <p className="text-center text-sm text-stone-500 mt-8">
          By submitting, you agree that JKKN learners may work on your problem as part of their
          educational curriculum. All intellectual property agreements will be handled separately
          for paid projects.
        </p>
      </div>
    </div>
  );
}
