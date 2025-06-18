/**
 * Utility functions for generating insight prompts and managing 5 Whys data
 */

export const INSIGHT_PROMPTS = [
  "What is this really about?",
  "What assumptions am I making?",
  "What haven't I tested yet?",
  "If I ignored what I know, where would I start?",
  "What's the smallest step I could take?",
  "What's one question I'm avoiding?",
  "What if I had no fear around this?",
  "Why do I care about this right now?",
  "What would I say to a friend in the same spot?",
  "What's true but uncomfortable here?"
] as const

/**
 * Get a random insight prompt from the predefined list
 */
export function getRandomPrompt(): string {
  const randomIndex = Math.floor(Math.random() * INSIGHT_PROMPTS.length)
  return INSIGHT_PROMPTS[randomIndex]
}

/**
 * Interface for 5 Whys responses
 */
export interface FiveWhysData {
  why1: string
  why2: string
  why3: string
  why4: string
  why5: string
}

/**
 * Create an empty 5 Whys data structure
 */
export function createEmptyFiveWhys(): FiveWhysData {
  return {
    why1: "",
    why2: "",
    why3: "",
    why4: "",
    why5: ""
  }
}

/**
 * Check if any of the 5 Whys fields have content
 */
export function hasFiveWhysContent(data: FiveWhysData): boolean {
  return Object.values(data).some(value => value.trim().length > 0)
}