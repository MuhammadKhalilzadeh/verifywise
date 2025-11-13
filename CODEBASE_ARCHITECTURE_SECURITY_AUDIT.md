# VerifyWise Codebase Architecture - Comprehensive Security Analysis

## Executive Summary

VerifyWise is a sophisticated, multi-service AI governance platform designed for compliance management and risk assessment. It employs a modern clean architecture pattern with clear separation between frontend, backend, and specialized AI services. The application implements enterprise-grade security controls including multi-tenancy, RBAC, JWT authentication, and comprehensive audit logging.

---

## 1. APPLICATION TYPE & PURPOSE

### Core Application Type
- **Type**: Full-stack web application with specialized microservices
- **Purpose**: AI governance, compliance management, and risk assessment platform
- **Deployment Model**: Self-hosted (on-premises) or SaaS via Docker containers

### Key Functional Areas
- EU AI Act compliance tracking
- ISO 27001 and ISO 42001 compliance
- AI model inventory and risk management
- Bias and fairness evaluation for ML systems
- Vendor risk management
- AI incident management
- Policy management for AI governance
- Training registry and audit logging

---

## 2. TECHNOLOGY STACK

### Frontend (Clients/)
**Framework & Build:**
- React 18.3.1 with TypeScript
- Vite 7.1.12 (build tool)
- Node.js runtime

**State Management & Data:**
- Redux Toolkit 2.2.7 for global state
- Redux Persist 6.0.0 for persistent storage
- TanStack React Query 5.84.2 for server state & caching
- Zustand 4.5.5 for lightweight state management
- React Router DOM 6.26.2 for routing

**UI Components & Styling:**
- Material-UI (MUI) 6.1.6 with X components
- Styled Components 6.1.13
- Emotion for CSS-in-JS
- Plotly.js for data visualization
- React Grid Layout for dashboard widgets
- Uppy 4.2+ for file uploads with drag-drop

**Rich Text & Document Editing:**
- TipTap/Plate for rich text editing
- Monaco Editor for code editing
- jsPDF for PDF generation
- html-to-docx-lite for Word document generation

**Utilities:**
- Axios 1.12.0 for HTTP requests
- DOMPurify 3.3.0 for XSS prevention
- Validator 13.15.20 for input validation
- js-yaml for YAML parsing

### Backend (Servers/)
**Runtime & Framework:**
- Node.js with Express.js 4.21.2
- TypeScript 5.6.2 (primary language)
- tsc-watch for development with live reload

**Database:**
- PostgreSQL 16.8 (primary datastore)
- Sequelize 6.37.6 ORM with TypeScript support
- Database migrations using Sequelize CLI
- Connection pooling with pg-pool

**Authentication & Security:**
- JWT (jsonwebtoken 9.0.2) with access & refresh tokens
- Bcrypt 5.1.1 for password hashing (10 rounds)
- Passport.js 4.0.1 with JWT strategy
- Helmet 8.0.0 for security headers
- Express Rate Limit 8.2.0 for DoS protection
- CORS 2.8.5 with origin validation

**Caching & Job Queues:**
- Redis 7 (via ioredis 5.7.0)
- BullMQ 5.61.0 for job queue processing
- Background workers for async tasks

**Email Services:**
- Nodemailer 7.0.7 (core email library)
- AWS SES 3.901.0 integration
- Resend provider integration
- Exchange Online/On-Premises support
- SMTP generic provider support
- MJML 4.16.1 for email template compilation

**External Integrations:**
- Slack Web API 7.10.0
- MLflow 2.0.7 for ML model tracking
- Google Auth Library 10.5.0 for OAuth

**Validation & Input Processing:**
- Express-Validator 7.2.1
- Custom validation utilities for domain layer
- Multer 2.0.2 for file uploads (memory storage)

**Logging & Monitoring:**
- Winston 3.17.0 with daily rotation
- Winston-Daily-Rotate-File 5.0.0
- Structured logging with context propagation
- AsyncLocalStorage for request tracing

**Document Processing:**
- Marked 15.0.11 for Markdown parsing
- Striptags 3.2.0 for HTML sanitization

**Utilities:**
- dotenv 16.4.5 for environment configuration
- Cookie-parser 1.4.7
- HTTP Proxy Middleware 3.0.5
- YAML 0.3.0
- Sanitize-filename 1.6.3

