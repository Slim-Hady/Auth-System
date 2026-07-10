# Authentication System - Learning Notes

## Project Overview

This is a **Node.js/Express authentication system** using **JWT (JSON Web Tokens)** with **Bearer Token** authentication. It uses **MongoDB** for database and **bcrypt** for password hashing.

**Current Status:** Login only with Bearer Token JWT (learning phase)

---

## What is Authentication?

**Authentication** = Proving who you are (Who are you?)
- Example: Show your ID card, enter password, use fingerprint

**Authorization** = What you are allowed to do (What can you do?)
- Example: Admin can delete users, normal user can only see own profile

---

## Two Main Ways to Handle Authentication

### 1. Session-Based Authentication (Traditional / Server-Side)

**How it works:**
```
1. User logs in with email + password
2. Server checks password → if correct, creates a "Session" on server
3. Server saves session data in memory, database (Redis, MongoDB), or file
4. Server sends back a "Session ID" (usually in a Cookie)
5. Browser saves the Cookie automatically
6. Next request → Browser sends Cookie automatically
4. Server reads Session ID from Cookie → finds session data on server → knows who you are
```

**Where is data stored?**
- **Session Data** → Stored on **Server** (Memory, Redis, MongoDB, File)
- **Session ID** → Stored in **Cookie** on Browser

**Cookie Settings (Important!):**
```javascript
res.cookie('sessionId', sessionId, {
    httpOnly: true,    // JavaScript CANNOT read this cookie (security)
    secure: true,      // Only sent over HTTPS (production)
    sameSite: 'lax',   // CSRF protection
    maxAge: 1000 * 60 * 60 * 24 // 1 day
})
```

**Pros:**
- ✅ Session data is hidden on server (more secure)
- ✅ Can revoke session instantly (delete from server)
- ✅ Session ID is small (just an ID string)
- ✅ Can store large session data on server

**Cons:**
- ❌ Server must store session data (memory/Redis/database) → **Scaling is hard**
- ❌ If you have many servers, need shared storage (Redis) → **More complex**
- ❌ Cookies can be stolen (CSRF attacks) → Need CSRF tokens
- ❌ Cookies don't work well with mobile apps / APIs
- ❌ CORS issues with cookies across domains

---

### 2. JWT (JSON Web Token) - Stateless / Client-Side (What This Project Uses)

**How it works:**
```
1. User logs in with email + password
2. Server checks password → if correct, creates a JWT
3. JWT = Header + Payload + Signature (all encoded in Base64)
4. Server sends JWT back in JSON response (NOT in cookie)
5. Client (browser/app) saves JWT in: localStorage, sessionStorage, or memory
6. Next request → Client sends JWT in Header: Authorization: Bearer <token>
7. Server verifies JWT signature → reads payload → knows who you are
```

**JWT Structure (3 parts separated by dots):**
```
xxxxx.yyyyy.zzzzz
│     │     │
│     │     └─ Signature (verifies nobody changed the token)
│     └─────── Payload (user data: userId, email, role, exp time)
└──────────── Header (algorithm: HS256, type: JWT)
```

**Where is JWT stored? (Client Side Options):**

| Storage | Pros | Cons |
|---------|------|------|
| **localStorage** | Persists after browser close, easy to use | Vulnerable to XSS (JavaScript can read it) |
| **sessionStorage** | Cleared when tab closes, slightly safer than localStorage | Still vulnerable to XSS, lost on tab close |
| **Memory (Variable)** | Most secure from XSS | Lost on page refresh, complex for SPA |
| **HttpOnly Cookie** | JavaScript CANNOT read it (XSS safe), sent automatically | Vulnerable to CSRF, needs CSRF token, CORS issues |

**⚠️ Current Project Uses:** JWT in **Response Body (JSON)** → Client saves in **localStorage/memory** → Sends in **Authorization Header**

