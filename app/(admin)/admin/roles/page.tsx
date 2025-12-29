'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Shield,
  Building2,
  Calendar,
  Plus,
  Search,
  Loader2,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface EventAdmin {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  assigned_at: string;
}

interface InstitutionAdmin {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  institution_id: string;
  institution_name: string;
  institution_short_name: string;
  assigned_at: string;
}

interface Event {
  id: string;
  name: string;
  slug: string;
}

interface Institution {
  id: string;
  name: string;
  short_name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminRolesPage() {
  const [eventAdmins, setEventAdmins] = useState<EventAdmin[]>([]);
  const [institutionAdmins, setInstitutionAdmins] = useState<InstitutionAdmin[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('event');

  // Modal states
  const [showAddEventAdmin, setShowAddEventAdmin] = useState(false);
  const [showAddInstitutionAdmin, setShowAddInstitutionAdmin] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    await Promise.all([
      fetchEventAdmins(),
      fetchInstitutionAdmins(),
      fetchEvents(),
      fetchInstitutions(),
    ]);
    setLoading(false);
  }

  async function fetchEventAdmins() {
    const { data, error } = await supabase
      .from('event_admins')
      .select(`
        id,
        user_id,
        event_id,
        assigned_at,
        users!event_admins_user_id_fkey (name, email),
        events!event_admins_event_id_fkey (name, slug)
      `)
      .order('assigned_at', { ascending: false });

    if (!error && data) {
      setEventAdmins(data.map((ea: Record<string, unknown>) => ({
        id: ea.id as string,
        user_id: ea.user_id as string,
        user_name: (ea.users as Record<string, unknown>)?.name as string || 'Unknown',
        user_email: (ea.users as Record<string, unknown>)?.email as string || '',
        event_id: ea.event_id as string,
        event_name: (ea.events as Record<string, unknown>)?.name as string || 'Unknown',
        event_slug: (ea.events as Record<string, unknown>)?.slug as string || '',
        assigned_at: ea.assigned_at as string,
      })));
    }
  }

  async function fetchInstitutionAdmins() {
    const { data, error } = await supabase
      .from('institution_admins')
      .select(`
        id,
        user_id,
        institution_id,
        assigned_at,
        users!institution_admins_user_id_fkey (name, email),
        institutions!institution_admins_institution_id_fkey (name, short_name)
      `)
      .order('assigned_at', { ascending: false });

    if (!error && data) {
      setInstitutionAdmins(data.map((ia: Record<string, unknown>) => ({
        id: ia.id as string,
        user_id: ia.user_id as string,
        user_name: (ia.users as Record<string, unknown>)?.name as string || 'Unknown',
        user_email: (ia.users as Record<string, unknown>)?.email as string || '',
        institution_id: ia.institution_id as string,
        institution_name: (ia.institutions as Record<string, unknown>)?.name as string || 'Unknown',
        institution_short_name: (ia.institutions as Record<string, unknown>)?.short_name as string || '',
        assigned_at: ia.assigned_at as string,
      })));
    }
  }

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setEvents(data);
    }
  }

  async function fetchInstitutions() {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, short_name')
      .order('name');

    if (!error && data) {
      setInstitutions(data as Institution[]);
    }
  }

  async function removeEventAdmin(id: string) {
    if (!confirm('Are you sure you want to remove this event admin?')) return;

    const { error } = await supabase
      .from('event_admins')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove event admin');
    } else {
      toast.success('Event admin removed');
      fetchEventAdmins();
    }
  }

  async function removeInstitutionAdmin(id: string) {
    if (!confirm('Are you sure you want to remove this institution admin?')) return;

    const { error } = await supabase
      .from('institution_admins')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove institution admin');
    } else {
      toast.success('Institution admin removed');
      fetchInstitutionAdmins();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Role Management</h1>
          <p className="text-stone-400">
            Assign admin roles to users for events and institutions
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-stone-100">{eventAdmins.length}</div>
                <p className="text-sm text-stone-500">Event Admins</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-stone-100">{institutionAdmins.length}</div>
                <p className="text-sm text-stone-500">Institution Admins</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {new Set([...eventAdmins.map(e => e.user_id), ...institutionAdmins.map(i => i.user_id)]).size}
                </div>
                <p className="text-sm text-stone-500">Unique Admins</p>
              </div>
              <Shield className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-900/50 border border-stone-800">
          <TabsTrigger value="event" className="data-[state=active]:bg-stone-800">
            <Calendar className="h-4 w-4 mr-2" />
            Event Admins
          </TabsTrigger>
          <TabsTrigger value="institution" className="data-[state=active]:bg-stone-800">
            <Building2 className="h-4 w-4 mr-2" />
            Institution Admins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="event">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-stone-100">Event Admins</CardTitle>
                <CardDescription>
                  Users who can manage specific events
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddEventAdmin(true)}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event Admin
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-700">
                    <TableHead className="text-stone-400">User</TableHead>
                    <TableHead className="text-stone-400">Event</TableHead>
                    <TableHead className="text-stone-400">Assigned</TableHead>
                    <TableHead className="text-stone-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventAdmins.length > 0 ? (
                    eventAdmins.map((admin) => (
                      <TableRow key={admin.id} className="border-stone-700">
                        <TableCell>
                          <div>
                            <div className="font-medium text-stone-100">{admin.user_name}</div>
                            <div className="text-xs text-stone-500">{admin.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                            {admin.event_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-stone-400">
                          {new Date(admin.assigned_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEventAdmin(admin.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-stone-500">
                        No event admins assigned yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institution">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-stone-100">Institution Admins</CardTitle>
                <CardDescription>
                  Users who can view data for their institution (read-only)
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddInstitutionAdmin(true)}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Institution Admin
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-700">
                    <TableHead className="text-stone-400">User</TableHead>
                    <TableHead className="text-stone-400">Institution</TableHead>
                    <TableHead className="text-stone-400">Assigned</TableHead>
                    <TableHead className="text-stone-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutionAdmins.length > 0 ? (
                    institutionAdmins.map((admin) => (
                      <TableRow key={admin.id} className="border-stone-700">
                        <TableCell>
                          <div>
                            <div className="font-medium text-stone-100">{admin.user_name}</div>
                            <div className="text-xs text-stone-500">{admin.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-400 border-green-500/30">
                            {admin.institution_short_name || admin.institution_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-stone-400">
                          {new Date(admin.assigned_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInstitutionAdmin(admin.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-stone-500">
                        No institution admins assigned yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Event Admin Modal */}
      {showAddEventAdmin && (
        <AddAdminModal
          type="event"
          events={events}
          institutions={institutions}
          onClose={() => setShowAddEventAdmin(false)}
          onSuccess={() => {
            fetchEventAdmins();
            setShowAddEventAdmin(false);
          }}
        />
      )}

      {/* Add Institution Admin Modal */}
      {showAddInstitutionAdmin && (
        <AddAdminModal
          type="institution"
          events={events}
          institutions={institutions}
          onClose={() => setShowAddInstitutionAdmin(false)}
          onSuccess={() => {
            fetchInstitutionAdmins();
            setShowAddInstitutionAdmin(false);
          }}
        />
      )}
    </div>
  );
}

function AddAdminModal({
  type,
  events,
  institutions,
  onClose,
  onSuccess,
}: {
  type: 'event' | 'institution';
  events: Event[];
  institutions: Institution[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  async function searchUsers(query: string) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data as User[]);
    }
    setSearching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUser || !selectedId) {
      toast.error('Please select a user and ' + (type === 'event' ? 'event' : 'institution'));
      return;
    }

    setSubmitting(true);

    if (type === 'event') {
      const { error } = await supabase
        .from('event_admins')
        .insert({
          user_id: selectedUser.id,
          event_id: selectedId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This user is already an admin for this event');
        } else {
          toast.error('Failed to add event admin');
        }
      } else {
        toast.success('Event admin added successfully');
        onSuccess();
      }
    } else {
      const { error } = await supabase
        .from('institution_admins')
        .insert({
          user_id: selectedUser.id,
          institution_id: selectedId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This user is already an admin for this institution');
        } else {
          toast.error('Failed to add institution admin');
        }
      } else {
        toast.success('Institution admin added successfully');
        onSuccess();
      }
    }

    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <h2 className="text-xl font-bold text-stone-100">
            Add {type === 'event' ? 'Event' : 'Institution'} Admin
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              Search User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search by name or email..."
                className="pl-9 bg-stone-800 border-stone-700"
              />
            </div>

            {/* Search Results */}
            {(searchResults.length > 0 || searching) && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-stone-700 bg-stone-800">
                {searching ? (
                  <div className="p-3 text-center text-stone-500">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Searching...
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchQuery(user.name);
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-700 transition-colors"
                    >
                      <div className="font-medium text-stone-100">{user.name}</div>
                      <div className="text-xs text-stone-500">{user.email}</div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-stone-100">{selectedUser.name}</span>
                <span className="text-stone-500 text-sm">({selectedUser.email})</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                  className="ml-auto p-1 text-stone-400 hover:text-stone-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Event/Institution Select */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              Select {type === 'event' ? 'Event' : 'Institution'}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Choose {type === 'event' ? 'an event' : 'an institution'}...</option>
              {type === 'event'
                ? events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))
                : institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.short_name || inst.name}
                    </option>
                  ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedUser || !selectedId}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Assign
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
