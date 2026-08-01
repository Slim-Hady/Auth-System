# Project Notes Authentication System

## 1. JWT (JSON Web Token) Authentication

### What is JWT?
JWT is a compact, URL-safe token format used for authentication. It consists of three parts separated by dots:  
**Header.Payload.Signature**

### Implementation

**Token Generation** — `services/auth.service.js:20-30`

```javascript
static generateToken(user){
    const payload = {
        userId: user.id,
        username: user.userName,
        email: user.email,
        role: user.role
    }
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,  
        issuer: "Auth-System"
    })
}
```

- Takes a user object → extracts `id`, `userName`, `email`, `role`
- Signs with a secret key (`JWT_SECRET`) — a 256-bit hex string from `.env`
- Sets expiration (`JWT_EXPIRES_IN = "5m"`) — token dies after 5 minutes
- Sets issuer (`issuer: "Auth-System"`) for token origin validation
- Returns a signed JWT string

**Token Verification** — `services/auth.service.js:35-48`

```javascript
static verifyToken(token){
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch(err) {
        if(err.name === 'TokenExpiredError'){
            throw new AppError('Token expired', 401);
        } else if (err.name === 'JsonWebTokenError'){
            throw new AppError('Invalid token', 401);
        }
        throw err;
    }
}
```

- Uses `jwt.verify()` which validates the signature AND expiration
- On expiry → throws `AppError` 401 with "Token expired"
- On tampered token → throws `AppError` 401 with "Invalid token"
- Returns the decoded payload (`{userId, username, email, role}`)

**Token Decoding (without verification)** — `services/auth.service.js:52-54`

```javascript
static decodeToken(token){
    return jwt.decode(token, {complete: true});
}
```

- `jwt.decode()` does NOT verify the signature — only base64-decodes
- Useful for debugging or reading header info without validation

**Protect Middleware** — `middlewares/auth.middleware.js`

```javascript
exports.protect = CatchAsync(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // "Bearer <token>" → extract token part

    if(!token) {
        return next(new AppError(`You are not logged in...`, 401));
    }

    const payload = AuthService.verifyToken(token);
    const user = await User.findById(payload.userId);

    if(!user) {
        throw new AppError(`User no longer exists`, 401);
    }

    req.user = user;  // attach user to request for downstream handlers
    next();
})
```

Flow:
1. Extract token from `Authorization: Bearer <token>` header
2. If no token → "You are not logged in"
3. Verify token (signature + expiry) → get payload
4. Fetch user from DB by `payload.userId`
5. If user deleted → "User no longer exists"
6. Attach user to `req.user` → next middleware/controller

### .env Config

```
JWT_SECRET=
JWT_EXPIRES_IN=
```

All env vars are exported via `config/key.js`:

```javascript
module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    // ... other vars
}
```

---

## 🔑 2. Login

### Route
```
POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }
Response: { status, message, token, user }
```

### Controller — `controllers/auth.controller.js`

```javascript
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });
    const { token, user } = result;

    res.status(200).json({
        status: 'success',
        message: 'login successfully',
        token,
        user
    });
})
```

- Extracts email + password from request body
- Delegates to `AuthService.login()`
- Returns `token` (JWT string) and `user` (formatted DTO)

### Service — `services/auth.service.js`

```javascript
static async login(user) {
    const { email, password } = user;
    const findUser = await User.findOne({ email }).select('+password');
    //                                      .select('+password') → include password field (hidden by default)

    const isMatch = await findUser.comparePassword(password);
    //                    ^ calls bcrypt.compare(password, hashedPassword)

    if (!findUser || !isMatch) {
        throw new AppError(`user email or password is not correct`, 401);
    }

    const token = AuthService.generateToken(findUser);

    return {
        token,
        user: userDTO.formatUser(findUser)
        //    ^ returns only { username, email, role } — no password, no _id
    }
}
```

