# Contributing to Skillr

Thank you for your interest in contributing. This guide covers setup, coding standards, and the PR process.

## Development Setup

### Prerequisites

- PHP 8.4+
- Composer
- Node.js 20+ and npm
- MariaDB 11+ (or Docker)

### With Docker

```bash
git clone https://github.com/eooo-io/skillr.git
cd skillr
cp .env.example .env
# Edit .env — set PROJECTS_HOST_PATH to your local dev directory

make build
make up
make migrate

# Start the React SPA (separate terminal)
cd ui && npm install && npm run dev
```

### Without Docker

```bash
git clone https://github.com/eooo-io/skillr.git
cd skillr
composer install
cp .env.example .env
php artisan key:generate

# Configure database credentials in .env (DB_HOST=127.0.0.1)
php artisan migrate --seed

cd ui && npm install && cd ..
composer dev
```

### Access Points

| Interface | URL |
|---|---|
| React SPA | http://localhost:5173 |
| Filament Admin | http://localhost:8000/admin |
| API | http://localhost:8000/api |

Default login: `admin@admin.com` / `password`

## Running Tests

```bash
# PHP tests (Pest)
composer test
# or with Docker:
make test

# TypeScript type checking
cd ui && npx tsc --noEmit

# Frontend linting
cd ui && npm run lint
```

## Coding Standards

### PHP

- Follow [PSR-12](https://www.php-fig.org/psr/psr-12/) coding style
- Format with Laravel Pint: `vendor/bin/pint`
- Use [Pest PHP](https://pestphp.com/) for tests
- Add authorization checks (`$this->authorize()`) to any new controller methods that access user resources
- Use FormRequest classes for complex validation

### TypeScript / React

- Run ESLint before committing: `cd ui && npm run lint`
- Use TypeScript strictly (no `any` types)
- Follow existing component patterns in `ui/src/components/`
- Use Zustand stores for shared state

## Pull Request Process

1. **Open an issue first** to discuss significant changes
2. Fork the repo and create a feature branch: `git checkout -b feature/my-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `composer test` and `cd ui && npx tsc --noEmit`
5. Format code: `vendor/bin/pint`
6. Push and open a PR against `main`

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Reference related issues with `Closes #123`
- Add tests for new API endpoints
- Update CLAUDE.md if you add new routes, models, or services

## Project Structure

See [CLAUDE.md](CLAUDE.md) for full architecture documentation including:
- Database schema
- API endpoints
- Service layer overview
- Provider sync system
