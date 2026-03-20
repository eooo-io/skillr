import fs from 'node:fs/promises';
import path from 'node:path';
import { hasSkillrDir, writeSkillFile, readManifest, writeManifest, slugify } from '../services/ManifestService.js';
import { parseContent } from '../services/SkillFileParser.js';
import type { SkillFrontmatter } from '../types.js';
import * as ui from '../ui.js';

interface DetectedSkill {
  name: string;
  body: string;
  source: string;
}

/**
 * Detect skills from existing provider config files.
 */
async function detectSkills(projectPath: string): Promise<DetectedSkill[]> {
  const detected: DetectedSkill[] = [];

  // Claude: .claude/CLAUDE.md — split by H2
  await detectFromH2File(path.join(projectPath, '.claude', 'CLAUDE.md'), 'claude', detected);

  // Copilot: .github/copilot-instructions.md — split by H2
  await detectFromH2File(path.join(projectPath, '.github', 'copilot-instructions.md'), 'copilot', detected);

  // Cline: .clinerules — split by H2
  await detectFromH2File(path.join(projectPath, '.clinerules'), 'cline', detected);

  // OpenAI: .openai/instructions.md — split by H2
  await detectFromH2File(path.join(projectPath, '.openai', 'instructions.md'), 'openai', detected);

  // Cursor: .cursor/rules/*.mdc — one per file
  await detectFromDirectory(path.join(projectPath, '.cursor', 'rules'), '.mdc', 'cursor', detected);

  // Windsurf: .windsurf/rules/*.md — one per file
  await detectFromDirectory(path.join(projectPath, '.windsurf', 'rules'), '.md', 'windsurf', detected);

  return detected;
}

async function detectFromH2File(
  filePath: string,
  source: string,
  detected: DetectedSkill[],
): Promise<void> {
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch {
    return;
  }

  const sections = content.split(/^## /m).slice(1);
  for (const section of sections) {
    const newlineIdx = section.indexOf('\n');
    if (newlineIdx === -1) continue;
    const name = section.slice(0, newlineIdx).trim();
    let body = section.slice(newlineIdx + 1).trim();
    // Remove trailing ---
    body = body.replace(/\n---\s*$/, '').trim();
    if (name && body) {
      detected.push({ name, body, source });
    }
  }
}

async function detectFromDirectory(
  dirPath: string,
  ext: string,
  source: string,
  detected: DetectedSkill[],
): Promise<void> {
  let files: string[];
  try {
    files = await fs.readdir(dirPath);
  } catch {
    return;
  }

  for (const file of files) {
    if (!file.endsWith(ext)) continue;

    const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
    const { frontmatter, body } = parseContent(content);
    const name = (frontmatter as any).description || file.replace(ext, '').replace(/-/g, ' ');

    if (body) {
      detected.push({ name, body, source });
    }
  }
}

export async function importCommand(): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  ui.thinking('Scanning for existing provider configs...');

  const detected = await detectSkills(projectPath);

  if (detected.length === 0) {
    ui.confused('No provider configs found to import.');
    return;
  }

  ui.success(`Found ${detected.length} skill(s) in provider configs:`);
  ui.blank();

  for (const skill of detected) {
    ui.info(`  ${skill.name} (from ${skill.source})`);
  }

  ui.blank();
  ui.working(`Importing ${detected.length} skill(s)...`);

  const manifest = await readManifest(projectPath);
  let imported = 0;

  for (const skill of detected) {
    const slug = slugify(skill.name);

    // Skip if skill already exists
    if (manifest.skills.includes(slug)) {
      ui.info(`  Skipped: ${slug} (already exists)`);
      continue;
    }

    const now = new Date().toISOString();
    const frontmatter: SkillFrontmatter = {
      id: slug,
      name: skill.name,
      description: null,
      category: 'general',
      tags: [],
      tools: [],
      includes: [],
      template_variables: [],
      created_at: now,
      updated_at: now,
    };

    await writeSkillFile(projectPath, frontmatter, skill.body);
    manifest.skills.push(slug);
    imported++;

    ui.info(`  Imported: ${slug}`);
  }

  await writeManifest(projectPath, manifest);

  ui.blank();
  ui.success(`Imported ${imported} skill(s). Run \`skillr sync\` to sync them back.`);
}