Step-by-step:
1. Find user by email — `.select('+password')` is required because the `password` field has `select: false` in the schema
2. Compare submitted password with stored hash using `bcrypt.compare()`
3. If user not found OR password doesn't match → throw generic error (don't reveal WHICH is wrong — security best practice)
4. If valid → generate JWT via `generateToken()`
5. Return token + sanitized user via DTO

### Why `.select('+password')`?

In `models/user.model.js`:

```javascript
password: {
    type: String,
    select: false  // ← excluded from all queries by default
}
```

Without `.select('+password')`, `findOne()` returns the user WITHOUT the password field, so `comparePassword()` would fail. The `+` prefix explicitly includes fields that are `select: false`.

### Password Comparison — `models/user.model.js`

```javascript
    userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}
```

- `bcrypt.compare(plainText, hash)` — returns `true` or `false`
- This is an **instance method** on the User document
- Called as `user.comparePassword(inputPassword)`

---

## 3. Sign-Up / Register

### Route
```
POST /api/v1/auth/register
Body: { "firstName": "...", "secondName": "...", "email": "...", "password": "..." }
Response: { status, message, user }
```

### Controller — `controllers/auth.controller.js`

```javascript
exports.register = catchAsync(async (req, res, next) => {
    const user = await AuthService.register(req.body);
    res.status(201).json({
        status: 'success',
        message: 'sign up successfully',
        user
    });
})
```

- Passes entire `req.body` to the service
- Returns 201 (Created) — not 200

### Service — `services/auth.service.js`

```javascript
static async register(user) {
    const { email } = user;

    if (await User.findOne({ email })) {
        throw new AppError(`Email already exists.`, 409);
        //                                    ^ 409 Conflict
    }

    const newUser = await User.create(user);
    //       ^ Mongoose.create() triggers pre('save') hook → password hashing

    return userDTO.formatUser(newUser);
}
```

Step-by-step:
1. Check if email already exists — if yes, throw 409
2. `User.create(user)` → creates document + triggers `pre('save')` hook
3. Return sanitized user DTO (no password, no token)

### Why NO token on sign-up?

The register endpoint does NOT return a JWT. This is intentional — the user must verify their email first before being able to log in (the `isVerified` field exists in the schema). The token would be issued after email verification.

### Password Hashing — `models/user.model.js` pre-save hook

```javascript
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
        // ^ skip hashing if password hasn't changed (e.g. updating other fields)
    }
    this.password = await bcrypt.hash(this.password, 12);
    //                                          saltRounds = 12
});
```

- `isModified('password')` — built-in Mongoose method to check if the field changed
- `bcrypt.hash(password, saltRounds=12)` — computationally expensive, takes ~250ms
- Higher salt rounds = more secure but slower (12 is standard)

### User DTO — `dtos/user.dto.js`

```javascript
class UserDTO {
    static formatUser(user) {
        return {
            username: user.userName,  // virtual field: "firstName secondName"
            email: user.email,
            role: user.role
        }
    }
    static formatAllUsers(users) {
        return users.map(user => UserDTO.formatUser(user));
    }
}
```

- Excludes: `password`, `_id`, `__v`, `createdAt`, `updatedAt`, `isVerified`, `verificationOTP`, `verificationOTPExpires`
- Transforms: `userName` virtual is a computed field from `firstName + " " + secondName`

---

## 4. Email Service

