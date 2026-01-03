'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Save,
  FileText,
  Mail,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { TrackOverview } from '@/lib/admin/demo-day/types';

type ContentType =
  | 'judge-briefing'
  | 'participant-email-slot-confirmed'
  | 'participant-email-reminder'
  | 'participant-email-results'
  | 'track-summary';

interface ContentTypeOption {
  value: ContentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'briefing' | 'email' | 'summary';
}

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    value: 'judge-briefing',
    label: 'Judge Briefing',
    description: 'Complete guide for judges with criteria and instructions',
    icon: <ClipboardList className="w-4 h-4" />,
    category: 'briefing',
  },
  {
    value: 'participant-email-slot-confirmed',
    label: 'Demo Slot Confirmed Email',
    description: 'Email confirming participant demo time and track',
    icon: <Mail className="w-4 h-4" />,
    category: 'email',
  },
  {
    value: 'participant-email-reminder',
    label: 'Demo Day Reminder Email',
    description: 'Reminder email for the day before Demo Day',
    icon: <Mail className="w-4 h-4" />,
    category: 'email',
  },
  {
    value: 'participant-email-results',
    label: 'Results Announcement Email',
    description: 'Email announcing that results are live',
    icon: <Mail className="w-4 h-4" />,
    category: 'email',
  },
  {
    value: 'track-summary',
    label: 'Track Summary',
    description: 'Overview of apps in a track for judges',
    icon: <FileText className="w-4 h-4" />,
    category: 'summary',
  },
];

interface SavedTemplate {
  id: string;
  content_type: ContentType;
  content: string;
  saved_at: string;
  name: string;
}

