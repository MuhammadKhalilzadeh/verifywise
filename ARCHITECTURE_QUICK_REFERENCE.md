# VerifyWise Architecture - Quick Reference Guide

## What is VerifyWise?
An enterprise AI governance platform for compliance management (EU AI Act, ISO 27001/42001), risk assessment, vendor management, and ML bias/fairness evaluation. Built with React, Express.js, PostgreSQL, and Python.

---

## Architecture Type
**Clean Architecture + Domain-Driven Design** with clear separation:
- Frontend: React with Redux/TanStack Query
- Backend: Express.js with TypeScript  
- Database: PostgreSQL with Sequelize ORM
- Specialized Services: Python ML module + BullMQ job queue

---

## Key Directory Map

| Directory | Purpose |
|-----------|---------|
| `Clients/` | React frontend with Redux/Material-UI |
| `Servers/` | Express backend with clean architecture |
| `domain.layer/` | Pure business logic, models, validations |
| `infrastructure.layer/` | Database, external services |
| `controllers/` | HTTP request handlers (44 files) |
| `routes/` | API endpoint definitions (40+ routes) |
| `middleware/` | Auth, RBAC, rate limiting, multi-tenancy |
| `services/` | Business logic (email, Slack, MLflow) |
| `database/` | Sequelize models + 100+ migrations |
| `BiasAndFairnessModule/` | Python ML evaluation engine |

---

## Core Security Components

### Authentication (7 files)
- **JWT Tokens**: Access (1hr) + Refresh (30-day) tokens
- **File**: `/utils/jwt.utils.ts`
- **Middleware**: `/middleware/auth.middleware.ts`
- **Password Hashing**: Bcrypt with 10 salt rounds
- **Token Payload**: id, email, roleName, organizationId, tenantId, expire

### Authorization (RBAC)
- **File**: `/middleware/accessControl.middleware.ts`
- **Roles**: Admin, Reviewer, Editor, Auditor
- **Pattern**: authenticateJWT → authorize(['RoleName']) → controller
- **Multi-tenancy**: Organization-scoped queries + tenant hash validation

### File Upload (3 files)
- **Routes**: `/api/files` (basic), `/api/file-manager` (advanced)
- **Limits**: 30MB max, memory storage, MIME type validation
- **Access**: Admin/Reviewer/Editor only for uploads
- **Rate Limit**: 15 requests/15min

### Rate Limiting (3 limiters)
- **Auth**: 5 attempts/15min
- **File Ops**: 15 requests/15min  
- **General API**: 100 requests/15min

### Input Validation
- `/domain.layer/validations/` - Domain validation
- `/utils/validations/` - Utility validation
- Express-Validator on routes
- DOMPurify on frontend (XSS prevention)

---

## API Endpoints (Quick List)

### Authentication
- POST `/api/users/login`
- POST `/api/users/register`
- POST `/api/users/refresh-token`
- POST `/api/users/forgot-password`

### User Management
- GET `/api/users` - List (org-scoped)
- POST `/api/users` - Create
- GET `/api/users/:id` - Get
- PATCH `/api/users/:id` - Update
- DELETE `/api/users/:id` - Delete

### Compliance Frameworks
- `/api/eu-ai-act` - EU AI Act
- `/api/iso-27001` - ISO 27001
- `/api/iso-42001` - ISO 42001

### Risk Management
- `/api/projectRisks` - Project risks
- `/api/vendorRisks` - Vendor risks
- `/api/modelRisks` - Model risks
- `/api/modelInventory` - ML model tracking

### File Management
- GET `/api/file-manager` - List files
- POST `/api/file-manager` - Upload (30MB limit)
- GET `/api/file-manager/:id` - Download
- DELETE `/api/file-manager/:id` - Delete

### Integrations
- `/api/integrations/mlflow` - MLflow sync
- `/api/slackWebhooks` - Slack notifications
- `/api/mail` - Email operations
- `/api/bias_and_fairness/` - ML bias evaluation

