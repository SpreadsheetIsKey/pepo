import { createClient } from '@/lib/supabase/server'

export interface CategorizationRule {
  id: string
  pattern: string
  pattern_type: 'contains' | 'regex' | 'exact'
  case_sensitive: boolean
  main_category: string
  sub_category: string
  confidence: number
  priority: number
}

export interface CategorizationResult {
  main_category: string
  sub_category: string
  confidence: number
  matched_rule_id?: string
  matched_pattern?: string
}

/**
 * Test if a pattern matches a description
 */
function testPattern(
  description: string,
  pattern: string,
  patternType: 'contains' | 'regex' | 'exact',
  caseSensitive: boolean
): boolean {
  const desc = caseSensitive ? description : description.toUpperCase()
  const pat = caseSensitive ? pattern : pattern.toUpperCase()

  switch (patternType) {
    case 'exact':
      return desc === pat

    case 'contains':
      return desc.includes(pat)

    case 'regex':
      try {
        const flags = caseSensitive ? 'g' : 'gi'
        const regex = new RegExp(pattern, flags)
        return regex.test(description)
      } catch (error) {
        console.error('Invalid regex pattern:', pattern, error)
        return false
      }

    default:
      return false
  }
}

/**
 * Categorize a transaction description using rules
 * @param description - Transaction description to categorize
 * @param userId - User ID for fetching user-specific rules
 * @returns Categorization result with category and confidence, or null if no match
 */
export async function categorizeTransaction(
  description: string,
  userId: string
): Promise<CategorizationResult | null> {
  const supabase = await createClient()

  // Fetch all active rules for this user (system + user-specific), ordered by priority
  const { data: rules, error } = await supabase
    .from('categorization_rules')
    .select('id, pattern, pattern_type, case_sensitive, main_category, sub_category, confidence, priority')
    .eq('is_active', true)
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order('priority', { ascending: true })
    .order('confidence', { ascending: false })

  if (error) {
    console.error('Error fetching categorization rules:', error)
    return null
  }

  if (!rules || rules.length === 0) {
    return null
  }

  // Test each rule against the description
  for (const rule of rules) {
    const matches = testPattern(
      description,
      rule.pattern,
      rule.pattern_type as 'contains' | 'regex' | 'exact',
      rule.case_sensitive
    )

    if (matches) {
      // Found a match! Return the category
      return {
        main_category: rule.main_category,
        sub_category: rule.sub_category,
        confidence: rule.confidence,
        matched_rule_id: rule.id,
        matched_pattern: rule.pattern,
      }
    }
  }

  // No matching rule found
  return null
}

/**
 * Categorize multiple transactions in batch
 */
export async function categorizeTransactions(
  transactions: Array<{ description: string }>,
  userId: string
): Promise<Array<CategorizationResult | null>> {
  // For now, categorize one by one
  // In the future, this could be optimized to fetch rules once and reuse
  const results: Array<CategorizationResult | null> = []

  for (const transaction of transactions) {
    const result = await categorizeTransaction(transaction.description, userId)
    results.push(result)
  }

  return results
}

/**
 * Update rule match count (called after successful categorization)
 */
export async function updateRuleMatchCount(ruleId: string): Promise<void> {
  const supabase = await createClient()

  await supabase.rpc('increment_rule_match_count', { rule_id: ruleId })
}