### Specialized AI Module (BiasAndFairnessModule/)
**Language & Framework:**
- Python 3.x
- Core evaluation engine for ML bias and fairness
- Dataset loader and evaluation utilities
- Inference capabilities
- Visualization generation

---

## 3. MAIN DIRECTORY STRUCTURE & PURPOSES

### Root Level
```
/home/user/verifywise/
├── Clients/              # React frontend application
├── Servers/              # Express.js backend with clean architecture
├── BiasAndFairnessModule/ # Python module for ML bias evaluation
├── BiasAndFairnessServers/ # Separate service for bias/fairness
├── docker-compose.yml    # Multi-container orchestration
├── .env.dev             # Development environment config
├── .env.prod            # Production environment config
└── BackendDocs/         # Backend documentation
```

### Frontend Structure (Clients/src/)
```
Clients/src/
├── application/         # Business logic & state management
│   ├── redux/          # Redux store, slices, transforms
│   ├── constants/      # API responses, configuration
│   └── hooks/          # Custom React hooks
├── domain/             # Domain models & types
│   ├── models/         # Entity definitions
│   └── Common/         # Shared domain models
├── infrastructure/     # API communication & external services
│   ├── api/           # HTTP client setup
│   └── services/      # Service integrations
├── presentation/      # UI components & pages
│   ├── components/    # Reusable UI components
│   ├── layouts/       # Page layouts
│   ├── pages/         # Route pages
│   └── styles/        # Global styles
├── config/            # Configuration files
└── types/             # TypeScript type definitions
```

### Backend Structure (Servers/)
```
Servers/
├── domain.layer/          # Domain-Driven Design core
│   ├── models/           # Database models (Sequelize)
│   ├── validations/      # Input validation logic
│   ├── exceptions/       # Custom exception classes
│   ├── interfaces/       # Contract definitions
│   └── enums/           # Enumeration types
├── infrastructure.layer/  # External systems
│   └── driver/          # Database drivers
├── controllers/          # HTTP request handlers (44 controllers)
├── services/            # Business logic services
│   ├── email/          # Email provider implementations
│   ├── slack/          # Slack integration
│   ├── mlflow/         # MLflow sync workers
│   ├── automations/    # Automation engine
│   └── markdowns/      # Report generation
├── routes/              # Express route definitions (40+ routes)
├── middleware/          # Express middleware
│   ├── auth.middleware.ts           # JWT validation
│   ├── accessControl.middleware.ts  # RBAC enforcement
│   ├── rateLimit.middleware.ts      # Rate limiting
│   ├── multiTenancy.middleware.ts   # Multi-tenant validation
│   └── Others
├── database/            # Database configuration
│   ├── config/         # Connection config
│   ├── migrations/     # Schema migrations (100+ migrations)
│   └── db.ts          # Sequelize instance
├── utils/              # Utility functions
│   ├── validations/    # Validation utilities
│   ├── logger/         # Logging utilities
│   ├── jwt.utils.ts    # Token generation/verification
│   ├── auth.utils.ts   # Authentication utilities
│   ├── user.utils.ts   # User query utilities
│   └── Others
├── jobs/                # Background job workers
│   ├── worker.js       # BullMQ worker
│   └── producer.ts     # Job producer
├── types/              # Shared TypeScript types
├── structures/         # Framework data structures
└── index.ts            # Main application entry point
```

---

## 4. BACKEND/FRONTEND STRUCTURE

### Frontend Architecture (Clean Architecture Pattern)

**Presentation Layer:**
- React components organized by feature
- Separation of presentational and container components
- Material-UI for consistent UI design
- Redux for global state, local React state for component state

**Application Layer:**
- Redux slices for feature-based state management
- Redux selectors for memoized state derivation
- Async thunks for API integration
- Redux Persist for state persistence

**Domain Layer:**
- TypeScript interfaces and types
- Model definitions
- Business rule implementations
- Entity validation logic

**Infrastructure Layer:**
- Axios HTTP client configuration
- API endpoint definitions
- Service layer for external integrations
- OAuth/authentication setup

### Backend Architecture (Clean Architecture with DDD)

**Domain Layer (domain.layer/):**
- Pure business logic with no external dependencies
- Sequelize TypeScript models with validation
- Custom exceptions with typed hierarchy
- Validation rules (password, email, numbers, etc.)
- Business entities and interfaces

