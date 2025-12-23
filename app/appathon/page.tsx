'use client';

import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Clock, Users, Zap, ChevronRight,
  ExternalLink, CheckCircle, AlertCircle, BookOpen,
  Sparkles, Medal, Gift, Code, Target, Smartphone, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import {
  APPATHON_SUCCESS_STORY,
  TWO_PHASE_FORMAT,
  MYJKKN_TRACK,
  APPATHON_TIMELINE,
  ELIGIBILITY,
  BUILD_PHASE_RULES,
  DEMO_DAY_RULES,
  PRIZE_STRUCTURE_DETAILED,
  APPATHON_FAQ,
  RESOURCES,
  getTotalPrizePoolDetailed,
  getDaysUntilBuildPhase,
  isBuildPhaseActive,
  isLovableStillFree
} from '@/lib/appathon/launch-content';
import { APPATHON_THEMES } from '@/lib/appathon/content';
import { SuccessStoryBanner } from '@/components/appathon/details/SuccessStoryBanner';
import { TwoPhaseVisual } from '@/components/appathon/details/TwoPhaseVisual';
import { MyJKKNTrackHighlight } from '@/components/appathon/details/MyJKKNTrackHighlight';
import { PrizeSummary } from '@/components/appathon/details/PrizeSummary';

export default function AppathonGuidePage() {
  const totalPrizePool = getTotalPrizePoolDetailed();
  const daysUntilBuild = getDaysUntilBuildPhase();
  const buildPhaseActive = isBuildPhaseActive();
  const lovableFree = isLovableStillFree();

  const formatINR = (amount: number) =>
    amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-stone-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {buildPhaseActive ? 'BUILD PHASE ACTIVE' : `${daysUntilBuild} days until Build Phase`}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Appathon 2.0
            </h1>
            <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
              JKKN's AI-Powered App Building Competition
            </p>

            {/* Key Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-stone-300">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="font-semibold">{formatINR(totalPrizePool)}+ in prizes</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>Dec 21 - Jan 3</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Code className="w-5 h-5 text-emerald-400" />
                <span>Zero coding required</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <Zap className="w-5 h-5" />
                Enter the Arena
              </Link>
              <a
                href={RESOURCES.lovable.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-700 text-stone-300 font-semibold hover:border-stone-600 hover:text-white transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                Open Lovable
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        {/* Success Story */}
        <section>
          <SuccessStoryBanner compact={false} />
        </section>

        {/* Two-Phase Format */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-amber-400" />
            Two-Phase Format
          </h2>
          <TwoPhaseVisual showExplanation={true} />
        </section>

        {/* MyJKKN Track */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-blue-400" />
            MyJKKN Data Apps Track
          </h2>
          <MyJKKNTrackHighlight expanded={true} />
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-400" />
            Full Timeline
          </h2>
          <div className="space-y-6">
            {/* Preparation Phase */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-xl border bg-stone-800/50 border-stone-700/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-stone-100">{APPATHON_TIMELINE.phase0.name}</h3>
                <span className="text-sm font-medium text-amber-400">{APPATHON_TIMELINE.phase0.dates}</span>
              </div>
              <div className="space-y-2">
                {APPATHON_TIMELINE.phase0.activities.map((activity, idx) => (
                  <div key={idx} className={`flex items-start gap-3 text-sm ${'important' in activity && activity.important ? 'text-amber-400' : 'text-stone-400'}`}>
                    <span className="text-stone-600 flex-shrink-0 w-28">{activity.date}</span>
                    <span className={'important' in activity && activity.important ? 'font-medium' : ''}>{activity.activity}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Build Phase */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-emerald-400">{APPATHON_TIMELINE.phase1.name}</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">MAIN</span>
                </div>
                <span className="text-sm font-medium text-emerald-400">{APPATHON_TIMELINE.phase1.dates}</span>
              </div>
              <div className="space-y-2">
                {APPATHON_TIMELINE.phase1.activities.map((activity, idx) => (
                  <div key={idx} className={`flex items-start gap-3 text-sm ${'important' in activity && activity.important ? 'text-amber-400' : 'text-stone-400'}`}>
                    <span className="text-stone-600 flex-shrink-0 w-28">{activity.date}</span>
                    <span className={'important' in activity && activity.important ? 'font-medium' : ''}>{activity.activity}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Demo Day */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-amber-400">{APPATHON_TIMELINE.phase2.name}</h3>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-amber-400">{APPATHON_TIMELINE.phase2.dates}</span>
              </div>
              <div className="space-y-2">
                {APPATHON_TIMELINE.phase2.schedule.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 text-sm ${'important' in item && item.important ? 'text-amber-400' : 'text-stone-400'}`}>
                    <span className="text-stone-600 flex-shrink-0 w-28">{item.time}</span>
                    <span className={'important' in item && item.important ? 'font-medium' : ''}>{item.activity}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Themes */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            Challenge Themes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {APPATHON_THEMES.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-stone-600/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <h3 className="font-semibold text-stone-100">{theme.name}</h3>
                    <p className="text-sm text-stone-400 mt-1">{theme.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Prizes */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            Prize Structure
          </h2>
          <PrizeSummary showAll={true} />
        </section>

        {/* Eligibility */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-green-400" />
            Who Can Participate
          </h2>
          <div className="p-6 rounded-xl bg-stone-800/50 border border-stone-700/50">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Eligibility
                </h3>
                <ul className="space-y-2">
                  {ELIGIBILITY.whoCanParticipate.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-stone-300">
                      <span className="text-emerald-400 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Composition
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-stone-700/30">
                    <span className="text-xs text-stone-500">Team Size</span>
                    <p className="text-stone-300">{ELIGIBILITY.teamComposition.minSize} - {ELIGIBILITY.teamComposition.maxSize} members</p>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-700/30">
                    <span className="text-xs text-stone-500">Cross-Department</span>
                    <p className="text-stone-300">{ELIGIBILITY.teamComposition.crossDepartment}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-700/30">
                    <span className="text-xs text-stone-500">Year Mix</span>
                    <p className="text-stone-300">{ELIGIBILITY.teamComposition.yearMix}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-700/30">
                    <span className="text-xs text-stone-500">Senior Learners</span>
                    <p className="text-stone-300">{ELIGIBILITY.teamComposition.seniorLearner}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rules */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-400" />
            Rules & Requirements
          </h2>

          <div className="space-y-6">
            {/* Build Phase Rules */}
            <div className="p-6 rounded-xl bg-stone-800/50 border border-stone-700/50">
              <h3 className="font-semibold text-stone-100 mb-4">Build Phase (Dec 21-30)</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">Must Do</h4>
                  <ul className="space-y-2">
                    {BUILD_PHASE_RULES.mustDo.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-stone-300">{item.rule}</span>
                          <span className="text-stone-500 ml-2 text-xs">({item.note})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">Can Do</h4>
                  <ul className="space-y-1">
                    {BUILD_PHASE_RULES.canDo.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-300">
                        <span className="text-amber-400">✓</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-rose-400 mb-2">Cannot Do</h4>
                  <ul className="space-y-1">
                    {BUILD_PHASE_RULES.cannotDo.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
                        <span className="text-rose-400">✗</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Demo Day Rules */}
            <div className="p-6 rounded-xl bg-stone-800/50 border border-stone-700/50">
              <h3 className="font-semibold text-stone-100 mb-4">Demo Day (Jan 3)</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-2">Presentation Format</h4>
                  <div className="space-y-2">
                    {DEMO_DAY_RULES.presentationFormat.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-stone-700/30">
                        <span className="text-stone-300">{item.element}</span>
                        <span className="text-amber-400 font-medium">{item.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-2">What to Prepare</h4>
                  <ul className="space-y-1">
                    {DEMO_DAY_RULES.whatToPrepare.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-300">
                        <span className="text-blue-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-2">Rules</h4>
                  <ul className="space-y-1">
                    {DEMO_DAY_RULES.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
                        <span className="text-stone-500">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {Object.entries(APPATHON_FAQ).map(([category, questions]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="space-y-3">
                  {questions.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 rounded-xl bg-stone-800/50 border border-stone-700/50"
                    >
                      <h4 className="font-semibold text-stone-100 mb-2">{faq.question}</h4>
                      <p className="text-sm text-stone-400">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <ExternalLink className="w-6 h-6 text-cyan-400" />
            Quick Links
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={RESOURCES.lovable.loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-purple-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Code className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="font-semibold text-stone-100">Lovable</span>
                  <p className="text-xs text-stone-500">AI App Builder</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-purple-400 transition-colors" />
            </a>

            <a
              href={RESOURCES.lovable.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-blue-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <span className="font-semibold text-stone-100">Lovable Docs</span>
                  <p className="text-xs text-stone-500">Learn to Build</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-blue-400 transition-colors" />
            </a>

            <Link
              href="/dashboard"
              className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-amber-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="font-semibold text-stone-100">Dashboard</span>
                  <p className="text-xs text-stone-500">Join the Arena</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-amber-400 transition-colors" />
            </Link>

            <a
              href={RESOURCES.solutionStudio.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-emerald-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="font-semibold text-stone-100">Solution Studio</span>
                  <p className="text-xs text-stone-500">Find Your Problem</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 transition-colors" />
            </a>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-8">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-stone-900 border border-amber-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Build?</h2>
            <p className="text-stone-400 mb-6">
              {lovableFree
                ? "Lovable is FREE until December 31. Start building now!"
                : "Join JKKN's biggest app building competition."
              }
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              <Zap className="w-6 h-6" />
              Enter the Arena
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
