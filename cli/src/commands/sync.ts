import { hasSkillrDir } from '../services/ManifestService.js';
import { sync } from '../services/SyncService.js';
import * as ui from '../ui.js';

export async function syncCommand(options: {
  provider?: string;
  dryRun?: boolean;
  force?: boolean;
}): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  if (options.dryRun) {
    ui.thinking('Dry run — use `skillr diff` for detailed preview.');
    const { diffCommand } = await import('./diff.js');
    return diffCommand({ provider: options.provider, force: options.force });
  }

  ui.working('Syncing skills to provider configs...');

  try {
    const { results, skipped } = await sync(projectPath, {}, options.provider, {
      force: options.force,
    });

    ui.blank();
    if (skipped.length > 0) {
      for (const s of skipped) {
        ui.info(`Skipped ${s.slug}: ${s.reason}`);
      }
      ui.blank();
    }

    let totalFiles = 0;
    let failed = 0;
    for (const result of results) {
      if (result.error) {
        ui.error(`${result.provider}: ${result.error}`);
        failed++;
        continue;
      }
      ui.success(`${result.provider}: ${result.files.length} file(s) written`);
      for (const file of result.files) {
        ui.info(file.path);
      }
      totalFiles += result.files.length;
    }

    ui.blank();
    const ok = results.length - failed;
    ui.success(`Synced ${totalFiles} file(s) across ${ok} provider(s).`);
    if (failed > 0) {
      ui.error(`${failed} provider(s) failed.`);
      process.exit(1);
    }
  } catch (err) {
    ui.error((err as Error).message);
    process.exit(1);
  }
}