---

## Database Schema
- **ORM**: Sequelize TypeScript
- **Database**: PostgreSQL 16.8
- **Connection**: Connection pooling with pg-pool
- **Production**: SSL/TLS support
- **Models**: 30+ in domain.layer/models/
- **Migrations**: 100+ for schema evolution

### Core Tables
- users (with role_id, organization_id)
- organizations (tenants)
- roles (Admin, Reviewer, Editor, Auditor)
- projects, assessments, risks, vendors, etc.
- files (JSONB for file data)

---

## External Integrations

### Email Providers
1. **Resend** (default)
2. **SMTP** (Gmail, custom)
3. **Exchange Online** (Office 365)
4. **Exchange On-Premises** (self-hosted)
5. **Amazon SES** (AWS)

**File**: `/services/emailService.ts`

### Slack Integration
- Webhook management
- Message routing
- OAuth support
- Rate limited: 10 creations/hour

**Files**: `/routes/slackWebhook.route.ts`, `/services/slack/`

### MLflow Integration
- Model tracking server connection
- Configuration management
- Sync workers (BullMQ + Redis)

**Files**: `/routes/integrations.route.ts`, `/services/mlflow/`

### Bias & Fairness Module
- Separate Python service
- Docker container
- Evaluation engine
- Exposed via `/api/bias_and_fairness/`

---

## Error Handling

**Custom Exception Hierarchy** (`/domain.layer/exceptions/custom.exception.ts`):
- CustomException (500) - Base class
- ValidationException (400) - Input validation
- NotFoundException (404) - Resource not found
- UnauthorizedException (401) - Auth failed
- ForbiddenException (403) - Permission denied
- ConflictException (409) - Resource conflict
- BusinessLogicException (422) - Business rule violation
- DatabaseException (500) - DB error
- ExternalServiceException (502) - External API error
- ConfigurationException (500) - Config error

---

## Logging

**System**: Winston with daily rotation

**Utilities** (`/utils/logger/`):
- `fileLogger.ts` - File logging
- `dbLogger.ts` - Database audit trails
- `logHelper.ts` - Helper functions
  - logProcessing()
  - logSuccess()
  - logFailure()
  - logStructured()

**Request Context**: AsyncLocalStorage for tracing

---

## Environment Variables (Key)

```
# Database
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# Security
JWT_SECRET, REFRESH_TOKEN_SECRET
MULTI_TENANCY_ENABLED, ALLOWED_ORIGINS

# Email
EMAIL_PROVIDER (resend/smtp/exchange-online/amazon-ses)
EMAIL_ID, RESEND_API_KEY, SMTP_*, EXCHANGE_*, AWS_SES_*

# Slack
SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_BOT_TOKEN

# Redis/Queue
REDIS_URL

# Frontend
FRONTEND_URL, BACKEND_URL
```

---

## Middleware Stack

| Middleware | Purpose | File |
|-----------|---------|------|
| CORS | Cross-origin requests | index.ts |
| Helmet | Security headers | index.ts |
| authenticateJWT | Token validation | auth.middleware.ts |
| authorize | Role-based access | accessControl.middleware.ts |
| checkMultiTenancy | Tenant restrictions | multiTenancy.middleware.ts |
| Rate limiting | Request throttling | rateLimit.middleware.ts |
| Cookie parser | Cookie handling | index.ts |

---

## Controllers (Sample List)

- `user.ctrl.ts` - User CRUD + auth (200+ lines)
- `project.ctrl.ts` - Project management
- `assessment.ctrl.ts` - Assessment tracking
- `organization.ctrl.ts` - Organization management
- `fileManager.ctrl.ts` - File operations
- `eu.ctrl.ts` - EU AI Act compliance
- `iso27001.ctrl.ts` - ISO 27001 compliance
- `iso42001.ctrl.ts` - ISO 42001 compliance
- And 36 more...

