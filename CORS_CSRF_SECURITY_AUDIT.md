# CORS and CSRF Security Audit Report - VerifyWise

**Date:** 2025-11-13
**Audit Scope:** CORS Configuration, CSRF Protections, and Cookie Security
**Thoroughness Level:** Very Thorough

---

## EXECUTIVE SUMMARY

The application implements a **JWT-based authentication architecture** with CORS middleware and HTTP-only cookies for refresh tokens. The security posture is **MODERATE with some concerns**:

- ✓ CORS origin validation is properly configured
- ✓ JWT tokens provide strong authentication
- ✓ HTTP-only cookies prevent XSS token theft
- ⚠ SameSite=none in production requires Secure flag (correctly set)
- ⚠ No explicit CSRF token implementation (acceptable for JSON APIs with JWT)
- ⚠ Client-side credentials config uses `withCredentials: false` by default
- ⚠ Some public endpoints lack authentication where they may need it

---

## 1. CORS CONFIGURATION AUDIT

### 1.1 CORS Middleware Setup

**File:** `/home/user/verifywise/Servers/index.ts` (Lines 83-91)

```typescript
app.use(
  cors({
    origin: (origin, callback) => {
      testOrigin({ origin, allowedOrigins, callback });
    },
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  }),
);
```

**Status:** PROPERLY CONFIGURED

**Details:**
- Custom origin validation function implemented
- Credentials enabled (allows cookies)
- Allowed headers limited to necessary ones
- Dynamic origin parsing from environment variables

### 1.2 Origin Validation Logic

**File:** `/home/user/verifywise/Servers/utils/parseOrigins.utils.ts` (Lines 56-62)

```typescript
const testOrigin = ({origin, allowedOrigins, callback}: TestOrigin): void => {
    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
};
```

**Status:** SECURE WITH CAVEAT

**Security Details:**
- Undefined origin is ALLOWED (browser requests without Origin header)
- Matching origins are validated against allowedOrigins array
- Explicit rejection for non-matching origins

**⚠ SECURITY CONCERN:**
- Undefined origin is treated as allowed - this affects requests from file:// URLs and certain browser scenarios
- **Impact:** Low - typically only affects development environments

### 1.3 Allowed Origins Configuration

**Files Checked:**
- `.env.dev` (Line 7): `["http://localhost:5173", "http://localhost:8082", "http://localhost:3000"]`
- `.env.prod` (Line 7): `["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"]`

**Status:** REQUIRES PRODUCTION UPDATE

**Findings:**
- Development configuration has multiple localhost ports (reasonable for local development)
- Production configuration STILL uses localhost - NOT PRODUCTION READY
- Configuration requires manual replacement before deployment

**⚠ CRITICAL FINDING:**
- Production `.env.prod` still contains localhost origins
- **Recommendation:** Update to actual deployment domain before going live

### 1.4 Preflight Request Handling

**Status:** HANDLED BY EXPRESS-CORS

The `cors` package automatically handles:
- OPTIONS requests (preflights)
- Access-Control-Allow-Origin headers
- Access-Control-Allow-Methods
- Access-Control-Allow-Credentials headers

**No custom preflight handling found** - relies on default cors behavior ✓

### 1.5 Credentials Handling

**Status:** ENABLED AND PROPERLY CONFIGURED

- CORS `credentials: true` enables cookie/auth header sending
- Client-side (`customAxios.ts` lines 84-86): Credentials enabled ONLY for auth endpoints:
  ```typescript
  if (config.url?.includes('/users/login') || config.url?.includes('/users/refresh-token')) {
    config.withCredentials = true;
  }
  ```

**Security Assessment:**
- Default: `withCredentials: false` (safer default)
- Selective enable for sensitive endpoints (good practice)
- Prevents accidental credential leakage in non-auth requests

---

## 2. CSRF PROTECTION AUDIT

### 2.1 CSRF Token Implementation

