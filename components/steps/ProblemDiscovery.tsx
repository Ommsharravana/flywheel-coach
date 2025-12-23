'use client';

import { useState } from 'react';
import { Cycle, Problem } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Lightbulb, Save, Sparkles, FileText, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAppathonMode } from '@/lib/context/EventContext';
import { ProblemIdeasPanel } from '@/components/appathon/ProblemIdeasPanel';
import { type ProblemIdea, type AppathonThemeId } from '@/lib/appathon/content';

interface ProblemDiscoveryProps {
  cycle: Cycle;
}

const DISCOVERY_QUESTIONS = [
  {
    id: 'question1',
    title: 'What frustrates you most?',
    description: 'Think about daily tasks, tools, or processes that annoy you regularly.',
    placeholder: 'e.g., "I hate manually updating spreadsheets with student attendance every day..."',
    icon: '😤',
  },
  {
    id: 'question2',
    title: 'What takes too long?',
    description: 'What activities consume more time than they should?',
    placeholder: 'e.g., "Grading assignments takes me 3+ hours every evening..."',
    icon: '⏰',
  },
  {
    id: 'question3',
    title: 'What do you avoid doing?',
    description: 'Tasks you procrastinate on or delegate because they\'re painful.',
    placeholder: 'e.g., "I keep putting off organizing my research notes..."',
    icon: '🙈',
  },
  {
    id: 'question4',
    title: 'What would you pay to fix?',
    description: 'Problems painful enough that you\'d spend money to solve them.',
    placeholder: 'e.g., "I\'d pay for something that schedules meetings without the back-and-forth..."',
    icon: '💰',
  },
  {
    id: 'question5',
    title: 'What problem affects others too?',
    description: 'Problems you\'ve heard colleagues or friends complain about.',
    placeholder: 'e.g., "Everyone in the department struggles with the same attendance system..."',
    icon: '👥',
  },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Every day or multiple times a day' },
  { value: 'weekly', label: 'Weekly', description: 'Several times a week' },
  { value: 'monthly', label: 'Monthly', description: 'A few times a month' },
  { value: 'occasional', label: 'Rarely', description: 'Occasionally when it comes up' },
];

// Placeholder key colors for visual distinction
const PLACEHOLDER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  WHO: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  PROBLEM: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  CAUSE: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  IMPACT: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
};

