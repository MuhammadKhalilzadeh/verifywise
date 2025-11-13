# Command Injection Security Audit Report
## VerifyWise Codebase

**Audit Date:** 2025-11-13  
**Scope:** Full Codebase (Backend, Frontend, Build Scripts, DevOps)  
**Thoroughness Level:** Very Thorough

---

## CRITICAL VULNERABILITIES FOUND

### 1. SQL INJECTION via User-Controlled Tenant Parameter (CRITICAL - HIGH RISK)

**Location:** `/home/user/verifywise/BiasAndFairnessServers/src/crud/bias_and_fairness.py` (Multiple lines)

**Lines Affected:**
- Line 9-17: `get_all_metrics_query()` - schema name in FROM clause
- Line 27-33: `get_metrics_by_id()` - schema name in FROM clause  
- Line 41: `upload_model()` - schema name in INSERT
- Line 49: `upload_data()` - schema name in INSERT
- Line 57: `insert_metrics()` - schema name in INSERT
- Line 68: `delete_metrics_by_id()` - schema name in DELETE
- Line 77: DELETE FROM query
- Line 83: DELETE FROM query
- Line 103-107: `insert_bias_fairness_evaluation()` - schema name hardcoded with conditional
- Line 126-139: `get_all_bias_fairness_evaluations()` - schema name
- Line 151-165: `get_bias_fairness_evaluation_by_id()` - schema name
- Line 188-193: `update_bias_fairness_evaluation_status()` - schema name
- Line 198-203: UPDATE query with schema
- Line 214-217: DELETE query with schema

**Vulnerability Type:** SQL Injection (Schema Name Interpolation)

**Risk Level:** CRITICAL

**Details:**
The `tenant` parameter is directly interpolated into SQL queries using f-strings:
```python
text(f'INSERT INTO "{tenant}".model_files ...')
text(f"""SELECT ... FROM "{tenant}".model_files ...""")
```

An attacker controlling the tenant parameter could inject SQL commands. While the quoted schema name provides some protection, PostgreSQL-specific injection techniques could still bypass this. For example:
- `tenant = 'a4ayc80OGd" CASCADE; DROP TABLE "a4ayc80OGd"; --'`
- Could lead to table/schema destruction or data exfiltration

**Affected Code Example:**
```python
# Line 41 - BiasAndFairnessServers/src/crud/bias_and_fairness.py
result = await db.execute(
    text(f'INSERT INTO "{tenant}".model_files (name, file_content) VALUES (:name, :file_content) RETURNING id'),
    {"name": name, "file_content": content}
)
```

**Mitigation Required:**
- Use parameterized queries for schema names (though limited support in SQLAlchemy)
- Validate tenant parameter against whitelist
- Use Alembic/SQLAlchemy's schema parameter instead of string interpolation

---

### 2. SQL INJECTION in Controller Function (CRITICAL - HIGH RISK)

**Location:** `/home/user/verifywise/BiasAndFairnessServers/src/controllers/bias_and_fairness.py`

**Lines Affected:** Lines 771-777

**Vulnerability Type:** SQL Injection

**Risk Level:** CRITICAL

**Details:**
```python
result = await db.execute(
    text(f'''
        UPDATE "{schema_name}".bias_fairness_evaluations 
        SET config_data = :config_data, updated_at = CURRENT_TIMESTAMP
        WHERE eval_id = :eval_id
        RETURNING id
    '''),
    {"eval_id": eval_id, "config_data": config_data}
)
```

The `schema_name` is derived from the `tenant` parameter (line 769):
```python
schema_name = "a4ayc80OGd" if tenant == "default" else tenant
```

Although there's a hardcoded conditional, if tenant is anything other than "default", it's interpolated directly into the SQL. This is a high-risk SQL injection point.

---

### 3. Dynamic Function Lookup via globals[] (CODE INJECTION - HIGH RISK)

**Location:** `/home/user/verifywise/BiasAndFairnessModule/run_full_evaluation.py`

**Lines Affected:** Line 243

**Vulnerability Type:** Code Injection / Unsafe Dynamic Function Resolution

**Risk Level:** HIGH

**Details:**
```python
def _run_metric(metric_name: str, y_true: np.ndarray, y_pred: np.ndarray, 
               sex_sensitive: np.ndarray, race_sensitive: np.ndarray, 
               all_results: dict):
    """Run a single metric for both sex and race attributes."""
    try:
        metric_func = globals()[metric_name]  # LINE 243 - CRITICAL
```

The `metric_name` parameter is user-controlled (passed from config or request) and used directly to look up functions in the global namespace. This could allow code execution via:
- `metric_name = "__import__('os').system('rm -rf /')"`
- `metric_name = "compile('__import__(\"os\").system(\"id\")','')'and__builtins__[\"exec\"]")`

