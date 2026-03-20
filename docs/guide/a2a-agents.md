# A2A Agents

Skillr supports configuring [Agent-to-Agent](https://google.github.io/A2A/) (A2A) integrations for your projects. A2A is a protocol that enables AI agents from different providers to communicate and collaborate.

## Managing A2A Agents

Navigate to a project and open the **A2A** tab to view and manage A2A agent configurations.

### Adding an A2A Agent

Click **Add A2A Agent** and provide:

| Field | Description |
|---|---|
| **Name** | Display name for the agent |
| **Provider** | The AI provider or service hosting the agent |
| **Config** | JSON configuration with connection details and capabilities |

### Configuration

The config object varies by provider but typically includes:

```json
{
  "endpoint": "https://agent.example.com/a2a",
  "capabilities": ["code-review", "testing"],
  "auth": {
    "type": "bearer",
    "token_env": "A2A_AGENT_TOKEN"
  }
}
```

### Editing and Removing

Click an agent card to edit its configuration, or click delete to remove it.

## API

```
GET    /api/projects/{id}/a2a-agents      # List A2A agents
POST   /api/projects/{id}/a2a-agents      # Create A2A agent
PUT    /api/a2a-agents/{id}               # Update agent
DELETE /api/a2a-agents/{id}               # Delete agent
```
