import { createClient } from './server';
import { cookies } from 'next/headers';

const IMPERSONATION_COOKIE = 'flywheel_impersonation';

interface ImpersonationSession {
  adminId: string;
  adminEmail: string;
  adminName: string | null;
  targetUserId: string;
  targetEmail: string;
  targetName: string | null;
  startedAt: string;
  expiresAt: string;
}

interface EffectiveUser {
  id: string;
  email: string;
  name: string | null;
  isImpersonating: boolean;
  realAdminId?: string;
  realAdminEmail?: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Gets the effective user - either the impersonated user (if active)
 * or the actual authenticated user.
 *
 * This function should be used in dashboard and cycle pages to show
 * the correct user's data during impersonation.
 */
export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error('[getEffectiveUser] createClient error:', err);
    return null;
  }

  // Get the actual authenticated user
  let authUser;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[getEffectiveUser] getUser error:', error);
      return null;
    }
    authUser = data.user;
  } catch (err) {
    console.error('[getEffectiveUser] getUser exception:', err);
    return null;
  }

  if (!authUser) {
    return null;
  }

  // Check for impersonation session
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (err) {
    console.error('[getEffectiveUser] cookies() error:', err);
    // Continue without impersonation check
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
      isImpersonating: false,
    };
  }
  const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

  if (impersonationCookie) {
    try {
      const session: ImpersonationSession = JSON.parse(impersonationCookie.value);

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        // Session expired, return normal user
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', authUser.id)
            .single();

          if (error) {
            console.error('[getEffectiveUser] expired session user query error:', error);
          }

          const user = userData as unknown as UserRow | null;

          return user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            isImpersonating: false,
          } : {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || null,
            isImpersonating: false,
          };
        } catch (err) {
          console.error('[getEffectiveUser] expired session user query exception:', err);
          return {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || null,
            isImpersonating: false,
          };
        }
      }

      // Verify the admin is actually the one who started impersonation
      if (session.adminId !== authUser.id) {
        // Cookie doesn't belong to this user
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', authUser.id)
            .single();

          if (error) {
            console.error('[getEffectiveUser] wrong admin user query error:', error);
          }

          const user = userData as unknown as UserRow | null;

          return user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            isImpersonating: false,
          } : {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || null,
            isImpersonating: false,
          };
        } catch (err) {
          console.error('[getEffectiveUser] wrong admin user query exception:', err);
          return {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || null,
            isImpersonating: false,
          };
        }
      }

      // Return impersonated user's data
      return {
        id: session.targetUserId,
        email: session.targetEmail,
        name: session.targetName,
        isImpersonating: true,
        realAdminId: session.adminId,
        realAdminEmail: session.adminEmail,
      };
    } catch {
      // Invalid cookie, fall through to normal user
    }
  }

  // No impersonation, return actual user
  // Try direct query first, fall back to auth user data if RLS blocks
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('[getEffectiveUser] user query error:', error);
    }

    const user = userData as unknown as UserRow | null;

    // If user profile exists, use it; otherwise create response from auth data
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isImpersonating: false,
      };
    }
  } catch (err) {
    console.error('[getEffectiveUser] user query exception:', err);
  }

  // Fallback: return auth user data (profile might not exist yet or RLS blocked)
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
    isImpersonating: false,
  };
}

/**
 * Gets just the effective user ID - useful for queries
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const effectiveUser = await getEffectiveUser();
  return effectiveUser?.id || null;
}

/**
 * Checks if current session is impersonating
 */
export async function isImpersonating(): Promise<boolean> {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (err) {
    console.error('[isImpersonating] cookies() error:', err);
    return false;
  }

  const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

  if (!impersonationCookie) {
    return false;
  }

  try {
    const session: ImpersonationSession = JSON.parse(impersonationCookie.value);
    return new Date(session.expiresAt) >= new Date();
  } catch {
    return false;
  }
}