The code doesn't validate that the requested function is a legitimate metric.

**Attack Scenario:**
If a user can control the `metrics` list in the config passed to `_run_metric()`, they could execute arbitrary Python code.

**Affected Code:**
```python
# Line 140-151 in run_full_evaluation.py - calls _run_metric with user-controlled metrics
if user_selected_metrics:
    print(f"\n   🎯 Running User Selected Metrics:")
    for metric_name in user_selected_metrics:
        _run_metric(metric_name, y_true, y_pred, sex_sensitive, race_sensitive, all_results)
```

---

### 4. Subprocess Execution via Shell Command (MEDIUM-HIGH RISK)

**Location:** `/home/user/verifywise/BiasAndFairnessServers/src/controllers/bias_and_fairness.py`

**Lines Affected:** Lines 502-530

**Vulnerability Type:** Subprocess Execution Risk

**Risk Level:** MEDIUM-HIGH

**Details:**
```python
result = subprocess.run(
    [python_exec, "run_full_evaluation.py"],  # Line 525
    capture_output=True,
    text=True,
    cwd=str(module_dir),
    timeout=1800  # 30 minute timeout
)
```

While the code uses a list-based argument (not shell=True), making it safer, the concern is:

1. **Vulnerable subprocess module is imported at runtime** (Line 502)
2. **Config path is passed as context** - The config at `config_path` contains user-controlled data that could be exploited if `run_full_evaluation.py` has vulnerabilities
3. **No shell=False explicitly set** - While implicit, code should be explicit about security choices

The vulnerability is indirect - the subprocess itself is safe, but malicious config data passed to `run_full_evaluation.py` could trigger the CODE INJECTION vulnerability in `_run_metric()`.

---

### 5. Unsafe Shell Environment Variable Expansion (MEDIUM RISK)

**Location:** `/home/user/verifywise/install.sh`

**Lines Affected:** Line 80

**Vulnerability Type:** Shell Injection / Command Substitution Injection

**Risk Level:** MEDIUM

**Details:**
```bash
export $(cat $ENV_FILE | grep -v '#' | awk '/=/ {print $1}')
```

This script dynamically exports variables from the .env file without proper quoting or validation. If an attacker can control the .env file, they could inject shell commands:

**Attack Example:**
```
ENV_FILE_CONTENT:
MALICIOUS_VAR=$(rm -rf /);echo
SAFE_VAR=value
```

When executed with `export $(cat...)`, the command substitution would execute the injected command.

**Affected Code:**
```bash
# Line 77-80
load_env() {
    ENV_FILE=$1
    if [ -f $ENV_FILE ]; then
        export $(cat $ENV_FILE | grep -v '#' | awk '/=/ {print $1}')
```

---

### 6. Unsafe child_process.exec Usage (MEDIUM RISK)

**Location:** `/home/user/verifywise/Servers/scripts/resetDatabase.ts`

**Lines Affected:** Lines 4, 10, 52

**Vulnerability Type:** Subprocess Execution

**Risk Level:** MEDIUM

**Details:**
```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Later in code...
await execAsync("npx sequelize db:migrate");  // Line 52
```

The code imports and uses `exec()` which is known to be inherently dangerous. While the command string here is hardcoded and safe:
1. **exec() defaults to shell=true**, making it vulnerable to shell interpretation
2. **If this code is modified to use user input, it becomes immediately dangerous**
3. **Best practice would be to use `execFile()` or `spawn()` with explicit options**

**Mitigation Note:** Current use is safe because the command is hardcoded. However, the use of `exec()` is discouraged for production code.

---

### 7. Unsafe child_process.execSync Usage (MEDIUM RISK)

**Location:** `/home/user/verifywise/Clients/scripts/build.js`

**Lines Affected:** Lines 7, 19

**Vulnerability Type:** Subprocess Execution

**Risk Level:** MEDIUM (for build script - lower impact)

**Details:**
```javascript
import { execSync } from 'child_process';

// ...
execSync('vite build', { stdio: 'inherit' });
```

While the command is hardcoded and safe, `execSync()` is generally discouraged. The `stdio: 'inherit'` option is actually good for transparency, but the underlying approach is risky if the command string ever becomes user-controlled.

**Impact:** Lower risk since this is a build script with no user input, but demonstrates potential weak pattern.

---

## MEDIUM RISK - PATTERNS OF CONCERN

### 8. Password Hardcoded in Script

**Location:** `/home/user/verifywise/Servers/scripts/resetDatabase.ts`

**Lines Affected:** Lines 61, 74

**Details:**
```typescript
password: "Verifywise#1",  // Line 61
confirmPassword: "Verifywise#1",
// ...
"MyJH4rTm!@.45L0wm",  // Line 74 - Different hardcoded password
```

