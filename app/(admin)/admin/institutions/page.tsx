'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Plus,
  Search,
  GraduationCap,
  School,
  Globe,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Institution } from '@/lib/institutions/types';
import { getInstitutionIcon, getInstitutionColor } from '@/lib/institutions/types';

interface InstitutionWithStats extends Institution {
  user_count?: number;
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<InstitutionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

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

  const filteredInstitutions = institutions.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.short_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: institutions.length,
    colleges: institutions.filter(i => i.type === 'college').length,
    schools: institutions.filter(i => i.type === 'school').length,
    external: institutions.filter(i => i.type === 'external').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-100">
            Institution Management
          </h1>
          <p className="text-stone-400">
            Manage all {stats.total} institutions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900"
        >
          <Plus className="h-4 w-4" />
          Add Institution
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-stone-100">{stats.total}</div>
                <p className="text-sm text-stone-500">Total Institutions</p>
              </div>
              <Building2 className="h-8 w-8 text-stone-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.colleges}</div>
                <p className="text-sm text-stone-500">Colleges</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-400">{stats.schools}</div>
                <p className="text-sm text-stone-500">Schools</p>
              </div>
              <School className="h-8 w-8 text-orange-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400">{stats.external}</div>
                <p className="text-sm text-stone-500">External</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Institutions List */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-stone-100">All Institutions</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                placeholder="Search institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-stone-800 border-stone-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredInstitutions.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                {searchQuery ? 'No institutions match your search' : 'No institutions found'}
              </div>
            ) : (
              filteredInstitutions.map((institution) => (
                <InstitutionRow
                  key={institution.id}
                  institution={institution}
                  onUpdate={fetchInstitutions}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInstitutionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            fetchInstitutions();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function InstitutionRow({
  institution,
  onUpdate
}: {
  institution: InstitutionWithStats;
  onUpdate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const colors = getInstitutionColor(institution.slug);
  const icon = getInstitutionIcon(institution);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to deactivate "${institution.name}"?`)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/institutions/${institution.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Institution deactivated');
        onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Something went wrong');
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors.bg} border ${colors.border}`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-100">{institution.short_name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
              institution.type === 'college'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : institution.type === 'school'
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}>
              {institution.type.charAt(0).toUpperCase() + institution.type.slice(1)}
            </span>
          </div>
          <p className="text-sm text-stone-500">{institution.name}</p>
          <p className="text-xs text-stone-600 font-mono">{institution.slug}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-stone-400">
          <Users className="h-4 w-4" />
          <span className="text-sm">{institution.user_count ?? '—'} users</span>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 p-0 text-stone-400 hover:text-stone-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 py-1 rounded-lg bg-stone-800 border border-stone-700 shadow-xl">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // TODO: Open edit modal
                    toast.info('Edit coming soon');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:bg-stone-700 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-stone-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Deactivate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateInstitutionModal({
  onClose,
  onCreated
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    slug: '',
    type: 'college' as 'college' | 'school' | 'external',
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    setFormData({ ...formData, name, slug });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.short_name || !formData.slug) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Institution created successfully');
        onCreated();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create institution');
      }
    } catch (err) {
      console.error('Failed to create:', err);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-700 bg-stone-900 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <h2 className="font-display text-xl font-bold text-stone-100">
            Add New Institution
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              Full Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., JKKN College of Engineering & Technology"
              className="bg-stone-800 border-stone-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              Short Name *
            </label>
            <Input
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="e.g., Engineering"
              className="bg-stone-800 border-stone-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              Slug * <span className="text-stone-500">(auto-generated)</span>
            </label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., jkkn-engineering"
              className="bg-stone-800 border-stone-700 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
              Type
            </label>
            <div className="flex gap-3">
              {(['college', 'school', 'external'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    formData.type === type
                      ? type === 'college'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : type === 'school'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-purple-500/20 border-purple-500 text-purple-400'
                      : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-600'
                  }`}
                >
                  {type === 'college' ? <GraduationCap className="h-4 w-4" /> :
                   type === 'school' ? <School className="h-4 w-4" /> :
                   <Globe className="h-4 w-4" />}
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
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
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
