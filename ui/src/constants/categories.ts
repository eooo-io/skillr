import type { SkillCategory, SkillType } from '@/types'

export interface CategoryOption {
  value: SkillCategory | ''
  label: string
  color: string
}

export const SKILL_CATEGORIES: CategoryOption[] = [
  { value: '', label: 'All', color: '' },
  { value: 'library-api-reference', label: 'Library & API', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'product-verification', label: 'Verification', color: 'bg-green-500/10 text-green-500' },
  { value: 'data-analysis', label: 'Data & Analysis', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'business-automation', label: 'Business Automation', color: 'bg-amber-500/10 text-amber-500' },
  { value: 'scaffolding-templates', label: 'Scaffolding', color: 'bg-cyan-500/10 text-cyan-500' },
  { value: 'code-quality-review', label: 'Code Quality', color: 'bg-red-500/10 text-red-500' },
  { value: 'ci-cd-deployment', label: 'CI/CD', color: 'bg-orange-500/10 text-orange-500' },
  { value: 'incident-runbooks', label: 'Runbooks', color: 'bg-rose-500/10 text-rose-500' },
  { value: 'infrastructure-ops', label: 'Infrastructure', color: 'bg-slate-500/10 text-slate-500' },
  { value: 'general', label: 'General', color: 'bg-muted text-muted-foreground' },
]

export const SKILL_TYPES: { value: SkillType; label: string; description: string }[] = [
  {
    value: 'capability-uplift',
    label: 'Capability Uplift',
    description: 'Teaches something the base model can\'t do or can\'t do consistently',
  },
  {
    value: 'encoded-preference',
    label: 'Encoded Preference',
    description: 'Sequences steps according to your team\'s processes',
  },
]

export function getCategoryOption(value: string | null | undefined): CategoryOption | undefined {
  return SKILL_CATEGORIES.find((c) => c.value === value)
}
