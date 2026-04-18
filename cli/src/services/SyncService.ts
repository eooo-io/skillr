import fs from 'node:fs/promises';
import path from 'node:path';
import { scanProject, readManifest, writeManifest } from './ManifestService.js';
import { resolve as resolveIncludes } from './SkillCompositionService.js';
import { resolve as resolveTemplates } from './TemplateResolver.js';
import { getDriver } from '../drivers/index.js';
import type { ParsedSkill, ResolvedSkill, FileOutput, Manifest } from '../types.js';

export interface SyncResult {
  provider: string;
  files: FileOutput[];
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
    });
  }

  return { skills: resolved, manifest };
}

/**
 * Resolve skills and generate provider file outputs without any disk I/O.
 * Shared pipeline used by sync (writes) and preview (diffs).
 */
async function generateOutputs(
  projectPath: string,
  variables: Record<string, string>,
  providerFilter?: string,
): Promise<{
  outputs: SyncResult[];
  manifest: Manifest;
  skills: ResolvedSkill[];
}> {
  const { skills, manifest } = await resolveSkills(projectPath, variables);
  const providers = providerFilter ? [providerFilter] : manifest.providers;
  const outputs = providers.map((provider) => ({
    provider,
    files: getDriver(provider).generate(skills, projectPath),
  }));
  return { outputs, manifest, skills };
}

export interface PreviewEntry {
  path: string;
  provider: string;
  current: string | null;
  proposed: string;
  status: 'added' | 'modified' | 'unchanged';
}

/**
 * Sync skills to all enabled providers.
 */
export async function sync(
  projectPath: string,
  variables: Record<string, string> = {},
  providerFilter?: string,
): Promise<SyncResult[]> {
  const { outputs, manifest, skills } = await generateOutputs(projectPath, variables, providerFilter);

  for (const { files } of outputs) {
    for (const file of files) {
      await fs.mkdir(path.dirname(file.path), { recursive: true });
      await fs.writeFile(file.path, file.content);
    }
  }

  manifest.synced_at = new Date().toISOString();
  manifest.skills = skills.map((s) => s.slug);
  await writeManifest(projectPath, manifest);

  return outputs;
}

/**
 * Generate sync preview (dry run) — returns what would change.
 */
export async function preview(
  projectPath: string,
  variables: Record<string, string> = {},
  providerFilter?: string,
): Promise<PreviewEntry[]> {
  const { outputs } = await generateOutputs(projectPath, variables, providerFilter);
  const results: PreviewEntry[] = [];

  for (const { provider, files } of outputs) {
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

  return results;
}
