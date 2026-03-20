import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { v4 as uuidv4 } from 'uuid';
import { parseContent, parseSkillContent, renderFile, slugify } from './SkillFileParser.js';
import type { Manifest, ParsedSkill, SkillFrontmatter } from '../types.js';

/**
 * Scan a project's .skillr/ directory and return manifest + parsed skills.
 */
export async function scanProject(projectPath: string): Promise<{
  manifest: Manifest | null;
  skills: ParsedSkill[];
}> {
  const skillrDir = path.join(projectPath, '.skillr');
  let manifest: Manifest | null = null;
  const skills: ParsedSkill[] = [];

  // Read manifest
  const manifestPath = path.join(skillrDir, 'manifest.json');
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw) as Manifest;
  } catch {
    // No manifest
  }

  const skillsDir = path.join(skillrDir, 'skills');

  try {
    await fs.access(skillsDir);
  } catch {
    return { manifest, skills };
  }

  // Flat files: *.md
  const flatFiles = await fg('*.md', { cwd: skillsDir, absolute: true });
  for (const file of flatFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const filename = path.basename(file);
    skills.push(parseSkillContent(content, filename));
  }

  // Folder-based: */skill.md
  const folderFiles = await fg('*/skill.md', { cwd: skillsDir, absolute: true });
  for (const file of folderFiles) {
    const dir = path.dirname(file);
    const content = await fs.readFile(file, 'utf-8');
    const slug = path.basename(dir);
    const skill = parseSkillContent(content, `${slug}.md`);

    // Read gotchas.md if it exists
    const gotchasPath = path.join(dir, 'gotchas.md');
    try {
      skill.frontmatter.gotchas = await fs.readFile(gotchasPath, 'utf-8');
    } catch {
      // No gotchas file
    }

    // Discover supplementary files
    const allFiles = await fg('**/*', { cwd: dir, absolute: false });
    const supplementary = [];
    for (const f of allFiles) {
      if (f === 'skill.md' || f === 'gotchas.md') continue;
      const filePath = path.join(dir, f);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      supplementary.push({ path: f, content: fileContent });
    }
    if (supplementary.length > 0) {
      skill.frontmatter.supplementary_files = supplementary;
    }

    skills.push(skill);
  }

  return { manifest, skills };
}

/**
 * Scaffold a new .skillr/ directory.
 */
export async function scaffoldProject(
  projectPath: string,
  name: string,
  providers: string[] = [],
): Promise<void> {
  const skillrDir = path.join(projectPath, '.skillr');
  await fs.mkdir(path.join(skillrDir, 'skills'), { recursive: true });

  const manifest: Manifest = {
    spec_version: 1,
    id: uuidv4(),
    name,
    description: '',
    providers,
    skills: [],
    created_at: new Date().toISOString(),
    synced_at: null,
  };

  await fs.writeFile(
    path.join(skillrDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
}

/**
 * Read the manifest from a project.
 */
export async function readManifest(projectPath: string): Promise<Manifest> {
  const manifestPath = path.join(projectPath, '.skillr', 'manifest.json');
  const raw = await fs.readFile(manifestPath, 'utf-8');
  return JSON.parse(raw) as Manifest;
}

/**
 * Write a manifest to a project.
 */
export async function writeManifest(projectPath: string, manifest: Manifest): Promise<void> {
  const manifestPath = path.join(projectPath, '.skillr', 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

/**
 * Write a skill file to .skillr/skills/.
 */
export async function writeSkillFile(
  projectPath: string,
  frontmatter: SkillFrontmatter,
  body: string,
): Promise<void> {
  const slug = frontmatter.id;
  const skillsDir = path.join(projectPath, '.skillr', 'skills');
  await fs.mkdir(skillsDir, { recursive: true });

  const useFolderFormat = !!(frontmatter.gotchas || frontmatter.supplementary_files?.length);

  if (useFolderFormat) {
    const skillDir = path.join(skillsDir, slug);
    await fs.mkdir(skillDir, { recursive: true });

    // Remove flat file if upgrading
    try {
      await fs.unlink(path.join(skillsDir, `${slug}.md`));
    } catch { /* doesn't exist */ }

    // Write skill.md (without gotchas in frontmatter — it goes in gotchas.md)
    const fmCopy = { ...frontmatter };
    delete (fmCopy as Record<string, unknown>).gotchas;
    delete (fmCopy as Record<string, unknown>).supplementary_files;
    await fs.writeFile(path.join(skillDir, 'skill.md'), renderFile(fmCopy, body));

    if (frontmatter.gotchas) {
      await fs.writeFile(path.join(skillDir, 'gotchas.md'), frontmatter.gotchas);
    }

    for (const file of frontmatter.supplementary_files ?? []) {
      const filePath = path.join(skillDir, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
    }
  } else {
    // Remove folder if downgrading
    try {
      await fs.rm(path.join(skillsDir, slug), { recursive: true, force: true });
    } catch { /* doesn't exist */ }

    await fs.writeFile(path.join(skillsDir, `${slug}.md`), renderFile(frontmatter, body));
  }
}

/**
 * Check if .skillr/ exists in the given directory.
 */
export async function hasSkillrDir(projectPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(projectPath, '.skillr', 'manifest.json'));
    return true;
  } catch {
    return false;
  }
}

export { slugify };
