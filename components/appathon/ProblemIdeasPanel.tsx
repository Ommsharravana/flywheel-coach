'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  APPATHON_THEMES,
  PROBLEM_IDEAS,
  MYJKKN_DATA_ENDPOINTS,
  type AppathonThemeId,
  type ProblemIdea,
} from '@/lib/appathon/content';
import { Lightbulb, Sparkles, Database, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProblemIdeasPanelProps {
  onSelectProblem?: (problem: string, lovablePrompt?: string) => void;
}

export function ProblemIdeasPanel({ onSelectProblem }: ProblemIdeasPanelProps) {
  const [selectedTheme, setSelectedTheme] = useState<AppathonThemeId>('healthcare');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: ProblemIdea['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      case 'Medium':
        return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      case 'Hard':
        return 'text-red-400 border-red-500/50 bg-red-500/10';
    }
  };

  const handleCopyPrompt = (problem: ProblemIdea, idx: number) => {
    const promptText = problem.lovablePrompt || problem.problem;
    navigator.clipboard.writeText(promptText);
    setCopiedId(`${selectedTheme}-${idx}`);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectProblem = (problem: ProblemIdea) => {
    if (onSelectProblem) {
      onSelectProblem(problem.problem, problem.lovablePrompt);
    }
  };

  return (
    <Card className="glass-card border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Lightbulb className="w-5 h-5 text-purple-400" />
          Appathon Problem Ideas
        </CardTitle>
        <p className="text-xs text-stone-400">
          Pick one or use these for inspiration. Click to use.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedTheme}
          onValueChange={(v) => setSelectedTheme(v as AppathonThemeId)}
        >
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-stone-800/50 mb-4">
            {APPATHON_THEMES.map((theme) => (
              <TabsTrigger
                key={theme.id}
                value={theme.id}
                className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <span className="mr-1">{theme.icon}</span>
                <span className="hidden sm:inline">
                  {theme.id === 'myjkkn'
                    ? 'MyJKKN'
                    : theme.name.split(' ')[0]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.entries(PROBLEM_IDEAS) as [AppathonThemeId, ProblemIdea[]][]).map(
            ([themeId, problems]) => (
              <TabsContent key={themeId} value={themeId} className="space-y-2">
                {themeId === 'myjkkn' && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 mb-4">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                      <Database className="w-4 h-4" />
                      MyJKKN Data Available
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {MYJKKN_DATA_ENDPOINTS.slice(0, 4).map((ep) => (
                        <div key={ep.endpoint} className="text-stone-400">
                          <span className="text-stone-300">{ep.data}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-400/70 mt-2">
                      Extra 11,000 in prizes for MyJKKN apps!
                    </p>
                  </div>
                )}

                {problems.map((problem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-800/30 rounded-lg hover:bg-stone-800/50 transition-colors cursor-pointer group"
                    onClick={() => handleSelectProblem(problem)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-stone-200 font-medium">
                          {problem.problem}
                        </div>
                        <div className="text-xs text-stone-500 mt-1">
                          Target: {problem.target}
                        </div>
                        {problem.lovablePrompt && (
                          <div className="text-xs text-purple-400 mt-1 italic line-clamp-1">
                            &quot;{problem.lovablePrompt}&quot;
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(problem.difficulty)}
                        >
                          {problem.difficulty}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {problem.lovablePrompt && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPrompt(problem, idx);
                              }}
                            >
                              {copiedId === `${themeId}-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProblem(problem);
                            }}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            )
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
