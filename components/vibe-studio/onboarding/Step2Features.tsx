'use client';

import { useEffect } from 'react';
import { useOnboardingStore, Feature } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';
import { Check } from 'lucide-react';

// Intelligent keyword-based feature generator
const generateFeatures = (appIdea: string): Feature[] => {
  const idea = appIdea.toLowerCase();
  const matched: Feature[] = [];
  let idCounter = 1;

  // Domain-specific feature mappings
  const featureMappings = [
    // Attendance & Tracking
    {
      keywords: ['attendance', 'check-in', 'track', 'presence'],
      features: [
        { name: 'Attendance Tracking', description: 'Mark and monitor attendance' },
        { name: 'QR Code Scanner', description: 'Scan codes for quick check-in' },
        { name: 'Reports & Analytics', description: 'Attendance insights and trends' },
      ]
    },
    // Quiz & Testing
    {
      keywords: ['quiz', 'test', 'exam', 'assessment', 'question'],
      features: [
        { name: 'Question Bank', description: 'Manage quiz questions' },
        { name: 'Timer & Auto-Submit', description: 'Timed assessments' },
        { name: 'Scoring System', description: 'Automatic grading' },
        { name: 'Leaderboard', description: 'Track top performers' },
      ]
    },
    // Inventory & Stock
    {
      keywords: ['inventory', 'stock', 'warehouse', 'product'],
      features: [
        { name: 'Stock Management', description: 'Track inventory levels' },
        { name: 'Barcode Scanner', description: 'Scan product barcodes' },
        { name: 'Low Stock Alerts', description: 'Automatic notifications' },
      ]
    },
    // Booking & Appointments
    {
      keywords: ['booking', 'appointment', 'schedule', 'reservation'],
      features: [
        { name: 'Calendar View', description: 'Visual scheduling interface' },
        { name: 'Booking Form', description: 'Easy appointment booking' },
        { name: 'Reminders', description: 'Email/SMS notifications' },
      ]
    },
    // Chat & Messaging
    {
      keywords: ['chat', 'messaging', 'message', 'conversation'],
      features: [
        { name: 'Real-time Chat', description: 'Instant messaging' },
        { name: 'File Sharing', description: 'Share documents and images' },
        { name: 'Push Notifications', description: 'Message alerts' },
      ]
    },
    // E-commerce
    {
      keywords: ['e-commerce', 'shop', 'store', 'sell', 'buy', 'cart'],
      features: [
        { name: 'Product Catalog', description: 'Browse and search products' },
        { name: 'Shopping Cart', description: 'Add items and checkout' },
        { name: 'Payment Integration', description: 'Secure online payments' },
      ]
    },
    // Learning & Education
    {
      keywords: ['learn', 'course', 'education', 'training', 'lesson'],
      features: [
        { name: 'Course Management', description: 'Create and organize courses' },
        { name: 'Progress Tracking', description: 'Monitor learning progress' },
        { name: 'Certificates', description: 'Generate completion certificates' },
      ]
    },
    // Social & Community
    {
      keywords: ['social', 'community', 'post', 'feed', 'share'],
      features: [
        { name: 'Activity Feed', description: 'See latest updates' },
        { name: 'User Profiles', description: 'Customizable profiles' },
        { name: 'Comments & Likes', description: 'Engage with content' },
      ]
    },
    // Task & Project Management
    {
      keywords: ['task', 'todo', 'project', 'manage', 'workflow'],
      features: [
        { name: 'Task Lists', description: 'Organize and prioritize tasks' },
        { name: 'Team Collaboration', description: 'Assign and track work' },
        { name: 'Deadlines & Milestones', description: 'Time-based tracking' },
      ]
    },
    // Food & Restaurant
    {
      keywords: ['food', 'restaurant', 'menu', 'order', 'delivery'],
      features: [
        { name: 'Digital Menu', description: 'Browse available items' },
        { name: 'Order Placement', description: 'Easy online ordering' },
        { name: 'Delivery Tracking', description: 'Real-time order status' },
      ]
    },
  ];

  // Universal features (always useful)
  const universalFeatures: Feature[] = [
    { id: '', name: 'User Authentication', description: 'Secure login and signup', selected: false },
    { id: '', name: 'Dashboard', description: 'Overview of key metrics', selected: false },
    { id: '', name: 'Search & Filter', description: 'Find content quickly', selected: false },
    { id: '', name: 'Notifications', description: 'Real-time updates and alerts', selected: false },
    { id: '', name: 'Data Export', description: 'Export data to CSV/PDF', selected: false },
    { id: '', name: 'Settings & Preferences', description: 'Customize app behavior', selected: false },
  ];

  // Match domain-specific features
  for (const mapping of featureMappings) {
    const hasMatch = mapping.keywords.some(keyword => idea.includes(keyword));
    if (hasMatch) {
      for (const feature of mapping.features) {
        matched.push({
          id: String(idCounter++),
          name: feature.name,
          description: feature.description,
          selected: false,
        });
      }
    }
  }

  // Remove duplicates by name
  const uniqueMatched = matched.filter((feature, index, self) =>
    index === self.findIndex(f => f.name === feature.name)
  );

  // Add universal features to fill up to 6-8 total
  const result: Feature[] = [...uniqueMatched];
  for (const universal of universalFeatures) {
    if (result.length >= 8) break;
    if (!result.some(f => f.name === universal.name)) {
      result.push({
        ...universal,
        id: String(idCounter++),
      });
    }
  }

  // If we still have less than 6, add more universals
  if (result.length < 6) {
    for (const universal of universalFeatures) {
      if (result.length >= 6) break;
      if (!result.some(f => f.name === universal.name)) {
        result.push({
          ...universal,
          id: String(idCounter++),
        });
      }
    }
  }

  // Return 6-8 features
  return result.slice(0, 8);
};

export function Step2Features() {
  const {
    appIdea,
    features,
    setFeatures,
    toggleFeature,
    nextStep,
    prevStep
  } = useOnboardingStore();

  useEffect(() => {
    if (features.length === 0 && appIdea) {
      setFeatures(generateFeatures(appIdea));
    }
  }, [appIdea, features.length, setFeatures]);

  const selectedCount = features.filter(f => f.selected).length;
  const canContinue = selectedCount >= 1 && selectedCount <= 3;

  return (
    <TerminalWindow>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            PICK CORE FEATURES
          </h1>
          <p className="text-gray-400">
            Select 1-3 features to start with (AI-generated based on your idea)
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => toggleFeature(feature.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left vibe-feature-card ${
                feature.selected ? 'selected' : ''
              }`}
            >
              <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                feature.selected
                  ? 'bg-orange-500 border-orange-500'
                  : 'border-[#444]'
              }`}>
                {feature.selected && <Check className="w-4 h-4 text-black" />}
              </div>
              <div>
                <div className="font-mono text-sm tracking-wider text-white">
                  {feature.name}
                </div>
                <div className="text-xs text-gray-500">
                  {feature.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selection count */}
        <div className="text-sm text-gray-400 font-mono">
          Selected: {selectedCount}/3
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={nextStep}
            disabled={!canContinue}
            className={`w-full py-4 rounded-lg font-bold text-lg tracking-wider transition-all ${
              canContinue
                ? 'vibe-btn-gradient text-black hover:shadow-lg'
                : 'bg-[#333] text-gray-500 cursor-not-allowed'
            }`}
          >
            [CONTINUE]
          </button>
          <button
            onClick={prevStep}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
          >
            ← BACK
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>STEP_02/05</span>
          <span className="text-cyan-400">SYSTEM_READY</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
