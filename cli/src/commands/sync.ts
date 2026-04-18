import path from 'node:path';
import fs from 'node:fs';
import { hasSkillrDir } from '../services/ManifestService.js';
import { sync } from '../services/SyncService.js';
import * as ui from '../ui.js';

interface SyncOptions {
  provider?: string;
  dryRun?: boolean;
  force?: boolean;
  watch?: boolean;
}

async function runSync(projectPath: string, opts: SyncOptions): Promise<number> {
  const { results, skipped } = await sync(projectPath, {}, opts.provider, {
    force: opts.force,
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
  }
  return failed;
}

async function watchAndSync(projectPath: string, opts: SyncOptions): Promise<void> {
  const skillsDir = path.join(projectPath, '.skillr', 'skills');

  ui.working('Initial sync...');
  try {
    await runSync(projectPath, opts);
  } catch (err) {
    ui.error((err as Error).message);
  }

  ui.thinking(`Watching ${skillsDir} — press Ctrl+C to stop.`);

  let pending = false;
  let running = false;

  const runDebounced = async () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      ui.working('Change detected — re-syncing...');
      await runSync(projectPath, opts);
    } catch (err) {
      ui.error((err as Error).message);
    } finally {
      running = false;
      if (pending) {
        pending = false;
        setTimeout(runDebounced, 100);
      }
    }
  };

  let timer: NodeJS.Timeout | null = null;
  const watcher = fs.watch(skillsDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(runDebounced, 150);
  });

  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      ui.blank();
      ui.ready('Watch stopped.');
      watcher.close();
      resolve();
    });
  });
}

export async function syncCommand(options: SyncOptions): Promise<void> {
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

  if (options.watch) {
    return watchAndSync(projectPath, options);
  }

  ui.working('Syncing skills to provider configs...');

  try {
    const failed = await runSync(projectPath, options);
    if (failed > 0) process.exit(1);
  } catch (err) {
    ui.error((err as Error).message);
    process.exit(1);
  }
}
