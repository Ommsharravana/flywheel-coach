import { describe, it, expect } from 'vitest'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from '../../../lib/validations/user'

describe('user validation schemas', () => {
  describe('createUserSchema', () => {
    const validInput: CreateUserInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'builder',
    }

    describe('valid inputs', () => {
      it('should accept valid input', () => {
        const result = createUserSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should accept all valid roles', () => {
        const roles = ['builder', 'admin', 'event_admin', 'institution_admin', 'superadmin']

        roles.forEach((role) => {
          const input = { ...validInput, role }
          const result = createUserSchema.safeParse(input)
          expect(result.success).toBe(true)
        })
      })

      it('should accept name with exactly 1 character', () => {
        const input = { ...validInput, name: 'J' }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept name with exactly 100 characters', () => {
        const input = { ...validInput, name: 'a'.repeat(100) }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept password with exactly 6 characters', () => {
        const input = { ...validInput, password: '123456' }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('name validation', () => {
      it('should reject empty name', () => {
        const input = { ...validInput, name: '' }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Name is required')
        }
      })

      it('should reject name longer than 100 characters', () => {
        const input = { ...validInput, name: 'a'.repeat(101) }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Name is too long')
        }
      })

      it('should reject missing name', () => {
        const inputWithoutName = { email: validInput.email, password: validInput.password, role: validInput.role }
        const result = createUserSchema.safeParse(inputWithoutName)
        expect(result.success).toBe(false)
      })
    })

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'spaces in@email.com',
          'email@',
        ]

        invalidEmails.forEach((email) => {
          const input = { ...validInput, email }
          const result = createUserSchema.safeParse(input)
          expect(result.success).toBe(false)
        })
      })

      it('should accept valid email formats', () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.com',
          'user@subdomain.example.com',
          'user123@example.co.uk',
        ]

        validEmails.forEach((email) => {
          const input = { ...validInput, email }
          const result = createUserSchema.safeParse(input)
          expect(result.success).toBe(true)
        })
      })

      it('should reject missing email', () => {
        const inputWithoutEmail = { name: validInput.name, password: validInput.password, role: validInput.role }
        const result = createUserSchema.safeParse(inputWithoutEmail)
        expect(result.success).toBe(false)
      })
    })

    describe('password validation', () => {
      it('should reject password shorter than 6 characters', () => {
        const input = { ...validInput, password: '12345' }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Password must be at least 6 characters')
        }
      })

      it('should reject empty password', () => {
        const input = { ...validInput, password: '' }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing password', () => {
        const inputWithoutPassword = { name: validInput.name, email: validInput.email, role: validInput.role }
        const result = createUserSchema.safeParse(inputWithoutPassword)
        expect(result.success).toBe(false)
      })
    })

    describe('role validation', () => {
      it('should reject invalid role', () => {
        const input = { ...validInput, role: 'invalid_role' }
        const result = createUserSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing role', () => {
        const inputWithoutRole = { name: validInput.name, email: validInput.email, password: validInput.password }
        const result = createUserSchema.safeParse(inputWithoutRole)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('updateUserSchema', () => {
    const validInput: UpdateUserInput = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'admin',
      user_category: 'senior_learner',
    }

    describe('valid inputs', () => {
      it('should accept valid input', () => {
        const result = updateUserSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should accept all valid roles', () => {
        const roles = ['builder', 'admin', 'event_admin', 'institution_admin', 'superadmin']

        roles.forEach((role) => {
          const input = { ...validInput, role }
          const result = updateUserSchema.safeParse(input)
          expect(result.success).toBe(true)
        })
      })

      it('should accept all valid user categories', () => {
        const categories = ['learner', 'senior_learner']

        categories.forEach((user_category) => {
          const input = { ...validInput, user_category }
          const result = updateUserSchema.safeParse(input)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('name validation', () => {
      it('should reject empty name', () => {
        const input = { ...validInput, name: '' }
        const result = updateUserSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Name is required')
        }
      })

      it('should reject name longer than 100 characters', () => {
        const input = { ...validInput, name: 'a'.repeat(101) }
        const result = updateUserSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Name is too long')
        }
      })
    })

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const input = { ...validInput, email: 'invalid-email' }
        const result = updateUserSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid email address')
        }
      })
    })

    describe('role validation', () => {
      it('should reject invalid role', () => {
        const input = { ...validInput, role: 'invalid_role' }
        const result = updateUserSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    describe('user_category validation', () => {
      it('should reject invalid user_category', () => {
        const input = { ...validInput, user_category: 'invalid_category' }
        const result = updateUserSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing user_category', () => {
        const inputWithoutCategory = { name: validInput.name, email: validInput.email, role: validInput.role }
        const result = updateUserSchema.safeParse(inputWithoutCategory)
        expect(result.success).toBe(false)
      })
    })

    describe('differences from createUserSchema', () => {
      it('should not require password field', () => {
        // updateUserSchema does not have password field
        const result = updateUserSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should require user_category field (unlike create)', () => {
        const inputWithoutCategory = { name: validInput.name, email: validInput.email, role: validInput.role }
        const result = updateUserSchema.safeParse(inputWithoutCategory)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('type inference', () => {
    it('should correctly infer CreateUserInput type', () => {
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'builder' as const,
      }
      const result = createUserSchema.safeParse(input)
      if (result.success) {
        const data: CreateUserInput = result.data
        expect(data.name).toBe(input.name)
        expect(data.email).toBe(input.email)
        expect(data.password).toBe(input.password)
        expect(data.role).toBe(input.role)
      }
    })

    it('should correctly infer UpdateUserInput type', () => {
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin' as const,
        user_category: 'learner' as const,
      }
      const result = updateUserSchema.safeParse(input)
      if (result.success) {
        const data: UpdateUserInput = result.data
        expect(data.name).toBe(input.name)
        expect(data.email).toBe(input.email)
        expect(data.role).toBe(input.role)
        expect(data.user_category).toBe(input.user_category)
      }
    })
  })
})