**Finding:** ✓ NO EXPLICIT CSRF TOKENS FOUND

**Grep Results:**
```
No matches found for: csrf|CSRF|X-CSRF|x-csrf
```

**Analysis:**
The application does NOT implement traditional CSRF tokens. This is **ACCEPTABLE** because:

1. **JWT-Based Authentication:** Uses Authorization header (not automatic cookies)
2. **State-Changing Operations Protected:** All POST/PUT/DELETE require JWT
3. **JSON API Design:** CORS preflight requests provide some CSRF protection

### 2.2 State-Changing Operations Protection

**Audit of Critical Routes:**

#### User Routes (`/Servers/routes/user.route.ts`)
```typescript
router.post("/login", loginLimiter, loginUser);                    // Public (rate-limited)
router.post("/refresh-token", refreshAccessToken);                 // Public
router.post("/register", registerJWT, createNewUser);              // Requires invitation token
router.patch("/:id", authenticateJWT, updateUserById);             // Protected ✓
router.delete("/:id", authenticateJWT, deleteUserById);            // Protected ✓
```

**Status:** GOOD - State changes protected

#### Project Routes (`/Servers/routes/project.route.ts`)
```typescript
router.post("/", authenticateJWT, createProject);                  // Protected ✓
router.patch("/:id", authenticateJWT, updateProjectById);          // Protected ✓
router.delete("/:id", authenticateJWT, deleteProjectById);         // Protected ✓
```

**Status:** GOOD - All state-changing operations protected

#### Organization Routes (`/Servers/routes/organization.route.ts`)
```typescript
router.post("/", checkMultiTenancy, createOrganization);           // Multi-tenant gated ✓
router.patch("/:id", authenticateJWT, updateOrganizationById);     // Protected ✓
```

**Status:** GOOD - Organization changes protected

#### Vendor Routes (`/Servers/routes/vendor.route.ts`)
```typescript
router.post("/", authenticateJWT, createVendor);                   // Protected ✓
router.patch("/:id", authenticateJWT, updateVendorById);           // Protected ✓
router.delete("/:id", authenticateJWT, deleteVendorById);          // Protected ✓
```

**Status:** GOOD - All protected

#### Risk Routes (`/Servers/routes/risks.route.ts`)
```typescript
router.post("/", authenticateJWT, createRisk);                     // Protected ✓
router.put("/:id", authenticateJWT, updateRiskById);               // Protected ✓
router.delete("/:id", authenticateJWT, deleteRiskById);            // Protected ✓
```

**Status:** GOOD - All protected

#### ModelRisk Routes (`/Servers/routes/modelRisk.route.ts`)
```typescript
router.use(authenticateJWT);  // Global middleware for all routes ✓

router.post("/", createNewModelRisk);                              // Protected ✓
router.put("/:id", updateModelRiskById);                           // Protected ✓
router.delete("/:id", deleteModelRiskById);                        // Protected ✓
```

**Status:** GOOD - Global authentication middleware

#### Integrations Routes (`/Servers/routes/integrations.route.ts`)
```typescript
router.use(authenticateJWT);  // Global middleware ✓

router.post('/test', async (req: Request, res: Response) => {      // Protected ✓
router.post('/configure', async (req: Request, res: Response) => { // Protected ✓
```

**Status:** GOOD - Protected by global middleware

#### Email/Mailer Routes (`/Servers/routes/vwmailer.route.ts`)
```typescript
router.post("/invite", inviteLimiter, async (req, res) => {        // RATE-LIMITED ONLY ⚠
router.post("/reset-password", resetPasswordLimiter, async (req, res) => { // RATE-LIMITED ONLY ⚠
```

**Status:** ⚠ SPECIAL CASE - Public endpoints with rate limiting
- These are intentionally public for user onboarding (invite/reset-password)
- Rate limiting provides CSRF/abuse protection

### 2.3 CSRF Risk Assessment

**Conclusion:** CSRF RISK IS MINIMAL

