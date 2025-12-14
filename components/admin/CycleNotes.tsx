'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CycleNote {
  id: string;
  cycle_id: string;
  admin_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  admin?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CycleNotesProps {
  cycleId: string;
}

export function CycleNotes({ cycleId }: CycleNotesProps) {
  const [notes, setNotes] = useState<CycleNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, [cycleId]);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/notes`);
      if (!res.ok) {
        throw new Error('Failed to fetch notes');
      }
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add note');
      }

      const data = await res.json();
      setNotes([data.note, ...notes]);
      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm('Delete this note?')) return;

    setDeleting(noteId);
    try {
      const res = await fetch(`/api/admin/cycles/${cycleId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-400" />
          Admin Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a note about this cycle..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="bg-stone-800 border-stone-700 text-stone-100 resize-none"
            rows={3}
          />
          <Button
            type="submit"
            disabled={submitting || !newNote.trim()}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Adding...' : 'Add Note'}
          </Button>
        </form>

        {/* Notes List */}
        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="text-center py-4 text-stone-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-stone-500">
              No notes yet. Add the first one above.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg bg-stone-800/50 border border-stone-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-amber-400">
                        {note.admin?.name || note.admin?.email || 'Admin'}
                      </span>
                      <span className="text-xs text-stone-500">
                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-stone-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(note.id)}
                    disabled={deleting === note.id}
                    className="text-stone-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
