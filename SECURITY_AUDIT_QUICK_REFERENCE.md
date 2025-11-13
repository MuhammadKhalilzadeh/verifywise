# API SECURITY AUDIT - QUICK REFERENCE

## CRITICAL VULNERABILITIES (Fix Immediately)

### 1. Unauthenticated Password Change Endpoint
- **File:** `/home/user/verifywise/Servers/routes/user.route.ts` (Line 163)
- **Issue:** `PATCH /users/chng-pass/:id` - NO authenticateJWT middleware
- **Impact:** Any user can change ANY other user's password → Account takeover
- **Fix:** Add `authenticateJWT` and add permission check in controller

### 2. Information Disclosure - Public Endpoint
- **File:** `/home/user/verifywise/Servers/routes/organization.route.ts` (Line 53)
- **Issue:** `GET /organizations/exists` - Reveals if any org exists (no auth required)
- **Impact:** Reconnaissance attack, setup flow leakage
- **Fix:** Add `authenticateJWT` middleware

### 3. Mass Assignment - Object.assign with req.body
- **File:** `/home/user/verifywise/Servers/controllers/incident-management.ctrl.ts` (Line 295)
- **Issue:** `Object.assign(currentIncident, { ...req.body, updated_at: new Date() })`
- **Impact:** Can override approval_status, approved_by, archived fields
- **Fix:** Implement field whitelisting instead

### 4. Mass Assignment - Spread Operator in Project
- **File:** `/home/user/verifywise/Servers/controllers/project.ctrl.ts` (Lines 133-135)
- **Issue:** `{ ...req.body, framework: req.body.framework }`
- **Impact:** Could override tenant_id, creator_id (multi-tenancy bypass risk)
- **Fix:** Use explicit field extraction instead

### 5. No Request Body Size Limits
- **File:** `/home/user/verifywise/Servers/index.ts` (Line 98)
- **Issue:** `express.json()` with NO limit specified
- **Impact:** DoS via large payloads, memory exhaustion
- **Fix:** Set `express.json({ limit: '10mb' })`

### 6. Incomplete Rate Limiting
- **Files:** Only `/fileManager.route.ts`, `/user.route.ts` (login), `/vwmailer.route.ts`, `/slackWebhook.route.ts`
- **Issue:** 40+ route files have NO rate limiting
- **Impact:** DoS on expensive operations, brute force on API
- **Fix:** Apply `generalApiLimiter` to all protected routes

---

## HIGH PRIORITY VULNERABILITIES

### 7. Missing Input Validation on Routes
- **Validation utilities exist but NOT applied as middleware:**
  - `validateChangePassword` - Not used on password change route
  - `validateId` - Not used on most endpoints
  - Schema validation - Not applied to create/update routes

### 8. Missing Role-Based Authorization
- **Issue:** Many endpoints only check `authenticateJWT` but not `authorize(['Admin'])`
- **Affected endpoints:**
  - Project delete (`/api/projects/:id`)
  - Organization update (`/api/organizations/:id`)
  - Model inventory operations
  - Token management

### 9. Incomplete Authorization Checks (IDOR Risk)
- **Issue:** Controllers check `tenantId` but not user-level access
- **Example:** Any user in org can read ANY other user's data
- **Fix:** Add user-level permission checks in controllers

### 10. Direct req.body Usage Without Validation
- **Files with issues:**
  - `vendor.ctrl.ts` Line 150
  - `risks.ctrl.ts` Line 236
  - `slackWebhook.ctrl.ts` Line 304
  - `policy.ctrl.ts` Lines 41, 75
  - `trainingRegistar.ctrl.ts` Line 196
  - `organization.ctrl.ts` Line 468

---

## VULNERABILITY MATRIX

| Vulnerability | Severity | File(s) | Line(s) | Impact |
|---|---|---|---|---|
| Missing Auth on Password Change | CRITICAL | user.route.ts | 163 | Account Takeover |
| Public Organization Exists | CRITICAL | organization.route.ts | 53 | Info Disclosure |
| Object.assign Mass Assignment | CRITICAL | incident-management.ctrl.ts | 295 | Business Logic Bypass |
| Spread Operator Mass Assignment | CRITICAL | project.ctrl.ts | 133-135 | Multi-tenant Bypass |
| No Request Size Limits | CRITICAL | index.ts | 98 | DoS |
| Incomplete Rate Limiting | CRITICAL | 40+ route files | Various | DoS |
| Missing Input Validation | HIGH | user.route.ts, others | 163, 111 | Type Coercion, Injection |
| Missing Authorization Checks | HIGH | projects.route.ts, others | 72, 106 | Unauthorized Access |
| Incomplete Access Control | HIGH | project.ctrl.ts, others | Various | IDOR |
| Direct req.body Assignment | HIGH | vendor, risks, policy, etc | 150, 236, 41 | Mass Assignment |

---

## RATE LIMITING COVERAGE ANALYSIS

