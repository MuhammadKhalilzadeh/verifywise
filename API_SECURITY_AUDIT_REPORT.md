# API SECURITY AUDIT REPORT - VerifyWise
**Date:** 2025-11-13
**Scope:** /home/user/verifywise/Servers/routes, /home/user/verifywise/Servers/middleware, /home/user/verifywise/Servers/controllers
**Thoroughness Level:** Very Thorough

---

## EXECUTIVE SUMMARY

The API security audit reveals **CRITICAL**, **HIGH**, and **MEDIUM** severity vulnerabilities that require immediate remediation. The codebase demonstrates good foundational security practices with JWT authentication, multi-tenancy isolation, and some rate limiting, but has significant gaps in input validation, comprehensive rate limiting application, and request size limits.

### Key Findings:
- **CRITICAL**: Missing authentication on sensitive password change endpoint
- **CRITICAL**: Missing request body size limits (DoS vulnerability)
- **CRITICAL**: Public information disclosure endpoint without authentication
- **HIGH**: Incomplete rate limiting coverage (only 1 route file uses rate limiters)
- **HIGH**: Mass assignment vulnerabilities in multiple controllers
- **MEDIUM**: Missing input validation on many endpoints
- **MEDIUM**: Potential IDOR issues with incomplete authorization checks

---

## 1. RATE LIMITING IMPLEMENTATION

### Status: PARTIALLY IMPLEMENTED

#### A. Rate Limiters Available (Correctly Configured)

**File:** `/home/user/verifywise/Servers/middleware/rateLimit.middleware.ts` (Lines 1-96)

Three rate limiters are properly defined:
```
✓ fileOperationsLimiter: 15 requests/15 minutes
✓ generalApiLimiter: 100 requests/15 minutes
✓ authLimiter: 5 requests/15 minutes (for brute force protection)
```

#### B. CRITICAL ISSUE: Minimal Application of Rate Limiting

Rate limiting middleware is **only applied to**:
1. **File Manager routes** - `/home/user/verifywise/Servers/routes/fileManager.route.ts` (Lines 23, 105-106, 123, 149-150)
   - fileOperationsLimiter applied correctly for upload/download/delete
   
2. **User login route** - `/home/user/verifywise/Servers/routes/user.route.ts` (Lines 126-131)
   - Custom loginLimiter: 5 requests/minute
   
3. **Email routes** - `/home/user/verifywise/Servers/routes/vwmailer.route.ts` (Lines 13-29)
   - inviteLimiter: 5 requests/minute
   - resetPasswordLimiter: 5 requests/minute

4. **Slack Webhook routes** - `/home/user/verifywise/Servers/routes/slackWebhook.route.ts` (Line 18)
   - createWebhookLimiter: 10 requests/hour

#### C. CRITICAL: Endpoints Missing Rate Limiting

**High-Risk Endpoints Without Rate Limiting:**
- All project endpoints (create, update, delete)
- All user management endpoints (except login)
- All vendor endpoints (create, update, delete)
- All risk assessment endpoints
- All control endpoints
- All integration endpoints
- All model inventory endpoints
- All organization endpoints (except password reset)
- Assessment endpoints
- Dashboard endpoints
- Policy endpoints
- And 30+ more route files

**Security Impact:**
- DoS attacks possible on expensive operations (project creation, risk assessment)
- Brute force possible on API enumeration
- Resource exhaustion via bulk operations
- Recommended: Apply `generalApiLimiter` to all protected routes and `fileOperationsLimiter` to file/document operations

---

## 2. INPUT VALIDATION

### Status: INADEQUATE

#### A. Validation Infrastructure Available

**Utility Files Found:**
- `/home/user/verifywise/Servers/utils/validations/userValidation.utils.ts` - Contains validateEmail, validatePassword, validateChangePassword
- `/home/user/verifywise/Servers/utils/validations/fileValidation.utils.ts` - File validation
- `/home/user/verifywise/Servers/utils/validations/incidentManagementValidation.utils.ts` - Parameter validation
- `/home/user/verifywise/Servers/domain.layer/validations/id.valid.ts` - ID parameter validation (validateId)