---

## Frontend Architecture

**State Management**:
- Redux Toolkit for global state
- Redux Persist for local storage
- TanStack Query for server state
- Zustand for lightweight state

**UI Components**:
- Material-UI (MUI) 6.1.6
- Plotly for charts
- Custom components

**Routing**:
- React Router DOM v6
- Feature-based organization

---

## Background Jobs (BullMQ)

**Queue System**: Redis-backed with BullMQ

**Jobs**:
- MLflow synchronization
- Automation execution
- Email sending
- Slack notifications

**Files**:
- `/jobs/worker.js` - Job processing
- `/jobs/producer.ts` - Job enqueuing
- `/services/mlflow/mlflowSyncWorker.ts`
- `/services/automations/automationWorker.ts`

---

## Deployment

**Docker Compose Services**:
1. PostgreSQL 16.8 (database)
2. Redis 7 (cache/queue)
3. Express backend
4. React frontend
5. BullMQ worker
6. Python bias/fairness service

**Health Checks**: Database, Redis

**Environment Files**:
- `.env.dev` - Development
- `.env.prod` - Production

---

## Key Security Features

✓ JWT with separate access/refresh tokens
✓ Bcrypt password hashing (10 rounds)
✓ Multi-tenant organization isolation
✓ Role-based access control (4 roles)
✓ Rate limiting (auth, files, general API)
✓ Input validation (domain + express-validator)
✓ DOMPurify XSS prevention
✓ Helmet security headers
✓ CORS with origin validation
✓ Structured logging + audit trails
✓ Transaction support for data consistency
✓ SSL/TLS for production database
✓ Password strength validation (8-20 chars, mixed case, digits)
✓ File upload validation (MIME, size, extension)
✓ Organization-scoped data queries
✓ Tenant hash validation in JWT

---

## File Upload Validation Example

```
✓ File types: PDF, DOC, DOCX, XLS, XLSX, CSV, MD, JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF, MP4, MPEG, MOV, AVI, WMV, WEBM, MKV
✓ Max size: 30MB
✓ MIME type validation
✓ File extension checking
✓ Role-based access (Admin, Reviewer, Editor)
✓ Rate limited: 15 uploads/15min
✓ Organization-scoped storage
```

---

## Common Patterns

### User Authentication Flow
1. Client posts credentials to `/api/users/login`
2. Server validates password (bcrypt)
3. Server generates access + refresh tokens
4. Client stores access token (memory), refresh token (httpOnly cookie)
5. Client includes access token in Authorization header
6. authenticateJWT middleware verifies token
7. authorize() middleware checks role
8. Controller processes request with req.userId, req.role, req.organizationId

### Organization Isolation Pattern
1. authenticateJWT adds organizationId to req
2. All queries: `Model.findAll({where: {organizationId: req.organizationId}})`
3. No cross-org data access possible
4. Tenant hash validation prevents token manipulation

### File Upload Flow
1. Client requests with authenticateJWT + authorize(['Admin', ...])
2. Multer middleware validates file
3. fileOperationsLimiter rate limit applied
4. handleMulterError middleware catches errors
5. uploadFile controller saves to database
6. Returns 201 with file metadata

---

## Useful Commands

```bash
# Database
npm run migrate-db          # Run migrations
npm run reset-db            # Reset database

# Development
npm run dev                 # Start dev server
npm run watch               # Watch mode

# Production
npm run build               # Compile TypeScript
npm start                   # Run production server

# Jobs
npm run worker              # Start background worker

# Testing
npm test                    # Run tests
npm run test:watch          # Watch mode tests
```

---

## Related Documentation

- Full details: `/CODEBASE_ARCHITECTURE_SECURITY_AUDIT.md`
- README: `/README.md`
- Backend docs: `/BackendDocs/`
- Features: `/VERIFYWISE_FEATURES.md`

