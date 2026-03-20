# Desktop App Config Sync

Skillr can sync MCP server definitions and workspace settings to desktop AI applications. This extends Skillr's single-source-of-truth philosophy beyond IDE/CLI instruction files to desktop app configurations.

## The Problem

Desktop AI tools each maintain their own config files:

| App | Config Location | What It Stores |
|---|---|---|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | MCP servers, model prefs |
| Claude Code | `~/.claude/settings.json` | MCP servers, permissions, approval mode |
| Cursor | `~/.cursor/mcp.json` | MCP servers |
| Windsurf | `~/.windsurf/mcp.json` | MCP servers |
| Codex CLI | `~/.codex/config.json` | Model, approval mode |
| ChatGPT Desktop | `~/Library/Application Support/com.openai.chat/` | Plugins, preferences |

When you add a new MCP server, you have to manually update each tool's config file. Skillr eliminates this duplication.

## MCP Config Sync

### Detecting Desktop Apps

Click **Detect** to auto-discover which desktop AI tools are installed on your machine:

```
GET /api/desktop-configs/detect
```

Skillr checks known config file locations for each supported app.

### Registering an App

Register a detected app (or add one manually) to include it in sync:

```
POST /api/desktop-configs
```

### Syncing MCP Servers

Once registered, sync your project's MCP server definitions to all registered desktop apps:

```
POST /api/desktop-configs/sync           # Sync all apps
POST /api/desktop-configs/{appSlug}/sync  # Sync single app
```

Each app's driver translates the MCP server definitions into the correct config format for that tool.

### Preview Before Sync

See exactly what will change before writing:

```
GET /api/desktop-configs/{appSlug}/preview
```

Returns a diff showing the current config vs. the proposed config.

### Importing MCP Servers from Apps

If you've already configured MCP servers in a desktop app, import them into Skillr:

```
POST /api/desktop-configs/import-mcp
```

This reads the app's config file and creates MCP server records in your project.

## Workspace Settings Sync

Beyond MCP servers, Skillr can sync workspace-level settings like:

- **Model preferences** -- Default model per app
- **Permissions** -- File read/write, network access, shell execution
- **Approval modes** -- Auto-approve, suggest, manual

These settings are stored as workspace profiles in Skillr and synced to each app's native format.

## API

```
GET    /api/desktop-configs                        # List synced apps
GET    /api/desktop-configs/detect                 # Auto-detect installed apps
POST   /api/desktop-configs                        # Register app
DELETE /api/desktop-configs/{appSlug}              # Unregister app
POST   /api/desktop-configs/sync                   # Sync all apps
POST   /api/desktop-configs/{appSlug}/sync         # Sync single app
GET    /api/desktop-configs/{appSlug}/preview      # Preview changes
POST   /api/desktop-configs/import-mcp             # Import from app config
```

::: tip
Combine desktop config sync with [MCP server management](./mcp-servers) and [provider sync](./provider-sync) for a complete setup: define skills and MCP servers once in Skillr, then sync everything to all your tools with a single click.
:::
