# Authentication System

A robust and scalable Authentication & Authorization service built with **Node.js** and **MongoDB**. Designed using **Clean Architecture** principles and Software Design Patterns (**Strategy**, **Factory**) to ensure maintainability, testability, and seamless extensibility.

---

## Key Features

- **Authentication & Authorization (AuthN / AuthZ):** Secure user identification using **JWT** (JSON Web Tokens) alongside **OAuth** integration.
- **Dynamic Email Service Strategy:** Leverages **Strategy** and **Factory** design patterns to switch between **OTP** and **Verification Link** email drivers seamlessly without breaking existing logic.
- **File Uploads:** Integrated file handling for user profiles and attachments.
- **Centralized Error Handling:** Global middleware for standardized API error responses and operational error management.
- **Database Management:** Scalable data modeling with **MongoDB** and Mongoose.

---

## Architecture & Design Principles

- **Clean Architecture & MVC Structure:** Decoupled business logic from transport and framework layers, ensuring modularity and clear separation of concerns.
- **Design Patterns Applied:**
  - **Strategy Pattern:** Enables interchangeable notification workflows (OTP vs. Direct Link).
  - **Factory Pattern:** Dynamically instantiates the target email provider based on environmental configuration.

---

## Tech Stack

- **Runtime Environment:** Node.js
- **Database:** MongoDB
- **Security & Tokens:** JWT, OAuth
- **Architecture:** MVC / Clean Architecture