export function ProblemDiscovery({ cycle }: ProblemDiscoveryProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();
  const { isAppathonMode } = useAppathonMode();

  // Initialize state from existing problem or empty
  const [answers, setAnswers] = useState<Record<string, string>>(
    cycle.problem?.answers || {
      question1: '',
      question2: '',
      question3: '',
      question4: '',
      question5: '',
    }
  );
  const [problemStatement, setProblemStatement] = useState(cycle.problem?.statement || '');
  const [refinedStatement, setRefinedStatement] = useState(cycle.problem?.refinedStatement || '');
  const [painLevel, setPainLevel] = useState(cycle.problem?.painLevel || 5);
  const [frequency, setFrequency] = useState<string>(cycle.problem?.frequency || 'weekly');
  const [currentTab, setCurrentTab] = useState('questions');
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Appathon template state
  const [selectedProblem, setSelectedProblem] = useState<ProblemIdea | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<AppathonThemeId | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [copiedStatement, setCopiedStatement] = useState(false);

  // Calculate progress
  const answeredQuestions = Object.values(answers).filter((a) => a.trim().length > 0).length;
  const hasAllAnswers = answeredQuestions === 5;
  const hasProblemStatement = problemStatement.trim().length > 0;
  const hasRefinement = refinedStatement.trim().length > 0;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const generateProblemStatement = () => {
    // Simple concatenation of answers into a problem statement
    const parts = [];
    if (answers.question1) parts.push(`Users are frustrated by ${answers.question1.toLowerCase()}`);
    if (answers.question2) parts.push(`This takes too long: ${answers.question2.toLowerCase()}`);
    if (answers.question4) parts.push(`They would pay to solve ${answers.question4.toLowerCase()}`);

    const generated = parts.join('. ') + '.';
    setProblemStatement(generated);
    setCurrentTab('statement');
  };

  const saveProblem = async () => {
    setIsPending(true);
    try {
      // Map to database column names
      const problemData = {
        cycle_id: cycle.id,
        q_takes_too_long: answers.question2 || null,
        q_repetitive: answers.question3 || null,
        q_lookup_repeatedly: answers.question1 || null, // What frustrates you
        q_complaints: answers.question5 || null, // What affects others
        q_would_pay: answers.question4 || null,
        selected_question: problemStatement || null,
        refined_statement: refinedStatement || null,
        pain_level: painLevel,
        frequency: frequency,
        completed: !!refinedStatement,
        updated_at: new Date().toISOString(),
      };

      // Check if problem exists
      if (cycle.problem?.id) {
        // Update existing
        const { error } = await supabase
          .from('problems')
          .update(problemData)
          .eq('id', cycle.problem.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('problems').insert({
          ...problemData,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Update cycle step if completing
      if (hasRefinement) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 2,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;
      }

      toast.success('Problem saved successfully!');

      if (hasRefinement) {
        router.push(`/cycle/${cycle.id}/step/2`);
      } else {
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Error saving problem:', error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  const completeStep = async () => {
    if (!hasRefinement) {
      toast.error('Please refine your problem statement before proceeding.');
      return;
    }
    await saveProblem();
  };

  // Handler for Appathon problem selection - receives full ProblemIdea
  const handleAppathonProblemSelect = (problem: ProblemIdea, themeId: AppathonThemeId) => {
    setSelectedProblem(problem);
    setSelectedTheme(themeId);
    setTemplateValues({}); // Reset template values for new problem
    setCurrentTab('statement');
  };

  // Get filled statement from template
  const getFilledStatement = () => {
    if (!selectedProblem) return '';

    let statement = selectedProblem.template.statement;
    selectedProblem.template.placeholders.forEach(p => {
      const value = templateValues[p.key] || p.example;
      statement = statement.replace(`[${p.key}]`, value);
    });
    return statement;
  };

  // Update template value
  const updateTemplateValue = (key: string, value: string) => {
    setTemplateValues(prev => ({ ...prev, [key]: value }));
  };

  // Use filled statement as problem statement
  const useFilledStatement = () => {
    const statement = getFilledStatement();
    setProblemStatement(statement);
    if (selectedProblem?.lovablePrompt) {
      setRefinedStatement(selectedProblem.lovablePrompt);
    }
    toast.success('Statement applied! Review and refine it below.');
  };

  // Copy filled statement
  const copyFilledStatement = () => {
    navigator.clipboard.writeText(getFilledStatement());
    setCopiedStatement(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedStatement(false), 2000);
  };

  // Clear selected problem
  const clearSelectedProblem = () => {
    setSelectedProblem(null);
    setSelectedTheme(null);
    setTemplateValues({});
  };

  return (
    <div className={isAppathonMode ? 'grid lg:grid-cols-3 gap-6' : ''}>
      {/* Appathon sidebar - shown when Appathon mode is ON */}
      {isAppathonMode && (
        <div className="lg:col-span-1 order-2 lg:order-1">
          <ProblemIdeasPanel onSelectProblem={handleAppathonProblemSelect} />
        </div>
      )}

      {/* Main content */}
      <div className={isAppathonMode ? 'lg:col-span-2 order-1 lg:order-2 space-y-6' : 'space-y-6'}>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3 bg-stone-800/50">
            <TabsTrigger value="questions" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
              1. Questions ({answeredQuestions}/5)
            </TabsTrigger>
          <TabsTrigger
            value="statement"
            disabled={!hasAllAnswers && !isAppathonMode}
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900"
          >
            2. Statement
          </TabsTrigger>
          <TabsTrigger
            value="refine"
            disabled={!hasProblemStatement}
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900"
          >
            3. Refine
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100">Discovery Questions</CardTitle>
              <CardDescription>
                Answer these 5 questions to uncover problems worth solving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{DISCOVERY_QUESTIONS[currentQuestion].icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-stone-100">
                          {DISCOVERY_QUESTIONS[currentQuestion].title}
                        </h3>
                        <p className="text-sm text-stone-400">
                          {DISCOVERY_QUESTIONS[currentQuestion].description}
                        </p>
                      </div>
                    </div>

                    <Textarea
                      value={answers[DISCOVERY_QUESTIONS[currentQuestion].id] || ''}
                      onChange={(e) =>
                        handleAnswerChange(DISCOVERY_QUESTIONS[currentQuestion].id, e.target.value)
                      }
                      placeholder={DISCOVERY_QUESTIONS[currentQuestion].placeholder}
                      className="min-h-[120px] bg-stone-800/50 border-stone-700 focus:border-amber-500"
                    />

                    {/* Question navigation */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex gap-2">
                        {DISCOVERY_QUESTIONS.map((q, idx) => (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestion(idx)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                              idx === currentQuestion
                                ? 'bg-amber-500 text-stone-900'
                                : answers[q.id]?.trim()
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                                : 'bg-stone-800 text-stone-400 border border-stone-700'
                            }`}
                          >
                            {answers[q.id]?.trim() ? <Check className="w-4 h-4" /> : idx + 1}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {currentQuestion > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => setCurrentQuestion((prev) => prev - 1)}
                          >
                            Previous
                          </Button>
                        )}
                        {currentQuestion < 4 ? (
                          <Button
                            onClick={() => setCurrentQuestion((prev) => prev + 1)}
                            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                          >
                            Next
                            <ChevronRight className="ml-1 w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={generateProblemStatement}
                            disabled={!hasAllAnswers}
                            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                          >
                            <Sparkles className="mr-2 w-4 h-4" />
                            Generate Statement
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Answers summary */}
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-stone-100">Your Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DISCOVERY_QUESTIONS.map((q, idx) => (
                <div
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    idx === currentQuestion
                      ? 'bg-amber-500/20 border border-amber-500'
                      : 'bg-stone-800/30 hover:bg-stone-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{q.icon}</span>
                    <span className="text-sm font-medium text-stone-300">{q.title}</span>
                    {answers[q.id]?.trim() && (
                      <Badge variant="outline" className="ml-auto text-emerald-400 border-emerald-500">
                        <Check className="w-3 h-3 mr-1" /> Done
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 line-clamp-2">
                    {answers[q.id]?.trim() || 'Not answered yet'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statement Tab */}
        <TabsContent value="statement" className="mt-6 space-y-6">
          {/* Appathon Template Builder - shown when a problem is selected */}
          <AnimatePresence mode="wait">
            {isAppathonMode && selectedProblem && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-stone-950">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                          <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-stone-100">
                            Build Your Problem Statement
                          </CardTitle>
                          <CardDescription className="text-stone-400">
                            Fill in the blanks to customize your statement
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelectedProblem}
                        className="h-8 w-8 p-0 text-stone-500 hover:text-stone-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Selected problem title */}
                    <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-500 mb-1">Selected Problem</p>
                      <p className="text-sm text-stone-200 font-medium">{selectedProblem.problem}</p>
                    </div>

                    {/* Template structure visualization */}
                    <div className="bg-stone-900/50 rounded-lg p-4 border border-dashed border-stone-700">
                      <p className="text-xs text-stone-500 mb-3 uppercase tracking-wider font-bold">
                        Template Structure
                      </p>
                      <p className="text-sm text-stone-400 font-mono leading-relaxed">
                        <span className={`inline-block px-2 py-1 rounded border text-xs font-bold mr-1 ${PLACEHOLDER_COLORS.WHO.text} ${PLACEHOLDER_COLORS.WHO.bg} ${PLACEHOLDER_COLORS.WHO.border}`}>
                          WHO
                        </span>
                        struggles with
                        <span className={`inline-block px-2 py-1 rounded border text-xs font-bold mx-1 ${PLACEHOLDER_COLORS.PROBLEM.text} ${PLACEHOLDER_COLORS.PROBLEM.bg} ${PLACEHOLDER_COLORS.PROBLEM.border}`}>
                          PROBLEM
                        </span>
                        because
                        <span className={`inline-block px-2 py-1 rounded border text-xs font-bold mx-1 ${PLACEHOLDER_COLORS.CAUSE.text} ${PLACEHOLDER_COLORS.CAUSE.bg} ${PLACEHOLDER_COLORS.CAUSE.border}`}>
                          CAUSE
                        </span>
                        , which leads to
                        <span className={`inline-block px-2 py-1 rounded border text-xs font-bold mx-1 ${PLACEHOLDER_COLORS.IMPACT.text} ${PLACEHOLDER_COLORS.IMPACT.bg} ${PLACEHOLDER_COLORS.IMPACT.border}`}>
                          IMPACT
                        </span>
                        .
                      </p>
                    </div>

                    {/* Placeholder input fields */}
                    <div className="grid gap-4">
                      {selectedProblem.template.placeholders.map((placeholder) => {
                        const colors = PLACEHOLDER_COLORS[placeholder.key] || PLACEHOLDER_COLORS.WHO;
                        const currentValue = templateValues[placeholder.key] || '';

                        return (
                          <div key={placeholder.key} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-1 rounded border text-xs font-bold ${colors.text} ${colors.bg} ${colors.border}`}>
                                {placeholder.key}
                              </span>
                              <span className="text-xs text-stone-500 italic">
                                {placeholder.hint}
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder={placeholder.example}
                                value={currentValue}
                                onChange={(e) => updateTemplateValue(placeholder.key, e.target.value)}
                                className="w-full bg-stone-900/80 border-2 border-stone-700 rounded-lg px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                              />
                              {!currentValue && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Lightbulb className="w-4 h-4 text-stone-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Generated statement preview */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-lg p-4 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Your Problem Statement
                        </span>
                      </div>
                      <p className="text-base text-stone-200 leading-relaxed">
                        {getFilledStatement()}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-stone-700 text-stone-400 hover:bg-stone-800"
                        onClick={copyFilledStatement}
                      >
                        {copiedStatement ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Statement
                          </>
                        )}
                      </Button>
                      <Button
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold"
                        onClick={useFilledStatement}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Use This Statement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Problem Statement Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Problem Statement
              </CardTitle>
              <CardDescription>
                {isAppathonMode && !selectedProblem
                  ? 'Select a problem idea from the sidebar, or write your own below.'
                  : 'Based on your answers, here\'s a draft problem statement. Edit it to capture the core issue.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-stone-300 mb-2 block">Your Problem Statement</Label>
                <Textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Describe the problem in one or two sentences..."
                  className="min-h-[150px] bg-stone-800/50 border-stone-700 focus:border-amber-500 text-lg"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div>
                  <Label className="text-stone-300 mb-3 block">
                    Pain Level: <span className="text-amber-400 font-bold">{painLevel}/10</span>
                  </Label>
                  <Slider
                    value={[painLevel]}
                    onValueChange={([value]) => setPainLevel(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Mild annoyance</span>
                    <span>Extremely painful</span>
                  </div>
                </div>

                <div>
                  <Label className="text-stone-300 mb-3 block">How often does this occur?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFrequency(opt.value)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          frequency === opt.value
                            ? 'bg-amber-500/20 border-2 border-amber-500'
                            : 'bg-stone-800/50 border border-stone-700 hover:border-stone-600'
                        }`}
                      >
                        <div className="font-medium text-stone-200">{opt.label}</div>
                        <div className="text-xs text-stone-500">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentTab('questions')}>
                  Back to Questions
                </Button>
                <Button
                  onClick={() => setCurrentTab('refine')}
                  disabled={!hasProblemStatement}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                >
                  Continue to Refine
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refine Tab */}
        <TabsContent value="refine" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100">Refine Your Problem</CardTitle>
              <CardDescription>
                Make your problem statement more specific and actionable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original statement */}
              <div className="p-4 bg-stone-800/30 rounded-lg">
                <Label className="text-stone-400 text-sm mb-2 block">Original Statement</Label>
                <p className="text-stone-300">{problemStatement}</p>
              </div>

              {/* Refinement tips */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <div className="text-amber-400 font-medium mb-1">Be Specific</div>
                  <p className="text-sm text-stone-400">
                    &quot;Students&quot; → &quot;2nd year CS students at JKKN&quot;
                  </p>
                </div>
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <div className="text-amber-400 font-medium mb-1">Quantify</div>
                  <p className="text-sm text-stone-400">
                    &quot;Takes too long&quot; → &quot;Takes 3+ hours per week&quot;
                  </p>
                </div>
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <div className="text-amber-400 font-medium mb-1">Add Context</div>
                  <p className="text-sm text-stone-400">
                    &quot;When?&quot; → &quot;During exam preparation&quot;
                  </p>
                </div>
              </div>

              {/* Refined statement */}
              <div>
                <Label className="text-stone-300 mb-2 block">Refined Problem Statement</Label>
                <Textarea
                  value={refinedStatement}
                  onChange={(e) => setRefinedStatement(e.target.value)}
                  placeholder="Write a more specific, quantified version of your problem statement..."
                  className="min-h-[150px] bg-stone-800/50 border-stone-700 focus:border-amber-500 text-lg"
                />
              </div>

              {/* Summary card */}
              {hasRefinement && (
                <Card className="border-emerald-500/30 bg-emerald-500/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-emerald-400 mb-1">Ready to proceed!</h4>
                        <p className="text-sm text-stone-400">
                          Your refined problem statement: &quot;{refinedStatement}&quot;
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-stone-400">
                            Pain: <span className="text-amber-400">{painLevel}/10</span>
                          </span>
                          <span className="text-stone-400">
                            Frequency: <span className="text-amber-400 capitalize">{frequency}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentTab('statement')}>
                  Back to Statement
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={saveProblem}
                    disabled={isPending}
                  >
                    <Save className="mr-2 w-4 h-4" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={completeStep}
                    disabled={!hasRefinement || isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isPending ? 'Saving...' : 'Complete & Continue'}
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