**Reasons:**
1. JWT tokens in Authorization header (not automatic cookies)
2. All state changes require JWT authentication
3. Cross-origin requests blocked by CORS
4. Preflight checks prevent form-based attacks

---

## 3. COOKIE SECURITY AUDIT

### 3.1 Cookie Implementation

**Only Cookie Found:** `refresh_token`

**File:** `/home/user/verifywise/Servers/utils/auth.utils.ts` (Lines 40-46)

```typescript
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  path: '/api/users',
  expires: new Date(Date.now() + 1 * 3600 * 1000 * 24 * 30), // 30 days
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});
```

### 3.2 HttpOnly Flag

**Status:** ✓ PROPERLY CONFIGURED

```
httpOnly: true
```

**Security Impact:**
- Prevents JavaScript (XSS) from accessing the token
- Token cannot be stolen via `document.cookie`
- Only sent via HTTP/HTTPS requests
- Rating: EXCELLENT

### 3.3 Secure Flag

**Status:** ✓ PROPERLY CONFIGURED (for production)

```typescript
secure: process.env.NODE_ENV === 'production'
```

**Details:**
- **Production:** `secure: true` - Only sent over HTTPS
- **Development:** `secure: false` - Allows HTTP
- Rating: GOOD

**⚠ DEVELOPMENT CONCERN:**
- Development environment accepts insecure (HTTP) cookies
- This is acceptable for local development but should never be used in staging/production

### 3.4 SameSite Attribute

**Status:** ✓ CONFIGURED WITH CAVEAT

```typescript
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
```

**Configuration Details:**

| Environment | SameSite Value | Secure Flag | Status |
|-----------|----------------|----------|--------|
| Production | `'none'` | `true` | ✓ CORRECT |
| Development | `'lax'` | `false` | ✓ CORRECT |

**Analysis:**

**Production: SameSite='none'**
- Required when Secure=true (HTTPS)
- Must be used for cross-site cookie transmission
- Requires Secure flag (✓ implemented)
- Use case: Browser sends cookie in cross-origin POST requests

**Development: SameSite='lax'**
- Appropriate for HTTP-only development
- Provides reasonable CSRF protection
- Allows top-level navigation with cookies

**Rating:** PROPERLY IMPLEMENTED ✓

### 3.5 Path Restriction

**Status:** ✓ PROPERLY RESTRICTED

```typescript
path: '/api/users'
```

**Security Impact:**
- Cookie only sent to `/api/users` and subdirectories
- Not sent to other API endpoints (`/api/projects`, `/api/vendors`, etc.)
- Reduces CSRF attack surface
- Rating: GOOD

### 3.6 Expiration

**Status:** ✓ REASONABLE EXPIRATION

```typescript
expires: new Date(Date.now() + 1 * 3600 * 1000 * 24 * 30) // 30 days
```

**Analysis:**
- 30-day expiration is reasonable for refresh tokens
- Balance between security and user experience
- Could be shorter for enhanced security (recommendation: 7-14 days)

### 3.7 Cookie Clear on Logout

**Finding:** ⚠ NO LOGOUT ENDPOINT FOUND

**Status:** MISSING SECURITY FEATURE

**Grep Result:**
```
No matches for: logout
```

**Impact:**
- No server-side logout to clear refresh_token cookie
- Cookie expires after 30 days
- Potential security gap for manual logout

**⚠ SECURITY CONCERN - MEDIUM SEVERITY:**
- User cannot explicitly clear session server-side
- Refresh token lingers until expiration
- Attackers with cookie access have 30 days

**Recommendation:**
- Implement logout endpoint that clears refresh_token cookie
- Example:
  ```typescript
  router.post("/logout", authenticateJWT, (req, res) => {
    res.clearCookie('refresh_token', { path: '/api/users' });
    res.status(200).json({ message: 'Logged out' });
  });
  ```

### 3.8 Multiple Cookie Issues

**Finding:** ✓ ONLY ONE COOKIE (refresh_token)

