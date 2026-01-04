'use client';

import { useEffect, useState } from 'react';
import { Rocket, IndianRupee, Users, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PublicMetrics {
  startupsIncubated: number;
  learnerEarnings: number;
  activeBuilders: number;
  problemsSolved: number;
}

interface MetricCardProps {
  value: React.ReactNode;
  label: string;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ value, label, icon, color }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-stone-900/50 border border-stone-800 hover:border-stone-700 transition-colors">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-stone-100">
        {value}
      </div>
      <div className="text-xs md:text-sm text-stone-400 text-center">
        {label}
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Skip animation if value is 0
    if (value === 0) return;

    // Reset to 0 and animate via interval (async setState in callback is allowed)
    let current = 0;
    const duration = 1500;
    const steps = 30;
    const increment = value / steps;
    const stepDuration = duration / steps;

    // Start animation immediately
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

export function PublicMetricsStrip() {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/public/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-stone-900/50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !metrics) {
    return null; // Gracefully hide if metrics fail to load
  }

  const metricCards = [
    {
      value: metrics.startupsIncubated,
      label: 'Startups Incubated',
      icon: <Rocket className="h-5 w-5 text-green-400" />,
      color: 'bg-green-500/20',
    },
    {
      value: `₹${metrics.learnerEarnings.toLocaleString()}`,
      label: 'Learner Earnings',
      icon: <IndianRupee className="h-5 w-5 text-amber-400" />,
      color: 'bg-amber-500/20',
    },
    {
      value: metrics.activeBuilders,
      label: 'Active Builders',
      icon: <Users className="h-5 w-5 text-blue-400" />,
      color: 'bg-blue-500/20',
    },
    {
      value: metrics.problemsSolved,
      label: 'Problems Solved',
      icon: <CheckCircle className="h-5 w-5 text-purple-400" />,
      color: 'bg-purple-500/20',
    },
  ];

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-stone-950 to-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            Live Platform Metrics
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-100">
            Real Impact, Real Numbers
          </h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {metricCards.map((metric) => (
            <MetricCard
              key={metric.label}
              value={
                typeof metric.value === 'number' ? (
                  <AnimatedNumber value={metric.value} />
                ) : (
                  metric.value
                )
              }
              label={metric.label}
              icon={metric.icon}
              color={metric.color}
            />
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-6">
          <Link
            href="/metrics"
            className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-400 transition-colors"
          >
            View detailed metrics →
          </Link>
        </div>
      </div>
    </section>
  );
}
