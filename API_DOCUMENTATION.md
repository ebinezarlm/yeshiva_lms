# Authentication API Documentation

## Overview

This document describes the authentication and user management API endpoints for the Learning Management System. The API uses JWT (JSON Web Tokens) for authentication with both access tokens (15 minutes expiry) and refresh tokens (7 days expiry).

## Base URL

All endpoints are relative to: `http://localhost:5000/api`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Test Users

The system is seeded with four test users:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@lms.com | password123 |
| Admin | admin@lms.com | password123 |
| Tutor | tutor@lms.com | password123 |
| Student | student@lms.com | password123 |

## Endpoints

### Authentication Endpoints

#### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleName": "student"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "status": "active"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation:**
- `name`: Required, min 2 characters
- `email`: Required, valid email format
- `password`: Required, min 6 characters
- `roleName`: Optional, defaults to "student", must be one of: "student", "tutor", "admin", "superadmin"

---

#### POST /auth/login
Authenticate and receive JWT tokens.

**Request Body:**
```json
{
  "email": "student@lms.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "Student User",
    "email": "student@lms.com",
    "role": "student",
    "status": "active"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid credentials or validation errors
- `401 Unauthorized`: Invalid email or password

---

#### POST /auth/logout
Invalidate the current refresh token (client should also discard tokens).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

---

#### POST /auth/refresh
Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token

---

### User Management Endpoints

#### GET /users/profile
Get the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Student User",
  "email": "student@lms.com",
  "role": "student",
  "status": "active",
  "createdAt": "2025-11-02T08:58:17.277Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

---

#### GET /users
List all users (Admin and Super Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Super Admin User",
    "email": "superadmin@lms.com",
    "role": "superadmin",
    "status": "active",
    "createdAt": "2025-11-02T08:58:16.364Z"
  },
  {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@lms.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2025-11-02T08:58:16.673Z"
  }
]
```

**Authorization:**
- Requires role: `admin` or `superadmin`

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (not admin/superadmin)

---

#### POST /users/:userId/role
Update a user's role (Super Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `userId`: The UUID of the user to update

**Request Body:**
```json
{
  "roleName": "admin"
}
```

**Response (200 OK):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid",
    "name": "Updated User",
    "email": "user@example.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2025-11-02T08:58:17.277Z"
  }
}
```

**Authorization:**
- Requires role: `superadmin`

**Validation:**
- `roleName`: Required, must be one of: "student", "tutor", "admin", "superadmin"

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (not superadmin)
- `404 Not Found`: User not found

---

#### DELETE /users/:userId
Delete a user account (Super Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `userId`: The UUID of the user to delete

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Authorization:**
- Requires role: `superadmin`

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions (not superadmin)
- `404 Not Found`: User not found

---

## JWT Token Structure

### Access Token Payload
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roleId": "uuid",
  "roleName": "student",
  "iat": 1762073975,
  "exp": 1762074875
}
```

**Expiry:** 15 minutes

### Refresh Token Payload
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roleId": "uuid",
  "roleName": "student",
  "iat": 1762073975,
  "exp": 1762678775
}
```

**Expiry:** 7 days

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": [
    {
      "code": "validation_code",
      "message": "Detailed error message",
      "path": ["field_name"]
    }
  ]
}
```

---

## Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Role-Based Access Control

| Endpoint | Student | Tutor | Admin | Super Admin |
|----------|---------|-------|-------|-------------|
| POST /auth/signup | ✅ | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ | ✅ |
| POST /auth/refresh | ✅ | ✅ | ✅ | ✅ |
| GET /users/profile | ✅ | ✅ | ✅ | ✅ |
| GET /users | ❌ | ❌ | ✅ | ✅ |
| POST /users/:userId/role | ❌ | ❌ | ❌ | ✅ |
| DELETE /users/:userId | ❌ | ❌ | ❌ | ✅ |

---

## Example Usage with curl

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@lms.com", "password": "password123"}'
```

### Get Profile
```bash
TOKEN="your_access_token_here"
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### List Users (Admin only)
```bash
TOKEN="your_access_token_here"
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Token
```bash
REFRESH_TOKEN="your_refresh_token_here"
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

---

## Frontend Integration Notes

1. **Store tokens securely**: Store access and refresh tokens in memory or secure storage (not localStorage for production)
2. **Handle token expiry**: Implement automatic token refresh when access token expires
3. **Include token in requests**: Add Authorization header to all authenticated requests
4. **Handle 401 responses**: Redirect to login when receiving 401 Unauthorized
5. **Logout cleanup**: Clear tokens from storage on logout

---

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS in production to protect tokens in transit
2. **Token Storage**: Avoid storing tokens in localStorage in production (use httpOnly cookies or secure storage)
3. **Password Requirements**: Enforce strong password policies (currently min 6 characters)
4. **Rate Limiting**: Consider implementing rate limiting on authentication endpoints
5. **Account Lockout**: Consider implementing account lockout after failed login attempts
6. **Token Rotation**: Refresh tokens are rotated on each refresh request
7. **Logout**: Tokens should be discarded client-side on logout
