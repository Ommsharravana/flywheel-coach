/**
 * Domain validation for Google OAuth
 * Restricts sign-in to @jkkn.ac.in email addresses only
 */

export const ALLOWED_DOMAIN = 'jkkn.ac.in'

/**
 * Check if an email address belongs to the allowed domain
 */
export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}

/**
 * Get user-friendly error message for domain restriction
 */
export function getDomainErrorMessage(): string {
  return `Only @${ALLOWED_DOMAIN} email addresses are allowed`
}
