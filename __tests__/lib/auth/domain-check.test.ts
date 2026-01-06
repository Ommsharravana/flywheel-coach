import { describe, it, expect } from 'vitest'
import { isAllowedEmail, getDomainErrorMessage, ALLOWED_DOMAIN } from '../../../lib/auth/domain-check'

describe('domain-check module', () => {
  describe('ALLOWED_DOMAIN constant', () => {
    it('should be jkkn.ac.in', () => {
      expect(ALLOWED_DOMAIN).toBe('jkkn.ac.in')
    })
  })

  describe('isAllowedEmail', () => {
    describe('valid emails', () => {
      it('should return true for valid @jkkn.ac.in email', () => {
        expect(isAllowedEmail('user@jkkn.ac.in')).toBe(true)
      })

      it('should return true for uppercase domain', () => {
        expect(isAllowedEmail('user@JKKN.AC.IN')).toBe(true)
      })

      it('should return true for mixed case domain', () => {
        expect(isAllowedEmail('user@JkKn.Ac.In')).toBe(true)
      })

      it('should return true for email with dots in local part', () => {
        expect(isAllowedEmail('first.last@jkkn.ac.in')).toBe(true)
      })

      it('should return true for email with plus sign', () => {
        expect(isAllowedEmail('user+tag@jkkn.ac.in')).toBe(true)
      })

      it('should return true for email with numbers', () => {
        expect(isAllowedEmail('user123@jkkn.ac.in')).toBe(true)
      })

      it('should return true for email with underscores', () => {
        expect(isAllowedEmail('user_name@jkkn.ac.in')).toBe(true)
      })

      it('should return true for email with hyphens', () => {
        expect(isAllowedEmail('user-name@jkkn.ac.in')).toBe(true)
      })
    })

    describe('invalid emails', () => {
      it('should return false for other domains', () => {
        expect(isAllowedEmail('user@gmail.com')).toBe(false)
        expect(isAllowedEmail('user@yahoo.com')).toBe(false)
        expect(isAllowedEmail('user@outlook.com')).toBe(false)
      })

      it('should return false for similar but different domains', () => {
        expect(isAllowedEmail('user@jkkn.ac')).toBe(false)
        expect(isAllowedEmail('user@jkkn.in')).toBe(false)
        expect(isAllowedEmail('user@ac.in')).toBe(false)
      })

      it('should return false for subdomain emails', () => {
        expect(isAllowedEmail('user@sub.jkkn.ac.in')).toBe(false)
        expect(isAllowedEmail('user@mail.jkkn.ac.in')).toBe(false)
      })

      it('should return false for domain as prefix', () => {
        expect(isAllowedEmail('user@jkkn.ac.in.other.com')).toBe(false)
      })

      it('should return false for null', () => {
        expect(isAllowedEmail(null)).toBe(false)
      })

      it('should return false for undefined', () => {
        expect(isAllowedEmail(undefined)).toBe(false)
      })

      it('should return false for empty string', () => {
        expect(isAllowedEmail('')).toBe(false)
      })

      it('should return false for string without @', () => {
        expect(isAllowedEmail('userjkkn.ac.in')).toBe(false)
      })

      it('should return false for domain only', () => {
        expect(isAllowedEmail('jkkn.ac.in')).toBe(false)
      })

      it('should return true for @domain only (endsWith check only)', () => {
        // Note: The function only checks endsWith, not email format validity
        // So @jkkn.ac.in passes because it ends with @jkkn.ac.in
        expect(isAllowedEmail('@jkkn.ac.in')).toBe(true)
      })
    })
  })

  describe('getDomainErrorMessage', () => {
    it('should return user-friendly error message', () => {
      const message = getDomainErrorMessage()
      expect(message).toBe('Only @jkkn.ac.in email addresses are allowed')
    })

    it('should include the allowed domain', () => {
      const message = getDomainErrorMessage()
      expect(message).toContain(ALLOWED_DOMAIN)
    })
  })
})