### Technology Stack
- **Nodemailer** — Node.js mail library (sends emails)
- **Mailtrap** — SMTP service for development (catches emails, doesn't actually send)
- **Handlebars (hbs)** — template engine for HTML emails
- **nodemailer-express-handlebars** — plugin that renders `.hbs` templates inside Nodemailer

### Configuration — `config/email.js`

```javascript
const transport = nodemailer.createTransport({
    host: smtp_host,           // "live.smtp.mailtrap.io"
    port: smtp_port,           // 587
    secure: false,             // false for port 587 (STARTTLS)
    auth: {
        user: smtp_name,       // Mailtrap username
        pass: smtp_password    // Mailtrap password
    }
});

// Handlebars plugin setup
const option = {
    viewEngine: {
        extname: '.hbs',
        partialsDir: path.resolve('./template'),
        defaultLayout: false    // no layout wrapper — each template is standalone
    },
    extname: '.hbs',
    viewPath: path.resolve('./template')
};

transport.use('compile', hbs(option));
//        ^ "compile" step — transforms `.hbs` to HTML before sending
```

- `transport.use('compile', ...)` — registers the handlebars plugin in Nodemailer's pipeline
- Templates are in `template/` directory with `.hbs` extension
- No default layout — each template is self-contained HTML

### Service — `services/email.service.js`

```javascript
class EmailService {
    static async sendEmail(to, subject, template, context) {
        const option = {
            from: `"${email_from_name}" <${email_from_address}>`,
            //  ^ e.g. "Auth System" <auth@example.com>
            to,
            subject,
            template,    // filename without .hbs → "signup-OTP"
            context      // variables passed to the template → { name, otp }
        };
        return await transport.sendMail(option);
    }

    // Convenience methods:
    static sendSignUpOTP(to, otp, name) {
        return this.sendEmail(to, "Verify Email", "signup-OTP", { name, otp });
    }

    static sendSignUpVerification(to, link, name) {
        return this.sendEmail(to, "Verify Email", "signup-link", { name, link });
    }

    static sendForgetPasswordOTP(to, otp, name) {
        return this.sendEmail(to, "Forget Password", "forget-password-otp", { name, otp });
    }
}
```

- `sendEmail()` is the generic method — takes template name + context variables
- Three convenience methods wrap `sendEmail()` with pre-filled subjects and templates
- The `template` parameter maps to `template/signup-OTP.hbs`, etc.

### Connection Verification — `config/email.js:16-25`

```javascript
const verifyEmailConnection = async () => {
    try {
        await transport.verify();
        console.log(`Connect to Email service`);
    } catch (err) {
        console.log(`can't connect to email service ${err}`);
    }
};
```

Called in `server.js` at startup to ensure SMTP credentials are valid.

### Email Templates — Handlebars (.hbs)

**`template/signup-OTP.hbs`** — Variables: `{{name}}`, `{{otp}}`
- Full HTML email with logo, styled OTP display (big centered digits), 10-min expiry warning
- OTP is a 6-digit number

**`template/signup-link.hbs`** — Variables: `{{name}}`, `{{link}}`
- Full HTML email with a "Verify Email Address" button
- The link is a crypto token (32-byte hex) — would be used like `https://app.com/verify?token={{link}}`

**`template/forget-password-otp.hbs`** — Variables: `{{name}}`, `{{otp}}`
- Similar OTP email but for password reset flow, 5-min expiry

### Flow Summary

```
server.js startup
    → verifyEmailConnection()    // validates SMTP
    → MONGO_CONNECTION()         // connects to MongoDB
    → app.listen(PORT)

Later, when a user needs verification:
    EmailService.sendSignUpOTP(user.email, otp, user.userName)
        → sendEmail(to, subject, "signup-OTP", { name, otp })
            → transport.sendMail(options)
                → nodemailer-express-handlebars compiles signup-OTP.hbs
                → sends via Mailtrap SMTP
```

---

## 5. Strategy Design Pattern

### What & Why

The **Strategy Pattern** defines a family of algorithms, encapsulates each one, and makes them interchangeable. The strategy algorithm can vary independently from the clients that use it.

**In this project**: We have two ways to verify a user's email:
1. **OTP** — send a 6-digit code, user types it in (expires 10 min)
2. **Link** — send a magic link, user clicks it (expires 24 hours)

We want to be able to switch between these without changing the code that triggers verification. That's the Strategy Pattern.

### Structure

