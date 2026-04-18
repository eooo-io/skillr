#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { syncCommand } from './commands/sync.js';
import { diffCommand } from './commands/diff.js';
import { lintCommand } from './commands/lint.js';
import { importCommand } from './commands/import.js';
import { testCommand } from './commands/test.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('skillr')
  .description('Portable AI instruction format with cross-provider sync')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize .skillr/ in the current directory')
  .option('-n, --name <name>', 'Project name (defaults to directory name)')
  .option('-p, --providers <list>', 'Comma-separated provider list (default: all)')
  .action(initCommand);

program
  .command('add <name>')
  .description('Create a new skill')
  .option('-d, --description <desc>', 'Skill description')
  .option('-c, --category <category>', 'Skill category')
  .option('-m, --model <model>', 'Target model')
  .action(addCommand);

program
  .command('sync')
  .description('Sync skills to provider config files')
  .option('-p, --provider <name>', 'Sync to a single provider')
  .option('--dry-run', 'Preview without writing')
  .option('--force', 'Ignore skill conditions and sync all skills')
  .action(syncCommand);

program
  .command('diff')
  .description('Show what sync would change')
  .option('-p, --provider <name>', 'Diff a single provider')
  .option('--force', 'Ignore skill conditions')
  .action(diffCommand);

program
  .command('lint [slug]')
  .description('Run prompt quality checks')
  .option('--json', 'Output as JSON')
  .action(lintCommand);

program
  .command('import')
  .description('Import skills from existing provider configs')
  .action(importCommand);

program
  .command('test <slug>')
  .description('Test a skill against an LLM')
  .option('-m, --message <msg>', 'User message to send')
  .option('--model <model>', 'Override the skill model')
  .action(testCommand);

program.parse();
