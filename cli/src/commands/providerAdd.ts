import fs from 'node:fs/promises';
import path from 'node:path';
import { hasSkillrDir } from '../services/ManifestService.js';
import { slugify } from '../services/SkillFileParser.js';
import * as ui from '../ui.js';

function template(slug: string, name: string): string {
  return `// Custom provider plugin: ${name}
//
// Skillr loads every *.js / *.mjs file in .skillr/plugins/ at sync time
// and registers its default export as a provider. The object must match
// the ProviderPlugin interface:
//   { name: string, slug: string, generate(skills, projectPath): FileOutput[] }

export default {
  name: '${name}',
  slug: '${slug}',

  generate(skills, projectPath) {
    // Build your provider's native config from \`skills\`. Each skill has:
    //   { slug, name, description, body, category, tags, conditions, gotchas,
    //     supplementary_files }
    //
    // Return an array of { path, content } file outputs.

    let output = '';
    for (const skill of skills) {
      output += \`## \${skill.name}\\n\\n\${skill.body}\\n\\n---\\n\\n\`;
    }

    return [
      {
        path: \`\${projectPath}/.${slug}/instructions.md\`,
        content: output.trimEnd() + '\\n',
      },
    ];
  },
};
`;
}

export async function providerAddCommand(name: string): Promise<void> {
  const projectPath = process.cwd();

  if (!(await hasSkillrDir(projectPath))) {
    ui.error('No .skillr/ found. Run `skillr init` first.');
    process.exit(1);
  }

  if (!name?.trim()) {
    ui.error('Provider name is required.');
    process.exit(1);
  }

  const slug = slugify(name);
  if (!slug) {
    ui.error(`Cannot derive a valid slug from "${name}".`);
    process.exit(1);
  }

  const pluginsDir = path.join(projectPath, '.skillr', 'plugins');
  await fs.mkdir(pluginsDir, { recursive: true });
  const filePath = path.join(pluginsDir, `${slug}.js`);

  try {
    await fs.access(filePath);
    ui.error(`Plugin already exists: .skillr/plugins/${slug}.js`);
    process.exit(1);
  } catch { /* doesn't exist — good */ }

  await fs.writeFile(filePath, template(slug, name));

  ui.success(`Created .skillr/plugins/${slug}.js`);
  ui.info('Edit the file, then add the slug to manifest.json providers to enable it.');
  ui.info(`Docs: docs/guide/custom-providers.md`);
}
