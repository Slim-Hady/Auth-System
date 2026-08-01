# Testing Guide - Test As You Build

> **The rule:** After you finish ONE thing, TEST it immediately before moving to the next.
> Don't build 10 things then try to test. Build 1, test 1, move on.

---

## How to Use This Guide

- Open Postman
- Create a Collection called `Auth System`
- Save every request you make (you'll reuse them)
- Follow the order below. Each step tests ONE thing.

---

## 0. Start Your Server

```bash
node server.js
```

You should see:
```
app running on port 3001
Email connection verified successfully
MongoDB connected successfully
```

If any of these fail, STOP. Fix it before continuing.

---

## 1. Test Register (POST /api/v1/auth/register)

### 1a. Successful registration

Method: `POST`
URL: `http://localhost:3001/api/v1/auth/register`
Body → raw → JSON:

```json
{
    "firstName": "Mohamed",
    "secondName": "Abdelhady",
    "email": "test@gmail.com",
    "password": "12345678"
}
```

**Expected:** Status `201`
```json
{
    "status": "success",
    "message": "sign up successfully",
    "user": {
        "username": "Mohamed Abdelhady",
        "email": "test@gmail.com",
        "role": "user"
    }
}
```

**What to notice:**
- No `password` in the response (DTO is working)
- No `_id` or `__v` (DTO is working)
- `role` defaults to `"user"`

### 1b. Duplicate email

Same request again, same email.

**Expected:** Status `409`
```json
{
    "status": "Failed",
    "message": "Email already exists."
}
```

### 1c. Missing fields

Remove `firstName` from the body.

**Expected:** Status `500` with validation error message.

### 1d. Bad email format

Change email to `"notanemail"`.

**Expected:** Status `500` with validator error.

### 1e. Check MongoDB directly

Open MongoDB compass or run in mongosh:
```js
db.users.find()
```

**What to check:**
- User exists
- `password` is a bcrypt hash (starts with `$2b$`)
- `isVerified` is `false`
- `role` is `"user"`

---

## 2. Test Login (POST /api/v1/auth/login)

### 2a. Successful login

Method: `POST`
URL: `http://localhost:3001/api/v1/auth/login`
Body → raw → JSON:

```json
{
    "email": "test@gmail.com",
    "password": "12345678"
}
```

**Expected:** Status `200`
```json
{
    "status": "success",
    "message": "login successfully",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "username": "Mohamed Abdelhady",
        "email": "test@gmail.com",
        "role": "user"
    }
}
```

**What to notice:**
- `token` is present (long string with dots)
- `user` does not have password

**SAVE THIS TOKEN.** Copy it. You need it for the next tests.

### 2b. Wrong password

```json
{
    "email": "test@gmail.com",
    "password": "wrongpassword"
}
```

**Expected:** Status `401`
```json
{
    "status": "Failed",
    "message": "user email or password is not correct"
}
```

### 2c. Non-existent email

```json
{
    "email": "nobody@gmail.com",
    "password": "12345678"
}
```

**Expected:** Status `401` (same error message — don't reveal which field is wrong)

### 2d. Empty body

Send empty `{}`.

**Expected:** Status `500` or `401` ( crashes because of the null check bug in auth.service.js line 19-20 — `findUser.comparePassword` is called before checking if `findUser` is null)

**This is a bug.** Fix it later or now:
```js
// auth.service.js line 18-20, swap the order:
const findUser = await User.findOne({email}).select('+password');
if(!findUser || !(await findUser.comparePassword(password))){
    throw new AppError(`user email or password is not correct`, 401);
}
```

---

## 3. Test Token Expiration

Your JWT expires in 5 minutes (set in `.env` as `JWT_EXPIRES_IN=5m`).

### 3a. Wait 5 minutes

Use the same token from step 2a. Wait 5 minutes, then:

Method: `GET`
URL: `http://localhost:3001/api/v1/users`
Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected:** Status `401`
```json
{
    "status": "Failed",
    "message": "Token expired"
}
```

### 3b. What you learn

This proves `verifyToken()` works and catches expired tokens.

---

## 4. Test Protected Route (GET /api/v1/users)

### 4a. Without token

Method: `GET`
URL: `http://localhost:3001/api/v1/users`

**Expected:** Status `401`
```json
{
    "status": "Failed",
    "message": "You are not logged in, log in to get access."
}
```

### 4b. With valid token

Get a fresh token (login again), then:

Method: `GET`
URL: `http://localhost:3001/api/v1/users`
Headers:
```
Authorization: Bearer YOUR_FRESH_TOKEN
```

**Expected:** Status `200`
```json
{
    "status": "success",
    "results": 1,
    "data": [
        {
            "username": "Mohamed Abdelhady",
            "email": "test@gmail.com",
            "role": "user"
        }
    ]
}
```

**What to notice:** All users returned, no passwords, no `_id`.

### 4c. With invalid token

Change one character in the token string.

**Expected:** Status `401`
```json
{
    "status": "Failed",
    "message": "Invalid token"
}
```

### 4d. With malformed header

Headers:
```
Authorization: wrongformat
```

**Expected:** Status `401`
```json
{
    "status": "Failed",
    "message": "You are not logged in, log in to get access."
}
```

---

## 5. Test Email Service

This is NOT connected to your routes yet. But you can test it directly.

### 5a. Create a test script

Create `test-email.js` in your project root:

```js
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const { verifyEmailConnection } = require('./config/email');
const EmailService = require('./services/email.service');

async function test() {
    await verifyEmailConnection();

    // Test OTP email
    await EmailService.sendSignUpOTP(
        'your-email@mailtrap.io',  // use your Mailtrap inbox email
        '123456',
        'Mohamed'
    );

    console.log('Email sent! Check Mailtrap.');
}

test().catch(console.error);
```

### 5b. Run it

```bash
node test-email.js
```

### 5c. Check Mailtrap

Go to your Mailtrap inbox. You should see the email with:
- Subject: "Email Verification Code"
- Body: 6-digit OTP
- Styled HTML template

**What to notice:**
- The template renders correctly
- The name shows up
- The OTP code is visible

### 5d. Test the other email types

Copy the test file and try:
```js
// Link verification email
await EmailService.sendSignUpVerification(
    'your-email@mailtrap.io',
    'https://yourapp.com/verify/abc123',
    'Mohamed'
);

// Forgot password email
await EmailService.sendForgetPasswordOTP(
    'your-email@mailtrap.io',
    '654321',
    'Mohamed'
);
```

---

## 6. Test Edge Cases

These tests teach you what your API DOESN'T handle yet.

### 6a. SQL/NoSQL injection

```json
{
    "email": { "$gt": "" },
    "password": { "$gt": "" }
}
```

**Expected:** Should fail. Check if your app crashes or handles it.

### 6b. Very long input

```json
{
    "firstName": "AAAAAAAAAA... (1000 characters)",
    "secondName": "Test",
    "email": "test@gmail.com",
    "password": "12345678"
}
```

**Expected:** Should fail or truncate. Check MongoDB.

### 6c. Wrong HTTP method

Try `GET` on `/api/v1/auth/register`.

**Expected:** Status `404` (your catch-all handler).

---

## The Mindset: Test One Thing at a Time

```
Build register route  → Test register (1a-1e)  → Done ✓
Build login route     → Test login (2a-2c)      → Done ✓
Build protect middleware → Test protected route (4a-4d) → Done ✓
Build email service   → Test email (5a-5d)      → Done ✓
Wait for JWT expiry   → Test token expiry (3a)  → Done ✓
```

**Don't jump ahead.** If test 1a fails, don't try test 4b.
Fix the failure first, re-test, then continue.

---

## Quick Reference: Your API Endpoints

| Method | URL | Body | Auth | Status |
|--------|-----|------|------|--------|
| POST | `/api/v1/auth/register` | `{firstName, secondName, email, password}` | No | 201 |
| POST | `/api/v1/auth/login` | `{email, password}` | No | 200 |
| GET | `/api/v1/users` | — | Bearer token | 200 |

---

## Postman Collection Setup

Save these requests in a collection:

```
Auth System/
├── Register/
│   ├── Success (201)
│   ├── Duplicate Email (409)
│   ├── Missing Fields (500)
│   └── Bad Email (500)
├── Login/
│   ├── Success (200)
│   ├── Wrong Password (401)
│   ├── Non-existent Email (401)
│   └── Empty Body (500)
├── Protected Routes/
│   ├── Get Users - No Token (401)
│   ├── Get Users - Valid Token (200)
│   ├── Get Users - Invalid Token (401)
│   └── Get Users - Expired Token (401)
└── Email/
    └── Test Email Service
```

Use Postman **Environments** to store the token:
```
Variable: base_url    → http://localhost:3001
Variable: token       → (copy from login response)
```

Then use `{{base_url}}` and `{{token}}` in requests.
