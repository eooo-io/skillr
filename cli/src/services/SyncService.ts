import fs from 'node:fs/promises';
import path from 'node:path';
import { scanProject, readManifest, writeManifest } from './ManifestService.js';
import { resolve as resolveIncludes } from './SkillCompositionService.js';
import { resolve as resolveTemplates } from './TemplateResolver.js';
import { evaluateConditions } from './ConditionEvaluator.js';
import { getDriver, loadPlugins } from '../drivers/index.js';
import type { ParsedSkill, ResolvedSkill, FileOutput, Manifest } from '../types.js';

export interface SyncResult {
  provider: string;
  files: FileOutput[];
  error?: string;
}

export interface SkippedSkill {
  slug: string;
  reason: string;
}

export interface SyncRunResult {
  results: SyncResult[];
  skipped: SkippedSkill[];
}

/**
 * Build resolved skills from a project directory.
 */
export async function resolveSkills(
  projectPath: string,
  variables: Record<string, string> = {},
): Promise<{ skills: ResolvedSkill[]; manifest: Manifest }> {
  const { manifest, skills } = await scanProject(projectPath);

  if (!manifest) {
    throw new Error('No .skillr/manifest.json found. Run `skillr init` first.');
  }

  // Build lookup map
  const skillMap = new Map<string, ParsedSkill>();
  for (const skill of skills) {
    skillMap.set(skill.slug, skill);
  }

  // Resolve each skill
  const resolved: ResolvedSkill[] = [];
  for (const skill of skills) {
    // Resolve includes
    let body = resolveIncludes(skill, skillMap);

    // Build variable values: defaults + overrides
    const vars: Record<string, string> = {};
    for (const def of skill.frontmatter.template_variables ?? []) {
      if (def.default != null) {
        vars[def.name] = def.default;
      }
    }
    Object.assign(vars, variables);

    // Resolve templates
    if (Object.keys(vars).length > 0) {
      body = resolveTemplates(body, vars);
    }

    resolved.push({
      slug: skill.slug,
      name: skill.frontmatter.name,
      description: skill.frontmatter.description ?? null,
      body,
      category: skill.frontmatter.category ?? 'general',
      skill_type: skill.frontmatter.skill_type ?? null,
      gotchas: skill.frontmatter.gotchas ?? null,
      tags: skill.frontmatter.tags ?? [],
      conditions: skill.frontmatter.conditions ?? null,
      supplementary_files: skill.frontmatter.supplementary_files ?? [],
    });
  }

  return { skills: resolved, manifest };
}

/**
 * Resolve skills and generate provider file outputs without any disk I/O.
 * Shared pipeline used by sync (writes) and preview (diffs).
 *
 * Skills whose `conditions` aren't met for the current project are filtered
 * out (unless `force=true`) and reported via `skipped`.
 *
 * Each provider is generated inside its own try/catch so one failing driver
 * doesn't block the rest; the failure is reported via `outputs[i].error`.
 */
async function generateOutputs(
  projectPath: string,
  variables: Record<string, string>,
  providerFilter?: string,
  force = false,
): Promise<{
  outputs: SyncResult[];
  manifest: Manifest;
  skills: ResolvedSkill[];
  skipped: SkippedSkill[];
}> {
  await loadPlugins(projectPath);
  const { skills: allSkills, manifest } = await resolveSkills(projectPath, variables);

  const skills: ResolvedSkill[] = [];
  const skipped: SkippedSkill[] = [];
  for (const skill of allSkills) {
    if (force || !skill.conditions) {
      skills.push(skill);
      continue;
    }
    const result = await evaluateConditions(skill.conditions, projectPath);
    if (result.passed) {
      skills.push(skill);
    } else {
      skipped.push({ slug: skill.slug, reason: result.reason });
    }
  }

  const providers = providerFilter ? [providerFilter] : manifest.providers;
  const outputs: SyncResult[] = providers.map((provider) => {
    try {
      return { provider, files: getDriver(provider).generate(skills, projectPath) };
    } catch (err) {
      return { provider, files: [], error: (err as Error).message };
    }
  });

  return { outputs, manifest, skills, skipped };
}

export interface PreviewEntry {
  path: string;
  provider: string;
  current: string | null;
  proposed: string;
  status: 'added' | 'modified' | 'unchanged';
}

export interface SyncOptions {
  force?: boolean;
}

/**
 * Sync skills to all enabled providers.
 *
 * Returns { results, skipped } where `results[i].error` is set if that
 * provider's driver threw during generation — other providers still sync.
 */
export async function sync(
  projectPath: string,
  variables: Record<string, string> = {},
  providerFilter?: string,
  options: SyncOptions = {},
): Promise<SyncRunResult> {
  const { outputs, manifest, skills, skipped } = await generateOutputs(
    projectPath,
    variables,
    providerFilter,
    options.force,
  );

  for (const { files, error } of outputs) {
    if (error) continue;
    for (const file of files) {
      await fs.mkdir(path.dirname(file.path), { recursive: true });
      await fs.writeFile(file.path, file.content);
    }
  }

  const anyFailed = outputs.some((o) => o.error);
  if (!anyFailed) {
    manifest.synced_at = new Date().toISOString();
    manifest.skills = skills.map((s) => s.slug);
    await writeManifest(projectPath, manifest);
  }

  return { results: outputs, skipped };
}

export interface PreviewRunResult {
  results: PreviewEntry[];
  skipped: SkippedSkill[];
  errors: Array<{ provider: string; error: string }>;
}

/**
 * Generate sync preview (dry run) — returns what would change.
 */
export async function preview(
  projectPath: string,
  variables: Record<string, string> = {},
  providerFilter?: string,
  options: SyncOptions = {},
): Promise<PreviewRunResult> {
  const { outputs, skipped } = await generateOutputs(projectPath, variables, providerFilter, options.force);
  const results: PreviewEntry[] = [];
  const errors: Array<{ provider: string; error: string }> = [];

  for (const { provider, files, error } of outputs) {
    if (error) {
      errors.push({ provider, error });
      continue;
    }
    for (const file of files) {
      let current: string | null = null;
      try {
        current = await fs.readFile(file.path, 'utf-8');
      } catch {
        // File doesn't exist
      }

      let status: PreviewEntry['status'];
      if (current === null) {
        status = 'added';
      } else if (current === file.content) {
        status = 'unchanged';
      } else {
        status = 'modified';
      }

      results.push({ path: file.path, provider, current, proposed: file.content, status });
    }
  }

  return { results, skipped, errors };
}
