# Internal /api/auth Routes Analysis

## Current Internal Routes

1. **`/api/auth/csrf-token`** - Generates CSRF token, sets in httpOnly cookie
2. **`/api/auth/refresh`** - Proxies refresh token request, manages httpOnly cookies
3. **`/api/auth/set-refresh-token`** - Sets refresh token in httpOnly cookie
4. **`/api/auth/clear-refresh-token`** - Clears refresh token cookie

## Why They Exist

### Security Reasons:
1. **httpOnly Cookies**: JavaScript cannot set httpOnly cookies (prevents XSS attacks)
2. **CSRF Protection**: CSRF tokens must be generated server-side
3. **Refresh Token Security**: Refresh tokens in httpOnly cookies are protected from XSS

### Current Flow:
```
Login → Backend returns tokens → Frontend stores access token → 
Frontend calls /api/auth/set-refresh-token → Server sets httpOnly cookie
```

## Can We Simplify?

### Option 1: Store Refresh Token in localStorage (Simpler, Less Secure)
**Pros:**
- No need for `/api/auth/set-refresh-token` or `/api/auth/clear-refresh-token`
- Simpler code
- Fewer API calls

**Cons:**
- Refresh token accessible to JavaScript (XSS vulnerability)
- Less secure than httpOnly cookies

### Option 2: Backend Sets Cookies Directly (Requires Backend Changes)
**Pros:**
- No need for `/api/auth/set-refresh-token`
- Backend controls cookie security settings
- Single request for login

**Cons:**
- Requires backend modifications
- Still need `/api/auth/csrf-token` for CSRF protection
- CORS cookie handling can be complex

### Option 3: Keep Current Approach (Most Secure)
**Pros:**
- Maximum security (httpOnly cookies)
- Refresh tokens protected from XSS
- CSRF protection in place
- No backend changes needed

**Cons:**
- More API routes to maintain
- Additional round trips

## Recommendation

**Keep the current approach** for production, but you could simplify for development:

1. **Keep `/api/auth/csrf-token`** - Essential for CSRF protection
2. **Keep `/api/auth/refresh`** - Needed for token refresh with httpOnly cookies
3. **Simplify `/api/auth/set-refresh-token`** - Could be removed if storing refresh token in localStorage (less secure)
4. **Simplify `/api/auth/clear-refresh-token`** - Could be removed if using localStorage

## Simplified Alternative (Less Secure)

If you want to simplify, you could:
- Store refresh token in localStorage (accessible to JavaScript)
- Remove `/api/auth/set-refresh-token` and `/api/auth/clear-refresh-token`
- Keep `/api/auth/csrf-token` and `/api/auth/refresh` for CSRF and token refresh

This reduces security but simplifies the codebase.

