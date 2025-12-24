'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ExternalLink, Link2 } from 'lucide-react';
import Link from 'next/link';
import { PROBLEM_THEMES } from '@/lib/types/problem-bank';

interface SimilarProblem {
  id: string;
  title: string;
  problem_statement: string;
  theme: string;
  similarity_score: number;
}

interface SimilarProblemsProps {
  problemId: string;
  variant?: 'admin' | 'public';
}

export function SimilarProblems({ problemId, variant = 'admin' }: SimilarProblemsProps) {
  const [similar, setSimilar] = useState<SimilarProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const response = await fetch(`/api/problems/${problemId}/similar`);
        if (response.ok) {
          const data = await response.json();
          setSimilar(data.similar || []);
        }
      } catch (err) {
        setError('Failed to load similar problems');
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [problemId]);

  if (loading) {
    return (
      <Card className={variant === 'admin' ? 'glass-card' : 'bg-stone-900/50 border-stone-800'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || similar.length === 0) {
    return null; // Don't show anything if no similar problems
  }

  const basePath = variant === 'admin' ? '/admin/problem-bank' : '/appathon/problems';

  return (
    <Card className={variant === 'admin' ? 'glass-card' : 'bg-stone-900/50 border-stone-800'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
          <Link2 className="h-5 w-5 text-amber-400" />
          Similar Problems
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {similar.map((problem) => {
            const themeInfo = problem.theme ? PROBLEM_THEMES[problem.theme as keyof typeof PROBLEM_THEMES] : null;

            return (
              <Link
                key={problem.id}
                href={`${basePath}/${problem.id}`}
                className="block p-3 rounded-lg bg-stone-800/50 border border-stone-700 hover:border-stone-600 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {themeInfo && (
                        <span className={`text-xs ${themeInfo.color}`}>
                          {themeInfo.emoji}
                        </span>
                      )}
                      <h4 className="text-sm font-medium text-stone-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {problem.title}
                      </h4>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {problem.problem_statement}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {problem.similarity_score >= 0.7 && (
                      <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Related
                      </Badge>
                    )}
                    <ExternalLink className="h-4 w-4 text-stone-500 group-hover:text-stone-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default SimilarProblems;
