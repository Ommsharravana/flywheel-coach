'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Building2,
  Calendar,
  Plus,
  Search,
  Loader2,
  X,
  Check,
  Trash2,
  UserCog,
  Hammer,
  Globe,
  CalendarCheck,
  Info,
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

interface UserWithRole {
  id: string;
  name: string | null;
  email: string;
  role: 'builder' | 'admin' | 'event_admin' | 'institution_admin' | 'superadmin';
  user_category: 'learner' | 'senior_learner';
  created_at: string;
}

// Role colors for badges
const roleColors: Record<string, string> = {
  builder: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  event_admin: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  institution_admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  superadmin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const roleLabels: Record<string, string> = {
  builder: 'Builder',
  admin: 'Admin',
  event_admin: 'Global Event Admin',
  institution_admin: 'Global Institution Admin',
  superadmin: 'Super Admin',
};

export default function AdminRolesPage() {
  const [eventAdmins, setEventAdmins] = useState<EventAdmin[]>([]);
  const [institutionAdmins, setInstitutionAdmins] = useState<InstitutionAdmin[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('by-role');

  // Modal states
  const [showAddEventAdmin, setShowAddEventAdmin] = useState(false);
  const [showAddInstitutionAdmin, setShowAddInstitutionAdmin] = useState(false);
  const [showBulkRoleChange, setShowBulkRoleChange] = useState(false);

  // Selection states for bulk operations
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const supabase = createClient();

  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, user_category, created_at')
      .order('name');

    if (!error && data) {
      setAllUsers(data as UserWithRole[]);
    }
  }, [supabase]);

  const fetchEventAdmins = useCallback(async () => {
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
  }, [supabase]);

  const fetchInstitutionAdmins = useCallback(async () => {
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
  }, [supabase]);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setEvents(data);
    }
  }, [supabase]);

  const fetchInstitutions = useCallback(async () => {
    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, short_name')
      .order('name');

    if (!error && data) {
      setInstitutions(data as Institution[]);
    }
  }, [supabase]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchEventAdmins(),
      fetchInstitutionAdmins(),
      fetchEvents(),
      fetchInstitutions(),
      fetchAllUsers(),
    ]);
    setLoading(false);
  }, [fetchEventAdmins, fetchInstitutionAdmins, fetchEvents, fetchInstitutions, fetchAllUsers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching is a valid useEffect pattern
    fetchData();
  }, [fetchData]);

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

  // Group users by role
  const usersByRole = allUsers.reduce((acc, user) => {
    const role = user.role || 'builder';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, UserWithRole[]>);

  // Calculate unique event admins (global role OR per-event assignment)
  const uniqueEventAdminUsers = useMemo(() => {
    const globalEventAdmins = allUsers.filter(u => u.role === 'event_admin').map(u => u.id);
    const perEventAdmins = eventAdmins.map(ea => ea.user_id);
    const allEventAdminIds = new Set([...globalEventAdmins, ...perEventAdmins]);
    return allEventAdminIds.size;
  }, [allUsers, eventAdmins]);

  // Calculate unique institution admins (global role OR per-institution assignment)
  const uniqueInstitutionAdminUsers = useMemo(() => {
    const globalInstAdmins = allUsers.filter(u => u.role === 'institution_admin').map(u => u.id);
    const perInstAdmins = institutionAdmins.map(ia => ia.user_id);
    const allInstAdminIds = new Set([...globalInstAdmins, ...perInstAdmins]);
    return allInstAdminIds.size;
  }, [allUsers, institutionAdmins]);

  // Get filtered users for display
  const filteredUsers = roleFilter === 'all'
    ? allUsers
    : allUsers.filter(u => u.role === roleFilter);

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Select all filtered users
  const selectAllFiltered = () => {
    const newSelected = new Set(selectedUsers);
    filteredUsers.forEach(u => {
      if (u.role !== 'superadmin') { // Don't allow selecting superadmins
        newSelected.add(u.id);
      }
    });
    setSelectedUsers(newSelected);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

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
            View users by role and assign admin permissions
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-stone-100">{usersByRole['builder']?.length || 0}</div>
                <p className="text-sm text-stone-500">Builders</p>
              </div>
              <Hammer className="h-8 w-8 text-stone-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-stone-100">{uniqueEventAdminUsers}</div>
                <p className="text-sm text-stone-500">Event Admins</p>
                <p className="text-xs text-stone-600 mt-1">
                  {usersByRole['event_admin']?.length || 0} global, {eventAdmins.length} assignments
                </p>
              </div>
              <Calendar className="h-8 w-8 text-cyan-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-stone-100">{uniqueInstitutionAdminUsers}</div>
                <p className="text-sm text-stone-500">Institution Admins</p>
                <p className="text-xs text-stone-600 mt-1">
                  {usersByRole['institution_admin']?.length || 0} global, {institutionAdmins.length} assignments
                </p>
              </div>
              <Building2 className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-400">{usersByRole['superadmin']?.length || 0}</div>
                <p className="text-sm text-stone-500">Super Admins</p>
              </div>
              <Shield className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-900/50 border border-stone-800">
          <TabsTrigger value="by-role" className="data-[state=active]:bg-stone-800">
            <Globe className="h-4 w-4 mr-2" />
            Global Roles
          </TabsTrigger>
          <TabsTrigger value="event" className="data-[state=active]:bg-stone-800">
            <CalendarCheck className="h-4 w-4 mr-2" />
            Event Assignments ({eventAdmins.length})
          </TabsTrigger>
          <TabsTrigger value="institution" className="data-[state=active]:bg-stone-800">
            <Building2 className="h-4 w-4 mr-2" />
            Institution Assignments ({institutionAdmins.length})
          </TabsTrigger>
        </TabsList>

        {/* View by Role Tab */}
        <TabsContent value="by-role">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  Global Roles
                </CardTitle>
                <CardDescription>
                  View all users by their global permission role. Global admins have access to ALL resources of their type.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {selectedUsers.size > 0 && (
                  <>
                    <span className="text-sm text-stone-400">
                      {selectedUsers.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="border-stone-700 text-stone-300"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => setShowBulkRoleChange(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Change Role
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-800/50 border border-stone-700">
                <Info className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-stone-400">
                  <p className="mb-1">
                    <strong className="text-stone-200">Two types of Event/Institution Admins:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><span className="text-cyan-400">Global</span> (role-based): Can manage ALL events/institutions</li>
                    <li><span className="text-emerald-400">Per-event/Per-institution</span> (assigned): Can only manage specific events/institutions they&apos;re assigned to</li>
                  </ul>
                  <p className="mt-2 text-stone-500">
                    This tab shows users by their <strong>global role</strong>. See the &quot;Event Admins&quot; and &quot;Institution Admins&quot; tabs for per-resource assignments.
                  </p>
                </div>
              </div>

              {/* Filter and Actions */}
              <div className="flex items-center gap-4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-56 bg-stone-800 border-stone-700">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="builder">Builder</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="event_admin">Global Event Admin</SelectItem>
                    <SelectItem value="institution_admin">Global Institution Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllFiltered}
                  className="border-stone-700 text-stone-300"
                >
                  Select All
                </Button>
                <span className="text-sm text-stone-500">
                  Showing {filteredUsers.length} users
                </span>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-700">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredUsers.every(u => u.role === 'superadmin' || selectedUsers.has(u.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllFiltered();
                          } else {
                            clearSelection();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-stone-400">User</TableHead>
                    <TableHead className="text-stone-400">Role</TableHead>
                    <TableHead className="text-stone-400">Category</TableHead>
                    <TableHead className="text-stone-400">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-stone-700">
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                            disabled={user.role === 'superadmin'}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-stone-100">{user.name || 'No name'}</div>
                            <div className="text-xs text-stone-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[user.role] || roleColors.builder}>
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.user_category === 'senior_learner' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}>
                            {user.user_category === 'senior_learner' ? 'Senior Learner' : 'Learner'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-stone-400 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event">
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-emerald-400" />
                  Per-Event Admin Assignments
                </CardTitle>
                <CardDescription>
                  Users assigned to manage <strong>specific events</strong>. Unlike Global Event Admins (who can manage all events), these users can only manage the events they&apos;re assigned to.
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddEventAdmin(true)}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign to Event
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
                          <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
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
                <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-400" />
                  Per-Institution Admin Assignments
                </CardTitle>
                <CardDescription>
                  Users assigned to view data for <strong>specific institutions</strong> (read-only). Unlike Global Institution Admins (who can view all institutions), these users can only view their assigned institution&apos;s data.
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddInstitutionAdmin(true)}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign to Institution
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
                          <Badge variant="outline" className="text-orange-400 border-orange-500/30">
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

      {/* Bulk Role Change Modal */}
      {showBulkRoleChange && (
        <BulkRoleChangeModal
          selectedUserIds={Array.from(selectedUsers)}
          users={allUsers.filter(u => selectedUsers.has(u.id))}
          onClose={() => setShowBulkRoleChange(false)}
          onSuccess={() => {
            fetchAllUsers();
            setSelectedUsers(new Set());
            setShowBulkRoleChange(false);
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
          <div>
            <h2 className="text-xl font-bold text-stone-100">
              Assign {type === 'event' ? 'Event' : 'Institution'} Admin
            </h2>
            <p className="text-sm text-stone-400 mt-1">
              Give a user admin access to a specific {type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Step 1: Event/Institution Select */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              <span className="text-cyan-400">Step 1:</span> Select {type === 'event' ? 'Event' : 'Institution'}
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

          {/* Step 2: User Search */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              <span className="text-cyan-400">Step 2:</span> Search User
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

function BulkRoleChangeModal({
  selectedUserIds,
  users,
  onClose,
  onSuccess,
}: {
  selectedUserIds: string[];
  users: UserWithRole[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newRole, setNewRole] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newRole) {
      toast.error('Please select a role');
      return;
    }

    // Filter out superadmins from selection
    const usersToUpdate = selectedUserIds.filter(id => {
      const user = users.find(u => u.id === id);
      return user && user.role !== 'superadmin';
    });

    if (usersToUpdate.length === 0) {
      toast.error('No eligible users to update');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .in('id', usersToUpdate);

    if (error) {
      toast.error('Failed to update user roles');
      console.error(error);
    } else {
      toast.success(`Updated ${usersToUpdate.length} user(s) to ${roleLabels[newRole] || newRole}`);
      onSuccess();
    }

    setSubmitting(false);
  }

  const eligibleCount = selectedUserIds.filter(id => {
    const user = users.find(u => u.id === id);
    return user && user.role !== 'superadmin';
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <h2 className="text-xl font-bold text-stone-100">
            Bulk Role Change
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-stone-800 border border-stone-700">
            <p className="text-stone-300">
              <span className="font-bold text-amber-400">{eligibleCount}</span> user(s) selected
            </p>
            {selectedUserIds.length !== eligibleCount && (
              <p className="text-xs text-stone-500 mt-1">
                {selectedUserIds.length - eligibleCount} superadmin(s) excluded (cannot be changed)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              New Role
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-stone-800 border-stone-700">
                <SelectValue placeholder="Select new role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="builder">Builder (Default)</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="event_admin">Event Admin</SelectItem>
                <SelectItem value="institution_admin">Institution Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-stone-500 mt-2">
              Super Admin role cannot be assigned via bulk change for security reasons.
            </p>
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
              disabled={submitting || !newRole || eligibleCount === 0}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserCog className="h-4 w-4 mr-2" />
                  Update {eligibleCount} User(s)
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