**JWT Payload Example (from this project):**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "username": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "iat": 1700000000,      // Issued at (timestamp)
  "exp": 1700086400,      // Expires at (timestamp)
  "iss": "Auth-System"    // Issuer
}
```

**Pros:**
- ✅ **Stateless** - Server stores NOTHING about sessions
- ✅ **Scales easily** - Any server can verify JWT (just need secret key)
- ✅ **Works great with APIs** - Mobile apps, SPAs, microservices
- ✅ **No CORS cookie issues** - Sent in header, not cookie
- ✅ **Self-contained** - User info inside token (no DB lookup needed for basic info)

**Cons:**
- ❌ **Cannot revoke easily** - Token valid until expiry (unless you build a blocklist)
- ❌ **Token size grows** - More data = bigger token = larger requests
- ❌ **XSS vulnerable** - If stored in localStorage, XSS can steal token
- ❌ **No auto-send** - Client must manually attach to every request
- ❌ **Token theft = full access** until expiry (no easy revoke)

---

## What This Project Implements (JWT Bearer Token)

### Login Flow:
```
POST /api/v1/auth/login
Body: { email, password }

Server:
1. Find user by email
2. Compare password with bcrypt
3. If valid → generate JWT with userId, username, email, role
4. Return JSON: { token, user }
```

### Protected Route Flow:
```
GET /api/v1/users
Header: Authorization: Bearer <token>

