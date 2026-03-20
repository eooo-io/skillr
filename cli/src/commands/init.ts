import path from 'node:path';
import { hasSkillrDir, scaffoldProject } from '../services/ManifestService.js';
import { VALID_PROVIDERS } from '../types.js';
import * as ui from '../ui.js';

export async function initCommand(options: { name?: string; providers?: string }): Promise<void> {
  const projectPath = process.cwd();
  const projectName = options.name ?? path.basename(projectPath);

  ui.thinking(`Initializing .skillr/ in ${projectPath}`);

  if (await hasSkillrDir(projectPath)) {
    ui.error('.skillr/ already exists in this directory.');
    process.exit(1);
  }

  const providers = options.providers
    ? options.providers.split(',').map((p) => p.trim()).filter((p) => VALID_PROVIDERS.includes(p as any))
    : [...VALID_PROVIDERS];

  await scaffoldProject(projectPath, projectName, providers);

  ui.success(`Initialized .skillr/ for "${projectName}"`);
  ui.info(`Providers: ${providers.join(', ')}`);
  ui.info('');
  ui.info('Next steps:');
  ui.info('  skillr add "My First Skill"    Create a skill');
  ui.info('  skillr sync                    Sync to provider configs');
}
