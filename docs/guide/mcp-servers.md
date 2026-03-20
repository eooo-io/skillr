# MCP Servers

Skillr can manage [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server configurations for your projects. MCP servers extend AI tools with additional capabilities like file system access, database queries, or custom tool integrations.

## Managing MCP Servers

Navigate to a project and open the **MCP** tab. From here you can add, edit, and remove MCP server configurations.

### Adding a Server

Click **Add MCP Server** and provide:

| Field | Description |
|---|---|
| **Name** | Display name for the server (e.g., "PostgreSQL", "GitHub") |
| **Transport** | Connection type: `stdio` (subprocess) or `sse` (HTTP stream) |
| **Config** | JSON configuration object with transport-specific parameters |

#### stdio Transport

For subprocess-based servers that communicate over stdin/stdout:

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "DATABASE_URL": "postgresql://localhost:5432/mydb"
  }
}
```

#### SSE Transport

For HTTP-based servers using Server-Sent Events:

```json
{
  "url": "http://localhost:3001/sse"
}
```

### Editing and Removing

Click a server card to edit its configuration, or click the delete button to remove it.

## Sync to Desktop Apps

MCP server definitions stored in Skillr can be synced to desktop AI tools that support MCP, including Claude Desktop, Claude Code, and Cursor. See [Desktop Config Sync](./desktop-sync) for details.

## API

```
GET    /api/projects/{id}/mcp-servers      # List MCP servers
POST   /api/projects/{id}/mcp-servers      # Add server
PUT    /api/mcp-servers/{id}               # Update server
DELETE /api/mcp-servers/{id}               # Remove server
```
