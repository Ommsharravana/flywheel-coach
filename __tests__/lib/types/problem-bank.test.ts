import { describe, it, expect } from 'vitest'
import {
  getSeverityLabel,
  getSeverityColor,
  formatDesperateUserScore,
  isHighPotentialProblem,
  type ProblemBankEntry,
} from '../../../lib/types/problem-bank'

describe('problem-bank utility functions', () => {
  describe('getSeverityLabel', () => {
    it('should return "Unknown" for null', () => {
      expect(getSeverityLabel(null)).toBe('Unknown')
    })

    it('should return "Low" for ratings 1-3', () => {
      expect(getSeverityLabel(1)).toBe('Low')
      expect(getSeverityLabel(2)).toBe('Low')
      expect(getSeverityLabel(3)).toBe('Low')
    })

    it('should return "Medium" for ratings 4-6', () => {
      expect(getSeverityLabel(4)).toBe('Medium')
      expect(getSeverityLabel(5)).toBe('Medium')
      expect(getSeverityLabel(6)).toBe('Medium')
    })

    it('should return "High" for ratings 7-8', () => {
      expect(getSeverityLabel(7)).toBe('High')
      expect(getSeverityLabel(8)).toBe('High')
    })

    it('should return "Critical" for ratings 9-10', () => {
      expect(getSeverityLabel(9)).toBe('Critical')
      expect(getSeverityLabel(10)).toBe('Critical')
    })

    it('should handle edge case of 0', () => {
      expect(getSeverityLabel(0)).toBe('Low')
    })
  })

  describe('getSeverityColor', () => {
    it('should return gray for null', () => {
      expect(getSeverityColor(null)).toBe('text-gray-400')
    })

    it('should return green for low severity (1-3)', () => {
      expect(getSeverityColor(1)).toBe('text-green-500')
      expect(getSeverityColor(2)).toBe('text-green-500')
      expect(getSeverityColor(3)).toBe('text-green-500')
    })

    it('should return yellow for medium severity (4-6)', () => {
      expect(getSeverityColor(4)).toBe('text-yellow-500')
      expect(getSeverityColor(5)).toBe('text-yellow-500')
      expect(getSeverityColor(6)).toBe('text-yellow-500')
    })

    it('should return orange for high severity (7-8)', () => {
      expect(getSeverityColor(7)).toBe('text-orange-500')
      expect(getSeverityColor(8)).toBe('text-orange-500')
    })

    it('should return red for critical severity (9-10)', () => {
      expect(getSeverityColor(9)).toBe('text-red-500')
      expect(getSeverityColor(10)).toBe('text-red-500')
    })

    it('should handle edge case of 0', () => {
      expect(getSeverityColor(0)).toBe('text-green-500')
    })
  })

  describe('formatDesperateUserScore', () => {
    it('should return "Not assessed" for null', () => {
      expect(formatDesperateUserScore(null)).toBe('Not assessed')
    })

    it('should format score as "X/5 criteria met"', () => {
      expect(formatDesperateUserScore(0)).toBe('0/5 criteria met')
      expect(formatDesperateUserScore(1)).toBe('1/5 criteria met')
      expect(formatDesperateUserScore(2)).toBe('2/5 criteria met')
      expect(formatDesperateUserScore(3)).toBe('3/5 criteria met')
      expect(formatDesperateUserScore(4)).toBe('4/5 criteria met')
      expect(formatDesperateUserScore(5)).toBe('5/5 criteria met')
    })
  })

  describe('isHighPotentialProblem', () => {
    const createMockProblem = (
      overrides: Partial<ProblemBankEntry> = {}
    ): ProblemBankEntry => ({
      id: '1',
      original_cycle_id: null,
      source_type: 'manual',
      source_year: 2024,
      source_event: null,
      title: 'Test Problem',
      problem_statement: 'Test statement',
      theme: 'education',
      sub_theme: null,
      who_affected: null,
      when_occurs: null,
      where_occurs: null,
      frequency: null,
      severity_rating: null,
      current_workaround: null,
      validation_status: 'unvalidated',
      users_interviewed: 0,
      desperate_user_count: 0,
      desperate_user_score: null,
      institution_id: null,
      department: null,
      submitted_by: null,
      status: 'open',
      approval_status: 'approved',
      is_open_for_attempts: true,
      industry_partner_name: null,
      industry_partner_email: null,
      industry_partner_company: null,
      industry_partner_phone: null,
      budget_amount: null,
      budget_currency: 'INR',
      claimed_by_team_id: null,
      claimed_at: null,
      best_solution_cycle_id: null,
      best_solution_url: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      metadata: {},
      ...overrides,
    })

    it('should return true for desperate_user_confirmed validation status', () => {
      const problem = createMockProblem({
        validation_status: 'desperate_user_confirmed',
      })
      expect(isHighPotentialProblem(problem)).toBe(true)
    })

    it('should return true for market_validated validation status', () => {
      const problem = createMockProblem({
        validation_status: 'market_validated',
      })
      expect(isHighPotentialProblem(problem)).toBe(true)
    })

    it('should return true for desperate_user_score >= 3', () => {
      expect(isHighPotentialProblem(createMockProblem({ desperate_user_score: 3 }))).toBe(true)
      expect(isHighPotentialProblem(createMockProblem({ desperate_user_score: 4 }))).toBe(true)
      expect(isHighPotentialProblem(createMockProblem({ desperate_user_score: 5 }))).toBe(true)
    })

    it('should return true for severity_rating >= 7', () => {
      expect(isHighPotentialProblem(createMockProblem({ severity_rating: 7 }))).toBe(true)
      expect(isHighPotentialProblem(createMockProblem({ severity_rating: 8 }))).toBe(true)
      expect(isHighPotentialProblem(createMockProblem({ severity_rating: 9 }))).toBe(true)
      expect(isHighPotentialProblem(createMockProblem({ severity_rating: 10 }))).toBe(true)
    })

    it('should return false for unvalidated problems with low scores', () => {
      const problem = createMockProblem({
        validation_status: 'unvalidated',
        desperate_user_score: 2,
        severity_rating: 5,
      })
      expect(isHighPotentialProblem(problem)).toBe(false)
    })

    it('should return false for user_tested with low scores', () => {
      const problem = createMockProblem({
        validation_status: 'user_tested',
        desperate_user_score: 1,
        severity_rating: 3,
      })
      expect(isHighPotentialProblem(problem)).toBe(false)
    })

    it('should return false for null scores without validated status', () => {
      const problem = createMockProblem({
        validation_status: 'unvalidated',
        desperate_user_score: null,
        severity_rating: null,
      })
      expect(isHighPotentialProblem(problem)).toBe(false)
    })

    it('should handle edge cases for scores', () => {
      // Score of 2 should return false
      expect(isHighPotentialProblem(createMockProblem({ desperate_user_score: 2 }))).toBe(false)
      // Severity of 6 should return false
      expect(isHighPotentialProblem(createMockProblem({ severity_rating: 6 }))).toBe(false)
    })

    it('should prioritize validation status over scores', () => {
      // Even with low scores, validated status should return true
      const problem = createMockProblem({
        validation_status: 'desperate_user_confirmed',
        desperate_user_score: 0,
        severity_rating: 1,
      })
      expect(isHighPotentialProblem(problem)).toBe(true)
    })
  })
})