**Application Layer:**
- Controllers handling HTTP requests/responses
- Service layer for business operations
- Middleware for cross-cutting concerns
- DTOs for request/response transformation

**Infrastructure Layer (infrastructure.layer/):**
- Database drivers (Sequelize with PostgreSQL)
- External service integrations (Email, Slack, MLflow)
- File storage operations
- Queue/job processing (BullMQ with Redis)
- Logging and monitoring

**Routes & HTTP Layer:**
- Express routes mapped to controllers
- Middleware applied per-route or globally
- Input validation on routes
- Error handling at route level

---

## 5. API ENDPOINTS & ROUTING FILES

### Route Files (Servers/routes/) - 40+ route definitions

**Core Routes:**
- `/api/users` - User management (login, registration, CRUD)
- `/api/projects` - Project management
- `/api/assessments` - Assessment tracking
- `/api/roles` - Role management
- `/api/organizations` - Organization management
- `/api/frameworks` - Framework definitions

**Compliance Routes:**
- `/api/eu-ai-act` - EU AI Act compliance
- `/api/iso-27001` - ISO 27001 compliance
- `/api/iso-42001` - ISO 42001 compliance

**Risk & Vendor Management:**
- `/api/projectRisks` - Project risk tracking
- `/api/vendors` - Vendor management
- `/api/vendorRisks` - Vendor risk assessment
- `/api/modelInventory` - ML model inventory
- `/api/modelRisks` - Model risk management
- `/api/risks` - Risk management

**File & Document Management:**
- `/api/files` - File upload/download
- `/api/file-manager` - Advanced file operations

**Integration Routes:**
- `/api/integrations/mlflow` - MLflow integration
- `/api/slackWebhooks` - Slack webhook management
- `/api/mail` - Email operations
- `/api/bias_and_fairness/` - Bias/fairness evaluation

**Administrative Routes:**
- `/api/dashboard` - Dashboard data
- `/api/reporting` - Report generation
- `/api/logger` - Logging endpoints
- `/api/policies` - Policy management
- `/api/tokens` - Token management
- `/api/automations` - Automation setup
- `/api/tasks` - Task management
- `/api/training` - Training registry
- `/api/docs` - Swagger documentation

**Authentication:**
All routes require JWT authentication via `authenticateJWT` middleware unless public (login, registration, password reset).

---

## 6. DATABASE INTERACTION FILES

### Key Database Files

**Connection & Configuration:**
- `/database/config/config.js` - Database connection configuration (development, production with SSL support)
- `/database/db.ts` - Sequelize instance initialization
- Environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

**Models (domain.layer/models/)** - 30+ Sequelize TypeScript models:

**Core Entities:**
- `user/user.model.ts` - User entity with role associations
- `organization/organization.model.ts` - Organization/tenant entity
- `role/role.model.ts` - Role-based access control

**Compliance Entities:**
- `assessment/assessment.model.ts` - Assessment tracking
- `question/question.model.ts` - Compliance questions
- `subcontrol/subcontrol.model.ts` - Control sub-elements

**Risk Management:**
- `risks/risk.model.ts` - Risk tracking
- `vendorRisk/vendorRisk.model.ts` - Vendor risk assessment
- `modelRisk/modelRisk.model.ts` - ML model risks

**Data Models:**
- `fileManager` - File storage and management
- `mlflowModelRecord.model.ts` - MLflow integration records
- `projectFrameworks.model.ts` - Framework assignments

**Migrations** (database/migrations/) - 100+ migrations:
- Initial schema setup (20250319225827-initial-setup.js)
- Table creation for all entities
- Schema evolution and updates
- Field type conversions
- Constraint updates

**Query Utilities** (utils/):
- `user.utils.ts` - User CRUD and authentication queries
- `project.utils.ts` - Project operations
- `risk.utils.ts` - Risk assessment queries
- `organization.utils.ts` - Organization queries
- `fileManager.utils.ts` - File operations
- `role.utils.ts` - Role-based queries

**Database Patterns:**
- Transaction support for multi-step operations
- Soft deletes where applicable
- Audit timestamps (created_at, updated_at)
- Foreign key relationships for data integrity
- Organization-scoped queries for multi-tenancy

---

## 7. AUTHENTICATION & AUTHORIZATION FILES

### Authentication Components

