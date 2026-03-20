# Reverse Import

Reverse import lets you bring existing AI provider configurations _into_ Skillr. If you already have `.cursor/rules/`, `.claude/CLAUDE.md`, or other provider config files, Skillr can detect and import them as skills.

## How It Works

Reverse import is the opposite of [provider sync](./provider-sync). Instead of writing from `.skillr/` to provider files, it reads from provider files and creates `.skillr/` skills.

```
Provider configs → Skillr detection → Preview → Import as skills
```

## Detecting Skills

### From the Project Settings

Navigate to a project's **Settings** page and open the **Import** tab. Click **Detect** to scan the project directory for provider-specific skill files.

Skillr scans for:

| Provider | Scanned Path | Format |
|---|---|---|
| Claude | `.claude/CLAUDE.md` | H2 headings parsed as individual skills |
| Cursor | `.cursor/rules/*.mdc` | Each MDC file becomes a skill |
| Copilot | `.github/copilot-instructions.md` | H2 headings parsed as individual skills |
| Windsurf | `.windsurf/rules/*.md` | Each file becomes a skill |
| Cline | `.clinerules` | Parsed as a single skill or split by headings |
| OpenAI | `.openai/instructions.md` | H2 headings parsed as individual skills |

### From the Project Detail Page

Click **Scan** on the project detail page. This scans both `.skillr/skills/` (normal scan) and provider-specific paths (reverse import).

## Preview Before Import

After detection, Skillr shows a preview of the skills it found:

- **Skill name** -- Derived from the filename or heading
- **Source provider** -- Which provider config the skill was found in
- **Body preview** -- First 200 characters of the skill content
- **Conflict indicator** -- Whether a skill with the same slug already exists

Review the list and select which skills to import.

## Importing

Click **Import** to create the selected skills in your project. For each imported skill, Skillr:

1. Creates a skill record in the database
2. Writes a `.skillr/skills/{slug}.md` file
3. Creates a version 1 snapshot
4. Assigns the `general` category by default

### Conflict Handling

If a skill with the same slug already exists in the project, the import skips that skill. Rename the existing skill first if you want to import the detected version.

## API

```
POST /api/import/detect                 # Detect skills in provider formats
POST /api/projects/{id}/import          # Import detected skills
```

The detect endpoint accepts:

```json
{
  "path": "/path/to/project"
}
```

Returns an array of detected skills with their source, name, and body.

::: tip
Reverse import is a great way to onboard an existing project onto Skillr. Run detect once, import what you want, then use Skillr as the source of truth going forward.
:::