Two different passwords hardcoded in reset script. While intended for development/demo, this should be replaced with environment variables.

---

### 9. Unsafe Use of getattr() (LOW-MEDIUM RISK)

**Location:** `/home/user/verifywise/BiasAndFairnessModule/run_full_evaluation.py` and other files

**Risk Level:** LOW-MEDIUM (depends on implementation)

**Details:**
While `getattr()` itself is safe when used correctly, the codebase uses it extensively for dynamic attribute access. If combined with user-controlled attribute names, this could expose private attributes or methods.

Current usage appears safe, but worth monitoring.

---

## LOW RISK - INFORMATIONAL FINDINGS

### 10. eval() and Function Constructor Not Found
✓ No instances of `eval()` or `new Function()` detected in JavaScript  
✓ No instances of `eval()` in Python  
✓ Good practice followed

### 11. Shell option not explicitly set
- `shell: false` (or `shell: 'false'`) not always explicitly set in subprocess calls
- While defaults are safe in Node.js, explicit declaration would improve security posture

---

## SUMMARY OF FINDINGS

| Vulnerability | Severity | Count | Status |
|---|---|---|---|
| SQL Injection (Schema) | CRITICAL | 13 | UNFIXED |
| SQL Injection (Controller) | CRITICAL | 1 | UNFIXED |
| Code Injection (globals[]) | HIGH | 1 | UNFIXED |
| Shell Injection | MEDIUM | 1 | UNFIXED |
| Subprocess exec() | MEDIUM | 1 | UNFIXED (safe by design) |
| Subprocess execSync() | MEDIUM | 1 | UNFIXED (safe by design) |
| Hardcoded Passwords | MEDIUM | 2 | UNFIXED |
| **TOTAL ISSUES** | | **20** | |

---

## REMEDIATION PRIORITIES

### Priority 1 - CRITICAL (Must Fix)
1. **SQL Injection (All tenant-based queries)**
   - Implement tenant whitelisting
   - Use sqlalchemy.schema or other non-interpolation method
   - Add input validation for tenant parameter

2. **Code Injection (globals[] lookup)**
   - Create a safe metric registry/dictionary
   - Validate metric names against allowed list
   - Never use dynamic lookup for user-controlled identifiers

### Priority 2 - HIGH (Should Fix)
3. **Shell Environment Variable Injection**
   - Use explicit variable assignment
   - Validate .env file contents
   - Consider using Python dotenv library instead

### Priority 3 - MEDIUM (Nice to Fix)
4. **Replace exec() with safer alternatives**
   - Use `execFile()` for fixed commands
   - Use `spawn()` for complex operations

5. **Remove hardcoded passwords**
   - Use environment variables
   - Use config files with proper permissions

6. **Explicit shell: false in all subprocess calls**
   - Even though default, makes intent clear

---

## FILES REQUIRING IMMEDIATE ATTENTION

1. `/home/user/verifywise/BiasAndFairnessServers/src/crud/bias_and_fairness.py` - 13 SQL injection points
2. `/home/user/verifywise/BiasAndFairnessServers/src/controllers/bias_and_fairness.py` - 1 SQL injection + subprocess config
3. `/home/user/verifywise/BiasAndFairnessModule/run_full_evaluation.py` - Code injection via globals[]
4. `/home/user/verifywise/install.sh` - Shell injection in environment loading
5. `/home/user/verifywise/Servers/scripts/resetDatabase.ts` - Hardcoded credentials + exec usage

---

## RECOMMENDATIONS

1. **Implement Input Validation Framework**
   - Create a validation layer for tenant, eval_id, and other user-controlled parameters
   - Use regex patterns for expected formats

2. **Use ORM Properly**
   - Leverage SQLAlchemy's schema handling
   - Avoid string interpolation in queries

3. **Create Safe Lookup Mechanism**
   - Replace globals[] with explicit registry dictionary
   - Validate against whitelist before execution

4. **Security Code Review**
   - Implement pre-commit hooks for security patterns
   - Use static analysis tools (bandit for Python, ESLint plugins for JS)

5. **Principle of Least Privilege**
   - Database users should have minimal required permissions
   - Container/service users should run with restricted permissions

---

## TESTING RECOMMENDATIONS

### SQL Injection Testing
```sql
-- Test with schema_name = 'public" CASCADE; DROP SCHEMA public CASCADE; --'
-- Verify queries fail or behave safely
```

### Code Injection Testing
```python
# Test with metric_name = '__import__'
# Verify function lookup rejects invalid metrics
```

### Shell Injection Testing
```bash
# .env file with: VAR=$(touch /tmp/pwned)
# Verify file is not created
```

