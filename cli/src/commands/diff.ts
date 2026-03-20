import { hasSkillrDir } from '../services/ManifestService.js';
import { preview } from '../services/SyncService.js';
import * as ui from '../ui.js';
import { colors } from '../ui.js';

export async function diffCommand(options: { provider?: string }): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  ui.thinking('Computing diff...');

  try {
    const results = await preview(projectPath, {}, options.provider);

    const changed = results.filter((r) => r.status !== 'unchanged');
    if (changed.length === 0) {
      ui.success('No changes. Provider configs are up to date.');
      return;
    }

    ui.blank();
    for (const result of changed) {
      const statusColor = result.status === 'added' ? colors.green : colors.yellow;
      console.log(`  ${statusColor}[${result.status.toUpperCase()}]${colors.reset} ${result.path}`);
      console.log(`  ${colors.dim}Provider: ${result.provider}${colors.reset}`);

      if (result.status === 'modified' && result.current !== null) {
        const currentLines = result.current.split('\n');
        const proposedLines = result.proposed.split('\n');
        const maxLines = Math.max(currentLines.length, proposedLines.length);

        let diffCount = 0;
        for (let i = 0; i < maxLines && diffCount < 20; i++) {
          const curr = currentLines[i] ?? '';
          const prop = proposedLines[i] ?? '';
          if (curr !== prop) {
            if (curr) console.log(`  ${colors.red}- ${curr}${colors.reset}`);
            if (prop) console.log(`  ${colors.green}+ ${prop}${colors.reset}`);
            diffCount++;
          }
        }
        if (diffCount >= 20) {
          console.log(`  ${colors.dim}... (diff truncated)${colors.reset}`);
        }
      } else if (result.status === 'added') {
        const lines = result.proposed.split('\n').slice(0, 10);
        for (const line of lines) {
          console.log(`  ${colors.green}+ ${line}${colors.reset}`);
        }
        if (result.proposed.split('\n').length > 10) {
          console.log(`  ${colors.dim}... (${result.proposed.split('\n').length - 10} more lines)${colors.reset}`);
        }
      }

      console.log();
    }

    const added = results.filter((r) => r.status === 'added').length;
    const modified = results.filter((r) => r.status === 'modified').length;
    ui.ready(`${added} added, ${modified} modified. Run \`skillr sync\` to apply.`);
  } catch (err) {
    ui.error((err as Error).message);
    process.exit(1);
  }
}
