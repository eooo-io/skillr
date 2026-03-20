# Authentication

Skillr uses session-based authentication with support for multiple sign-in methods.

## Sign-In Methods

### Email and Password

Register at `/register` or log in at `/login` with your email and password.

### GitHub OAuth

Click **Sign in with GitHub** on the login page. Skillr redirects to GitHub for authorization, then creates or links your account on callback.

### Apple Sign In

Click **Sign in with Apple** on the login page. Uses Apple's form_post response mode for the callback.

## Session Management

Skillr uses Laravel's session-based auth (`auth:web` guard). The React SPA and API share the same session cookie via CORS configuration. There are no API tokens -- all requests are authenticated via the session cookie.

### Logging Out

Click your avatar or the logout option in the sidebar. This invalidates the session and redirects to the login page.

## Default Development Account

In development, the seeded database includes a default account:

- **Email:** `admin@admin.com`
- **Password:** `password`

::: warning
Change the default credentials before deploying to any shared or production environment.
:::

## Organizations

Skillr supports multi-tenant organizations. Each user can belong to multiple organizations, and each organization has its own projects, skills, and settings.

### Roles

| Role | Permissions |
|---|---|
| **Owner** | Full access, can delete organization, manage billing |
| **Admin** | Manage members, projects, and settings |
| **Editor** | Create and edit skills, run syncs |
| **Viewer** | Read-only access to projects and skills |
| **Member** | Default role with basic access |

### Switching Organizations

Your current organization is resolved via the `X-Organization-Id` header or your `current_organization_id` user setting. The React SPA manages this automatically.

### Creating an Organization

Organizations are managed through the Filament Admin panel at `/admin`.

## API

```
POST /api/auth/register       # Email registration
POST /api/auth/login          # Email login
POST /api/auth/logout         # Logout
GET  /api/auth/me             # Current user

GET  /auth/github/redirect    # GitHub OAuth redirect
GET  /auth/github/callback    # GitHub OAuth callback
GET  /auth/apple/redirect     # Apple Sign In redirect
POST /auth/apple/callback     # Apple Sign In callback
```
