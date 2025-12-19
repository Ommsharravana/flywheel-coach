'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  APPATHON_THEMES,
  PROBLEM_IDEAS,
  MYJKKN_DATA_ENDPOINTS,
  JUDGING_CRITERIA,
  BONUS_CRITERIA,
  type AppathonThemeId,
  type ProblemIdea,
} from '@/lib/appathon/content';
import {
  Sparkles,
  Database,
  Copy,
  Check,
  Trophy,
  Star,
  ChevronDown,
  ChevronRight,
  Zap,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ProblemIdeasPanelProps {
  onSelectProblem?: (problem: string, lovablePrompt?: string, fullStatement?: string) => void;
}

// Theme colors - neon accents for each category
const THEME_COLORS: Record<AppathonThemeId, { bg: string; border: string; text: string; glow: string }> = {
  healthcare: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
  education: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
  agriculture: {
    bg: 'bg-lime-500/10',
    border: 'border-lime-500',
    text: 'text-lime-400',
    glow: 'shadow-lime-500/20',
  },
  environment: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  community: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  myjkkn: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
};

// Difficulty visual config
const DIFFICULTY_CONFIG = {
  Easy: { bars: 1, color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Starter' },
  Medium: { bars: 2, color: 'bg-amber-500', text: 'text-amber-400', label: 'Balanced' },
  Hard: { bars: 3, color: 'bg-rose-500', text: 'text-rose-400', label: 'Advanced' },
};

// Placeholder key colors for visual distinction
const PLACEHOLDER_COLORS: Record<string, string> = {
  WHO: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  PROBLEM: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  CAUSE: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  IMPACT: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
};

export function ProblemIdeasPanel({ onSelectProblem }: ProblemIdeasPanelProps) {
  const [selectedTheme, setSelectedTheme] = useState<AppathonThemeId>('healthcare');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCriteria, setShowCriteria] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, Record<string, string>>>({});

  const themeColors = THEME_COLORS[selectedTheme];
  const currentTheme = APPATHON_THEMES.find((t) => t.id === selectedTheme);
  const problems = PROBLEM_IDEAS[selectedTheme];

  const handleCopyPrompt = (problem: ProblemIdea, idx: number) => {
    const promptText = problem.lovablePrompt || problem.problem;
    navigator.clipboard.writeText(promptText);
    setCopiedId(`${selectedTheme}-${idx}`);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyStatement = (cardId: string, problem: ProblemIdea) => {
    const values = templateValues[cardId] || {};
    let statement = problem.template.statement;

    problem.template.placeholders.forEach(p => {
      const value = values[p.key] || p.example;
      statement = statement.replace(`[${p.key}]`, value);
    });

    navigator.clipboard.writeText(statement);
    setCopiedId(`${cardId}-statement`);
    toast.success('Problem statement copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectProblem = (problem: ProblemIdea, cardId: string) => {
    if (onSelectProblem) {
      const values = templateValues[cardId] || {};
      let statement = problem.template.statement;

      problem.template.placeholders.forEach(p => {
        const value = values[p.key] || p.example;
        statement = statement.replace(`[${p.key}]`, value);
      });

      onSelectProblem(problem.problem, problem.lovablePrompt, statement);
    }
  };

  const updateTemplateValue = (cardId: string, key: string, value: string) => {
    setTemplateValues(prev => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || {}),
        [key]: value,
      },
    }));
  };

  const getFilledStatement = (cardId: string, problem: ProblemIdea) => {
    const values = templateValues[cardId] || {};
    let statement = problem.template.statement;

    problem.template.placeholders.forEach(p => {
      const value = values[p.key] || p.example;
      statement = statement.replace(`[${p.key}]`, value);
    });

    return statement;
  };

  const toggleExpanded = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-2 border-stone-800 bg-stone-950/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${themeColors.bg} ${themeColors.border} border`}>
                <Zap className={`w-4 h-4 ${themeColors.text}`} />
              </div>
              <div>
                <h3 className="font-bold text-stone-100 text-sm tracking-tight">
                  PROBLEM IDEAS
                </h3>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                  Appathon 2.0
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${themeColors.text} ${themeColors.border} text-[10px] font-mono`}
            >
              {problems.length} IDEAS
            </Badge>
          </div>
        </CardHeader>

        {/* Theme Selector - Horizontal scroll */}
        <div className="px-2 pb-3">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-700">
            {APPATHON_THEMES.map((theme) => {
              const colors = THEME_COLORS[theme.id];
              const isActive = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    setExpandedCard(null);
                  }}
                  className={`
                    flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg
                    text-xs font-medium transition-all duration-200
                    border-2 ${isActive
                      ? `${colors.bg} ${colors.border} ${colors.text} shadow-lg ${colors.glow}`
                      : 'border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400'
                    }
                  `}
                >
                  <span className="text-base">{theme.icon}</span>
                  <span className="hidden sm:inline whitespace-nowrap">
                    {theme.id === 'myjkkn' ? 'MyJKKN' : theme.name.split(' ')[0]}
                  </span>
                  {theme.id === 'myjkkn' && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Theme Description */}
        <div className={`px-4 py-2 ${themeColors.bg} border-t-2 ${themeColors.border}`}>
          <p className="text-xs text-stone-400">
            <span className={`font-semibold ${themeColors.text}`}>{currentTheme?.name}</span>
            {' — '}{currentTheme?.description}
          </p>
        </div>
      </Card>

      {/* MyJKKN Data Banner */}
      <AnimatePresence mode="wait">
        {selectedTheme === 'myjkkn' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-2 border-amber-500/50 bg-amber-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Real Data Available
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 text-[10px]">
                    +₹11,000 Prizes
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {MYJKKN_DATA_ENDPOINTS.slice(0, 4).map((ep) => (
                    <div
                      key={ep.endpoint}
                      className="text-[10px] text-stone-500 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      {ep.data}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Problem Cards */}
      <Card className="border-2 border-stone-800 bg-stone-950/80">
        <CardContent className="p-2 space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTheme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-1.5"
            >
              {problems.map((problem, idx) => {
                const difficulty = DIFFICULTY_CONFIG[problem.difficulty];
                const cardId = `${selectedTheme}-${idx}`;
                const isExpanded = expandedCard === cardId;
                const isCopied = copiedId === cardId;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`
                      relative group rounded-lg overflow-hidden
                      border-2 transition-all duration-200
                      ${isExpanded
                        ? `${themeColors.border} ${themeColors.bg}`
                        : 'border-stone-800 hover:border-stone-700'
                      }
                    `}
                  >
                    {/* Difficulty indicator strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${difficulty.color}`} />

                    {/* Main row - always visible */}
                    <div
                      className="pl-3 pr-2 py-2.5 cursor-pointer"
                      onClick={(e) => toggleExpanded(cardId, e)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={`w-4 h-4 text-stone-500 transition-transform duration-200 flex-shrink-0 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                            <h4 className="text-sm font-medium text-stone-200 leading-tight">
                              {problem.problem}
                            </h4>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-1.5 ml-6">
                            <span className="text-[10px] text-stone-500">
                              → {problem.target}
                            </span>

                            {/* Difficulty bars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3].map((bar) => (
                                <div
                                  key={bar}
                                  className={`w-1.5 h-3 rounded-sm ${
                                    bar <= difficulty.bars
                                      ? difficulty.color
                                      : 'bg-stone-800'
                                  }`}
                                />
                              ))}
                              <span className={`text-[9px] ml-1 ${difficulty.text}`}>
                                {difficulty.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick actions (always visible) */}
                        <div className="flex items-center gap-1">
                          {problem.lovablePrompt && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 w-7 p-0 ${themeColors.text} hover:${themeColors.bg}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPrompt(problem, idx);
                              }}
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Template Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-dashed border-stone-700"
                        >
                          <div className="p-3 space-y-3">
                            {/* Template header */}
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-stone-500" />
                              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                                Problem Statement Template
                              </span>
                              <div className="flex-1 border-t border-dashed border-stone-800" />
                            </div>

                            {/* Template structure visualization */}
                            <div className="bg-stone-900/50 rounded-lg p-3 border border-dashed border-stone-700">
                              <p className="text-xs text-stone-400 font-mono leading-relaxed">
                                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mr-1 ${PLACEHOLDER_COLORS.WHO}`}>
                                  WHO
                                </span>
                                struggles with
                                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mx-1 ${PLACEHOLDER_COLORS.PROBLEM}`}>
                                  PROBLEM
                                </span>
                                because
                                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mx-1 ${PLACEHOLDER_COLORS.CAUSE}`}>
                                  CAUSE
                                </span>
                                , which leads to
                                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mx-1 ${PLACEHOLDER_COLORS.IMPACT}`}>
                                  IMPACT
                                </span>
                                .
                              </p>
                            </div>

                            {/* Placeholder fields */}
                            <div className="space-y-2">
                              {problem.template.placeholders.map((placeholder) => {
                                const colorClass = PLACEHOLDER_COLORS[placeholder.key] || 'text-stone-400 bg-stone-500/10 border-stone-500/30';
                                const currentValue = templateValues[cardId]?.[placeholder.key] || '';

                                return (
                                  <div key={placeholder.key} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${colorClass}`}>
                                        {placeholder.key}
                                      </span>
                                      <span className="text-[10px] text-stone-500 italic">
                                        {placeholder.hint}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder={placeholder.example}
                                        value={currentValue}
                                        onChange={(e) => updateTemplateValue(cardId, placeholder.key, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-stone-900/80 border border-stone-700 rounded px-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500/20"
                                      />
                                      {!currentValue && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                          <Lightbulb className="w-3.5 h-3.5 text-stone-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Generated statement preview */}
                            <div className="bg-stone-900/80 rounded-lg p-3 border border-stone-700">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                  Your Statement
                                </span>
                              </div>
                              <p className="text-xs text-stone-300 leading-relaxed">
                                {getFilledStatement(cardId, problem)}
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs border-stone-700 text-stone-400 hover:bg-stone-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyStatement(cardId, problem);
                                }}
                              >
                                {copiedId === `${cardId}-statement` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                                    Copy Statement
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className={`flex-1 h-8 text-xs font-bold ${themeColors.bg} ${themeColors.text} ${themeColors.border} border hover:brightness-110`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProblem(problem, cardId);
                                }}
                              >
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Use This Problem
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Collapsible Judging Criteria */}
      <Card className="border-2 border-stone-800 bg-stone-950/80 overflow-hidden">
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-stone-200">Judging Criteria</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
              showCriteria ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showCriteria && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0 pb-4 px-4 border-t border-stone-800">
                {/* Main criteria */}
                <div className="space-y-2 mt-3">
                  {JUDGING_CRITERIA.map((criterion) => (
                    <div key={criterion.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-1.5 rounded-full bg-stone-800 overflow-hidden"
                        >
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${criterion.weight}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-400">{criterion.name}</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400">
                        {criterion.weight}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bonus criteria */}
                <div className="mt-4 pt-3 border-t border-stone-800">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Bonus Points
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BONUS_CRITERIA.map((bonus) => (
                      <div
                        key={bonus.name}
                        className="flex items-center gap-1.5 text-[10px] text-stone-500"
                      >
                        <span>{bonus.icon}</span>
                        <span className="truncate">{bonus.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[8px] text-emerald-400 border-emerald-500/30 px-1 py-0 ml-auto"
                        >
                          +{bonus.points}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
