import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';
import { appendSupplementary } from './supplementary.js';

const DEPRECATION_HEADER = `<!--
  DEPRECATED — the \`openai\` provider writes to .openai/instructions.md,
  which no current OpenAI tool actually reads. Use the \`codex\` provider
  instead — it emits AGENTS.md at the project root, the file Codex CLI,
  the Codex macOS app, and the Codex IDE extension all consume.

  This provider will be removed in v1.2.0. To migrate:
    1. Edit .skillr/manifest.json and replace "openai" with "codex" in the
       providers array.
    2. Run \`skillr sync\`.
    3. Delete the old .openai/ directory.
-->

`;

export const openaiDriver: ProviderDriver = {
  name: 'OpenAI (deprecated)',
  slug: 'openai',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    let output = '';

    for (const skill of skills) {
      output += `## ${skill.name}\n\n`;
      output += `${skill.body}\n\n`;
      if (skill.gotchas) {
        output += `### Common Gotchas\n\n${skill.gotchas}\n\n`;
      }
      output = appendSupplementary(output, skill.supplementary_files) + '\n---\n\n';
    }

    return [{
      path: path.join(projectPath, '.openai', 'instructions.md'),
      content: DEPRECATION_HEADER + output.trimEnd() + '\n',
    }];
  },
};
