import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encrypt, decrypt, isEncryptionConfigured } from '../../../lib/byos/encryption'

describe('encryption module', () => {
  const originalEnv = process.env.CREDENTIAL_ENCRYPTION_KEY

  beforeEach(() => {
    // Set a valid 64-character hex key (32 bytes)
    process.env.CREDENTIAL_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  })

  afterEach(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = originalEnv
  })

  describe('encrypt', () => {
    it('should encrypt a string and return formatted ciphertext', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encrypt(plaintext)

      // Should have format: iv:authTag:ciphertext
      expect(encrypted.split(':')).toHaveLength(3)
    })

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const plaintext = 'Same text'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should encrypt empty strings', () => {
      const encrypted = encrypt('')
      expect(encrypted.split(':')).toHaveLength(3)
    })

    it('should encrypt long strings', () => {
      const longText = 'a'.repeat(10000)
      const encrypted = encrypt(longText)
      expect(encrypted.split(':')).toHaveLength(3)
    })

    it('should encrypt special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~'
      const encrypted = encrypt(specialChars)
      expect(encrypted.split(':')).toHaveLength(3)
    })

    it('should encrypt unicode characters', () => {
      const unicode = 'Hello World!'
      const encrypted = encrypt(unicode)
      expect(encrypted.split(':')).toHaveLength(3)
    })

    it('should throw error when encryption key is not set', () => {
      delete process.env.CREDENTIAL_ENCRYPTION_KEY
      expect(() => encrypt('test')).toThrow('CREDENTIAL_ENCRYPTION_KEY environment variable is not set')
    })

    it('should throw error when encryption key is wrong length', () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = '0123456789abcdef'
      expect(() => encrypt('test')).toThrow('CREDENTIAL_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    })
  })

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should decrypt empty strings', () => {
      const encrypted = encrypt('')
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe('')
    })

    it('should decrypt long strings', () => {
      const longText = 'a'.repeat(10000)
      const encrypted = encrypt(longText)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(longText)
    })

    it('should decrypt special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~'
      const encrypted = encrypt(specialChars)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(specialChars)
    })

    it('should decrypt unicode characters', () => {
      const unicode = 'Hello World!'
      const encrypted = encrypt(unicode)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(unicode)
    })

    it('should throw error for invalid format (wrong number of parts)', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid encrypted text format')
      expect(() => decrypt('part1:part2')).toThrow('Invalid encrypted text format')
      expect(() => decrypt('part1:part2:part3:part4')).toThrow('Invalid encrypted text format')
    })

    it('should throw error for invalid IV length', () => {
      // IV should be 32 hex chars (16 bytes), using shorter one
      const invalidIV = '0123456789abcdef' // 16 hex chars = 8 bytes
      const authTag = '0123456789abcdef0123456789abcdef' // 32 hex chars = 16 bytes
      const ciphertext = 'abcdef'
      expect(() => decrypt(`${invalidIV}:${authTag}:${ciphertext}`)).toThrow('Invalid IV length')
    })

    it('should throw error for invalid auth tag length', () => {
      const validIV = '0123456789abcdef0123456789abcdef' // 32 hex chars = 16 bytes
      const invalidAuthTag = '0123456789abcdef' // 16 hex chars = 8 bytes
      const ciphertext = 'abcdef'
      expect(() => decrypt(`${validIV}:${invalidAuthTag}:${ciphertext}`)).toThrow('Invalid auth tag length')
    })

    it('should throw error when decrypting with wrong key', () => {
      const plaintext = 'Secret data'
      const encrypted = encrypt(plaintext)

      // Change the key
      process.env.CREDENTIAL_ENCRYPTION_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'

      expect(() => decrypt(encrypted)).toThrow()
    })
  })

  describe('isEncryptionConfigured', () => {
    it('should return true when valid encryption key is set', () => {
      expect(isEncryptionConfigured()).toBe(true)
    })

    it('should return false when encryption key is not set', () => {
      delete process.env.CREDENTIAL_ENCRYPTION_KEY
      expect(isEncryptionConfigured()).toBe(false)
    })

    it('should return false when encryption key is wrong length', () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = '0123456789abcdef'
      expect(isEncryptionConfigured()).toBe(false)
    })

    it('should return false when encryption key is empty', () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = ''
      expect(isEncryptionConfigured()).toBe(false)
    })
  })

  describe('encrypt/decrypt roundtrip', () => {
    const testCases = [
      'Simple text',
      '',
      'A',
      '!@#$%^&*()',
      'Unicode: cafe',
      JSON.stringify({ key: 'value', nested: { data: [1, 2, 3] } }),
      'Multi\nline\ntext',
      '\t\tTabbed content',
      'Quotes: "double" and \'single\'',
      'Backslash: \\path\\to\\file',
    ]

    testCases.forEach((testCase) => {
      it(`should roundtrip: "${testCase.substring(0, 30)}..."`, () => {
        const encrypted = encrypt(testCase)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(testCase)
      })
    })
  })
})