### ✓ PROTECTED Routes (4 files):
1. `fileManager.route.ts` - fileOperationsLimiter
2. `user.route.ts` - loginLimiter (login only)
3. `vwmailer.route.ts` - inviteLimiter, resetPasswordLimiter
4. `slackWebhook.route.ts` - createWebhookLimiter

### ✗ UNPROTECTED Routes (40+ files):
- assessment.route.ts
- automation.route.ts
- biasAndFairnessRoutes.route.ts
- control.route.ts
- controlCategory.route.ts
- dashboard.route.ts
- eu.route.ts
- file.route.ts
- frameworks.route.ts
- integrations.route.ts
- iso27001.route.ts
- iso42001.route.ts
- logger.route.ts
- modelInventory.route.ts
- modelInventoryHistory.route.ts
- modelRisk.route.ts
- organization.route.ts
- policy.route.ts
- project.route.ts
- projectScope.route.ts
- question.route.ts
- risks.route.ts
- riskHistory.route.ts
- role.route.ts
- subscription.route.ts
- task.route.ts
- tokens.route.ts
- topic.route.ts
- vendor.route.ts
- vendorRisk.route.ts
- + more...

---

## WHAT'S WORKING WELL

### ✓ JWT Authentication
- Proper signature verification
- Expiration validation
- Payload structure validation
- Organization membership check
- Tenant hash validation

### ✓ Multi-Tenancy Isolation
- All queries filtered by `req.tenantId!`
- Tenant data segregation
- Organization-scoped access

### ✓ Role-Based Access Control
- `authorize()` middleware exists
- When used properly on routes
- Clear error responses

### ✓ File Upload Limits
- 30MB limit on file manager uploads
- File type validation
- MIME type checking

---

## REMEDIATION CHECKLIST

### IMMEDIATE (24 hours)
- [ ] Add `authenticateJWT` to `/users/chng-pass/:id`
- [ ] Add permission check: `if (req.userId !== id) return 403`
- [ ] Add `authenticateJWT` to `/organizations/exists`
- [ ] Add `express.json({ limit: '10mb' })` in index.ts
- [ ] Replace `Object.assign` with field whitelisting in incident-management.ctrl.ts
- [ ] Replace spread operator in project.ctrl.ts

### WEEK 1
- [ ] Create validation middleware factory
- [ ] Apply `generalApiLimiter` to all POST/PUT/PATCH/DELETE routes
- [ ] Add `authorize()` to sensitive operations
- [ ] Add field whitelisting to all update controllers

### WEEK 2-3
- [ ] Implement comprehensive input validation schema
- [ ] Add user-level access checks to all resource endpoints
- [ ] Add operation audit logging
- [ ] Security testing on all endpoints

### WEEK 4+
- [ ] Penetration testing
- [ ] Security code review
- [ ] Update documentation
- [ ] Deploy to production

---

## FILES TO REVIEW IMMEDIATELY

### Critical Priority
1. `/home/user/verifywise/Servers/routes/user.route.ts` (Lines 163)
2. `/home/user/verifywise/Servers/routes/organization.route.ts` (Line 53)
3. `/home/user/verifywise/Servers/controllers/incident-management.ctrl.ts` (Line 295)
4. `/home/user/verifywise/Servers/controllers/project.ctrl.ts` (Lines 133-135)
5. `/home/user/verifywise/Servers/index.ts` (Line 98)

### High Priority
1. `/home/user/verifywise/Servers/routes/project.route.ts` (All routes)
2. `/home/user/verifywise/Servers/routes/vendor.route.ts` (All routes)
3. `/home/user/verifywise/Servers/routes/risks.route.ts` (All routes)
4. `/home/user/verifywise/Servers/controllers/vendor.ctrl.ts` (Line 150)
5. `/home/user/verifywise/Servers/controllers/risks.ctrl.ts` (Line 236)

---

## RELATED FILES FOR REFERENCE

**Middleware:**
- `/home/user/verifywise/Servers/middleware/auth.middleware.ts` - JWT auth (GOOD)
- `/home/user/verifywise/Servers/middleware/accessControl.middleware.ts` - RBAC (GOOD but underused)
- `/home/user/verifywise/Servers/middleware/rateLimit.middleware.ts` - Rate limiting config
- `/home/user/verifywise/Servers/middleware/tokens.middleware.ts` - Token validation

**Validation Utilities:**
- `/home/user/verifywise/Servers/utils/validations/userValidation.utils.ts`
- `/home/user/verifywise/Servers/utils/validations/fileValidation.utils.ts`
- `/home/user/verifywise/Servers/domain.layer/validations/id.valid.ts`

---

## RECOMMENDED ACTIONS

1. **Create Pull Request:** Address CRITICAL issues in Phase 1
2. **Create Security Issues:** Track HIGH priority items
3. **Update Documentation:** Document authorization rules per endpoint
4. **Add Tests:** Security tests for each vulnerability
5. **Code Review:** Security-focused review process

---

For full details, see: `/home/user/verifywise/API_SECURITY_AUDIT_REPORT.md`
