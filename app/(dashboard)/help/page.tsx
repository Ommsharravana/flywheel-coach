import { Metadata } from 'next';
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
} from 'lucide-react';
import { HELP_CONTENT } from '@/lib/help/content';

export const metadata: Metadata = {
  title: 'Help & Guides - Appathon 2.0',
  description: 'Complete guide for judges and participants',
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
            Help & Guides
          </h1>
        </div>
        <p className="text-stone-400">
          Everything you need to know about judging and presenting at Appathon
          2.0
        </p>
      </div>

      <Tabs defaultValue="judges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-stone-800/50">
          <TabsTrigger value="judges">For Judges</TabsTrigger>
          <TabsTrigger value="participants">For Participants</TabsTrigger>
        </TabsList>

        {/* FOR JUDGES TAB */}
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

        {/* FOR PARTICIPANTS TAB */}
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
    </div>
  );
}
