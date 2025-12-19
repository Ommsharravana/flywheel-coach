'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  Link as LinkIcon,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import type { EventWithParticipantCount, EventBannerColor } from '@/lib/events/types';

const bannerColors: { value: EventBannerColor; label: string; class: string }[] = [
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { value: 'sky', label: 'Sky', class: 'bg-sky-500' },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventWithParticipantCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    banner_color: 'amber' as EventBannerColor,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          slug: '',
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          banner_color: 'amber',
        });
        fetchEvents();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  }

  function copyEventLink(slug: string) {
    const link = `${window.location.origin}/event/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  function getEventStatus(event: EventWithParticipantCount) {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (now < start) return { label: 'Upcoming', class: 'bg-blue-500/20 text-blue-400' };
    if (now > end) return { label: 'Ended', class: 'bg-stone-500/20 text-stone-400' };
    return { label: 'Live', class: 'bg-green-500/20 text-green-400' };
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">Events Management</h1>
          <p className="text-stone-400">Create and manage events for Solution Studio</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-card w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-stone-100">Create New Event</CardTitle>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 rounded-md text-stone-500 hover:text-stone-300 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-stone-300">Event Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Appathon 2.0"
                    className="bg-stone-800/50 border-stone-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-stone-300">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-sm">/event/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      placeholder="appathon-2"
                      className="bg-stone-800/50 border-stone-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-stone-300">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="24-hour innovation challenge"
                    className="bg-stone-800/50 border-stone-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-stone-300">Start Date</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="bg-stone-800/50 border-stone-700"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-stone-300">End Date</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="bg-stone-800/50 border-stone-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-stone-300">Banner Color</Label>
                  <div className="flex gap-2">
                    {bannerColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, banner_color: color.value })}
                        className={`w-8 h-8 rounded-full ${color.class} transition-transform ${
                          formData.banner_color === color.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Event'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events List */}
      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Trophy className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <p className="text-stone-400">No events created yet</p>
              <p className="text-sm text-stone-500 mt-1">Create your first event to get started</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => {
            const status = getEventStatus(event);
            const colorConfig = bannerColors.find((c) => c.value === event.banner_color);

            return (
              <Card key={event.id} className="glass-card overflow-hidden">
                <div className={`h-1 ${colorConfig?.class || 'bg-amber-500'}`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-stone-100">{event.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${status.class}`}>
                          {status.label}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-stone-400 text-sm mb-4">{event.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{event.participant_count} participants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LinkIcon className="w-4 h-4" />
                          <code className="text-amber-400/80">/event/{event.slug}</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => copyEventLink(event.slug)}
                        className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                        title="Copy event link"
                      >
                        {copiedSlug === event.slug ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={`/event/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                        title="Open event link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
