# Custom Provider Plugins

Skillr ships with 10 built-in providers (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, Zed, Aider, Continue, Junie). If your AI tool isn't on the list, you can add it as a plugin without touching the core codebase.

## The plugin contract

A provider plugin is a plain JavaScript object matching the `ProviderPlugin` interface:

```ts
interface ProviderPlugin {
  name: string;   // Human-readable provider name, e.g. "My Editor"
  slug: string;   // Kebab-case identifier used in manifest.json providers list
  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[];
}

interface FileOutput {
  path: string;     // Absolute path where the file should be written
  content: string;  // File contents
}
```

The `generate()` method is pure: given the resolved skills and the project path, return the files you want written. No I/O from inside `generate()` — Skillr handles writing.

## Writing your plugin

Scaffold a new plugin with:

```bash
skillr provider:add "My Editor"
```

This creates `.skillr/plugins/my-editor.js` with a working template. Edit it to produce whatever output your AI tool expects.

### Example — a hypothetical `my-editor` provider

```js
// .skillr/plugins/my-editor.js
export default {
  name: 'My Editor',
  slug: 'my-editor',

  generate(skills, projectPath) {
    let output = '# My Editor Rules\n\n';
    for (const skill of skills) {
      output += `## ${skill.name}\n\n${skill.body}\n\n`;
      if (skill.gotchas) {
        output += `### Gotchas\n\n${skill.gotchas}\n\n`;
      }
      output += '---\n\n';
    }
    return [
      {
        path: `${projectPath}/.my-editor/rules.md`,
        content: output.trimEnd() + '\n',
      },
    ];
  },
};
```

Add `"my-editor"` to the `providers` array in `.skillr/manifest.json`, then `skillr sync` will include it.

### The ResolvedSkill shape

Each skill passed to `generate()` has:

- `slug` — kebab-case identifier
- `name` — human-readable title
- `description` — one-line description or `null`
- `body` — the composed and template-resolved instruction body
- `category` — taxonomy bucket (`code-quality-review`, `general`, etc.)
- `tags` — string array
- `conditions` — `{ file_patterns?, path_prefixes? }` or `null`
- `gotchas` — gotchas markdown or `null`
- `supplementary_files` — array of `{ path, content }`

Skills whose `conditions` don't match the project are filtered out _before_ your `generate()` is called — you don't need to handle that.

## Testing your plugin locally

1. Scaffold and edit `.skillr/plugins/<slug>.js`
2. Run `skillr sync --provider <slug>` in the project
3. Inspect the generated files

Runtime errors in your plugin surface as that provider failing (other providers keep syncing; the CLI exits 1).

## How Skillr discovers plugins

On every sync, Skillr walks `.skillr/plugins/*.{js,mjs}` and imports each file's default export via `registerDriver()`. Validation happens at load time — a plugin missing `name`, `slug`, or `generate()` fails fast with a clear error.

Built-in providers follow the same contract — they're just pre-registered. There are no special internal APIs.

## Submitting a provider upstream

If your provider targets a popular tool that other Skillr users could benefit from, consider contributing it to the main repo:

1. Move the plugin from `.skillr/plugins/` to `cli/src/drivers/<slug>.ts` (port to TypeScript)
2. Register it in `cli/src/drivers/index.ts`
3. Add it to `VALID_PROVIDERS` in `cli/src/types.ts`
4. Add driver tests in `cli/src/drivers/drivers.test.ts`
5. Update the README's provider table
6. Open a PR

The built-in drivers (e.g. `claude.ts`, `cursor.ts`) are reference implementations — read them for idiomatic patterns.
