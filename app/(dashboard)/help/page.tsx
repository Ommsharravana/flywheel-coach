import { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  Target,
  Lightbulb,
  Wrench,
  Users,
  Presentation,
  Dna,
  Star,
  CheckCircle2,
  AlertCircle,
  Home,
  Briefcase,
  Settings,
  Database,
} from 'lucide-react';
import { HELP_CONTENT } from '@/lib/help/content';

export const metadata: Metadata = {
  title: 'Help & Support - JKKN Solution Studio',
  description: 'Complete guide for using JKKN Solution Studio and participating in events',
};

const CRITERIA_ICONS: Record<string, typeof Target> = {
  problem_impact: Target,
  solution_innovation: Lightbulb,
  working_prototype: Wrench,
  user_validation: Users,
  presentation_quality: Presentation,
  bioconvergence_alignment: Dna,
};

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-stone-100">
            Help & Support
          </h1>
        </div>
        <p className="text-stone-400">
          Everything you need to know about using JKKN Solution Studio and participating in events
        </p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-stone-800/50">
          <TabsTrigger value="platform">Platform Guide</TabsTrigger>
          <TabsTrigger value="appathon">Appathon Guide</TabsTrigger>
          <TabsTrigger value="support">Support & FAQ</TabsTrigger>
        </TabsList>

        {/* PLATFORM GUIDE TAB */}
        <TabsContent value="platform" className="space-y-6">
          {/* How to Use the Platform */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                How to Use JKKN Solution Studio
              </CardTitle>
              <CardDescription>
                Step-by-step guide to the Problem-to-Impact Flywheel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-stone-200 mb-2">What is the Flywheel?</h3>
                  <p className="text-stone-400 text-sm">
                    The Problem-to-Impact Flywheel is an 8-step methodology to help you discover real problems,
                    validate solutions, and ship AI-powered apps that make a difference.
                  </p>
                </div>

                <div className="bg-stone-800/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-amber-400 text-sm uppercase tracking-wider">The 8 Steps:</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">1</span>
                      <div>
                        <strong className="text-stone-200">Problem Discovery</strong>
                        <p className="text-stone-400">Find problems worth solving through structured questions</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">2</span>
                      <div>
                        <strong className="text-stone-200">Context Discovery</strong>
                        <p className="text-stone-400">Understand who, when, where, and how painful the problem is</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">3</span>
                      <div>
                        <strong className="text-stone-200">Value Discovery</strong>
                        <p className="text-stone-400">Validate with the Desperate User Test</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">4</span>
                      <div>
                        <strong className="text-stone-200">Workflow Classification</strong>
                        <p className="text-stone-400">Identify which of 10 AI workflow types fit your solution</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">5</span>
                      <div>
                        <strong className="text-stone-200">Prompt Generation</strong>
                        <p className="text-stone-400">Generate Lovable-ready prompts with AI assistance</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">6</span>
                      <div>
                        <strong className="text-stone-200">Build</strong>
                        <p className="text-stone-400">Create your app using Lovable AI</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">7</span>
                      <div>
                        <strong className="text-stone-200">Deploy</strong>
                        <p className="text-stone-400">Ship your app to production</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">8</span>
                      <div>
                        <strong className="text-stone-200">Impact Discovery</strong>
                        <p className="text-stone-400">Measure real-world results and discover new problems</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-200 mb-2">Getting Started</h3>
                  <ul className="space-y-2 text-sm text-stone-400">
                    <li className="flex gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Click &quot;Start New Cycle&quot; from your dashboard</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Work through each step - you can save progress at any time</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Use the AI Coach for guidance on any step</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Connect your Google account in Settings to enable AI features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem Bank */}
          <Card className="glass-card border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                Problem Bank
              </CardTitle>
              <CardDescription>
                Learn from validated problems discovered by the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-stone-400">
                The Problem Bank is a curated collection of real-world problems that have been validated
                through the Flywheel process. Browse it for inspiration or to find problems to solve.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/problem-bank"
                  className="text-sm text-purple-400 hover:text-purple-300 underline"
                >
                  Browse Problem Bank →
                </Link>
                <Link
                  href="/dashboard/problem-bank/submit"
                  className="text-sm text-amber-400 hover:text-amber-300 underline"
                >
                  Submit a Problem →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPATHON GUIDE TAB */}
        <TabsContent value="appathon" className="space-y-6">
          <Card className="glass-card border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-stone-100">Appathon 2.0 Guide</CardTitle>
              <CardDescription>
                Everything you need to know about judging and presenting at Appathon 2.0
              </CardDescription>
            </CardHeader>
          </Card>

          <Tabs defaultValue="judges" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-stone-800/50">
              <TabsTrigger value="judges">For Judges</TabsTrigger>
              <TabsTrigger value="participants">For Participants</TabsTrigger>
            </TabsList>

          {/* FOR JUDGES SUB-TAB */}
          <TabsContent value="judges" className="space-y-6">
          {/* How to Score */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                How to Score Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-stone-300">
                {HELP_CONTENT.scoring.how_to_score.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Scoring Criteria Explained */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <Star className="w-5 h-5 text-amber-400" />
                Scoring Criteria Explained
              </CardTitle>
              <CardDescription>
                What each criterion means and how to evaluate it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(HELP_CONTENT.criteria).map(([key, criterion]) => {
                  const Icon = CRITERIA_ICONS[key] || Target;
                  return (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger className="text-stone-200 hover:text-amber-400">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-amber-400" />
                          {criterion.title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-stone-400 space-y-3">
                        <p className="text-stone-300">{criterion.description}</p>
                        <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                          <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">
                            What to ask yourself:
                          </p>
                          <ul className="space-y-1 text-sm">
                            {criterion.tips.map((tip, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-amber-400">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Bonus Criteria */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <Star className="w-5 h-5 text-emerald-400" />
                Bonus Criteria
              </CardTitle>
              <CardDescription>
                Additional points teams can earn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(HELP_CONTENT.bonus).map(([key, bonus]) => (
                <div
                  key={key}
                  className="p-4 rounded-lg bg-stone-800/30 border border-stone-700 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-stone-200">
                      {bonus.title}
                    </h3>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                      +{key === 'cross_disciplinary' || key === 'cross_institutional' ? '5' : key === 'first_year' ? '3' : '2'}%
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-400 mb-2">
                    {bonus.description}
                  </p>
                  <p className="text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1 inline-block">
                    ✓ {bonus.check}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* What Makes a Good Score */}
          <Card className="glass-card border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-stone-100">
                What Makes a Good Score?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {HELP_CONTENT.scoring.what_makes_good_score.points.map(
                (point, i) => (
                  <div key={i} className="text-sm text-stone-300">
                    {point.split('**').map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="text-amber-400">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* FAQ for Judges */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {HELP_CONTENT.faq.judge_questions.map((faq, i) => (
                  <AccordionItem key={i} value={`judge-faq-${i}`}>
                    <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-stone-400">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOR PARTICIPANTS SUB-TAB */}
        <TabsContent value="participants" className="space-y-6">
          {/* Demo Day Tips */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <Presentation className="w-5 h-5 text-amber-400" />
                {HELP_CONTENT.demo_day.for_participants.title}
              </CardTitle>
              <CardDescription>
                How to deliver a winning demo presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {HELP_CONTENT.demo_day.for_participants.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-lg bg-stone-800/30 hover:bg-stone-800/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-stone-300 pt-0.5">
                    {tip.split('**').map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="text-amber-400">
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* What Judges Look For */}
          <Card className="glass-card border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-stone-100">
                {HELP_CONTENT.demo_day.what_judges_look_for.title}
              </CardTitle>
              <CardDescription>
                Understanding what gets you a high score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {HELP_CONTENT.demo_day.what_judges_look_for.points.map(
                  (point, i) => (
                    <li key={i} className="flex gap-3 text-stone-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>

          {/* FAQ for Participants */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {HELP_CONTENT.faq.participant_questions.map((faq, i) => (
                  <AccordionItem key={i} value={`participant-faq-${i}`}>
                    <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-stone-400">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </TabsContent>

        {/* SUPPORT & FAQ TAB */}
        <TabsContent value="support" className="space-y-6">
          {/* Contact Support */}
          <Card className="glass-card border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Need help? We&apos;re here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-800/30">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-200 mb-1">Technical Support</h3>
                  <p className="text-sm text-stone-400 mb-2">
                    For platform issues, bugs, or technical questions
                  </p>
                  <a
                    href="mailto:support@jkkn.ac.in"
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    support@jkkn.ac.in
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-800/30">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-200 mb-1">Event Support</h3>
                  <p className="text-sm text-stone-400 mb-2">
                    For event-related questions (Appathon, competitions)
                  </p>
                  <a
                    href="mailto:events@jkkn.ac.in"
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    events@jkkn.ac.in
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-800/30">
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-200 mb-1">Report a Bug</h3>
                  <p className="text-sm text-stone-400 mb-2">
                    Found a bug? Help us improve the platform
                  </p>
                  <Link
                    href="/my-bugs"
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Submit Bug Report →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General FAQ */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    How do I enable AI features?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    Go to Settings and click &quot;Connect Google Account&quot; under the Gemini AI section.
                    This uses your own Google subscription for AI features.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    Can I save my progress and come back later?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    Yes! Your progress is automatically saved as you work through each step.
                    You can close the browser and return anytime.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    What is a &quot;Cycle&quot;?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    A cycle is one complete journey through the 8-step Flywheel - from discovering a problem
                    to measuring its impact. You can complete multiple cycles for different problems.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    Do I need to know how to code?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    No! The platform uses AI (Lovable) to generate code for you. You focus on the problem
                    and solution - AI handles the coding.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    How do I submit my cycle to an event like Appathon?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    Enable &quot;Competition Mode&quot; in Settings, then complete your cycle.
                    Once you reach the Deploy step, you can submit your cycle to active events.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-6">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    Can I work on a cycle with a team?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    Currently, each cycle is associated with one user account. However, you can collaborate
                    offline and have one team member manage the cycle on the platform.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-7">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    What is the Problem Bank?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    The Problem Bank is a curated collection of validated problems discovered by the community.
                    You can browse it for inspiration or submit your own validated problems.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-8">
                  <AccordionTrigger className="text-stone-200 hover:text-amber-400 text-left">
                    How is my data stored and protected?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-400">
                    All data is stored securely using Supabase with industry-standard encryption.
                    Your Google API credentials are encrypted using AES-256-GCM.
                    See our{' '}
                    <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                      Privacy Policy
                    </Link>{' '}
                    for details.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="text-stone-100">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard"
                  className="p-3 rounded-lg bg-stone-800/30 hover:bg-stone-800/50 transition-colors text-sm text-stone-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">Dashboard</span>
                  </div>
                  <p className="text-xs text-stone-500">View your cycles</p>
                </Link>
                <Link
                  href="/portfolio"
                  className="p-3 rounded-lg bg-stone-800/30 hover:bg-stone-800/50 transition-colors text-sm text-stone-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold">Portfolio</span>
                  </div>
                  <p className="text-xs text-stone-500">Completed cycles</p>
                </Link>
                <Link
                  href="/dashboard/problem-bank"
                  className="p-3 rounded-lg bg-stone-800/30 hover:bg-stone-800/50 transition-colors text-sm text-stone-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold">Problem Bank</span>
                  </div>
                  <p className="text-xs text-stone-500">Browse problems</p>
                </Link>
                <Link
                  href="/settings"
                  className="p-3 rounded-lg bg-stone-800/30 hover:bg-stone-800/50 transition-colors text-sm text-stone-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Settings</span>
                  </div>
                  <p className="text-xs text-stone-500">Configure account</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
