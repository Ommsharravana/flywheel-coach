import { z } from 'zod'

// Problem themes enum from types
const problemThemes = [
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
] as const

export const submitProblemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  problem_statement: z
    .string()
    .min(1, 'Problem statement is required')
    .min(20, 'Problem statement must be at least 20 characters'),
  theme: z.enum(problemThemes),
  who_affected: z.string().max(200).optional(),
  when_occurs: z.string().max(200).optional(),
  where_occurs: z.string().max(200).optional(),
  current_workaround: z.string().max(1000).optional(),
  severity_rating: z.string().optional(),
})

export type SubmitProblemInput = z.infer<typeof submitProblemSchema>