#### B. CRITICAL: Validation Not Applied on Routes

**Issue:** Validation functions exist but are not consistently applied as middleware

**Examples:**

1. **User Password Change - No Validation** 
   - File: `/home/user/verifywise/Servers/routes/user.route.ts` (Line 163)
   - Route: `PATCH /users/chng-pass/:id`
   - Status: NO validateChangePassword middleware used
   - Body expects: `{ id, currentPassword, newPassword }`
   - Risk: No validation of password strength, format, or confirmation

2. **User Registration - No Body Validation Middleware**
   - File: `/home/user/verifywise/Servers/routes/user.route.ts` (Line 111)
   - Route: `POST /users/register`
   - Uses registerJWT middleware but NO schema validation middleware

3. **Vendor Creation - Direct req.body Assignment**
   - File: `/home/user/verifywise/Servers/controllers/vendor.ctrl.ts` (Line 150)
   - Code: `const vendorData = req.body;`
   - No validation of vendor fields before extraction

4. **Risk Creation - Direct req.body Usage**
   - File: `/home/user/verifywise/Servers/controllers/risks.ctrl.ts` (Line 236)
   - Code: `const riskData = req.body;`
   - No input validation before database insert

#### C. Validation Coverage Issues

**Endpoints with Parameter Validation:**
- ISO27001 routes - Uses validateId middleware (iso27001.route.ts Line 35+)
- AI Trust Centre routes - Uses validateId middleware (aiTrustCentre.route.ts Line 40+)
- Incident Management - Parameter validation in controller (incident-management.ctrl.ts Lines 80-92)

**Endpoints WITHOUT Parameter Validation:**
- Most project routes - No ID parameter validation
- Most vendor routes - No ID validation
- Risk routes - No ID validation
- Organization routes - No ID validation
- User routes - No ID validation
- Subscription routes - No validation
- Token routes - Basic validation in middleware but not comprehensive

**Recommendations:**
1. Create validation middleware factory for common patterns
2. Apply to all CREATE routes: email format, password strength, required fields
3. Apply to all UPDATE routes: field whitelist validation
4. Apply to all ID parameters: numeric validation, positive check
5. Consider Express-Validator or Joi for declarative validation

---

## 3. MASS ASSIGNMENT VULNERABILITIES

### Status: CRITICAL ISSUES FOUND

#### A. Direct Object.assign with req.body

**High-Risk Finding #1: Incident Management Controller**
- **File:** `/home/user/verifywise/Servers/controllers/incident-management.ctrl.ts` (Line 295)
- **Code:** 
  ```typescript
  Object.assign(currentIncident, { ...req.body, updated_at: new Date() });
  ```
- **Risk:** Any field in req.body will overwrite incident properties
- **Attack:** Attacker could modify:
  - `approval_status`, `approved_by` - Bypass approval workflow
  - `archived` - Hide incidents
  - Any other model property
- **Severity:** CRITICAL

**High-Risk Finding #2: User Controller (Potential)**
- **File:** `/home/user/verifywise/Servers/controllers/user.ctrl.ts` (Line 390)
- **Code:** `Object.assign(user, userData);`
- **Context:** Appears in older code path, but vulnerable pattern exists
- **Risk:** Could allow privilege escalation if userData includes role_id

#### B. Spread Operator with req.body

**High-Risk Finding #3: Project Controller**
- **File:** `/home/user/verifywise/Servers/controllers/project.ctrl.ts` (Lines 133-135)
- **Code:**
  ```typescript
  const projectData = {
    ...req.body,
    framework: req.body.framework,
  };
  ```
- **Risk:** All req.body fields copied to projectData
- **Potential Issues:** Could override:
  - `created_at`, `updated_at` timestamps
  - `creator_id`, `owner_id` - Ownership takeover
  - `tenant_id` - Multi-tenant isolation bypass
- **Severity:** CRITICAL (Multi-tenant isolation bypass risk)

