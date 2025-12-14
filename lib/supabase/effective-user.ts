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
  const supabase = await createClient();

  // Get the actual authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // Check for impersonation session
  const cookieStore = await cookies();
  const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

  if (impersonationCookie) {
    try {
      const session: ImpersonationSession = JSON.parse(impersonationCookie.value);

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        // Session expired, return normal user
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', authUser.id)
          .single();

        const user = userData as unknown as UserRow | null;

        return user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          isImpersonating: false,
        } : null;
      }

      // Verify the admin is actually the one who started impersonation
      if (session.adminId !== authUser.id) {
        // Cookie doesn't belong to this user
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', authUser.id)
          .single();

        const user = userData as unknown as UserRow | null;

        return user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          isImpersonating: false,
        } : null;
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
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('id', authUser.id)
    .single();

  const user = userData as unknown as UserRow | null;

  return user ? {
    id: user.id,
    email: user.email,
    name: user.name,
    isImpersonating: false,
  } : null;
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
  const cookieStore = await cookies();
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