**JWT Token Management:**
- `/utils/jwt.utils.ts` - Token generation and validation
  - `generateToken()` - 1-hour access tokens
  - `generateRefreshToken()` - 30-day refresh tokens
  - `getTokenPayload()` - JWT verification with JWT_SECRET
  - `getRefreshTokenPayload()` - Refresh token verification

**Token Structure:**
```javascript
{
  id: number,              // User ID
  email: string,          // User email
  roleName: string,       // User role
  organizationId: number, // Tenant ID
  tenantId: string,       // Tenant hash
  expire: number          // Expiration timestamp
}
```

**Authentication Middleware:**
- `/middleware/auth.middleware.ts` - Core JWT validation
  - Bearer token extraction from Authorization header
  - JWT signature verification
  - Token expiration validation
  - Organization membership verification
  - Role consistency checking
  - Tenant hash validation
  - AsyncLocalStorage context propagation
  - Returns 400/401/403/406 with appropriate status codes

**Access Control:**
- `/middleware/accessControl.middleware.ts` - RBAC enforcement
  - `authorize()` function for role-based access
  - Requires authenticateJWT to run first
  - Supports multiple roles per endpoint
  - Returns 401 if role not found, 403 if unauthorized

**Supported Roles:**
- Admin - Full system access
- Reviewer - Review and approval permissions
- Editor - Content editing permissions
- Auditor - Read-only audit access

**User Controller Operations:**
- `/controllers/user.ctrl.ts` - User lifecycle management
  - `getAllUsers()` - Organization-scoped user listing
  - `getUserById()` - User retrieval
  - `createNewUser()` - User registration with validation
  - `login()` - Authentication with password verification
  - `updateUserById()` - User profile updates
  - `deleteUserById()` - User removal (with demo user protection)
  - `resetPassword()` - Password reset workflow
  - `refreshToken()` - Token refresh from refresh token

**Password Security:**
- `/domain.layer/validations/password.valid.ts` - Password validation
  - Minimum 8 characters, maximum 20
  - Requires: lowercase, uppercase, digit
  - Optional special character support
  - Bcrypt hashing with 10 salt rounds
  - Constant-time comparison via bcrypt.compare()

**Organization Isolation:**
- `/middleware/multiTenancy.middleware.ts` - Tenant enforcement
  - Validates organization creation rules
  - Environment-based multi-tenancy control (MULTI_TENANCY_ENABLED)
  - Domain-based access validation
  - First-organization exception for setup
- All user queries scoped to organizationId
- Role associations within organization context

**Security Utilities:**
- `/utils/auth.utils.ts` - Authentication helpers
- `/tools/getTenantHash.ts` - Tenant hash generation

---

## 8. FILE UPLOAD HANDLING

### File Upload Implementation

**Routes:**
- `/api/files` - Basic file upload (route: `/routes/file.route.ts`)
- `/api/file-manager` - Advanced file operations (route: `/routes/fileManager.route.ts`)

**File Upload Route Configuration:**
```typescript
// Basic file upload
router.post("/", authenticateJWT, upload.any("files"), postFileContent);

// Advanced file manager
router.post(
  "/",
  fileOperationsLimiter,
  authenticateJWT,
  authorize(["Admin", "Reviewer", "Editor"]),
  upload.single("file"),
  handleMulterError,
  uploadFile
);
```

**Multer Configuration:**
- **Storage**: Memory storage (not disk)
- **File Size Limit**: 30MB
- **File Type Filtering**: MIME type validation

**Allowed File Types:**
- Documents: PDF, DOC, DOCX, XLS, XLSX, CSV, MD
- Images: JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF
- Videos: MP4, MPEG, MOV, AVI, WMV, WEBM, MKV

**Security Measures:**
- MIME type validation with file extension checking
- File size enforcement (30MB limit)
- Rate limiting for file operations (15 requests/15 min)
- Role-based upload access (Admin, Reviewer, Editor only)
- Organization-scoped file storage
- Files stored in database (JSONB format)
- File access validation before download

**File Upload Controller:**
- `/controllers/fileManager.ctrl.ts` - Advanced file operations
  - `uploadFile()` - File upload with validation
  - `listFiles()` - Organization-scoped file listing
  - `downloadFile()` - File retrieval with access control
  - `removeFile()` - File deletion

**File Utilities:**
- `/utils/fileManager.utils.ts` - File operation helpers
- `/utils/validations/fileManagerValidation.utils` - File validation