```
┌─────────────────────────────────────────────┐
│          VerificationStrategy                │ ← Abstract (interface)
│  + sendVerification(user)                    │
└─────────────────────────────────────────────┘
           ▲                    ▲
           │                    │
┌──────────┴──────────┐  ┌─────┴──────────────┐
│    OTPStrategy      │  │    LinkStrategy     │
│                     │  │                     │
│  generateOTP()      │  │  generateLink()     │
│  hashOTP()          │  │  generateExpiration()│
│  generateExpiration()│  │  saveLink()         │
│  saveOTP()          │  │  sendLinkEmail()    │
│  sendOTPEmail()     │  │                     │
└─────────────────────┘  └─────────────────────┘
```

### Abstract Base — `strategies/verification.strategy.js`

```javascript
class VerificationStrategy {
    async sendVerification(user) {
        throw new Error("You must implement send verification");
        // ^ Forces subclasses to override this method
    }
}
module.exports = VerificationStrategy;
```

Acts as an **interface** in JavaScript (no native interfaces). Any subclass MUST implement `sendVerification()`. The method signature is `async (user) → void`.

### Concrete Strategy #1 — OTP — `strategies/otp.strategy.js`

```javascript
class OTPStrategy extends VerificationStrategy {

    async sendVerification(user) {
        const otp = this.generateOTP();
        const hashedOTP = this.hashOTP(otp);
        const expirationDate = this.generateExpirationDate();

        await this.saveOTP(user, hashedOTP, expirationDate);
        await this.sendOTPEmail(user, otp);
    }

    generateOTP() {
        return crypto.randomInt(100000, 1000000);
        //    ^ Math.random() is NOT cryptographically secure — crypto.randomInt() is
        //    range: 100000 to 999999 (inclusive of min, exclusive of max)
    }

    async hashOTP(otp) {
        return bcrypt.hash(String(otp), 10);
        //    ^ HASH the OTP before storing — never store raw OTPs!
        //    saltRounds=10 (lighter than password's 12 — OTPs are short-lived)
    }

    generateExpirationDate() {
        return new Date(Date.now() + 10 * 60 * 1000);
        //                                ^ 10 minutes in ms
    }

    async saveOTP(user, hashedOTP, expirationDate) {
        user.verificationOTP = hashedOTP;       // ← hashed (not raw)
        user.verificationOTPExpires = expirationDate;
        await user.save({ validateBeforeSave: false });
        //    ^ skip validation — we're only updating OTP fields
    }

    async sendOTPEmail(user, otp) {
        await emailService.sendSignUpOTP(user.email, otp, user.userName);
        //    ^ sends the RAW otp (not hashed) — user needs the original digits
    }
}
```

Key design decisions:
- OTP is **hashed before storage** so that even if the DB is breached, OTPs are not exposed. `bcrypt.hash()` is used.
- OTP is **sent raw** via email — the user needs the original digits to type in.
- On verification, the submitted OTP would be compared via `bcrypt.compare(submittedOtp, user.verificationOTP)`.
- `crypto.randomInt()` is used (not `Math.random()`) because it's cryptographically secure.
- `save({ validateBeforeSave: false })` — we only update `verificationOTP` and `verificationOTPExpires`, no need to re-validate required fields like `firstName`, `email`, etc.

### Concrete Strategy #2 — Link — `strategies/link.strategy.js`

```javascript
class LinkStrategy extends VerificationStrategy {

    async sendVerification(user) {
        const link = this.constructor.generateLink();
        //                   ^ static method call
        const expirationDate = this.generateExpirationDate();

        await this.saveLink(user, link, expirationDate);
        await this.sendLinkEmail(user, link);
    }

    static generateLink() {
        return crypto.randomBytes(32).toString('hex');
        //    ^ 32 random bytes = 64 hex characters
        //    entropy: 256 bits — practically unguessable
    }

    generateExpirationDate() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
        //                                ^ 24 hours in ms
    }

    async saveLink(user, link, expirationDate) {
        user.verificationOTP = link;
        //    ^ NOTE: reuses the verifcationOTP field (misnamed but functional)
        user.verificationOTPExpires = expirationDate;
        await user.save({ validateBeforeSave: false });
    }

    async sendLinkEmail(user, link) {
        await emailService.sendSignUpVerification(user.email, link, user.userName);
    }
}
```