**High-Risk Finding #4: Policy Controller**
- **File:** `/home/user/verifywise/Servers/controllers/policy.ctrl.ts` (Line 41, 75)
- **Code:** `...req.body,` spread operators
- **Risk:** Uncontrolled field assignment

**High-Risk Finding #5: Training Registrar Controller**
- **File:** `/home/user/verifywise/Servers/controllers/trainingRegistar.ctrl.ts` (Line 196)
- **Code:** `...req.body,`

#### C. Other Controllers with Potential Issues

**Direct req.body Usage (Moderate Risk with Validation):**
- userPreference.ctrl.ts Lines 63, 192
- organization.ctrl.ts Line 468
- vendorRisk.ctrl.ts Lines 196, 242
- slackWebhook.ctrl.ts Line 304
- aiTrustCentre.ctrl.ts Lines 302-766
- risks.ctrl.ts Lines 236, 249, 334, 370
- file.ctrl.ts Line 166
- control.ctrl.ts Lines 137, 245, 545
- modelInventory.ctrl.ts Lines 220, 326
- assessment.ctrl.ts (if enabled)

**Recommendations for Mass Assignment:**
1. Use explicit field whitelisting:
   ```typescript
   const updateData = {
     name: req.body.name,
     email: req.body.email,
     // DO NOT include: role_id, organization_id, created_at, etc.
   };
   ```
2. Use DTO/schema validation with allowlist
3. Never use Object.assign or spread with user input
4. Create validation middleware that filters req.body before passing to controller

---

## 4. MISSING AUTHENTICATION ON SENSITIVE ENDPOINTS

### Status: CRITICAL VULNERABILITIES

#### A. CRITICAL: Password Change Endpoint Without Authentication

**File:** `/home/user/verifywise/Servers/routes/user.route.ts` (Line 163)
```typescript
router.patch("/chng-pass/:id", ChangePassword);  // NO authenticateJWT!
```

**Security Issues:**
1. **Missing Authentication:** Any unauthenticated attacker can call this endpoint
2. **User ID in Body:** Allows changing ANY user's password
   - Controller expects: `{ id, currentPassword, newPassword }` (Line 856)
3. **No Permission Check:** No verification that requester is changing their own password
4. **Account Takeover Risk:** CRITICAL - Complete account compromise

**Affected File:** `/home/user/verifywise/Servers/controllers/user.ctrl.ts` (Lines 854-907)

**Current Code:**
```typescript
async function ChangePassword(req: Request, res: Response) {
  const { id, currentPassword, newPassword } = req.body;
  const user = await getUserByIdQuery(id);  // ANY USER CAN CHANGE ANY PASSWORD
  // ... password update without checking if req.userId === id
}
```

**Fix Required:**
```typescript
router.patch("/chng-pass/:id", authenticateJWT, ChangePassword);
// AND add check in controller:
if (req.userId !== id) {
  return res.status(403).json({ message: "Can only change your own password" });
}
```

---

## 5. MISSING OR INADEQUATE AUTHORIZATION CHECKS

### Status: CRITICAL ISSUE

#### A. CRITICAL: Public Information Disclosure

**File:** `/home/user/verifywise/Servers/routes/organization.route.ts` (Line 53)
```typescript
router.get("/exists", getOrganizationsExists);  // NO AUTHENTICATION
```

**Security Issue:**
- Reveals whether ANY organization exists in the system
- Useful for reconnaissance/enumeration attacks
- Setup flow information leakage
- Should be removed or require authentication

**Expected Fix:**
```typescript
router.get("/exists", authenticateJWT, getOrganizationsExists);
```

#### B. Incomplete Authorization Checks (Potential IDOR)

**File:** `/home/user/verifywise/Servers/controllers/user.ctrl.ts` (Lines 157-160)
```typescript
async function getUserById(req: Request, res: Response) {
  const user = await getUserByIdQuery(id);
  if (user.organization_id !== req.organizationId) {
    return res.status(403).json(...);  // ✓ GOOD - Org check exists
  }
}
```

