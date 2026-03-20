# Repository Connections

Skillr can connect to GitHub and GitLab repositories for bidirectional skill sync -- push skills from Skillr to a remote repo, or pull skill changes made outside Skillr back in.

## Connecting a Repository

Navigate to a project's **Settings** page and open the **Repository** tab.

Click **Connect Repository** and provide:

| Field | Description |
|---|---|
| **Provider** | `github` or `gitlab` |
| **Owner** | Repository owner or organization |
| **Name** | Repository name |
| **Default Branch** | Branch to sync against (e.g., `main`) |
| **Access Token** | Personal access token with repo read/write permissions |

### Auto-Sync Options

| Option | Description |
|---|---|
| **Auto-scan on push** | When a push is received via webhook, automatically scan the project for new or changed skills |
| **Auto-sync on push** | After scanning, automatically sync skills to all enabled providers |

## Repository Status

Once connected, the repository tab shows:

- **Connection status** -- Whether the repo is accessible
- **Last synced at** -- When skills were last pulled or pushed
- **Last commit SHA** -- The most recent commit Skillr is aware of
- **Branch list** -- Available branches in the remote

## Pull and Push

### Pull

Click **Pull** to fetch the latest `.skillr/skills/` files from the remote repository and update the local project. This is useful when team members have edited skills directly in the repo.

### Push

Click **Push** to commit and push the current state of `.skillr/skills/` to the remote repository. This makes your local skill changes available to the rest of the team.

## Browsing Remote Files

The repository panel lets you browse the file tree of the connected repo without leaving Skillr. This is useful for verifying that skill files were pushed correctly.

## Allowed Paths

For security, Skillr restricts which local file paths can be used for projects. The allowed paths can be configured in the Filament Admin panel. The repository API exposes these:

```
GET /api/repositories/allowed-paths
```

## API

```
GET    /api/projects/{id}/repositories                          # List connections
POST   /api/projects/{id}/repositories                          # Connect repo
PUT    /api/projects/{id}/repositories/{provider}               # Update config
DELETE /api/projects/{id}/repositories/{provider}               # Disconnect
GET    /api/projects/{id}/repositories/{provider}/status        # Connection status
GET    /api/projects/{id}/repositories/{provider}/branches      # List branches
GET    /api/projects/{id}/repositories/{provider}/latest-commit # Latest commit info
GET    /api/projects/{id}/repositories/{provider}/files         # Browse files
POST   /api/projects/{id}/repositories/{provider}/pull          # Pull from remote
POST   /api/projects/{id}/repositories/{provider}/push          # Push to remote
```
