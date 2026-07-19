# Full Auth Learning Steps

Use this as a learning checklist in build order.

Only the items marked with `x` are already covered by the current code.

---

## 1. Signup

What you will do:

- create the registration endpoint
- validate the incoming data
- save the user with a hashed password
- return a safe response

- [x] Build `POST /register`
- [ ] Validate name, email, and password on input
- [x] Hash the password before saving the user
- [x] Set `isVerified = false` after registration
- [x] Return a safe user DTO, not the raw database document
- [ ] Reject duplicate email registration with a clear error
- [ ] Add password strength rules

---

## 2. Login

What you will do:

- compare the email and password
- create a JWT
- return the token to the client

- [x] Build `POST /login`
- [x] Check email and password
- [x] Issue a short-lived access token
- [x] Return only the data the frontend actually needs
- [ ] Reject unverified accounts if verification is required
- [ ] Make the login error message generic

---

## 3. Email Verification

What you will do:

- generate a verification code or token
- send it by email
- confirm the code
- mark the account as verified

- [ ] Generate a one-time verification code or token
- [ ] Store it with an expiry time
- [ ] Send it to the user by email
- [ ] Build `POST /verify-email`
- [ ] Build `POST /resend-otp`
- [ ] Mark the account as verified after a valid code
- [ ] Block login or sensitive actions until email is verified

---

## 4. Password Recovery

What you will do:

- let the user request a password reset
- create a reset token
- send the reset link or code
- accept the new password

- [ ] Build `POST /forgot-password`
- [ ] Generate a reset token with a short expiry
- [ ] Send the reset link or code by email
- [ ] Build `POST /reset-password`
- [ ] Invalidate the reset token after use
- [ ] Force the user to log in again after a password reset

---

## 5. Change Password

What you will do:

- let a logged-in user change their password
- require the current password first
- store the new password hashed

- [ ] Build `PATCH /update-password`
- [ ] Ask for the current password first
- [ ] Verify the current password before changing it
- [ ] Store the new password hashed
- [ ] Invalidate old tokens if your design requires it

---

## 6. Refresh Token and Logout

What you will do:

- keep the access token short-lived
- issue a refresh token
- use refresh token to get a new access token
- log out by clearing or revoking tokens

- [ ] Add long-lived refresh tokens
- [ ] Build `POST /refresh-token`
- [ ] Rotate refresh tokens on use
- [ ] Build `POST /logout`
- [ ] Add a token blacklist or refresh-token revocation store if needed

---

## 7. AuthZ: Protect Routes

What you will do:

- stop anonymous users from entering protected routes
- attach the logged-in user to the request

- [x] Build `protect` middleware
- [x] Protect routes before controller logic runs
- [ ] Make `protect` load only the fields you need
- [ ] Return a clear error when no token is sent

---

## 8. AuthZ: Roles

What you will do:

- allow admin-only actions
- deny normal users from admin routes

- [ ] Build `restrictTo('admin')`
- [ ] Add role-based access control
- [ ] Add a role check for admin-only actions
- [ ] Protect sensitive routes with both `protect` and `restrictTo`

---

## 9. AuthZ: Ownership

What you will do:

- let users edit only their own data
- let users delete only their own resources

- [ ] Add ownership checks for user-owned resources
- [ ] Add a user ownership check for resources like comments or profiles
- [ ] Test admin-only routes and user-only routes separately

---

## 10. OAuth

What you will do:

- allow login with Google or GitHub
- map provider profile data to your local user
- create your own local JWT after OAuth login

- [ ] Add `POST /auth/google`
- [ ] Add `POST /auth/github`
- [ ] Understand OAuth redirect flow first
- [ ] Map OAuth profile data to your local user model
- [ ] Handle first-time login and returning users
- [ ] Decide how OAuth users connect to email/password accounts
- [ ] Create a local JWT after OAuth login
- [ ] Keep OAuth users tied to a local database record
- [ ] Validate callback URLs
- [ ] Avoid overwriting existing password accounts by mistake

---

## 11. Rate Limit and Security

What you will do:

- slow down brute-force attacks
- add safer headers
- validate all incoming data
- protect cookie-based auth with CSRF

- [ ] Add rate limiting to auth routes
- [ ] Add `helmet`
- [ ] Configure `cors` correctly
- [ ] Use `cookie-parser` if you store tokens in cookies
- [ ] Validate all input with `Zod` or `Joi`
- [ ] Add CSRF protection if cookies are used

---

## 12. Testing

What you will do:

- test success cases
- test failure cases
- test auth and authz rules

- [ ] Test registration success and failure cases
- [ ] Test email verification with valid and expired codes
- [ ] Test login with correct and incorrect passwords
- [ ] Test role-based authorization
- [ ] Test ownership checks
- [ ] Test password reset and refresh token behavior
- [ ] Test OAuth callback handling

---

## 13. Cleanup

What you will do:

- remove unused code
- keep the response shapes clean
- document the endpoints

- [ ] Clean the response shapes
- [ ] Remove duplicate or unused auth helpers
- [ ] Document every endpoint
- [ ] Keep the project focused on learning, not feature creep