**Multer Error Handling:**
- 413 status: File size exceeds 30MB
- 415 status: Unsupported file type
- 400 status: Other validation errors

---

## 9. EXTERNAL INTEGRATIONS

### Email Service Integration
**Location:** `/services/emailService.ts`

**Supported Providers:**
1. **Resend** (default)
   - Configuration: RESEND_API_KEY
   - Modern email API service

2. **SMTP** (Generic)
   - Configuration: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
   - Supports: Gmail, custom servers, etc.

3. **Exchange Online** (Office 365)
   - Configuration: EXCHANGE_ONLINE_USER, EXCHANGE_ONLINE_PASS
   - Enterprise Microsoft integration

4. **Exchange On-Premises**
   - Configuration: EXCHANGE_ONPREM_HOST, EXCHANGE_ONPREM_PORT, etc.
   - Self-hosted Exchange servers

5. **Amazon SES**
   - Configuration: AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, etc.
   - AWS email service

**Features:**
- Provider factory pattern for extensibility
- Credential refresh support
- MJML template compilation (`/tools/mjmlCompiler`)
- Email option validation
- Template data injection
- Attachment support
- Multiple recipient support

**Email Routes:**
- `/api/mail` - Email operations

### Slack Integration
**Location:** `/routes/slackWebhook.route.ts`, `/services/slack/`

**Features:**
- Webhook creation and management
- Message routing (SlackNotificationRoutingType enum)
- Webhook-based notifications
- Rate limiting (10 creations/hour)
- OAuth integration with Slack API
- Automatic message sending to channels

**Configuration:**
- SLACK_CLIENT_ID, SLACK_CLIENT_SECRET
- SLACK_URL, SLACK_API_URL
- SLACK_USER_OAUTH_TOKEN, SLACK_BOT_TOKEN

**Routes:**
```
POST   /api/slackWebhooks            - Create webhook
GET    /api/slackWebhooks            - List webhooks
GET    /api/slackWebhooks/:id        - Get webhook
PATCH  /api/slackWebhooks/:id        - Update webhook
DELETE /api/slackWebhooks/:id        - Delete webhook
POST   /api/slackWebhooks/:id/send   - Send message
```

### MLflow Integration
**Location:** `/routes/integrations.route.ts`, `/src/services/mlflow.service.ts`

**Features:**
- ML model tracking server connection
- Configuration management
- Model synchronization
- Test connection validation
- Configuration persistence
- Manual sync trigger

**Routes:**
```
POST   /api/integrations/mlflow/test       - Test connection
GET    /api/integrations/mlflow/config     - Get configuration
POST   /api/integrations/mlflow/configure  - Save configuration
GET    /api/integrations/mlflow/models     - Fetch models
```

**Background Workers:**
- `/services/mlflow/mlflowSyncWorker.ts` - Scheduled synchronization
- `/services/mlflow/mlflowSyncProducer.ts` - Job enqueuing

### Google OAuth Integration
**Configuration:**
- google-auth-library for OAuth flow
- Environment configuration for Google credentials
- Used for alternative user authentication

### Bias & Fairness Module
**Location:** `/BiasAndFairnessModule/`, `/BiasAndFairnessServers/`

**Features:**
- Separate Python service for ML bias evaluation
- Dataset loading and evaluation
- Fairness metrics calculation
- Visualization generation
- Inference capabilities
- Exposed via `/api/bias_and_fairness/` routes

**Architecture:**
- Runs as separate Docker container
- Internal Redis communication
- PostgreSQL data persistence
- HTTP interface via Python service

---

## 10. ADDITIONAL SECURITY COMPONENTS

### Rate Limiting
**Location:** `/middleware/rateLimit.middleware.ts`

**Limiters:**
- **fileOperationsLimiter**: 15 requests/15min (expensive operations)
- **generalApiLimiter**: 100 requests/15min (standard endpoints)
- **authLimiter**: 5 requests/15min (prevent brute force)

### Input Validation
**Validation Framework:**
- `/utils/validations/` - Validation utilities
- `/domain.layer/validations/` - Domain validations
  - email.valid.ts - Email format validation
  - password.valid.ts - Password requirements
  - number.valid.ts - Numeric validation
- Express-Validator integration on routes

### Exception Handling
**Location:** `/domain.layer/exceptions/custom.exception.ts`

