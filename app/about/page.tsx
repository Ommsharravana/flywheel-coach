import { Metadata } from 'next';
import Link from 'next/link';
import { Lightbulb, Rocket, Target, Users, Zap, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | JKKN Solution Studio',
  description: 'Learn about JKKN Solution Studio - the AI-powered platform teaching learners to build solutions that create real impact.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-stone-100 mb-2">About JKKN Solution Studio</h1>
        <p className="text-stone-500 mb-8">Turning problems into impact through AI-guided building</p>

        <div className="space-y-8 text-stone-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Our Mission
            </h2>
            <p>
              JKKN Solution Studio is an AI-powered learning platform that teaches learners how to
              identify real problems, validate them, and build AI-powered solutions that create
              measurable impact. We believe that the best way to learn is by doing—and by solving
              problems that matter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-400" />
              The Problem-to-Impact Flywheel
            </h2>
            <p className="mb-4">
              At the heart of Solution Studio is the Problem-to-Impact Flywheel—an 8-step methodology
              that guides learners from discovering a problem worth solving all the way to measuring
              real-world impact:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li><strong className="text-stone-300">Problem Discovery</strong> — Find problems worth solving</li>
              <li><strong className="text-stone-300">Context Discovery</strong> — Understand who, when, how painful</li>
              <li><strong className="text-stone-300">Value Discovery</strong> — Validate with desperate users</li>
              <li><strong className="text-stone-300">Workflow Classification</strong> — Classify the AI workflow type</li>
              <li><strong className="text-stone-300">Prompt Generation</strong> — Generate Lovable-ready prompts</li>
              <li><strong className="text-stone-300">Building</strong> — Create with AI tools like Lovable</li>
              <li><strong className="text-stone-300">Deployment</strong> — Ship to real users</li>
              <li><strong className="text-stone-300">Impact Discovery</strong> — Measure and discover more problems</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              AI-Guided Coaching
            </h2>
            <p>
              Our AI coach doesn&apos;t do the work for you—it asks the right questions and guides you
              through each step. This approach ensures you develop real problem-solving skills while
              learning to leverage AI effectively. The coach adapts to your pace and provides
              contextual feedback as you progress through each flywheel cycle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-teal-400" />
              Part of JKKN Institutions
            </h2>
            <p className="mb-4">
              Solution Studio is developed by JKKN Educational Institutions as part of our commitment
              to innovative, practical education. We&apos;re building the next generation of problem-solvers
              who can identify opportunities and ship solutions that make a real difference.
            </p>
            <p>
              Our learners don&apos;t just write code—they learn to think like entrepreneurs, validate ideas,
              and measure impact. Every project in Solution Studio starts with a real problem and ends
              with measurable results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-amber-400" />
              JKKN100 Initiative
            </h2>
            <p>
              Solution Studio is a key component of JKKN100—our ambitious initiative to incubate
              100 startups from within our institutions. Learners who complete flywheel cycles and
              demonstrate real impact have opportunities for mentorship, funding, and incubation
              support to turn their solutions into sustainable ventures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-400" />
              Join Our Community
            </h2>
            <p>
              Whether you&apos;re a learner looking to build your first AI-powered solution, a senior
              learner mentoring others, or an institution interested in bringing Solution Studio to
              your campus—we&apos;d love to hear from you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-200 mb-3">Contact</h2>
            <p>
              For inquiries about JKKN Solution Studio, please reach out to:{' '}
              <a href="mailto:solutionstudio@jkkn.ac.in" className="text-teal-400 hover:text-teal-300">
                solutionstudio@jkkn.ac.in
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800 flex gap-4">
          <Link href="/" className="text-teal-400 hover:text-teal-300">
            ← Back to Home
          </Link>
          <span className="text-stone-700">|</span>
          <Link href="/showcase" className="text-teal-400 hover:text-teal-300">
            View Showcase →
          </Link>
        </div>
      </div>
    </div>
  );
}
