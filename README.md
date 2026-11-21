# UniPortal – Secure University Portal

## Project Overview

UniPortal is a secure university web application developed for the CMPS380 Cybersecurity course.

The project allows students and instructors to log in securely and access their dashboards based on their assigned roles.

The main goal is to implement cybersecurity techniques that protect user accounts, prevent unauthorized access, and improve authentication security.

## Technologies Used

- Next.js and React – Web application and user interface
- JavaScript – Application functionality
- Prisma – Database management
- SQLite – Database
- Argon2 – Password hashing
- Face Recognition – Additional identity verification

## Main Features

### 1. Secure Login
- Users log in using their university ID and password.
- Passwords are securely hashed using Argon2id.
- Incorrect login attempts are tracked and limited.
- Accounts are created in advance by the system administrator.

### 2. Password Security
- Passwords must contain at least 10 characters.
- Common and weak passwords are rejected.
- Passwords are checked against known compromised passwords.
- Passwords are never stored in plain text.

### 3. Login Attempt Limiting
- A maximum of 3 failed login attempts is allowed.
- After 3 failed attempts, login is temporarily blocked for 30 seconds.

### 4. Face Verification
- A webcam is used for facial verification.
- Face recognition provides an additional authentication step.

### 5. Role-Based Access
- Students and instructors have separate dashboards.
- Access is controlled according to the user's assigned role.

### 6. Session Management
- Sessions are created after successful authentication.
- Sessions are validated to verify user access.
- Users can log out securely.
- Existing sessions can be revoked.

## How to Run the Project

### Requirements
- Node.js
- npm
- A webcam for face verification

### Steps

1. Open the project folder in VS Code.
2. Open the terminal.
3. Install the required dependencies:

```bash
npm install
```

4. Configure the database and environment variables as described in the project's configuration files.

5. Generate the Prisma client:

```bash
npx prisma generate
```

6. Apply the database migrations:

```bash
npx prisma migrate deploy
```

7. Start the application:

```bash
npm run dev
```

8. Open the local address displayed in the terminal (normally `http://localhost:3000`).

**Note:** User accounts must already exist in the database. Public registration is not available.

## Security Testing

The project includes tests for:

- Password hashing and verification
- Weak and compromised password detection
- Failed login attempt limiting
- Session creation and validation
- Logout and session revocation

These tests help verify that the security functions behave as expected.

## Team Responsibilities

| Member | Responsibility |
|---|---|
| Yara | Webcam implementation |
| Dana | Face recognition |
| Khawla | User interface and access control |
| Fatima | Security implementation and testing |

## Course Information

**Course:** CMPS380 – Cybersecurity  
**Project:** UniPortal – Secure University Portal

## Conclusion

UniPortal demonstrates how different cybersecurity techniques can be combined to build a more secure authentication system.

Through this project, we gained practical experience in password protection, authentication, access control, session management, and security testing.