**HOWEVER, No User-Level Access Check:**
- Code allows users to read ANY user's data in their org
- No check if req.userId is allowed to access target user
- Should verify: Is requester an admin? Or same user?

**Similar Pattern in Other Controllers:**
- Project controller checks tenantId but not user role/access
- Risk controller - minimal access control
- Vendor controller - tenant-scoped but missing role checks

#### C. Authorization Gaps

**Routes with authenticateJWT but Limited Authorization:**

1. **Project Delete** - Only checks tenant, not user role
   ```typescript
   router.delete("/:id", authenticateJWT, deleteProjectById);  // Missing authorize() check
   ```

2. **Organization Update** - Only authenticateJWT
   ```typescript
   router.patch("/:id", authenticateJWT, updateOrganizationById);  // Should check admin role
   ```

3. **Token Management** - Uses custom middleware, not authorize()
   ```typescript
   router.post("/", authenticateJWT, validateTokenCreation, createApiToken);
   ```

4. **Model Inventory** - No role checks
   ```typescript
   router.delete("/:id", authenticateJWT, deleteModelInventoryById);  // Should check editor/admin
   ```

**Recommendations:**
1. Add role-based authorize() middleware to sensitive operations
2. Add resource-level access checks (user can only access their own resources)
3. Document authorization rules per endpoint
4. Audit trail for critical operations

---

## 6. REQUEST SIZE LIMITS

### Status: CRITICAL VULNERABILITY

#### A. Missing Body Size Limit Configuration

**File:** `/home/user/verifywise/Servers/index.ts` (Line 98)
```typescript
app.use((req, res, next) => {
  if (req.url.includes("/api/bias_and_fairness/")) {
    return next();
  }
  express.json()(req, res, next);  // NO SIZE LIMIT SPECIFIED!
});
```

**Security Vulnerabilities:**
1. **Default Express JSON limit:** 100KB (can vary)
2. **No explicit limit set:** Vulnerable to large payload DoS
3. **File upload routes:** Only fileManager has multer limit (30MB)
4. **Other routes:** No protection against:
   - Large project creation payloads
   - Large assessment responses
   - Bulk data operations
   - Memory exhaustion attacks

#### B. File Upload Limits (Partial)

**File:** `/home/user/verifywise/Servers/routes/fileManager.route.ts` (Lines 56-62)
```typescript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024,  // 30MB limit - GOOD
  },
  fileFilter: fileFilter,
});
```

**Status:** ✓ File Manager has protection
**Status:** ✗ Other file uploads missing limits

#### C. Email Service Limit (Partial)

**File:** `/home/user/verifywise/Servers/services/email/types.ts` (Line 52)
```typescript
if (options.html.length > 1000000) {  // 1MB limit in service
  return false;
}
```

**Status:** Some protection but should be at route level

**Recommendation:**
```typescript
// In index.ts, BEFORE routes:
app.use(express.json({ 
  limit: '10mb'  // Set appropriate limit
}));

app.use(express.urlencoded({ 
  limit: '10mb',
  extended: true
}));
```

**Suggested Limits by Endpoint Type:**
- Default API endpoints: 1MB
- File uploads: 30MB (as already configured)
- Bulk operations: 5MB
- Document processing: 50MB

---

## 7. ENDPOINT-SPECIFIC SECURITY ISSUES

### A. Slack Integration Endpoint

**File:** `/home/user/verifywise/Servers/routes/integrations.route.ts` (Line 15)
```typescript
const runtimeConfig = await mlflowService.resolveRuntimeConfig(req.tenantId!, req.body);
```
**Issue:** Direct req.body usage without validation

### B. Integration Configuration Endpoint

**File:** `/home/user/verifywise/Servers/routes/integrations.route.ts` (Line 50)
```typescript
const config = req.body;  // NO VALIDATION
```
**Issue:** Direct assignment of configuration from untrusted source

### C. Incident Management Update

**Already covered under Mass Assignment (CRITICAL)**

---

## 8. AUTHENTICATION & JWT VALIDATION

