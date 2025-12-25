'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, GraduationCap, Loader2, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Institution } from '@/lib/institutions/types';
import { getInstitutionIcon, getInstitutionColor } from '@/lib/institutions/types';

export default function SelectInstitutionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Building2 className="h-12 w-12 text-amber-400" />
        </motion.div>
        <p className="mt-4 text-stone-400">Loading...</p>
      </div>
    }>
      <SelectInstitutionContent />
    </Suspense>
  );
}

function SelectInstitutionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const response = await fetch('/api/institutions');
        if (response.ok) {
          const data = await response.json();
          setInstitutions(data);
        }
      } catch (err) {
        console.error('Failed to fetch institutions:', err);
        toast.error('Failed to load institutions');
      } finally {
        setLoading(false);
      }
    }
    fetchInstitutions();
  }, []);

  const handleSelect = async (institution: Institution) => {
    if (submitting) return;

    setSelectedId(institution.id);
    setSubmitting(true);

    try {
      const response = await fetch('/api/user/institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: institution.id }),
      });

      if (response.ok) {
        toast.success(`Welcome to ${institution.short_name}!`);
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        console.error('Institution set error:', errorData);

        // Extract error message from various possible response formats
        const errorMessage = errorData.error || errorData.message || 'Failed to set institution';

        // Show toast with appropriate duration for the message
        toast.error(errorMessage, {
          duration: 5000,
          description: response.status === 400
            ? 'You can request a change through Settings.'
            : undefined,
        });
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Failed to set institution:', err);
      toast.error('Something went wrong');
      setSelectedId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Separate colleges and schools
  const colleges = institutions.filter(i => i.type === 'college');
  const schools = institutions.filter(i => i.type === 'school');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Building2 className="h-12 w-12 text-amber-400" />
        </motion.div>
        <p className="mt-4 text-stone-400">Loading institutions...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Reason message - show when redirected from cycle creation */}
      {reason === 'cycle_creation' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-200">Institution required to start a cycle</p>
            <p className="text-sm text-amber-300/70 mt-1">
              Please select your institution below to start your Flywheel cycle and track your progress.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-6">
          <GraduationCap className="h-4 w-4" />
          <span>One-time selection</span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-100 mb-4 tracking-tight">
          Select Your Institution
        </h1>
        <p className="text-stone-400 text-lg max-w-2xl mx-auto">
          Choose the institution you belong to. This helps us personalize your experience
          and connect you with the right community.
        </p>
      </motion.div>

      {/* Colleges Section */}
      {colleges.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Colleges
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colleges.map((institution, index) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                index={index}
                isSelected={selectedId === institution.id}
                isSubmitting={submitting}
                onSelect={() => handleSelect(institution)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Schools Section */}
      {schools.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
              Schools
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schools.map((institution, index) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                index={index}
                isSelected={selectedId === institution.id}
                isSubmitting={submitting}
                onSelect={() => handleSelect(institution)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-stone-500 mt-10"
      >
        Need to change later? Contact your institution admin for assistance.
      </motion.p>
    </div>
  );
}

interface InstitutionCardProps {
  institution: Institution;
  index: number;
  isSelected: boolean;
  isSubmitting: boolean;
  onSelect: () => void;
}

function InstitutionCard({ institution, index, isSelected, isSubmitting, onSelect }: InstitutionCardProps) {
  const icon = getInstitutionIcon(institution);
  const colors = getInstitutionColor(institution.slug);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      onClick={onSelect}
      disabled={isSubmitting}
      className={`
        group relative w-full text-left p-5 rounded-2xl border-2
        transition-all duration-300 outline-none
        ${isSelected
          ? `${colors.border} ${colors.bg} shadow-lg shadow-${colors.text.replace('text-', '')}/20`
          : 'border-stone-800 bg-stone-900/50 hover:border-stone-700 hover:bg-stone-900/80'
        }
        ${isSubmitting && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute top-3 right-3 w-6 h-6 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}
        >
          {isSubmitting ? (
            <Loader2 className={`h-3 w-3 ${colors.text} animate-spin`} />
          ) : (
            <Check className={`h-3 w-3 ${colors.text}`} />
          )}
        </motion.div>
      )}

      {/* Icon */}
      <div className={`
        inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
        text-2xl
        ${isSelected ? colors.bg : 'bg-stone-800'}
        transition-colors duration-300
      `}>
        {icon}
      </div>

      {/* Content */}
      <h3 className={`
        font-display text-lg font-semibold mb-1 transition-colors duration-300
        ${isSelected ? colors.text : 'text-stone-100 group-hover:text-stone-50'}
      `}>
        {institution.short_name}
      </h3>

      <p className="text-sm text-stone-500 line-clamp-2 mb-3">
        {institution.name}
      </p>

      {/* Type badge + arrow */}
      <div className="flex items-center justify-between">
        <span className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
          ${institution.type === 'school'
            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
          }
        `}>
          {institution.type === 'school' ? '🏫' : '🎓'}
          {institution.type.charAt(0).toUpperCase() + institution.type.slice(1)}
        </span>

        <ChevronRight className={`
          h-4 w-4 transition-all duration-300
          ${isSelected
            ? `${colors.text} translate-x-0`
            : 'text-stone-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
          }
        `} />
      </div>
    </motion.button>
  );
}
