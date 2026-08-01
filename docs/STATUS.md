# Auth System - Status Overview

## Core Auth
- [x] User registration (signup)
- [x] User login
- [x] Password hashing (bcrypt)
- [x] JWT generation
- [x] JWT verification
- [x] Route protection middleware

## Email Verification
- [x] OTP strategy (generate, hash, save, send)
- [x] Link strategy (generate token, save, send)
- [x] OTP email template
- [x] Link email template
- [ ] Verification factory (empty file)
- [ ] Wire verification to register flow
- [ ] POST /verify-email route
- [ ] POST /resend-otp route
- [ ] Check isVerified on login

## Forgot / Reset Password
- [x] Forgot password OTP email template
- [ ] passwordResetToken field on user model
- [ ] POST /forgot-password route
- [ ] POST /reset-password route

## Logout
- [ ] POST /logout route
- [ ] Token blacklist / revocation
- [ ] Clear cookie

## Refresh Token
- [ ] Refresh token generation
- [ ] POST /refresh-token route
- [ ] Refresh token rotation

## Role-Based Access Control
- [x] Role field on user model (user/admin)
- [ ] restrictTo() middleware
- [ ] Admin-only routes

## User Profile
- [ ] GET /me
- [ ] PATCH /update-profile
- [ ] PATCH /update-password (change password while logged in)
- [ ] DELETE /delete-account

## Security
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Helmet (security headers)
- [ ] Input validation (Joi / Zod / express-validator)
- [ ] HttpOnly cookie for token storage
- [ ] CSRF protection

## Extras
- [ ] Comment model + routes (broken / empty)
- [ ] OAuth / social login
- [ ] Tests
- [ ] HTTPS enforcement

## Bugs
- [ ] auth.service.js: comparePassword called before null check on user
- [ ] link.strategy.js: duplicate import
- [ ] comment.model.js: mongoose not imported properly
- [ ] .env: `//` comment syntax invalid (should be `#`)