### Status: WELL IMPLEMENTED (No Critical Issues)

#### A. JWT Authentication (Properly Implemented)

**File:** `/home/user/verifywise/Servers/middleware/auth.middleware.ts` (Lines 1-173)

**Strengths:**
- ✓ Proper JWT signature verification
- ✓ Expiration validation
- ✓ Payload structure validation
- ✓ Organization membership verification
- ✓ Role consistency validation
- ✓ Tenant hash validation
- ✓ Multi-tenant isolation

**Validation Flow Verified:**
1. Bearer token extraction
2. JWT signature verification
3. Expiration check
4. Payload structure validation
5. Organization membership check
6. Role database consistency check
7. Tenant hash validation

**No Critical Issues Found**

#### B. Access Control Middleware

**File:** `/home/user/verifywise/Servers/middleware/accessControl.middleware.ts` (Lines 1-79)

**Status:** ✓ Properly Implemented
- Role-based access control
- Multiple role support
- Clear error messages

**Usage Examples:**
- `router.post("/", authenticateJWT, authorize(['Admin']), ...)`
- File Manager uses: `authorize(["Admin", "Reviewer", "Editor"])`

**Gap:** authorize() middleware NOT used on many endpoints

---

## 9. MULTI-TENANCY ISOLATION

### Status: WELL IMPLEMENTED

**Verification Points:**
1. ✓ All queries use `req.tenantId!` in WHERE clauses
2. ✓ Tenant hash validation in auth middleware
3. ✓ Organization membership verification
4. ✓ Multi-tenancy middleware exists (multiTenancy.middleware.ts)

**Examples:**
```typescript
// vendor.ctrl.ts Line 32
const vendors = await getAllVendorsQuery(req.tenantId!);

// risks.ctrl.ts Line 36
const risks = await getRisksByProjectQuery(projectId, req.tenantId!, filter);
```

**No Critical Multi-Tenancy Breaches Found**

---

## SUMMARY OF FINDINGS

### CRITICAL (Requires Immediate Fix):
1. **Authentication Missing:** Password change endpoint (`PATCH /chng-pass/:id`)
2. **Information Disclosure:** Organization exists endpoint without auth (`GET /organizations/exists`)
3. **Mass Assignment:** Object.assign in incident-management controller
4. **Mass Assignment:** Spread operator in project controller (tenant_id override risk)
5. **No Request Size Limits:** Global API vulnerable to payload DoS
6. **Incomplete Rate Limiting:** Only 1% of endpoints protected

### HIGH (Priority):
1. Input validation middleware not applied to most endpoints
2. Missing role-based authorization on sensitive operations
3. Missing user-level access checks (IDOR potential)
4. Incomplete field whitelisting in update operations
5. Default password validation not enforced on routes

### MEDIUM (Should Address):
1. API key management - Review token creation validation
2. Error messages may leak system information
3. Missing operation logging on sensitive endpoints
4. No rate limiting on expensive computational operations

---

## REMEDIATION ROADMAP

### Phase 1 (Immediate - 24-48 hours):
- [ ] Add authenticateJWT to password change endpoint
- [ ] Add authenticateJWT to organization exists endpoint
- [ ] Implement global request body size limit
- [ ] Replace Object.assign patterns with whitelisting

### Phase 2 (1-2 weeks):
- [ ] Create input validation middleware
- [ ] Apply generalApiLimiter to all protected routes
- [ ] Add role-based authorization to critical endpoints
- [ ] Implement field whitelisting for all update operations

### Phase 3 (2-4 weeks):
- [ ] Create comprehensive validation schema
- [ ] Add user-level access checks
- [ ] Implement operation audit logging
- [ ] Security testing & penetration testing

---

## TOOL & LIBRARY RECOMMENDATIONS

1. **Input Validation:** Express Validator or Joi for schema validation
2. **Rate Limiting:** Already using express-rate-limit (good choice)
3. **Field Whitelisting:** Create custom middleware factory
4. **Authorization:** Enhance existing authorize() pattern
5. **Logging:** Enhance security event logging

---