**Exception Types:**
- CustomException - Base exception
- ValidationException (400)
- NotFoundException (404)
- UnauthorizedException (401)
- ForbiddenException (403)
- ConflictException (409)
- BusinessLogicException (422)
- DatabaseException (500)
- ExternalServiceException (502)
- ConfigurationException (500)

**Features:**
- Structured metadata
- Status code mapping
- Exception factory pattern
- Cause chain support

### Logging & Audit
**Location:** `/utils/logger/`, `/controllers/logger.ctrl.ts`

**Logging System:**
- Winston logger for structured logging
- Daily rotation of log files
- File logger with configurable levels
- Database event logging for audits
- Request context via AsyncLocalStorage
- Structured logging with helper functions
  - logProcessing(), logSuccess(), logFailure()
  - logStructured() for JSON logs
  - logEvent() for database audit trails

### Security Headers
- Helmet.js integration for HTTP security headers
- CORS configuration with origin validation
- Cookie parsing with security settings

### Environment Security
- Sensitive secrets via environment variables
- JWT_SECRET, REFRESH_TOKEN_SECRET for tokens
- Database credentials isolation
- Email provider API keys isolation
- Encryption algorithm configuration
- SSL/TLS support for production database connections

---

## 11. DEPLOYMENT & INFRASTRUCTURE

### Docker Compose Architecture
**Services:**
1. **postgresdb** - PostgreSQL 16.8 database
2. **redis** - Redis 7 caching/queue
3. **backend** - Express.js API server
4. **frontend** - React application
5. **worker** - BullMQ background job worker
6. **bias_and_fairness_backend** - Python ML service

### Environment Configuration
- `.env.dev` - Development setup
- `.env.prod` - Production setup
- Multi-environment support for deployment

### Database Migrations
- Sequelize CLI for schema management
- Pre-deployment migration execution (`npm run migrate-db`)
- 100+ migrations for schema evolution

---

## 12. KEY SECURITY CONSIDERATIONS FOR AUDIT

### Authentication & Authorization
- JWT with separate access/refresh tokens
- Multi-tenant organization isolation
- Role-based access control (4 roles)
- Tenant hash validation for token verification
- Token expiration checks (access: 1hr, refresh: 30days)

### Data Protection
- Bcrypt password hashing (10 rounds)
- Organization-scoped data queries
- Sensitive data filtering (toSafeJSON() methods)
- HTTPS/SSL support in production

### Input Validation
- MIME type and file size validation
- Email format validation
- Password strength requirements
- Express-Validator on all API routes
- DOMPurify for XSS prevention (frontend)

### Rate Limiting
- 5 attempts/15min for authentication
- 15 file operations/15min for uploads
- 100 general API requests/15min

### Logging & Monitoring
- Structured logging with request context
- Database audit trails for critical operations
- Error tracking and reporting
- Daily log rotation

### External Service Security
- Provider abstraction for email services
- OAuth support for Slack
- Configuration validation for integrations
- Error handling for external failures

### Multi-Tenancy
- Organization-scoped database queries
- Tenant hash validation in JWT
- Multi-tenancy mode configuration
- Domain-based access control

### Database Security
- Connection pooling
- SQL injection prevention via ORM
- Transaction support for data consistency
- SSL/TLS for production database connections
- Parameterized queries via Sequelize

---

## 13. FILE STRUCTURE SUMMARY

### Total Codebase Organization
- **Frontend (React/TypeScript)**: Organized by feature/layer
- **Backend (Express/TypeScript)**: Clean architecture with clear separation
- **Specialized Services**: Python ML module + FastAPI wrapper
- **Infrastructure**: Docker composition with multiple services
- **Database**: Sequelize models + 100+ migrations
- **Routes**: 40+ API route files with consistent patterns
- **Controllers**: 44 controller files for business logic
- **Services**: Multiple service layers for email, Slack, MLflow, automations
- **Middleware**: 8 middleware files covering auth, RBAC, rate limiting, etc.
- **Utilities**: Extensive utility functions for validations, auth, file operations

---

## CONCLUSION

VerifyWise is a well-architected, enterprise-grade AI governance platform with:
- Clear separation of concerns (clean architecture + DDD)
- Comprehensive authentication and authorization
- Multi-tenant support with proper isolation
- Extensive logging and audit capabilities
- Modern tech stack (React, Express, PostgreSQL, Redis)
- Modular design enabling future extensions
- Strong focus on compliance and security controls
