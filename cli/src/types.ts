/**
 * Skillr Spec v1 — Core type definitions.
 */

export interface SkillFrontmatter {
  id: string;
  name: string;
  description?: string | null;
  category?: string;
  skill_type?: 'capability-uplift' | 'encoded-preference' | null;
  model?: string | null;
  max_tokens?: number | null;
  tags?: string[];
  tools?: Record<string, unknown>[];
  includes?: string[];
  template_variables?: TemplateVariableDefinition[];
  gotchas?: string | null;
  supplementary_files?: SupplementaryFile[];
  conditions?: SkillConditions | null;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateVariableDefinition {
  name: string;
  description?: string;
  default?: string;
}

export interface SupplementaryFile {
  path: string;
  content: string;
}

export interface SkillConditions {
  file_patterns?: string[];
  path_prefixes?: string[];
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  slug: string;
}

export interface ResolvedSkill {
  slug: string;
  name: string;
  description: string | null;
  body: string;
  category: string;
  skill_type: string | null;
  gotchas: string | null;
  tags: string[];
  conditions: SkillConditions | null;
  supplementary_files: SupplementaryFile[];
}

export interface FileOutput {
  path: string;
  content: string;
}

export interface Manifest {
  spec_version: number;
  id: string;
  name: string;
  description: string;
  providers: string[];
  skills: string[];
  created_at: string;
  synced_at: string | null;
}

export interface LintIssue {
  rule: string;
  severity: 'warning' | 'suggestion';
  message: string;
  suggestion: string;
  line?: number;
}

export interface ProviderDriver {
  readonly name: string;
  readonly slug: string;
  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[];
}

export const VALID_PROVIDERS = [
  'claude',
  'cursor',
  'copilot',
  'windsurf',
  'cline',
  'openai',
  'zed',
  'aider',
  'continue',
  'junie',
] as const;
export type ProviderSlug = typeof VALID_PROVIDERS[number];

export const CATEGORIES = [
  'library-api-reference',
  'product-verification',
  'data-analysis',
  'business-automation',
  'scaffolding-templates',
  'code-quality-review',
  'ci-cd-deployment',
  'incident-runbooks',
  'infrastructure-ops',
  'general',
] as const;