**Analysis:**
- Single cookie simplifies security
- Access token stored in localStorage (JS accessible, but XSS vulnerable)
- Good separation: sensitive token in HTTP-only cookie, access token in memory/localStorage

**Trade-off Assessment:**
- ✓ Refresh token protected from XSS
- ⚠ Access token vulnerable to XSS (inherent to JWT stored in JS)
- This is acceptable with good XSS prevention (CSP, input validation, output encoding)

---

## 4. AUTHENTICATION FLOW SECURITY

### 4.1 Login Flow

**File:** `/home/user/verifywise/Servers/controllers/user.ctrl.ts` (Lines 375-433)

```typescript
async function loginUser(req: Request, res: Response): Promise<any> {
  // 1. Get user by email
  const userData = await getUserByEmailQuery(email);
  
  // 2. Verify password with bcrypt
  let passwordIsMatched = await user.comparePassword(password);
  
  // 3. Generate tokens (sets refresh cookie internally)
  const { accessToken } = generateUserTokens({...}, res);
  
  // 4. Return access token in response
  return res.status(202).json({ token: accessToken });
}
```

**Route Protection:** Rate-limited but NOT authenticated (correct for login)

```typescript
router.post("/login", loginLimiter, loginUser);
```

**Rate Limiting:**
```typescript
windowMs: 1 * 60 * 1000,  // 1 minute
max: 5,                    // 5 attempts per minute
```

**Status:** ✓ GOOD - Rate limiting prevents brute force

### 4.2 Token Refresh Flow

**File:** `/home/user/verifywise/Servers/controllers/user.ctrl.ts` (Lines 466-510)

```typescript
async function refreshAccessToken(req: Request, res: Response): Promise<any> {
  // 1. Get refresh token from cookie
  const refreshToken = req.cookies.refresh_token;
  
  // 2. Verify JWT signature
  const decoded = getRefreshTokenPayload(refreshToken);
  
  // 3. Check expiration
  if (decoded.expire < Date.now()) {
    return res.status(406).json({ message: 'Token expired' });
  }
  
  // 4. Generate new access token
  const newAccessToken = generateToken({...});
  
  // 5. Return new token
  return res.status(200).json({ token: newAccessToken });
}
```

**Route Protection:** NOT authenticated

```typescript
router.post("/refresh-token", refreshAccessToken);
```

**Status:** ✓ CORRECT - Doesn't require JWT, uses cookie instead

**Client-Side Handling:** `/home/user/verifywise/Clients/src/infrastructure/api/customAxios.ts` (Lines 164-169)

```typescript
const response = await CustomAxios.post(
  `/users/refresh-token`,
  {},
  { withCredentials: true }
);
```

**Status:** ✓ Credentials enabled for refresh endpoint

### 4.3 JWT Secrets

**Files:** `.env.dev` and `.env.prod` (Lines 28-29)

```
JWT_SECRET=aacc459503e937c73ac3c4ebd874578a81b95861e83cdd923eeca8f7dadffea9d026e1581ee966a7fc4a74a8c6126ddec75c2c662ed7777a90e3aefb00ef1a87
REFRESH_TOKEN_SECRET=e628d7938c76308774cecf87dcb9bee6b8cae80ed2d20731ef94e211cf9c9b82b4632b55cead3632d59dd72d7e0d28f0afe125bfeaa0ea82b548be86c0de179d
```

**Status:** ⚠ CRITICAL - SECRETS EXPOSED IN ENV FILES

**Findings:**
- Same secrets in both `.env.dev` and `.env.prod`
- **SAME secrets across environments is NOT recommended**
- Secrets appear to be in version control (security risk)

**⚠ CRITICAL SECURITY ISSUE:**
- If repositories are public or compromised, JWT signing is broken
- Any attacker can forge valid tokens
- Immediate action required: rotate these secrets in production