Key differences from OTP Strategy:
- **Token type**: 64-character hex string (32 random bytes) vs 6-digit number
- **Storage**: Token is stored **in plain text** (not hashed) — this is a design choice. For a link strategy, the token is often stored hashed too, but here it's stored raw.
- **Expiration**: 24 hours vs 10 minutes — links are meant to be clicked at the user's convenience
- **Delivery**: "Click the button" email vs "Type this code" email

### What's Missing: The Factory

`factories/verification.factory.js` — currently **empty**.

Expected implementation would look like:

```javascript
class VerificationFactory {
    static createStrategy(type) {
        switch (type) {
            case 'otp':
                return new OTPStrategy();
            case 'link':
                return new LinkStrategy();
            default:
                throw new Error('Invalid verification strategy');
        }
    }
}
```

The factory would allow:
```javascript
const strategy = VerificationFactory.createStrategy('otp');
await strategy.sendVerification(user);
```

This would let the application switch strategies at runtime based on configuration or user preference.

### How the Pattern Would Be Used

Eventually, in the auth controller or service:

```javascript
// When user signs up:
const strategy = VerificationFactory.createStrategy('otp');
// or config-driven:
// const strategy = VerificationFactory.createStrategy(process.env.VERIFICATION_TYPE);

await strategy.sendVerification(newUser);

// On verification:
// (OTP)   — compare submitted OTP with hashed one in DB
// (Link)  — find user by token and check expiration
```

### Why Strategy Pattern Here?

| Without Strategy | With Strategy |
|---|---|
| `if (type === 'otp') { ... } else { ... }` scattered everywhere | New strategy = new class |
| Adding SMS verification = modify every if/else | Adding SMS = `class SMSStrategy extends VerificationStrategy` |
| Hard to test in isolation | Each strategy is independently testable |
| Business logic mixed with delivery logic | Clean separation of concerns |

---

## Error Handling Infrastructure

### AppError — `utils/AppError.js`

```javascript
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "Failed" : "Error";
        this.isOperational = true;  // distinguish from programming errors
        Error.captureStackTrace(this, this.constructor);
    }
}
```

- `4xx` → status = `"Failed"` (client error)
- `5xx` → status = `"Error"` (server error)
- `isOperational = true` — marks errors as expected/app-level vs unexpected/programming bugs

### catchAsync — `utils/catchAsync.js`

```javascript
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
        // catches any rejected promise and forwards to Express error handler
    };
};
```

Wraps async route handlers so that thrown errors are caught and passed to `next()`. Without this, Express wouldn't catch errors in async functions.

### Global Error Handler — `controllers/error.controller.js`

```javascript
module.exports = (err, req, res, next) => {
    console.log(err.stack);  // log for debugging
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};
```

Registered as the last middleware in `app.js`:
```javascript
app.use(globalErrorHandling);
```

---

## Project Architecture Diagram

