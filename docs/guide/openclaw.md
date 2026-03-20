# OpenClaw Config

Skillr supports managing [OpenClaw](https://openclaw.org/) configurations for your projects. OpenClaw is an open standard for defining AI agent behavior and constraints.

## Managing OpenClaw Config

Navigate to a project and open the **OpenClaw** tab to view and edit the project's OpenClaw configuration.

The OpenClaw config is a JSON document that defines agent constraints, allowed operations, and behavior boundaries for the project.

## API

```
GET /api/projects/{id}/openclaw      # Get OpenClaw config
PUT /api/projects/{id}/openclaw      # Update OpenClaw config
```

The PUT endpoint accepts a JSON body with the OpenClaw configuration:

```json
{
  "constraints": {
    "allowed_operations": ["read", "write", "execute"],
    "forbidden_paths": ["/etc", "/var/log"],
    "max_tokens_per_request": 8192
  },
  "behavior": {
    "confirmation_required": ["delete", "deploy"],
    "auto_approve": ["read", "lint"]
  }
}
```
