# CLAUDE.md - Claude Code Instructions for MedySure Backend

## Project Overview
MedySure is a healthcare management platform backend built with Node.js, Express.js, Supabase (PostgreSQL + Auth), Redis, and BullMQ.

## Architecture
- **Pattern**: Feature-based modular architecture with constructor-based dependency injection
- **Layers**: Controller → Service → Repository → Supabase PostgreSQL
- **DI Container**: `src/bootstrap/container.js` wires all dependencies
- **Singletons**: Supabase clients, Redis, Logger — created once, injected into everything

## Key Commands
- `npm run dev` — Start development server with nodemon
- `npm start` — Start production server
- `npm test` — Run all tests
- `npm run test:unit` — Run unit tests only
- `npm run lint` — Run ESLint
- `npm run worker` — Start background workers

## Code Style Rules
- Use constructor-based DI — never import singletons directly in business logic
- All database operations go through repositories
- Validate all inputs with Joi schemas in validators/
- Use the custom error classes from shared/errors/
- Use response helpers from shared/utils/response.js
- All routes are factory functions that receive dependencies

## File Naming Conventions
- Controllers: `{name}.controller.js`
- Services: `{name}.service.js`
- Repositories: `{name}.repository.js`
- Routes: `{name}.routes.js`
- Validators: `{name}.validator.js`
- DTOs: `{name}.dto.js`
- Constants: `{name}.constants.js`

## Adding a New Module
1. Create directory under `src/modules/{name}/`
2. Create controller, service, repository, routes, validators, dtos, constants, index.js
3. Wire in `src/bootstrap/container.js`
4. Mount routes in `src/app.js`
5. Add migration SQL in `database/migrations/`
6. Write tests in `tests/unit/modules/{name}/`

## Security Rules
- NEVER log passwords, tokens, or PII
- ALWAYS validate inputs with Joi
- Use parameterized queries (Supabase client handles this)
- Auth middleware validates JWTs via Supabase
- RBAC middleware checks permissions on every protected route

## Database
- Supabase PostgreSQL with admin client (service role key) for server operations
- Soft deletes via `deleted_at` column
- All tables use UUID primary keys
- Migrations in `database/migrations/` (numbered SQL files)