```
server.js                         ← Entry point
    │
    ├─── config/
    │    ├── DB.js                ← MongoDB/Mongoose connection
    │    ├── email.js             ← Nodemailer transport + Handlebars setup
    │    └── key.js               ← Env var exports
    │
    ├─── app.js                   ← Express app (routes, middleware, error handler)
    │    │
    │    ├── routes/
    │    │    ├── auth.routes.js   ← POST /login, POST /register
    │    │    └── user.routes.js   ← GET / (protected)
    │    │
    │    ├── controllers/
    │    │    ├── auth.controller.js     ← login(), register()
    │    │    ├── user.controller.js     ← getAllUser()
    │    │    └── error.controller.js    ← global error handler
    │    │
    │    ├── services/
    │    │    ├── auth.service.js        ← login logic, register logic, JWT
    │    │    └── email.service.js       ← sendEmail, 3 convenience methods
    │    │
    │    ├── middlewares/
    │    │    └── auth.middleware.js     ← protect() — JWT verification
    │    │
    │    ├── strategies/
    │    │    ├── verification.strategy.js   ← abstract base
    │    │    ├── otp.strategy.js           ← OTP verification
    │    │    └── link.strategy.js          ← Link verification
    │    │
    │    ├── factories/
    │    │    └── verification.factory.js   ← EMPTY (TODO)
    │    │
    │    ├── models/
    │    │    ├── user.model.js              ← User schema + bcrypt
    │    │    └── comment.model.js           ← (incomplete placeholder)
    │    │
    │    ├── dtos/
    │    │    └── user.dto.js                ← formatUser(), formatAllUsers()
    │    │
    │    ├── utils/
    │    │    ├── AppError.js                ← Custom error class
    │    │    └── catchAsync.js              ← Async error wrapper
    │    │
    │    └── template/
    │         ├── signup-OTP.hbs             ← OTP email template
    │         ├── signup-link.hbs            ← Magic link email template
    │         └── forget-password-otp.hbs    ← Password reset OTP template
```

---

## Request Lifecycle (Login Example)

```
Client                           Server
  │                                 │
  │  POST /api/v1/auth/login        │
  │  { email, password }            │
  │ ──────────────────────────────► │
  │                                 │
  │                    app.js: express.json() → parse body
  │                    auth.routes.js → match /login
  │                    auth.controller.login()
  │                                 │
  │                    AuthService.login({ email, password })
  │                      ├─ User.findOne({ email }).select('+password')
  │                      ├─ user.comparePassword(password) → bcrypt.compare
  │                      ├─ AuthService.generateToken(user) → jwt.sign
  │                      └─ userDTO.formatUser(user)
  │                                 │
  │  ◄────────────────────────────── │
  │  200 { token, user }            │
```

## Request Lifecycle (Protected Route Example)

```
Client                           Server
  │                                 │
  │  GET /api/v1/users              │
  │  Authorization: Bearer <token>  │
  │ ──────────────────────────────► │
  │                                 │
  │                    auth.middleware.protect()
  │                      ├─ Extract token from header
  │                      ├─ AuthService.verifyToken(token) → jwt.verify
  │                      ├─ User.findById(payload.userId)
  │                      └─ req.user = user
  │                                 │
  │                    user.controller.getAllUser()
  │                      ├─ User.find({}) → all users
  │                      └─ userDTO.formatAllUsers(users)
  │                                 │
  │  ◄────────────────────────────── │
  │  200 { data: { users: [...] } } │
```

---

## Summary of What's Done / What's Pending

| Feature | Status | File(s) |
|---|---|---|
| JWT generate/verify/decode | ✅ Done | `services/auth.service.js` |
| Login (email + password) | ✅ Done | `controllers/auth.controller.js`, `services/auth.service.js` |
| Sign-up / Register | ✅ Done | `controllers/auth.controller.js`, `services/auth.service.js` |
| Email service (Nodemailer + Mailtrap + Handlebars) | ✅ Done | `config/email.js`, `services/email.service.js`, `template/*.hbs` |
| Strategy Pattern (OTP + Link) | ✅ Done | `strategies/*.js` |
| Strategy Factory (creates strategies) | ❌ Empty file | `factories/verification.factory.js` |
| Protect middleware (JWT auth guard) | ✅ Done | `middlewares/auth.middleware.js` |
| Error handling (AppError + catchAsync + global handler) | ✅ Done | `utils/*.js`, `controllers/error.controller.js` |
| User DTO (sanitize output) | ✅ Done | `dtos/user.dto.js` |
| Email verification → login flow | ❌ Not wired | —
| Password reset flow | ❌ Not wired | (template exists, no routes/controllers) |
| Refresh tokens | ❌ Not implemented | —
| Role-based authorization | ❌ Not implemented | —
| Logout (token blacklist) | ❌ Not implemented | —
