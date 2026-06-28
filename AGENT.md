# AGENT.md - AI Agent Specification for MedySure Backend

## Project Context
MedySure Backend — Node.js + Express healthcare management API with Supabase, Redis, BullMQ.

## Architecture Rules

Code should be simple not complex but not compromise with security.

### 1. Module Structure
Every feature module MUST follow this structure:
```
src/modules/{name}/
├── controllers/{name}.controller.js
├── services/{name}.service.js
├── repositories/{name}.repository.js
├── routes/{name}.routes.js
├── validators/{name}.validator.js
├── dtos/{name}.dto.js
├── policies/{name}.policy.js
├── constants/{name}.constants.js
└── index.js
```

### 2. Dependency Injection
- Singletons (Supabase, Redis, Logger) are created ONCE in bootstrap/container.js
- Repositories receive the supabaseAdmin client via constructor
- Services receive repositories, redis, logger, queues via constructor
- Controllers receive services via constructor
- Routes are factory functions receiving controllers and middleware
- NEVER import singletons directly in services/controllers

### 3. Request Flow
```
Request → Middleware Chain → Controller → Service → Repository → Database
```

### 4. Error Handling
- Use custom error classes from shared/errors/
- AppError (base), NotFoundError (404), ValidationError (400), UnauthorizedError (401), ForbiddenError (403)
- Global error handler in middlewares/errorHandler.middleware.js catches all errors
- Operational errors return structured JSON; programming errors return 500

### 5. Response Format
```json
{
  "success": true|false,
  "message": "string",
  "data": {},
  "pagination": { "page", "limit", "totalCount", "totalPages", "hasNextPage", "hasPrevPage" },
  "error": { "code": "string", "message": "string", "details": [] }
}
```

### 6. Validation
- ALL mutating endpoints MUST have Joi schemas
- Validate in middleware before controller
- Strip unknown fields, abort early = false

### 7. Authentication & Authorization
- JWT validated via Supabase auth.getUser()
- Sessions cached in Redis (key: session:{userId}, TTL: 1h)
- Permissions cached in Redis (key: permissions:{userId}, TTL: 15m)
- RBAC: authorize('resource:action') middleware on each route

### 8. Database Conventions
- Tables: snake_case, plural
- Columns: snake_case
- Primary keys: id (UUID)
- Foreign keys: {table_singular}_id
- Timestamps: created_at, updated_at, deleted_at
- Booleans: is_ prefix
- Soft deletes: deleted_at column, filter with .is('deleted_at', null)

### 9. Testing Requirements
- Unit tests for all services and controllers (mock dependencies)
- Integration tests for repositories (real or mock DB)
- API tests with supertest for full request cycle
- Minimum 80% coverage for branches, functions, lines, statements

### 10. Security Checklist
- [ ] Input validated with Joi
- [ ] Auth middleware on protected routes
- [ ] RBAC middleware with correct permissions
- [ ] No raw SQL — use Supabase client
- [ ] Sensitive fields redacted in logs
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured for allowed origins only
- [ ] Helmet security headers enabled

### 11. New Module Checklist
- [ ] Create module directory with all required files
- [ ] Define constants and error messages
- [ ] Create Joi validation schemas
- [ ] Implement repository with CRUD + soft delete
- [ ] Implement service with business logic
- [ ] Implement controller with response helpers
- [ ] Create route factory with auth + RBAC + validation middleware
- [ ] Create index.js exporting all classes and route factory
- [ ] Wire in bootstrap/container.js
- [ ] Mount routes in app.js
- [ ] Create database migration
- [ ] Write unit tests for service and controller
- [ ] Write API tests with supertest
