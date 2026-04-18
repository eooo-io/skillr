import { hasSkillrDir, scanProject } from '../services/ManifestService.js';
import * as ui from '../ui.js';
import { colors } from '../ui.js';

interface SkillRow {
  slug: string;
  name: string;
  category: string;
  tags: string[];
  includes: number;
  conditions: boolean;
}

export async function listCommand(options: { json?: boolean }): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  const { skills } = await scanProject(projectPath);
  const rows: SkillRow[] = skills.map((s) => ({
    slug: s.slug,
    name: s.frontmatter.name ?? s.slug,
    category: s.frontmatter.category ?? 'general',
    tags: s.frontmatter.tags ?? [],
    includes: (s.frontmatter.includes ?? []).length,
    conditions: !!s.frontmatter.conditions,
  }));

  if (options.json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    return;
  }

  if (rows.length === 0) {
    ui.confused('No skills yet. Run `skillr add "Skill Name"` to create one.');
    return;
  }

  const headers = ['SLUG', 'NAME', 'CATEGORY', 'TAGS', 'INC', 'COND'];
  const widths = headers.map((h) => h.length);
  const serialized = rows.map((r) => [
    r.slug,
    r.name,
    r.category,
    r.tags.join(',') || '—',
    String(r.includes),
    r.conditions ? '✓' : '—',
  ]);

  for (const row of serialized) {
    for (let i = 0; i < row.length; i++) {
      widths[i] = Math.max(widths[i], row[i].length);
    }
  }

  const line = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join('  ');

  ui.blank();
  console.log(`${colors.bold}${line(headers)}${colors.reset}`);
  console.log(colors.dim + widths.map((w) => '-'.repeat(w)).join('  ') + colors.reset);
  for (const row of serialized) {
    console.log(line(row));
  }
  ui.blank();
  ui.info(`${rows.length} skill(s).`);
}
