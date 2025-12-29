'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CycleNameEditorProps {
  cycleId: string;
  initialName: string;
  onNameChange?: (newName: string) => void;
  className?: string;
  textClassName?: string;
  iconSize?: 'sm' | 'md';
}

export function CycleNameEditor({
  cycleId,
  initialName,
  onNameChange,
  className = '',
  textClassName = '',
  iconSize = 'md',
}: CycleNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [editValue, setEditValue] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Update local state when prop changes
  useEffect(() => {
    setName(initialName);
    setEditValue(initialName);
  }, [initialName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(name);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    if (!trimmedValue) {
      toast.error('Cycle name cannot be empty');
      return;
    }

    if (trimmedValue === name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cycles')
        .update({
          name: trimmedValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cycleId);

      if (error) throw error;

      setName(trimmedValue);
      setIsEditing(false);
      toast.success('Cycle name updated');
      onNameChange?.(trimmedValue);
    } catch (error) {
      console.error('Error updating cycle name:', error);
      toast.error('Failed to update cycle name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const iconClasses = iconSize === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const buttonPadding = iconSize === 'sm' ? 'p-1' : 'p-1.5';

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'bg-stone-800 border border-stone-600 rounded px-2 py-1 text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500',
            textClassName
          )}
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            buttonPadding,
            'rounded hover:bg-stone-700 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50'
          )}
          aria-label="Save cycle name"
        >
          {isSaving ? (
            <Loader2 className={cn(iconClasses, 'animate-spin')} />
          ) : (
            <Check className={iconClasses} />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className={cn(
            buttonPadding,
            'rounded hover:bg-stone-700 text-stone-400 hover:text-stone-300 transition-colors disabled:opacity-50'
          )}
          aria-label="Cancel editing"
        >
          <X className={iconClasses} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <span className={textClassName}>{name}</span>
      <button
        onClick={handleStartEdit}
        className={cn(
          buttonPadding,
          'rounded opacity-0 group-hover:opacity-100 hover:bg-stone-700 text-stone-400 hover:text-amber-400 transition-all'
        )}
        aria-label="Edit cycle name"
      >
        <Pencil className={iconClasses} />
      </button>
    </div>
  );
}
