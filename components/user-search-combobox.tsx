'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, UserCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserResult {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string | null;
}

interface UserSearchComboboxProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Filter by role (e.g., 'senior_learner') */
  roleFilter?: string;
  /** Event ID to scope search to event participants */
  eventId?: string;
  /** Currently selected user */
  value?: UserResult | null;
  /** Callback when user is selected */
  onSelect: (user: UserResult | null) => void;
  /** Users to exclude from results (e.g., already selected team members) */
  excludeIds?: string[];
  /** Custom label for the search */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
}

export function UserSearchCombobox({
  placeholder = 'Search by name or email...',
  roleFilter,
  eventId,
  value,
  onSelect,
  excludeIds = [],
  label,
  required = false,
  disabled = false,
}: UserSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search users with debouncing
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      if (eventId) params.set('event_id', eventId);
      params.set('limit', '20');

      const response = await fetch(`/api/users/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();

      // Filter out excluded users
      const filteredUsers = (data.users || []).filter(
        (u: UserResult) => !excludeIds.includes(u.id)
      );

      setResults(filteredUsers);
    } catch (err) {
      console.error('User search error:', err);
      setError('Failed to search users');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, eventId, excludeIds]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchUsers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle user selection
  const handleSelect = (user: UserResult) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  // Handle clear selection
  const handleClear = () => {
    onSelect(null);
    setQuery('');
    inputRef.current?.focus();
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="text-sm font-medium mb-1 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected user display */}
      {value ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              value.role === 'senior_learner' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            )}>
              {value.role === 'senior_learner' ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{value.name}</div>
              <div className="text-xs text-muted-foreground truncate">{value.email}</div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {formatRole(value.role)}
            </Badge>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="shrink-0 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              disabled={disabled}
              className="pl-10 pr-10"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Results dropdown */}
          {isOpen && query.trim() && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {error ? (
                <div className="p-3 text-sm text-red-500">{error}</div>
              ) : results.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  {isLoading ? 'Searching...' : 'No users found'}
                </div>
              ) : (
                <ul className="py-1">
                  {results.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(user)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left transition-colors"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          user.role === 'senior_learner' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {user.role === 'senior_learner' ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {formatRole(user.role)}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Export a multi-select version for team members
interface UserMultiSelectProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Filter by role (e.g., 'senior_learner') */
  roleFilter?: string;
  /** Event ID to scope search to event participants */
  eventId?: string;
  /** Currently selected users */
  value: UserResult[];
  /** Callback when users change */
  onChange: (users: UserResult[]) => void;
  /** Custom label for the search */
  label?: string;
  /** Minimum number of users required */
  minUsers?: number;
  /** Maximum number of users allowed */
  maxUsers?: number;
  /** Whether the field is disabled */
  disabled?: boolean;
}

export function UserMultiSelect({
  placeholder = 'Search by name or email...',
  roleFilter,
  eventId,
  value,
  onChange,
  label,
  minUsers = 0,
  maxUsers = 10,
  disabled = false,
}: UserMultiSelectProps) {
  const excludeIds = value.map(u => u.id);
  const canAddMore = value.length < maxUsers;

  const handleSelect = (user: UserResult | null) => {
    if (user && canAddMore) {
      onChange([...value, user]);
    }
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter(u => u.id !== userId));
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium block">
          {label}
          {minUsers > 0 && (
            <span className="text-muted-foreground font-normal ml-1">
              (min {minUsers})
            </span>
          )}
        </label>
      )}

      {/* Selected users */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 bg-muted rounded-md border"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                user.role === 'senior_learner' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              )}>
                {user.role === 'senior_learner' ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {formatRole(user.role)}
              </Badge>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(user.id)}
                  className="shrink-0 h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add more users */}
      {canAddMore && !disabled && (
        <UserSearchCombobox
          placeholder={placeholder}
          roleFilter={roleFilter}
          eventId={eventId}
          value={null}
          onSelect={handleSelect}
          excludeIds={excludeIds}
          disabled={disabled}
        />
      )}

      {!canAddMore && (
        <p className="text-sm text-muted-foreground">
          Maximum of {maxUsers} team members reached
        </p>
      )}
    </div>
  );
}

export type { UserResult };
