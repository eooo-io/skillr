import fs from 'node:fs/promises';
import path from 'node:path';
import {
  hasSkillrDir,
  readManifest,
  writeManifest,
  scanProject,
} from '../services/ManifestService.js';
import * as ui from '../ui.js';

export async function removeCommand(
  slug: string,
  options: { sync?: boolean },
): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  const { skills } = await scanProject(projectPath);
  const target = skills.find((s) => s.slug === slug);
  if (!target) {
    ui.error(`Skill not found: ${slug}`);
    process.exit(1);
  }

  const referrers = skills
    .filter((s) => s.slug !== slug && (s.frontmatter.includes ?? []).includes(slug))
    .map((s) => s.slug);

  if (referrers.length > 0) {
    ui.error(
      `Cannot remove "${slug}" — it is included by: ${referrers.join(', ')}. ` +
        `Remove the include reference first.`,
    );
    process.exit(1);
  }

  const skillsDir = path.join(projectPath, '.skillr', 'skills');
  const flatFile = path.join(skillsDir, `${slug}.md`);
  const folder = path.join(skillsDir, slug);

  ui.working(`Removing skill: ${slug}`);

  let removed = false;
  try {
    await fs.unlink(flatFile);
    removed = true;
  } catch { /* not a flat file */ }

  try {
    await fs.rm(folder, { recursive: true, force: true });
    const stat = await fs.stat(folder).catch(() => null);
    if (!stat) removed = true;
  } catch { /* not a folder */ }

  if (!removed) {
    ui.error(`Failed to remove skill files for "${slug}".`);
    process.exit(1);
  }

  const manifest = await readManifest(projectPath);
  manifest.skills = manifest.skills.filter((s) => s !== slug);
  await writeManifest(projectPath, manifest);

  ui.success(`Removed skill "${slug}".`);

  if (options.sync) {
    ui.blank();
    const { syncCommand } = await import('./sync.js');
    await syncCommand({});
  } else {
    ui.info('Run `skillr sync` to regenerate provider configs without this skill.');
  }
}
