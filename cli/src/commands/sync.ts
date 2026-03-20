import { hasSkillrDir } from '../services/ManifestService.js';
import { sync } from '../services/SyncService.js';
import * as ui from '../ui.js';

export async function syncCommand(options: { provider?: string; dryRun?: boolean }): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  if (options.dryRun) {
    ui.thinking('Dry run — use `skillr diff` for detailed preview.');
    // Just import and run diff instead
    const { diffCommand } = await import('./diff.js');
    return diffCommand({ provider: options.provider });
  }

  ui.working('Syncing skills to provider configs...');

  try {
    const results = await sync(projectPath, {}, options.provider);

    ui.blank();
    let totalFiles = 0;
    for (const result of results) {
      ui.success(`${result.provider}: ${result.files.length} file(s) written`);
      for (const file of result.files) {
        ui.info(file.path);
      }
      totalFiles += result.files.length;
    }

    ui.blank();
    ui.success(`Synced ${totalFiles} file(s) across ${results.length} provider(s).`);
  } catch (err) {
    ui.error((err as Error).message);
    process.exit(1);
  }
}
