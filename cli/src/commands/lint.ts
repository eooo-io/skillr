import { hasSkillrDir, scanProject } from '../services/ManifestService.js';
import { lint } from '../services/PromptLinter.js';
import * as ui from '../ui.js';
import { colors } from '../ui.js';

export async function lintCommand(slug?: string, options: { json?: boolean } = {}): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  const { skills } = await scanProject(projectPath);

  if (skills.length === 0) {
    ui.confused('No skills found in .skillr/skills/');
    return;
  }

  const toLint = slug
    ? skills.filter((s) => s.slug === slug)
    : skills;

  if (slug && toLint.length === 0) {
    ui.error(`Skill not found: ${slug}`);
    process.exit(1);
  }

  ui.judging(`Linting ${toLint.length} skill(s)...`);

  let totalIssues = 0;
  const allResults: Array<{ slug: string; issues: ReturnType<typeof lint> }> = [];

  for (const skill of toLint) {
    const issues = lint(skill);
    allResults.push({ slug: skill.slug, issues });
    totalIssues += issues.length;
  }

  if (options.json) {
    console.log(JSON.stringify(allResults, null, 2));
    process.exit(totalIssues > 0 ? 1 : 0);
  }

  ui.blank();
  for (const { slug: skillSlug, issues } of allResults) {
    if (issues.length === 0) continue;

    console.log(`${colors.bold}${skillSlug}${colors.reset}`);
    for (const issue of issues) {
      const icon = issue.severity === 'warning'
        ? `${colors.yellow}⚠${colors.reset}`
        : `${colors.blue}ℹ${colors.reset}`;
      const loc = issue.line ? `${colors.dim}:${issue.line}${colors.reset}` : '';
      console.log(`  ${icon} ${colors.dim}[${issue.rule}]${colors.reset}${loc} ${issue.message}`);
      console.log(`    ${colors.dim}→${colors.reset} ${issue.suggestion}`);
    }
    console.log();
  }

  if (totalIssues === 0) {
    ui.success('All skills pass lint checks.');
  } else {
    const warnings = allResults.flatMap((r) => r.issues).filter((i) => i.severity === 'warning').length;
    const suggestions = totalIssues - warnings;
    ui.ready(`${warnings} warning(s), ${suggestions} suggestion(s) across ${allResults.filter((r) => r.issues.length > 0).length} skill(s).`);
    process.exit(1);
  }
}
