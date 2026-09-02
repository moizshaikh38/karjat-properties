# Authentication and User Management API Documentation

## Overview

The Authentication API provides login, password management, and role-based access control for Karjat Properties. The User API manages staff accounts.

## Roles

The system uses role-based access control (RBAC).

| Role | Description |
|------|-------------|
| `admin` | Full system access. Can create/manage all users, properties, and system settings. |
| `manager` | Operational lead. Can create/manage properties and standard agents. Cannot create/manage other admins. |
| `agent` | Standard staff. Read-only access to properties. Later: manage assigned leads and site visits. |

## Authentication Format

All protected routes require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 1. Auth Endpoints

### Login

`POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "secure-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin",
      "is_active": true
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```

**Response (401 - Invalid Credentials):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

### Get Current User

`GET /api/auth/me`

Requires: Auth Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### Change Password

`POST /api/auth/change-password`

Requires: Auth Token

**Request:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-secure-password"
}
```

---

## 2. User Management Endpoints

All user management endpoints require `admin` or `manager` roles.

### Create User

`POST /api/users`

**Request:**
```json
{
  "name": "Agent John",
  "email": "john@example.com",
  "password": "initial-password-123",
  "phone": "+919876543210",
  "role": "agent"
}
```

**Note:** Managers cannot create `admin` users. Only Admins can.

### List Users

`GET /api/users`

### Update User

`PATCH /api/users/:id`

Partial updates allowed.

### Deactivate User

`PATCH /api/users/:id/deactivate`

Soft-deletes the user by setting `is_active = false`. Deactivated users cannot log in.

---

## 3. Initial Admin Bootstrap

In production, you cannot use the API to create the very first admin user since there are no admins to authenticate the request.

Instead, run the bootstrap script using environment variables:

```bash
# Set credentials
export ADMIN_NAME="Super Admin"
export ADMIN_EMAIL="admin@karjatproperties.com"
export ADMIN_PASSWORD="secure-initial-password"

# Run bootstrap script
npx tsx src/scripts/createAdmin.ts
```

This script will safely hash the password and insert the admin user. It will not duplicate the user if one already exists.
