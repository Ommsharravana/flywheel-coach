'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Settings,
  Shield,
  Trash2,
  AlertTriangle,
  Users,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { METHODOLOGIES } from '@/lib/methodologies';

interface EventData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  config: {
    type?: string;
    methodology_id?: string;
    [key: string]: unknown;
  };
  is_active: boolean;
}

interface EventAdmin {
  id: string;
  user_id: string;
  role: string;
  user: {
    name: string;
    email: string;
  };
}

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [admins, setAdmins] = useState<EventAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [methodologyId, setMethodologyId] = useState('flywheel-8');
  const [eventType, setEventType] = useState('general');

  // Admin assignment
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/by-slug/${slug}`);
        if (!response.ok) {
          if (response.status === 403) {
            router.push('/admin/events');
            return;
          }
          throw new Error('Failed to fetch event');
        }
        const data = await response.json();
        setEvent(data.event);
        setAdmins(data.admins || []);

        // Populate form
        setName(data.event.name);
        setDescription(data.event.description || '');
        setStartDate(data.event.start_date?.split('T')[0] || '');
        setEndDate(data.event.end_date?.split('T')[0] || '');
        setIsActive(data.event.is_active);
        setMethodologyId(data.event.config?.methodology_id || 'flywheel-8');
        setEventType(data.event.config?.type || 'general');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug, router]);

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: isActive,
          config: {
            ...event.config,
            methodology_id: methodologyId,
            type: eventType,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!event || !newAdminEmail) return;
    setAddingAdmin(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${event.id}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add admin');
      }

      const data = await response.json();
      setAdmins([...admins, data]);
      setNewAdminEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!event || !confirm('Remove this admin?')) return;

    try {
      const response = await fetch(`/api/events/${event.id}/admins/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove admin');
      }

      setAdmins(admins.filter(a => a.id !== adminId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <p className="text-stone-400">Event not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href={`/admin/events/${slug}`}
          className="inline-flex items-center text-stone-400 hover:text-stone-200 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold text-stone-100">Event Settings</h1>
        <p className="text-stone-400">Configure {event.name}</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Basic Settings */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-stone-800 border-stone-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (read-only)</Label>
              <Input
                id="slug"
                value={event.slug}
                disabled
                className="bg-stone-800/50 border-stone-700 text-stone-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-stone-800 border-stone-700"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-800/50 border border-stone-700">
            <div>
              <div className="font-medium text-stone-100">Active Status</div>
              <div className="text-sm text-stone-500">
                Inactive events are hidden from participants
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-stone-800 border-stone-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-stone-800 border-stone-700"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Methodology</CardTitle>
          <CardDescription>Choose the step flow for this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Methodology</Label>
              <Select value={methodologyId} onValueChange={setMethodologyId}>
                <SelectTrigger className="bg-stone-800 border-stone-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHODOLOGIES).map(([id, methodology]) => (
                    <SelectItem key={id} value={id}>
                      {methodology.name} ({methodology.steps.length} steps)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-stone-800 border-stone-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="appathon">Appathon (Competition)</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Admins */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Event Admins
          </CardTitle>
          <CardDescription>People who can manage this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current admins */}
          <div className="space-y-2">
            {admins.length > 0 ? (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50 border border-stone-700"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-stone-500" />
                    <div>
                      <div className="font-medium text-stone-100">{admin.user.name}</div>
                      <div className="text-xs text-stone-500">{admin.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                      {admin.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-500 text-center py-4">No event admins assigned</p>
            )}
          </div>

          {/* Add admin */}
          <div className="flex gap-2 pt-4 border-t border-stone-700">
            <Input
              placeholder="Email address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="bg-stone-800 border-stone-700"
            />
            <Select value={newAdminRole} onValueChange={setNewAdminRole}>
              <SelectTrigger className="w-[120px] bg-stone-800 border-stone-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddAdmin}
              disabled={!newAdminEmail || addingAdmin}
              className="bg-amber-500 hover:bg-amber-600 text-stone-900"
            >
              {addingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Event
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-stone-900"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
