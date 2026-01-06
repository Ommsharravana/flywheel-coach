import { describe, it, expect } from 'vitest'
import { submitProblemSchema, type SubmitProblemInput } from '../../../lib/validations/problem'

describe('problem validation schemas', () => {
  describe('submitProblemSchema', () => {
    const validInput: SubmitProblemInput = {
      title: 'Test Problem Title',
      problem_statement: 'This is a valid problem statement that is at least 20 characters long.',
      theme: 'education',
    }

    describe('valid inputs', () => {
      it('should accept valid minimal input', () => {
        const result = submitProblemSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should accept input with all optional fields', () => {
        const fullInput: SubmitProblemInput = {
          ...validInput,
          who_affected: 'Students in rural areas',
          when_occurs: 'During exam season',
          where_occurs: 'In classrooms',
          current_workaround: 'Manual tracking on paper',
          severity_rating: '7',
        }
        const result = submitProblemSchema.safeParse(fullInput)
        expect(result.success).toBe(true)
      })

      it('should accept all valid themes', () => {
        const themes = [
          'education',
          'healthcare',
          'agriculture',
          'environment',
          'finance',
          'transportation',
          'communication',
          'governance',
          'retail',
          'manufacturing',
          'other',
        ]

        themes.forEach((theme) => {
          const input = { ...validInput, theme }
          const result = submitProblemSchema.safeParse(input)
          expect(result.success).toBe(true)
        })
      })

      it('should accept title with exactly 200 characters', () => {
        const input = { ...validInput, title: 'a'.repeat(200) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept problem_statement with exactly 20 characters', () => {
        const input = { ...validInput, problem_statement: 'a'.repeat(20) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('title validation', () => {
      it('should reject empty title', () => {
        const input = { ...validInput, title: '' }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Title is required')
        }
      })

      it('should reject title longer than 200 characters', () => {
        const input = { ...validInput, title: 'a'.repeat(201) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Title must be 200 characters or less')
        }
      })

      it('should reject missing title', () => {
        const inputWithoutTitle = { problem_statement: validInput.problem_statement, theme: validInput.theme }
        const result = submitProblemSchema.safeParse(inputWithoutTitle)
        expect(result.success).toBe(false)
      })
    })

    describe('problem_statement validation', () => {
      it('should reject empty problem_statement', () => {
        const input = { ...validInput, problem_statement: '' }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Problem statement is required')
        }
      })

      it('should reject problem_statement shorter than 20 characters', () => {
        const input = { ...validInput, problem_statement: 'Short statement' }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Problem statement must be at least 20 characters')
        }
      })

      it('should reject missing problem_statement', () => {
        const inputWithoutStatement = { title: validInput.title, theme: validInput.theme }
        const result = submitProblemSchema.safeParse(inputWithoutStatement)
        expect(result.success).toBe(false)
      })
    })

    describe('theme validation', () => {
      it('should reject invalid theme', () => {
        const input = { ...validInput, theme: 'invalid-theme' }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject missing theme', () => {
        const inputWithoutTheme = { title: validInput.title, problem_statement: validInput.problem_statement }
        const result = submitProblemSchema.safeParse(inputWithoutTheme)
        expect(result.success).toBe(false)
      })
    })

    describe('optional fields validation', () => {
      it('should accept undefined optional fields', () => {
        const result = submitProblemSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should accept empty string for optional fields', () => {
        const input = {
          ...validInput,
          who_affected: '',
          when_occurs: '',
          where_occurs: '',
          current_workaround: '',
          severity_rating: '',
        }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject who_affected longer than 200 characters', () => {
        const input = { ...validInput, who_affected: 'a'.repeat(201) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject when_occurs longer than 200 characters', () => {
        const input = { ...validInput, when_occurs: 'a'.repeat(201) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject where_occurs longer than 200 characters', () => {
        const input = { ...validInput, where_occurs: 'a'.repeat(201) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject current_workaround longer than 1000 characters', () => {
        const input = { ...validInput, current_workaround: 'a'.repeat(1001) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should accept current_workaround with exactly 1000 characters', () => {
        const input = { ...validInput, current_workaround: 'a'.repeat(1000) }
        const result = submitProblemSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('type inference', () => {
      it('should correctly infer type from schema', () => {
        const result = submitProblemSchema.safeParse(validInput)
        if (result.success) {
          const data: SubmitProblemInput = result.data
          expect(data.title).toBe(validInput.title)
          expect(data.problem_statement).toBe(validInput.problem_statement)
          expect(data.theme).toBe(validInput.theme)
        }
      })
    })
  })
})
