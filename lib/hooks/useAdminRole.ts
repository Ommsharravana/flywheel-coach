'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AdminRole {
  roleType: 'superadmin' | 'event_admin' | 'institution_admin' | 'none';
  eventIds: string[];
  institutionIds: string[];
  isLoading: boolean;
  error: string | null;
}

export interface Institution {
  id: string;
  name: string;
  short_name: string | null;
  code: string | null;
}

export function useAdminRole(userId?: string): AdminRole {
  const [roleType, setRoleType] = useState<AdminRole['roleType']>('none');
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [institutionIds, setInstitutionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminRole = async () => {
      const supabase = createClient();

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcError } = await (supabase as any).rpc('get_admin_role', {
          p_user_id: userId || undefined
        });

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        if (data && data.length > 0) {
          const result = data[0];
          setRoleType(result.role_type || 'none');
          setEventIds(result.event_ids || []);
          setInstitutionIds(result.institution_ids || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch admin role');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminRole();
  }, [userId]);

  return { roleType, eventIds, institutionIds, isLoading, error };
}

export function useInstitutions(): {
  institutions: Institution[];
  isLoading: boolean;
  error: string | null;
} {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from('institutions')
          .select('id, name, short_name, code')
          .order('name');

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setInstitutions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch institutions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  return { institutions, isLoading, error };
}