**Recommendation:**
- Use different secrets for each environment
- Store production secrets in secure vault (AWS Secrets Manager, HashiCorp Vault)
- Never commit secrets to version control

### 4.4 Token Expiration

**File:** `/home/user/verifywise/Servers/utils/jwt.utils.ts`

```typescript
// Access Token
expire: Date.now() + 1 * 3600 * 1000, // 1 hour

// Refresh Token
expire: Date.now() + 1 * 3600 * 1000 * 24 * 30 // 30 days
```

**Status:** ✓ REASONABLE EXPIRATION TIMES

| Token | Duration | Assessment |
|-------|----------|-----------|
| Access Token | 1 hour | GOOD - Short-lived |
| Refresh Token | 30 days | MODERATE - Could be shorter |

---

## 5. CLIENT-SIDE SECURITY (CORS & Cookies)

### 5.1 Axios Configuration

**File:** `/home/user/verifywise/Clients/src/infrastructure/api/customAxios.ts`

```typescript
const CustomAxios = axios.create({
  baseURL: `${ENV_VARs.URL}/api`,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,  // Default: NO credentials
});
```

**Status:** ✓ SAFE DEFAULT

- `withCredentials: false` prevents accidental credential leakage
- Selectively enabled for auth endpoints:
  ```typescript
  if (config.url?.includes('/users/login') || config.url?.includes('/users/refresh-token')) {
    config.withCredentials = true;
  }
  ```

### 5.2 Authorization Header

**File:** `/home/user/verifywise/Clients/src/infrastructure/api/customAxios.ts` (Lines 74-93)

```typescript
CustomAxios.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Status:** ✓ PROPERLY IMPLEMENTED

- JWT in Authorization header (not cookie)
- Only sent when token exists
- Standard Bearer token format

### 5.3 Token Refresh Logic

**File:** `/home/user/verifywise/Clients/src/infrastructure/api/customAxios.ts` (Lines 128-188)

**Flow:**
1. Request fails with 406 (Token Expired)
2. Client attempts refresh via `/users/refresh-token`
3. Server validates refresh_token cookie
4. New access token returned
5. Original request retried with new token

**Status:** ✓ SECURE IMPLEMENTATION

**Features:**
- Prevents multiple simultaneous refresh requests
- Queue for pending requests during refresh
- Automatic logout on refresh failure

---

## 6. SECURITY HEADERS ANALYSIS

### 6.1 Helmet Configuration

**File:** `/home/user/verifywise/Servers/index.ts` (Line 92)

```typescript
app.use(helmet());
```

**Status:** ✓ ENABLED - Using defaults

**Default Headers Set by Helmet:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (only HTTPS)
- `Content-Security-Policy`
- And others...

**Assessment:** GOOD - Provides baseline security

**Recommendation:**
- Consider explicit helmet configuration for production
- Example: Stricter CSP, custom HSTS settings

---

## 7. MULTI-TENANCY & CORS INTERACTION

### 7.1 Multi-Tenancy Middleware

**File:** `/home/user/verifywise/Servers/middleware/multiTenancy.middleware.ts`

```typescript
export const checkMultiTenancy = async (req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = req.headers.origin || req.headers.host;
  const organizationExists = await getOrganizationsExistsQuery();
  
  if (
    (
      process.env.MULTI_TENANCY_ENABLED === "true" &&
      (
        requestOrigin?.includes("app.verifywise.ai") ||
        requestOrigin?.includes("test.verifywise.ai")
      )
    ) || !organizationExists.exists
  ) {
    next();
  } else {
    return res.status(403).json({
      message: "Multi tenancy is not enabled..."
    });
  }
}
```

**Status:** ✓ PROPERLY CONFIGURED

**Analysis:**
- Checks organization creation permissions
- Domain-based access control for SaaS
- Allows first organization (setup flow)

---

## 8. UNPROTECTED/SPECIAL ENDPOINTS

### 8.1 Public (Intentionally)

| Endpoint | Protection | Purpose |
|----------|-----------|---------|
| POST `/users/login` | Rate-limit | Authentication |
| POST `/users/refresh-token` | None | Token refresh |
| POST `/users/register` | JWT invitation | User registration |
| POST `/mail/invite` | Rate-limit | User onboarding |
| POST `/mail/reset-password` | Rate-limit | Password reset |
| GET `/organizations/exists` | None | Setup check |

**Assessment:** ✓ APPROPRIATE - These endpoints require different protections

### 8.2 Rate Limiting Applied

```typescript
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: "Too many login attempts..."
});

const inviteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: "Too many invite requests..."
});

const resetPasswordLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests..."
});
```

**Status:** ✓ GOOD - 5 requests per minute is reasonable

---

## SUMMARY OF FINDINGS

### Critical Issues (Immediate Action Required)

1. **JWT Secrets in Version Control** ⚠⚠⚠ CRITICAL
   - File: `.env.dev`, `.env.prod`
   - Impact: If exposed, all JWT tokens can be forged
   - Action: Rotate secrets immediately in production

2. **Production Origins Still Localhost** ⚠⚠ HIGH
   - File: `.env.prod` (Line 7)
   - Impact: CORS would fail in actual deployment
   - Action: Update before going to production

### High Priority Issues

3. **No Logout Endpoint** ⚠⚠ MEDIUM
   - Impact: No server-side session termination
   - Action: Implement logout that clears refresh_token cookie

4. **Same JWT Secrets Across Environments** ⚠ MEDIUM
   - Impact: Compromise in one environment affects others
   - Action: Use different secrets per environment

### Medium Priority Issues

5. **SameSite='none' Requires Monitoring** ⚠ MEDIUM
   - Current: Properly configured with Secure=true
   - Recommendation: Review if cross-origin cookies truly needed
   - Consider SameSite='strict' if possible

6. **Access Token in LocalStorage** ⚠ MEDIUM
   - Vulnerable to XSS attacks
   - Mitigation: Implement strong CSP and input validation
   - Note: Refresh token in HTTP-only cookie provides fallback

### Low Priority / Advisory

7. Helmet using default configuration (could be more explicit)
8. Refresh token expiration could be shorter (7-14 days recommended)
9. Undefined origin is allowed in CORS (low impact)

### Well-Implemented (No Action)

✓ CORS middleware with origin validation
✓ HTTP-only cookie flag
✓ Secure flag in production
✓ SameSite properly configured
✓ All state-changing operations require JWT
✓ Rate limiting on public endpoints
✓ Multi-tenancy controls in place
✓ JWT signature verification
✓ Token refresh mechanism secure
✓ Client-side credentials properly gated

---

## RECOMMENDATIONS PRIORITY LIST

### Priority 1 (Do Immediately)
- [ ] Rotate JWT_SECRET and REFRESH_TOKEN_SECRET in production
- [ ] Update ALLOWED_ORIGINS in `.env.prod` with actual domain

### Priority 2 (Do Before Release)
- [ ] Implement logout endpoint that clears refresh_token
- [ ] Use different JWT secrets per environment

### Priority 3 (Do in Next Sprint)
- [ ] Add explicit Helmet configuration
- [ ] Shorten refresh token expiration (7-14 days)
- [ ] Add endpoint monitoring for token refresh failures
- [ ] Implement token revocation list (optional but recommended)

### Priority 4 (Best Practices)
- [ ] Add CSRF token for form-based flows (if any)
- [ ] Implement request signing for sensitive operations
- [ ] Add rate limiting to more endpoints
- [ ] Regular JWT secret rotation policy

---

## CONCLUSION

The application has a **SOLID JWT-based security architecture** with appropriate CORS and cookie protections. The main concerns are operational (exposed secrets, hardcoded origins) rather than architectural. With the recommended fixes applied, the security posture will be **STRONG**.

**Current Grade: B+ (Good with issues)**
**After Fixes Grade: A- (Excellent)**