Middleware (protect):
1. Extract token from Authorization header
2. Verify JWT signature with secret key
3. If valid → decode payload → find user in DB → attach to req.user
4. Next → Controller gets req.user
```

### Code Flow in This Project:

| File | What It Does |
|------|--------------|
| `models/user.model.js` | User schema, password hashing (bcrypt), password compare method |
| `services/auth.service.js` | `login()`, `generateToken()`, `verifyToken()`, `decodeToken()` |
| `middlewares/auth.middleware.js` | `protect` middleware - extracts Bearer token, verifies, attaches user |
| `controllers/auth.controller.js` | `login` - calls service, returns token + user |
| `routes/auth.routes.js` | `POST /api/v1/auth/login` |

---

## Where Data Is Stored (Summary)

| Data | Where Stored | How Sent |
|------|--------------|----------|
| **Password** | MongoDB (hashed with bcrypt) | Never sent to client |
| **User Data** | MongoDB | Sent in JSON response |
| **JWT Token** | **Client side** (localStorage/memory) | Sent in `Authorization: Bearer <token>` header |
| **JWT Secret** | Server `.env` file (NEVER in client) | Never sent to client |
| **Session Data** | **NOT USED** (this is JWT, not sessions) | N/A |

---

## Session vs JWT - Quick Comparison

| Feature | Session (Cookie) | JWT (Bearer Token) |
|---------|------------------|-------------------|
| **Where is user data?** | Server (session store) | Inside token (client) |
| **Server stores session?** | YES | NO (stateless) |
| **Scales easily?** | NO (needs shared store) | YES |
| **Auto-sent with requests?** | YES (cookies auto-send) | NO (manual header) |
| **XSS Safe?** | YES (HttpOnly cookie) | NO (if localStorage) |
| **CSRF Risk?** | YES | NO (no cookies) |
| **Revoke session?** | Easy (delete from server) | Hard (need blocklist) |
| **Works with Mobile/API?** | Hard (cookies tricky) | YES (standard) |
| **Token Size** | Tiny (just session ID) | Bigger (contains data) |
| **Best For** | Traditional web apps, SSR | SPAs, Mobile, APIs, Microservices |

---

## Security Best Practices (What to Learn Next)

### For JWT (This Project):
1. **Use HttpOnly Cookie for JWT** (not localStorage) - prevents XSS theft
2. **Add CSRF Token** if using cookies
3. **Short expiry** (15-30 min) + **Refresh Token** (long expiry, in HttpOnly cookie)
4. **Token Blocklist (Redis)** for logout/revoke
5. **HTTPS Only** in production
6. **Strong JWT Secret** (long random string in .env)

### For Sessions:
1. **Use Redis** for session store (scales)
2. **HttpOnly + Secure + SameSite cookies**
3. **CSRF Tokens** for forms
4. **Session expiry + cleanup**

---

## Project Structure Summary

```
src/
├── config/
│   ├── DB.js          # MongoDB connection
│   └── key.js         # Environment variables
├── controllers/
│   ├── auth.controller.js   # Login handler
│   ├── error.controller.js  # Global error handler
│   └── user.controller.js   # Get all users (protected)
├── middlewares/
│   └── auth.middleware.js   # protect() - JWT verification
├── models/
│   ├── user.model.js    # User schema + bcrypt
│   └── comment.model.js # Placeholder
├── routes/
│   ├── auth.routes.js   # POST /login
│   ├── user.routes.js   # GET /users (protected)
│   └── comment.routes.js
├── services/
│   └── auth.service.js  # JWT logic, login logic
├── utils/
│   ├── AppError.js      # Custom error class
│   └── catchAsync.js    # Async wrapper
├── dtos/
│   └── user.dto.js      # Format user response
├── app.js               # Express setup
└── server.js            # Entry point
```

---

## What to Learn Next (Roadmap)

1. **Refresh Tokens** - Short access token + long refresh token in HttpOnly cookie
2. **Register + Email Verification** - Send email with token
3. **Password Reset** - Forgot password → email → reset token
4. **Role-Based Access Control (RBAC)** - Admin vs User permissions
5. **Refresh Token Rotation** - Rotate refresh tokens for security
6. **Token Blocklist (Redis)** - For logout / revoke tokens
7. **Rate Limiting** - Prevent brute force on login
8. **Two-Factor Authentication (2FA)** - TOTP / SMS / Email codes
9. **OAuth / Social Login** - Google, GitHub, etc.
10. **Session Alternative** - Implement session-based auth with Redis for comparison

---

## Key Terms Glossary (Simple English)

| Term | Simple Meaning |
|------|----------------|
| **Authentication** | Proving who you are (login) |
| **Authorization** | Checking what you can do (permissions) |
| **JWT** | A token that holds user info, signed by server |
| **Bearer Token** | "Here is my token" sent in Authorization header |
| **Payload** | The data inside JWT (userId, email, role) |
| **Signature** | Proof that token wasn't changed (signed with secret) |
| **bcrypt** | Slow hashing algorithm for passwords (secure) |
| **Hash** | One-way scramble of password (can't reverse) |
| **Salt** | Random data added before hashing (prevents rainbow tables) |
| **HttpOnly Cookie** | Cookie JavaScript CANNOT read (XSS protection) |
| **CSRF** | Attack where bad site tricks your browser to send request |
| **XSS** | Attack where hacker runs JavaScript on your site |
| **Stateless** | Server doesn't remember you (JWT) |
| **Stateful** | Server remembers you (Session) |
| **Refresh Token** | Long-lived token to get new access tokens |
| **Access Token** | Short-lived token for API access |
| **Blocklist/Blacklist** | List of revoked tokens (stored in Redis) |
| **CORS** | Browser security for cross-origin requests |

---

## Current Project Limitations (Learning Phase)

- ❌ No Register endpoint
- ❌ No Email Verification
- ❌ No Password Reset
- ❌ No Refresh Tokens (token expires = login again)
- ❌ No Logout / Token Revocation
- ❌ No Role-Based Access Control (admin vs user)
- ❌ No Rate Limiting
- ❌ JWT in JSON body (not HttpOnly cookie) - **XSS vulnerable**
- ❌ No HTTPS enforcement
- ❌ No Input Sanitization (XSS prevention)

---

## How to Test Current Flow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password123"}'

# Response: { "status": "success", "token": "eyJ...", "user": {...} }

# 2. Use token to access protected route
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

*Last Updated: Learning Phase - JWT Bearer Token Implementation*