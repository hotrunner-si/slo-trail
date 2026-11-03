import { z } from 'zod'

// Account labels are private, non-unique and never confer roles or publish runner profiles.
export const brainAccountName = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[^\p{Cc}\p{Cf}]+$/u)
