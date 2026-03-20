import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';

export const windsurfDriver: ProviderDriver = {
  name: 'Windsurf',
  slug: 'windsurf',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    const dir = path.join(projectPath, '.windsurf', 'rules');
    const files: FileOutput[] = [];

    for (const skill of skills) {
      let content = `# ${skill.name}\n\n${skill.body}\n`;

      if (skill.gotchas) {
        content += `\n## Common Gotchas\n\n${skill.gotchas}\n`;
      }

      files.push({
        path: path.join(dir, `${skill.slug}.md`),
        content,
      });
    }

    return files;
  },
};
