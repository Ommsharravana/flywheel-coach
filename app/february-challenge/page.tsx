'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Sparkles,
  Users,
  Trophy,
  Zap,
  Check,
  Loader2,
  ArrowRight,
  Code2,
  Lightbulb,
  Rocket,
  Target,
  Clock,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FebruaryChallengeePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    goals: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/challenge/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'landing-page',
          challengeSlug: 'february-2026',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to register interest');
        return;
      }

      setIsSubmitted(true);
      toast.success('Successfully registered! We\'ll notify you when registration opens.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Code2,
      title: 'No Coding Required',
      description: 'Build real apps using AI tools like Lovable - just describe what you want',
    },
    {
      icon: Lightbulb,
      title: 'Solve Real Problems',
      description: 'Work on problems that matter to your campus and community',
    },
    {
      icon: Trophy,
      title: 'Win Prizes',
      description: 'Compete for cash prizes, internships, and recognition',
    },
    {
      icon: Rocket,
      title: 'Launch Your App',
      description: 'Deploy your solution to real users and track your impact',
    },
    {
      icon: Users,
      title: 'Learn Together',
      description: 'Get support from mentors and learn alongside other builders',
    },
    {
      icon: Target,
      title: 'Build Portfolio',
      description: 'Add real projects to your portfolio that showcase your problem-solving',
    },
  ];

  const timeline = [
    { date: 'Feb 1', title: 'Registration Opens', description: 'Sign up and get access to the platform' },
    { date: 'Feb 3', title: 'Build Phase Starts', description: '10 days to build your solution' },
    { date: 'Feb 13', title: 'Submission Deadline', description: 'Submit your app for evaluation' },
    { date: 'Feb 14', title: 'Demo Day', description: 'Present your solution & winners announced' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-amber-400 border-amber-500/30 bg-amber-500/10">
              <Clock className="h-3 w-3 mr-1" />
              Coming February 2026
            </Badge>

            <h1 className="text-5xl md:text-7xl font-display font-bold text-stone-100 mb-6">
              <span className="text-amber-400">February</span> Challenge
            </h1>

            <p className="text-xl text-stone-400 max-w-2xl mx-auto mb-8">
              Build apps that solve real problems. No coding required.
              Join the next wave of AI-powered builders.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
              <div className="flex items-center gap-2 text-stone-300">
                <Calendar className="h-5 w-5 text-amber-400" />
                <span>February 1-14, 2026</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span>₹1,00,000+ in Prizes</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Users className="h-5 w-5 text-amber-400" />
                <span>Open to All Colleges</span>
              </div>
            </div>

            <a href="#register">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
                <Sparkles className="h-5 w-5 mr-2" />
                Register Your Interest
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </a>
          </div>

          {/* Stats from Previous Appathon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Card className="bg-stone-900/50 border-stone-800 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-400">300+</div>
                <div className="text-sm text-stone-500">Builders in Appathon 2.0</div>
              </CardContent>
            </Card>
            <Card className="bg-stone-900/50 border-stone-800 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-400">150+</div>
                <div className="text-sm text-stone-500">Apps Created</div>
              </CardContent>
            </Card>
            <Card className="bg-stone-900/50 border-stone-800 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-400">8</div>
                <div className="text-sm text-stone-500">Colleges Participated</div>
              </CardContent>
            </Card>
            <Card className="bg-stone-900/50 border-stone-800 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-400">₹63K</div>
                <div className="text-sm text-stone-500">Prizes Awarded</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-stone-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-stone-100 mb-4">
            Why Join the February Challenge?
          </h2>
          <p className="text-center text-stone-400 mb-12 max-w-2xl mx-auto">
            Whether you&apos;re a first-time builder or experienced developer, this challenge is designed for you.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="bg-stone-900/50 border-stone-800 hover:border-amber-500/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-500/20">
                      <benefit.icon className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-100 mb-1">{benefit.title}</h3>
                      <p className="text-sm text-stone-400">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-stone-100 mb-4">
            Challenge Timeline
          </h2>
          <p className="text-center text-stone-400 mb-12">
            14 days of building, learning, and creating impact
          </p>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-amber-500/30 transform md:-translate-x-1/2" />

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={item.date} className={`relative flex items-center gap-6 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1" />
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-amber-500 rounded-full transform md:-translate-x-1/2 z-10" />
                  <div className={`flex-1 ml-10 md:ml-0 ${index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:pl-8'}`}>
                    <Badge variant="outline" className="mb-2 text-amber-400 border-amber-500/30">
                      {item.date}
                    </Badge>
                    <h3 className="font-semibold text-stone-100">{item.title}</h3>
                    <p className="text-sm text-stone-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-16 px-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <div className="max-w-xl mx-auto">
          <Card className="bg-stone-900/80 border-amber-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <Gift className="h-8 w-8 text-amber-400" />
              </div>
              <CardTitle className="text-2xl text-stone-100">
                {isSubmitted ? 'You\'re on the List!' : 'Register Your Interest'}
              </CardTitle>
              <CardDescription>
                {isSubmitted
                  ? 'We\'ll notify you as soon as registration opens.'
                  : 'Be the first to know when registration opens. Early registrants get exclusive perks!'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="h-10 w-10 text-green-400" />
                  </div>
                  <p className="text-stone-300 mb-6">
                    Check your inbox for a confirmation email. In the meantime, explore what others have built:
                  </p>
                  <Link href="/showcase">
                    <Button variant="outline" className="border-amber-500/30 text-amber-400">
                      View Showcase
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-stone-800 border-stone-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-stone-800 border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-stone-800 border-stone-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution (Optional)</Label>
                      <Input
                        id="institution"
                        placeholder="Your college/university"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        className="bg-stone-800 border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">What do you hope to achieve? (Optional)</Label>
                    <Textarea
                      id="goals"
                      placeholder="Tell us about your goals for the challenge..."
                      value={formData.goals}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                      className="bg-stone-800 border-stone-700 min-h-[80px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Register Interest
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-stone-500">
                    By registering, you agree to receive updates about the February Challenge.
                    <br />
                    You can unsubscribe at any time.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-100 mb-4">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-stone-400 mb-8 max-w-2xl mx-auto">
            The February Challenge is your opportunity to turn ideas into reality.
            No coding required - just bring your creativity and problem-solving mindset.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#register">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
                <Sparkles className="h-5 w-5 mr-2" />
                Register Now
              </Button>
            </a>
            <Link href="/showcase">
              <Button size="lg" variant="outline" className="border-stone-700 text-stone-200 hover:bg-stone-800">
                See Past Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-stone-800">
        <div className="max-w-6xl mx-auto text-center text-stone-500 text-sm">
          <p>Powered by JKKN Solution Studio</p>
          <p className="mt-2">
            <Link href="/terms" className="hover:text-stone-300">Terms</Link>
            {' · '}
            <Link href="/privacy" className="hover:text-stone-300">Privacy</Link>
            {' · '}
            <Link href="/" className="hover:text-stone-300">Home</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