export default function ContentGeneratorPage() {
  const [selectedType, setSelectedType] = useState<ContentType | ''>('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tracks, setTracks] = useState<TrackOverview[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Context fields
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [demoTime, setDemoTime] = useState('');

  // Fetch tracks on mount
  useEffect(() => {
    async function fetchTracks() {
      try {
        const response = await fetch('/api/admin/demo-day');
        const data = await response.json();
        if (data.data?.tracks) {
          setTracks(data.data.tracks);
        }
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
      }
    }
    fetchTracks();

    // Load saved templates from localStorage
    const saved = localStorage.getItem('demo-day-templates');
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, []);

  const selectedTypeInfo = CONTENT_TYPES.find(t => t.value === selectedType);
  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  const handleGenerate = async () => {
    if (!selectedType) return;

    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const response = await fetch('/api/admin/demo-day/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: selectedType,
          context: {
            trackId: selectedTrackId || undefined,
            trackName: selectedTrack?.name || undefined,
            participantName: participantName || undefined,
            demoTime: demoTime || undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedContent(data.data.content);
      } else {
        setGeneratedContent(`Error: ${data.error || 'Failed to generate content'}`);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setGeneratedContent('Error: Failed to connect to the API');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !generatedContent) return;

    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      content_type: selectedType as ContentType,
      content: generatedContent,
      saved_at: new Date().toISOString(),
      name: templateName,
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('demo-day-templates', JSON.stringify(updated));
    setTemplateName('');
    setShowSaveDialog(false);
  };

  const handleLoadTemplate = (template: SavedTemplate) => {
    setSelectedType(template.content_type);
    setGeneratedContent(template.content);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('demo-day-templates', JSON.stringify(updated));
  };

  // Check if context fields are needed
  const needsTrackSelection = selectedType === 'track-summary';
  const needsParticipantInfo =
    selectedType === 'participant-email-slot-confirmed' ||
    selectedType === 'participant-email-reminder';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/demo-day">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-400 hover:text-stone-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Demo Day
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          AI Content Generator
        </h1>
        <div className="w-32" />
      </div>

      {/* Description */}
      <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4">
        <p className="text-stone-300 text-sm">
          Generate professional content for Demo Day communications. Select a content type,
          provide any required context, and let AI draft the content for you. You can edit
          the generated content before using it.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Content Type Selection */}
          <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-stone-100">Content Type</h2>

            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ContentType)}
            >
              <SelectTrigger className="w-full bg-stone-800 border-stone-700 text-stone-100">
                <SelectValue placeholder="Select content type..." />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem value="judge-briefing" className="text-stone-100">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-amber-500" />
                    Judge Briefing
                  </div>
                </SelectItem>
                <SelectItem value="participant-email-slot-confirmed" className="text-stone-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-500" />
                    Demo Slot Confirmed Email
                  </div>
                </SelectItem>
                <SelectItem value="participant-email-reminder" className="text-stone-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Demo Day Reminder Email
                  </div>
                </SelectItem>
                <SelectItem value="participant-email-results" className="text-stone-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" />
                    Results Announcement Email
                  </div>
                </SelectItem>
                <SelectItem value="track-summary" className="text-stone-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-500" />
                    Track Summary
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {selectedTypeInfo && (
              <p className="text-sm text-stone-400">{selectedTypeInfo.description}</p>
            )}
          </div>

          {/* Context Fields */}
          {(needsTrackSelection || needsParticipantInfo) && (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-stone-100">Context (Optional)</h2>

              {needsTrackSelection && (
                <div className="space-y-2">
                  <Label className="text-stone-300">Track</Label>
                  <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                    <SelectTrigger className="w-full bg-stone-800 border-stone-700 text-stone-100">
                      <SelectValue placeholder="Select a track..." />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-800 border-stone-700">
                      {tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id} className="text-stone-100">
                          {track.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {needsParticipantInfo && (
                <>
                  <div className="space-y-2">
                    <Label className="text-stone-300">Participant/Team Name</Label>
                    <Input
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="e.g., Team Innovators"
                      className="bg-stone-800 border-stone-700 text-stone-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-300">Demo Time</Label>
                    <Input
                      value={demoTime}
                      onChange={(e) => setDemoTime(e.target.value)}
                      placeholder="e.g., 10:30 AM"
                      className="bg-stone-800 border-stone-700 text-stone-100"
                    />
                  </div>
                  {needsParticipantInfo && selectedType === 'participant-email-slot-confirmed' && (
                    <div className="space-y-2">
                      <Label className="text-stone-300">Track Name</Label>
                      <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                        <SelectTrigger className="w-full bg-stone-800 border-stone-700 text-stone-100">
                          <SelectValue placeholder="Select a track..." />
                        </SelectTrigger>
                        <SelectContent className="bg-stone-800 border-stone-700">
                          {tracks.map((track) => (
                            <SelectItem key={track.id} value={track.id} className="text-stone-100">
                              {track.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedType || isGenerating}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>

          {/* Saved Templates */}
          {savedTemplates.length > 0 && (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-stone-100">Saved Templates</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-2 bg-stone-800/50 rounded-lg group"
                  >
                    <button
                      onClick={() => handleLoadTemplate(template)}
                      className="text-left flex-1 text-sm text-stone-300 hover:text-stone-100"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-stone-500">
                        {CONTENT_TYPES.find(t => t.value === template.content_type)?.label}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Output */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-100">Generated Content</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!generatedContent}
                  className="border-stone-700 text-stone-300 hover:text-stone-100"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!generatedContent}
                  className="border-stone-700 text-stone-300 hover:text-stone-100"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              placeholder={
                isGenerating
                  ? 'Generating content...'
                  : 'Generated content will appear here. You can edit it before copying.'
              }
              className="min-h-[400px] bg-stone-800 border-stone-700 text-stone-100 font-mono text-sm resize-y"
            />

            {generatedContent && (
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>{generatedContent.length} characters</span>
                <span>~{Math.ceil(generatedContent.split(/\s+/).length)} words</span>
              </div>
            )}
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-stone-100">Save as Template</h3>
              <div className="flex gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="bg-stone-700 border-stone-600 text-stone-100"
                />
                <Button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="border-stone-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-4">
        <h3 className="font-semibold text-amber-400 mb-2">Quick Tips</h3>
        <ul className="text-sm text-stone-300 space-y-1">
          <li>
            - <strong>Judge Briefing:</strong> Perfect for creating a comprehensive document to share with all judges before Demo Day.
          </li>
          <li>
            - <strong>Participant Emails:</strong> Add names and times for personalized emails, or leave blank for a template.
          </li>
          <li>
            - <strong>Track Summary:</strong> Select a track to auto-fetch the apps and generate a summary for judges.
          </li>
          <li>
            - All content follows JKKN brand guidelines (uses &quot;Learners&quot;, mentions bioconvergence, etc.)
          </li>
        </ul>
      </div>
    </div>
  );
}
