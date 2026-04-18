import { hasSkillrDir, writeSkillFile, readManifest, writeManifest, slugify } from '../services/ManifestService.js';
import { validateFrontmatter } from '../services/SkillFileParser.js';
import type { SkillFrontmatter } from '../types.js';
import * as ui from '../ui.js';

export async function addCommand(
  name: string,
  options: { description?: string; category?: string; model?: string },
): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  if (!name?.trim()) {
    ui.error('Skill name is required.');
    process.exit(1);
  }

  const slug = slugify(name);
  if (!slug) {
    ui.error(`Cannot derive a valid slug from "${name}". Use alphanumeric characters.`);
    process.exit(1);
  }

  ui.working(`Creating skill: ${name} (${slug})`);

  const now = new Date().toISOString();
  const frontmatter: SkillFrontmatter = {
    id: slug,
    name,
    description: options.description ?? null,
    category: options.category ?? 'general',
    model: options.model ?? null,
    tags: [],
    tools: [],
    includes: [],
    template_variables: [],
    created_at: now,
    updated_at: now,
  };

  const errors = validateFrontmatter(frontmatter);
  if (errors.length > 0) {
    ui.error(`Invalid frontmatter:\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
  }

  const body = `You are a helpful assistant.\n\n## Instructions\n\n- Replace this with your skill instructions\n`;

  await writeSkillFile(projectPath, frontmatter, body);

  // Update manifest
  const manifest = await readManifest(projectPath);
  if (!manifest.skills.includes(slug)) {
    manifest.skills.push(slug);
    await writeManifest(projectPath, manifest);
  }

  ui.success(`Created .skillr/skills/${slug}.md`);
  ui.info('Edit the file to add your instructions, then run `skillr sync`.');
}
