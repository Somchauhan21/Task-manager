# Task Management System

A production-ready task management system built with Next.js, TypeScript, and PostgreSQL (Neon).

## Overview

This system allows users to:
- Register, log in, and log out securely
- Create, view, update, delete, and toggle tasks
- Manage only their own tasks (user isolation)
- Use a responsive web UI with filtering, search, and pagination

## Architecture

### Technology Stack

| Layer | Technology | Reasoning |
|-------|------------|-----------|
| Frontend | Next.js 16 (App Router) | Modern React framework with excellent DX, built-in routing, and server components |
| Backend | Next.js Route Handlers | Unified codebase, simpler deployment, native TypeScript support |
| Database | PostgreSQL (Neon) | Reliable, ACID-compliant, excellent for relational data like users and tasks |
| ORM | Raw SQL with Neon SDK | Direct SQL provides better control and performance for this scope |
| Auth | JWT (Access + Refresh) | Stateless authentication, industry standard, good security when implemented correctly |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built accessible components |

### Why These Choices Minimize Bugs

1. **TypeScript Everywhere**: Strong typing catches errors at compile time rather than runtime.

2. **No ORM**: While ORMs like Prisma offer convenience, raw SQL with the Neon SDK provides:
   - Direct control over queries
   - No abstraction leaks or unexpected behavior
   - Simpler debugging
   - Better performance for straightforward CRUD operations

3. **JWT with Refresh Tokens**: 
   - Access tokens are short-lived (15 minutes) - limits exposure if compromised
   - Refresh tokens are stored in database - can be revoked server-side
   - Token rotation on refresh - prevents replay attacks

4. **Validation Layer**: All inputs are validated before processing, preventing malformed data.

5. **User Isolation**: Every task query includes user_id filtering, making data leaks impossible.

### Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST /api/auth/login
│   │   │   ├── logout/route.ts     # POST /api/auth/logout
│   │   │   ├── me/route.ts         # GET /api/auth/me
│   │   │   ├── refresh/route.ts    # POST /api/auth/refresh
│   │   │   └── register/route.ts   # POST /api/auth/register
│   │   └── tasks/
│   │       ├── [id]/
│   │       │   ├── route.ts        # GET/PATCH/DELETE /api/tasks/:id
│   │       │   └── toggle/route.ts # PATCH /api/tasks/:id/toggle
│   │       └── route.ts            # GET/POST /api/tasks
│   ├── dashboard/page.tsx          # Main task dashboard
│   ├── login/page.tsx              # Login page
│   ├── register/page.tsx           # Registration page
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with providers
│   └── globals.css                 # Global styles
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard-header.tsx        # Dashboard header with user menu
│   ├── task-card.tsx               # Individual task display
│   ├── task-filters.tsx            # Search and filter controls
│   ├── task-form.tsx               # Create/edit task dialog
│   └── task-list.tsx               # Task list with pagination
├── lib/
│   ├── api-client.ts               # Frontend API client with token handling
│   ├── auth-context.tsx            # React context for auth state
│   ├── auth.ts                     # JWT and password utilities
│   ├── db.ts                       # Database connection
│   ├── middleware.ts               # Auth middleware for routes
│   ├── types.ts                    # TypeScript type definitions
│   ├── utils.ts                    # Utility functions
│   └── validation.ts               # Input validation functions
└── scripts/
    └── 001-create-tables.sql       # Database schema
```

### Authentication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Server    │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. POST /auth/login   │                       │
       │──────────────────────>│                       │
       │   {email, password}   │                       │
       │                       │ 2. Verify user        │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │ 3. Hash compare       │
       │                       │<──────────────────────│
       │                       │                       │
       │                       │ 4. Generate tokens    │
       │                       │                       │
       │                       │ 5. Store refresh token│
       │                       │──────────────────────>│
       │                       │                       │
       │ 6. Return tokens      │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │ 7. Store in localStorage                      │
       │                       │                       │
       │ 8. GET /tasks         │                       │
       │   Authorization: Bearer <access_token>        │
       │──────────────────────>│                       │
       │                       │ 9. Verify token       │
       │                       │                       │
       │                       │ 10. Query tasks       │
       │                       │──────────────────────>│
       │                       │                       │
       │ 11. Return tasks      │                       │
       │<──────────────────────│                       │
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- A Neon PostgreSQL database (or compatible PostgreSQL)

### Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Secrets (use strong random strings in production)
JWT_ACCESS_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and secrets
   ```

4. **Run database migrations**
   
   The SQL script at `scripts/001-create-tables.sql` needs to be executed against your database.
   
   Using Neon console or psql:
   ```bash
   psql $DATABASE_URL -f scripts/001-create-tables.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to http://localhost:3000

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | Authenticate and get tokens | No |
| POST | `/api/auth/refresh` | Get new tokens using refresh token | No |
| POST | `/api/auth/logout` | Invalidate refresh token(s) | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |

#### POST /api/auth/register

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

#### POST /api/auth/login

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response (200):
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

### Task Endpoints

All task endpoints require authentication via `Authorization: Bearer <access_token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (paginated, filterable, searchable) |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:id` | Get a single task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/toggle` | Toggle task completion status |

#### GET /api/tasks

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (pending, in_progress, completed)
- `search` (string): Search by title (case-insensitive)

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "pending",
      "priority": "medium",
      "due_date": "2024-01-15T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST /api/tasks

Request:
```json
{
  "title": "New task",
  "description": "Optional description",
  "status": "pending",
  "priority": "high",
  "due_date": "2024-01-15"
}
```

## Assumptions & Trade-offs

### Assumptions

1. **Single-tenant**: Each user sees only their own tasks. No team/organization features.

2. **Simple Status Model**: Three statuses (pending, in_progress, completed) cover most use cases.

3. **Browser-based**: Tokens stored in localStorage. For mobile apps, secure storage would be needed.

### Trade-offs

1. **localStorage for Tokens**
   - Pro: Simple, works without cookies
   - Con: Vulnerable to XSS (mitigated by not accepting user HTML input)
   - Improvement: Use httpOnly cookies for refresh token

2. **No ORM**
   - Pro: Full control, simpler debugging, no abstraction overhead
   - Con: Manual migrations, no automatic schema sync
   - Improvement: For larger projects, Prisma would provide better DX

3. **Client-side Auth State**
   - Pro: Fast initial load, no server calls for auth check
   - Con: Brief flash of unauthenticated state
   - Improvement: Use middleware for server-side auth verification

4. **No Rate Limiting**
   - Improvement: Add rate limiting middleware for production

### Future Improvements

1. Add email verification for new accounts
2. Implement password reset functionality
3. Add task categories/tags
4. Add task sharing between users
5. Implement real-time updates with WebSockets
6. Add export/import functionality
7. Implement comprehensive testing suite

## Security Considerations

- Passwords hashed with bcrypt (cost factor 12)
- Short-lived access tokens (15 minutes)
- Refresh token rotation on each use
- All inputs validated before processing
- SQL injection prevented by parameterized queries
- User isolation enforced at query level
- No sensitive data in JWT payload beyond user ID and email

## License

MIT
