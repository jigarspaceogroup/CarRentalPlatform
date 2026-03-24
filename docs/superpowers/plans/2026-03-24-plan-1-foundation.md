# Plan 1: Project Foundation & Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the monorepo structure, database schema, authentication system, shared utilities (i18n, validation, error handling, API response format), and real-time infrastructure so that all subsequent plans can build on a solid foundation.

**Architecture:** TypeScript monorepo with three packages: `server` (Node.js/Express.js backend API), `web` (React.js service provider dashboard), and `mobile` (React Native customer app). PostgreSQL database accessed via Prisma ORM. JWT-based auth with access/refresh tokens. Socket.io for real-time events. RESTful API versioned at `/api/v1/`.

**Tech Stack:** TypeScript, Node.js, Express.js, React.js, React Native, PostgreSQL, Prisma, JWT, Socket.io, Redis (token blacklist + rate limiting), Jest, Supertest

---

## File Structure

```
car-rental-platform/
├── package.json                          # Root monorepo config (npm workspaces)
├── tsconfig.base.json                    # Shared TypeScript config
├── .env.example                          # Environment variable template
├── .gitignore                            # Ignore node_modules, dist, .env, etc.
├── docker-compose.yml                    # PostgreSQL + Redis for local dev
│
├── packages/
│   ├── shared/                           # Shared types, constants, utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Barrel export
│   │       ├── types/
│   │       │   ├── api.ts                # API response envelope, pagination types
│   │       │   ├── auth.ts               # User roles, JWT payload, auth types
│   │       │   └── models.ts             # Shared model interfaces (User, Vehicle, Booking, etc.)
│   │       ├── constants/
│   │       │   ├── roles.ts              # USER_ROLES enum
│   │       │   ├── booking-status.ts     # BOOKING_STATUS enum
│   │       │   └── errors.ts             # Error code constants
│   │       ├── i18n/
│   │       │   ├── en.json               # English translations
│   │       │   ├── ar.json               # Arabic translations
│   │       │   └── index.ts              # i18n helper (t function)
│   │       └── validation/
│   │           ├── auth.ts               # Zod schemas for auth payloads
│   │           └── index.ts              # Barrel export
│   │
│   ├── server/                           # Backend API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # Database schema
│   │   │   └── seed.ts                   # Seed script for dev data
│   │   └── src/
│   │       ├── index.ts                  # Server entry point
│   │       ├── app.ts                    # Express app setup (middleware, routes)
│   │       ├── config/
│   │       │   └── env.ts                # Environment config with validation
│   │       ├── middleware/
│   │       │   ├── auth.ts               # JWT verification middleware
│   │       │   ├── role-guard.ts         # Role-based access control middleware
│   │       │   ├── rate-limiter.ts       # Rate limiting middleware (Redis-backed)
│   │       │   ├── validate.ts           # Zod schema validation middleware
│   │       │   ├── error-handler.ts      # Global error handler
│   │       │   └── cors.ts              # CORS configuration
│   │       ├── modules/
│   │       │   └── auth/
│   │       │       ├── auth.routes.ts    # POST /register, /login, /refresh, /logout
│   │       │       ├── auth.controller.ts
│   │       │       ├── auth.service.ts   # Business logic (hash, verify, token mgmt)
│   │       │       └── auth.test.ts      # Integration tests
│   │       ├── lib/
│   │       │   ├── prisma.ts             # Prisma client singleton
│   │       │   ├── redis.ts              # Redis client singleton
│   │       │   ├── socket.ts             # Socket.io server setup
│   │       │   ├── api-response.ts       # Success/error response helpers
│   │       │   └── password.ts           # bcrypt hash/compare helpers
│   │       └── __tests__/
│   │           └── setup.ts              # Jest global setup (test DB, cleanup)
│   │
│   ├── web/                              # React.js dashboard (scaffolded, minimal)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx                  # App entry point
│   │       ├── App.tsx                   # Root component with router placeholder
│   │       ├── lib/
│   │       │   └── api-client.ts         # Axios instance with JWT interceptor
│   │       └── i18n/
│   │           └── setup.ts              # react-i18next setup
│   │
│   └── mobile/                           # React Native app (scaffolded, minimal)
│       ├── package.json
│       ├── tsconfig.json
│       ├── app.json                      # React Native config
│       └── src/
│           ├── App.tsx                   # Root component with navigator placeholder
│           ├── lib/
│           │   └── api-client.ts         # Axios instance with JWT interceptor
│           └── i18n/
│               └── setup.ts             # i18next-react-native setup
│
├── docs/                                 # Documentation (already exists)
│   ├── PROJECT_SCOPE.md
│   └── PRD.md
│
└── scripts/
    └── setup-dev.sh                      # One-command dev environment setup
```

---

## Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`

- [ ] **Step 1: Create root `package.json` with npm workspaces**

```json
{
  "name": "car-rental-platform",
  "version": "0.0.1",
  "private": true,
  "workspaces": [
    "packages/shared",
    "packages/server",
    "packages/web"
  ],
  "scripts": {
    "dev:server": "npm run dev -w packages/server",
    "dev:web": "npm run dev -w packages/web",
    "build": "npm run build -w packages/shared && npm run build -w packages/server && npm run build -w packages/web",
    "test": "npm run test -w packages/server",
    "lint": "eslint packages/*/src --ext .ts,.tsx"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
.env
*.log
.DS_Store
coverage/
.turbo/
packages/mobile/android/
packages/mobile/ios/
```

- [ ] **Step 4: Create `.env.example`**

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_rental_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:5173

# Test Database (used by Jest)
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/car_rental_test
```

- [ ] **Step 5: Create `packages/shared/package.json` and `tsconfig.json`**

`packages/shared/package.json`:
```json
{
  "name": "@car-rental/shared",
  "version": "0.0.1",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create `packages/server/package.json` and `tsconfig.json`**

`packages/server/package.json`:
```json
{
  "name": "@car-rental/server",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand --forceExit",
    "test:watch": "jest --watch --runInBand --forceExit",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@car-rental/shared": "*",
    "@prisma/client": "^6.0.0",
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "ioredis": "^5.4.0",
    "socket.io": "^4.8.0",
    "zod": "^3.23.0",
    "express-rate-limit": "^7.4.0",
    "rate-limit-redis": "^4.2.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "supertest": "^7.0.0",
    "ts-node-dev": "^2.0.0",
    "ts-node": "^10.9.0",
    "prisma": "^6.0.0"
  }
}
```

`packages/server/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src", "prisma"]
}
```

- [ ] **Step 7: Create `packages/web/package.json`, `tsconfig.json`, and `vite.config.ts`**

`packages/web/package.json`:
```json
{
  "name": "@car-rental/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@car-rental/shared": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "axios": "^1.7.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0",
    "socket.io-client": "^4.8.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "typescript": "^5.5.0"
  }
}
```

`packages/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src"]
}
```

`packages/web/vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 8: Install dependencies and verify workspace resolution**

Run: `npm install`
Expected: All packages installed, workspace symlinks created. No errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with shared, server, and web packages"
```

---

## Task 2: Docker Compose for Local Dev (PostgreSQL + Redis)

**Files:**
- Create: `docker-compose.yml`
- Create: `scripts/setup-dev.sh`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: car-rental-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: car_rental_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql

  redis:
    image: redis:7-alpine
    container_name: car-rental-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Create `scripts/init-test-db.sql`**

```sql
-- Creates the test database used by Jest
SELECT 'CREATE DATABASE car_rental_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'car_rental_test')\gexec
```

- [ ] **Step 3: Create `scripts/setup-dev.sh`**

```bash
#!/bin/bash
set -e

echo "Starting PostgreSQL and Redis..."
docker-compose up -d

echo "Installing dependencies..."
npm install

echo "Creating .env from template..."
cp -n .env.example .env 2>/dev/null || true

echo "Running database migrations..."
npm run db:push -w packages/server

echo "Dev environment ready!"
echo "  Server: npm run dev:server"
echo "  Web:    npm run dev:web"
```

- [ ] **Step 4: Start services and verify connectivity**

Run: `docker-compose up -d`
Expected: Both containers running. `docker-compose ps` shows `postgres` and `redis` as "Up". Test database `car_rental_test` is automatically created.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml scripts/setup-dev.sh scripts/init-test-db.sql
git commit -m "chore: add Docker Compose for PostgreSQL and Redis local dev"
```

---

## Task 3: Shared Types and Constants

**Files:**
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/api.ts`
- Create: `packages/shared/src/types/auth.ts`
- Create: `packages/shared/src/types/models.ts`
- Create: `packages/shared/src/constants/roles.ts`
- Create: `packages/shared/src/constants/booking-status.ts`
- Create: `packages/shared/src/constants/errors.ts`

- [ ] **Step 1: Create `packages/shared/src/constants/roles.ts`**

```ts
export enum UserRole {
  CUSTOMER = 'customer',
  PROVIDER_ADMIN = 'provider_admin',
  PROVIDER_MANAGER = 'provider_manager',
  PROVIDER_OPERATOR = 'provider_operator',
  PROVIDER_SUPPORT = 'provider_support',
}
```

- [ ] **Step 2: Create `packages/shared/src/constants/booking-status.ts`**

```ts
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  VEHICLE_PREPARING = 'vehicle_preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ACTIVE_RENTAL = 'active_rental',
  RETURN_PENDING = 'return_pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.VEHICLE_PREPARING, BookingStatus.CANCELLED],
  [BookingStatus.VEHICLE_PREPARING]: [BookingStatus.READY_FOR_PICKUP, BookingStatus.CANCELLED],
  [BookingStatus.READY_FOR_PICKUP]: [BookingStatus.ACTIVE_RENTAL, BookingStatus.CANCELLED],
  [BookingStatus.ACTIVE_RENTAL]: [BookingStatus.RETURN_PENDING],
  [BookingStatus.RETURN_PENDING]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.REJECTED]: [],
};
```

- [ ] **Step 3: Create `packages/shared/src/constants/errors.ts`**

```ts
export const ErrorCode = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS: 'PHONE_ALREADY_EXISTS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // General
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

- [ ] **Step 4: Create `packages/shared/src/types/api.ts`**

```ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
```

- [ ] **Step 5: Create `packages/shared/src/types/auth.ts`**

```ts
import { UserRole } from '../constants/roles';

export interface JwtAccessPayload {
  userId: string;
  role: UserRole;
  providerId?: string; // Set for service provider roles
}

export interface JwtRefreshPayload {
  userId: string;
  tokenVersion: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  language: 'en' | 'ar';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
```

- [ ] **Step 6: Create `packages/shared/src/types/models.ts`**

```ts
export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  language: 'en' | 'ar';
  isActive: boolean;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceProvider {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 7: Create `packages/shared/src/index.ts` barrel export**

```ts
// Constants
export { UserRole } from './constants/roles';
export { BookingStatus, BOOKING_STATUS_TRANSITIONS } from './constants/booking-status';
export { ErrorCode } from './constants/errors';

// Types
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginationMeta,
  PaginationQuery,
} from './types/api';

export type {
  JwtAccessPayload,
  JwtRefreshPayload,
  LoginRequest,
  RegisterCustomerRequest,
  AuthTokens,
} from './types/auth';

export type { User, ServiceProvider } from './types/models';
```

- [ ] **Step 8: Build shared package and verify**

Run: `npm run build -w packages/shared`
Expected: `packages/shared/dist/` created with compiled JS and type declarations. No errors.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared types, constants, and enums"
```

---

## Task 4: Prisma Schema (Core Database Tables)

**Files:**
- Create: `packages/server/prisma/schema.prisma`

- [ ] **Step 1: Create `packages/server/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === USERS & AUTH ===

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  phone          String    @unique
  passwordHash   String
  fullName       String
  role           String    @default("customer") // customer, provider_admin, provider_manager, etc.
  language       String    @default("en")       // en | ar
  isActive       Boolean   @default(true)
  tokenVersion   Int       @default(0)          // Increment to invalidate all refresh tokens
  profileImageUrl String?

  // Service provider link (null for customers)
  providerId String?
  provider   ServiceProvider? @relation(fields: [providerId], references: [id])

  // Failed login tracking
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([phone])
  @@index([providerId])
}

// === SERVICE PROVIDER ===

model ServiceProvider {
  id       String  @id @default(uuid())
  name     String
  nameAr   String
  email    String  @unique
  phone    String
  isActive Boolean @default(true)

  // Branding
  logoUrl       String?
  primaryColor  String  @default("#1a73e8")
  secondaryColor String @default("#ffffff")

  users    User[]
  branches Branch[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// === BRANCH / LOCATION ===

model Branch {
  id         String  @id @default(uuid())
  providerId String
  provider   ServiceProvider @relation(fields: [providerId], references: [id])

  name       String
  nameAr     String
  address    String
  addressAr  String
  latitude   Float
  longitude  Float
  phone      String?
  email      String?
  isActive   Boolean @default(true)

  // Operating hours stored as JSON: { "mon": { "open": "08:00", "close": "20:00" }, ... }
  operatingHours Json @default("{}")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([providerId])
}
```

- [ ] **Step 2: Create `.env` file from template**

Run: `cp .env.example .env` (if not already done)

- [ ] **Step 3: Push schema to database**

Run: `npm run db:push -w packages/server`
Expected: "Your database is now in sync with your Prisma schema." All tables created.

- [ ] **Step 4: Generate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" message. `@prisma/client` is ready to use.

- [ ] **Step 5: Commit**

```bash
git add packages/server/prisma/schema.prisma
git commit -m "feat: add Prisma schema with User, ServiceProvider, and Branch models"
```

---

## Task 5: Server Core Setup (Express App, Middleware, Error Handling)

**Files:**
- Create: `packages/server/src/config/env.ts`
- Create: `packages/server/src/lib/prisma.ts`
- Create: `packages/server/src/lib/redis.ts`
- Create: `packages/server/src/lib/api-response.ts`
- Create: `packages/server/src/middleware/error-handler.ts`
- Create: `packages/server/src/middleware/cors.ts`
- Create: `packages/server/src/middleware/validate.ts`
- Create: `packages/server/src/middleware/rate-limiter.ts`
- Create: `packages/server/src/app.ts`
- Create: `packages/server/src/index.ts`

- [ ] **Step 1: Create `packages/server/src/config/env.ts`**

```ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 2: Create `packages/server/src/lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

- [ ] **Step 3: Create `packages/server/src/lib/redis.ts`**

```ts
import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis(env.REDIS_URL);
```

- [ ] **Step 4: Create `packages/server/src/lib/api-response.ts`**

```ts
import { Response } from 'express';
import type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from '@car-rental/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: PaginationMeta) {
  const response: ApiSuccessResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: Record<string, string[]>
) {
  const response: ApiErrorResponse = {
    success: false,
    error: { code, message, ...(details && { details }) },
  };
  return res.status(statusCode).json(response);
}
```

- [ ] **Step 5: Create `packages/server/src/middleware/error-handler.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@car-rental/shared';
import { sendError } from '../lib/api-response';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode);
  }

  console.error('Unhandled error:', err);
  return sendError(res, ErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
}
```

- [ ] **Step 6: Create `packages/server/src/middleware/cors.ts`**

```ts
import cors from 'cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
});
```

- [ ] **Step 7: Create `packages/server/src/middleware/validate.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCode } from '@car-rental/shared';
import { sendError } from '../lib/api-response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          if (!details[path]) details[path] = [];
          details[path].push(issue.message);
        }
        return sendError(res, ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, details);
      }
      next(err);
    }
  };
}
```

- [ ] **Step 8: Create `packages/server/src/middleware/rate-limiter.ts`**

```ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' } },
});

export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
    prefix: 'rl:api:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, try again later' } },
});
```

- [ ] **Step 9: Create `packages/server/src/app.ts`**

```ts
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limiter';

export const app = express();

// Global middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRateLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes will be registered here by feature modules
// app.use('/api/v1/auth', authRoutes);

// Error handler (must be last)
app.use(errorHandler);
```

- [ ] **Step 10: Create `packages/server/src/index.ts`**

```ts
import 'dotenv/config';
import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
```

- [ ] **Step 11: Start the server and verify health endpoint**

> Note: `dotenv` is already listed in `packages/server/package.json` dependencies and was installed in Task 1.

Run: `npm run dev:server`
Then in another terminal: `curl http://localhost:3000/api/health`
Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 12: Commit**

```bash
git add packages/server/src/
git commit -m "feat: add Express server with env config, middleware, and health endpoint"
```

---

## Task 6: JWT Authentication Middleware

**Files:**
- Create: `packages/server/src/lib/password.ts`
- Create: `packages/server/src/middleware/auth.ts`
- Create: `packages/server/src/middleware/role-guard.ts`
- Test: `packages/server/src/modules/auth/auth.test.ts`

- [ ] **Step 1: Create `packages/server/src/lib/password.ts`**

```ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 2: Create `packages/server/src/middleware/auth.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorCode } from '@car-rental/shared';
import type { JwtAccessPayload } from '@car-rental/shared';
import { env } from '../config/env';
import { sendError } from '../lib/api-response';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, ErrorCode.TOKEN_INVALID, 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return sendError(res, ErrorCode.TOKEN_EXPIRED, 'Access token expired', 401);
    }
    return sendError(res, ErrorCode.TOKEN_INVALID, 'Invalid access token', 401);
  }
}
```

- [ ] **Step 3: Create `packages/server/src/middleware/role-guard.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import { ErrorCode, UserRole } from '@car-rental/shared';
import { sendError } from '../lib/api-response';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, ErrorCode.TOKEN_INVALID, 'Not authenticated', 401);
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return sendError(res, ErrorCode.FORBIDDEN, 'Insufficient permissions', 403);
    }

    next();
  };
}
```

- [ ] **Step 4: Write the failing test for auth middleware**

Create `packages/server/src/__tests__/env.setup.ts` (loaded BEFORE modules via `setupFiles`):
```ts
// This file runs before any module imports, so process.env is set before env.ts parses
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min16chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min16chars';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/car_rental_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
```

Create `packages/server/src/__tests__/setup.ts` (loaded via `setupFilesAfterEnv`, after modules):
```ts
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

afterAll(async () => {
  // Flush test Redis keys to prevent rate limiter and blacklist state from leaking between runs
  await redis.flushdb();
  await redis.quit();
  await prisma.$disconnect();
});
```

Create `packages/server/jest.config.ts`:
```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./src/__tests__/env.setup.ts'],
  setupFilesAfterEnv: ['./src/__tests__/setup.ts'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@car-rental/shared$': '<rootDir>/../shared/src',
  },
};

export default config;
```

Create `packages/server/src/middleware/auth.test.ts`:
```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './auth';
import { env } from '../config/env';

function mockReqResNext() {
  const req = { headers: {} } as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe('authenticate middleware', () => {
  it('rejects requests with no auth header', () => {
    const { req, res, next } = mockReqResNext();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests with invalid token', () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = 'Bearer invalid-token';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts requests with valid token and attaches user', () => {
    const { req, res, next } = mockReqResNext();
    const payload = { userId: 'user-1', role: 'customer' };
    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });

  it('rejects expired tokens', () => {
    const { req, res, next } = mockReqResNext();
    // JWT with expiresIn '0s' is already expired at sign time
    const token = jwt.sign({ userId: 'user-1', role: 'customer' }, env.JWT_ACCESS_SECRET, { expiresIn: '0s' });
    req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -w packages/server -- --testPathPattern=middleware/auth`
Expected: All 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/lib/password.ts packages/server/src/middleware/auth.ts packages/server/src/middleware/role-guard.ts packages/server/src/middleware/auth.test.ts packages/server/jest.config.ts packages/server/src/__tests__/
git commit -m "feat: add JWT auth middleware with role guard and tests"
```

---

## Task 7: Auth Module (Register, Login, Refresh, Logout)

**Files:**
- Create: `packages/shared/src/validation/auth.ts`
- Create: `packages/shared/src/validation/index.ts`
- Create: `packages/server/src/modules/auth/auth.service.ts`
- Create: `packages/server/src/modules/auth/auth.controller.ts`
- Create: `packages/server/src/modules/auth/auth.routes.ts`
- Modify: `packages/server/src/app.ts` (register auth routes)
- Test: `packages/server/src/modules/auth/auth.test.ts`

- [ ] **Step 1: Create `packages/shared/src/validation/auth.ts`**

```ts
import { z } from 'zod';

export const registerCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number too short').max(20, 'Phone number too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  language: z.enum(['en', 'ar']).default('en'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
```

- [ ] **Step 2: Create `packages/shared/src/validation/index.ts`**

```ts
export { registerCustomerSchema, loginSchema, refreshTokenSchema } from './auth';
```

Update `packages/shared/src/index.ts` to add:
```ts
// Validation schemas
export { registerCustomerSchema, loginSchema, refreshTokenSchema } from './validation/auth';
```

- [ ] **Step 3: Create `packages/server/src/modules/auth/auth.service.ts`**

```ts
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { hashPassword, verifyPassword } from '../../lib/password';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error-handler';
import { ErrorCode, UserRole } from '@car-rental/shared';
import type { JwtAccessPayload, JwtRefreshPayload, AuthTokens } from '@car-rental/shared';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function generateTokens(user: { id: string; role: string; providerId?: string | null; tokenVersion: number }): AuthTokens {
  const accessPayload: JwtAccessPayload = {
    userId: user.id,
    role: user.role as UserRole,
    ...(user.providerId && { providerId: user.providerId }),
  };

  const refreshPayload: JwtRefreshPayload = {
    userId: user.id,
    tokenVersion: user.tokenVersion,
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });

  return { accessToken, refreshToken };
}

export async function registerCustomer(data: {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  language: 'en' | 'ar';
}): Promise<AuthTokens> {
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) {
    throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, 'Email already registered', 409);
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existingPhone) {
    throw new AppError(ErrorCode.PHONE_ALREADY_EXISTS, 'Phone number already registered', 409);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      fullName: data.fullName,
      role: UserRole.CUSTOMER,
      language: data.language,
    },
  });

  return generateTokens(user);
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(ErrorCode.ACCOUNT_LOCKED, 'Account locked. Try again later.', 423);
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const update: any = { failedLoginAttempts: attempts };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await prisma.user.update({ where: { id: user.id }, data: update });
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  // Reset failed attempts on success
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  return generateTokens(user);
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  // Check if token is blacklisted
  const isBlacklisted = await redis.get(`bl:${refreshToken}`);
  if (isBlacklisted) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Token has been revoked', 401);
  }

  let payload: JwtRefreshPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
  } catch {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Invalid refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || !user.isActive) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'User not found or inactive', 401);
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new AppError(ErrorCode.TOKEN_INVALID, 'Token version mismatch', 401);
  }

  // Blacklist the old refresh token
  await redis.set(`bl:${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60); // 7 days

  return generateTokens(user);
}

export async function logout(refreshToken: string): Promise<void> {
  // Blacklist the refresh token
  await redis.set(`bl:${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60);
}
```

- [ ] **Step 4: Create `packages/server/src/modules/auth/auth.controller.ts`**

```ts
import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../lib/api-response';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.registerCustomer(req.body);
    return sendSuccess(res, tokens, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.login(req.body.email, req.body.password);
    return sendSuccess(res, tokens);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    return sendSuccess(res, tokens);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body.refreshToken);
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Create `packages/server/src/modules/auth/auth.routes.ts`**

```ts
import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rate-limiter';
import { registerCustomerSchema, loginSchema, refreshTokenSchema } from '@car-rental/shared';
import * as authController from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, validate(registerCustomerSchema), authController.register);
authRoutes.post('/login', authRateLimiter, validate(loginSchema), authController.login);
authRoutes.post('/refresh', validate(refreshTokenSchema), authController.refresh);
authRoutes.post('/logout', validate(refreshTokenSchema), authController.logout);
```

- [ ] **Step 6: Register auth routes in `packages/server/src/app.ts`**

Add after the health check route:
```ts
import { authRoutes } from './modules/auth/auth.routes';

// Routes
app.use('/api/v1/auth', authRoutes);
```

- [ ] **Step 7: Write integration tests for auth endpoints**

Create `packages/server/src/modules/auth/auth.test.ts`:
```ts
// Note: env vars are set by jest setupFiles (src/__tests__/env.setup.ts)
// Redis cleanup is handled by setupFilesAfterEnv (src/__tests__/setup.ts)
import supertest from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';

const request = supertest(app);

const testUser = {
  email: 'test@example.com',
  phone: '+1234567890',
  password: 'Password123',
  fullName: 'Test User',
  language: 'en' as const,
};

beforeEach(async () => {
  await prisma.user.deleteMany();
  // Clear rate limiter keys between tests to prevent 429 responses
  await redis.flushdb();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new customer and returns tokens', async () => {
    const res = await request.post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    await request.post('/api/v1/auth/register').send(testUser);
    const res = await request.post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('rejects invalid password (no uppercase)', async () => {
    const res = await request.post('/api/v1/auth/register').send({ ...testUser, password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request.post('/api/v1/auth/register').send(testUser);
  });

  it('logs in with valid credentials', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: testUser.email,
      password: 'WrongPass123',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues new tokens with valid refresh token', async () => {
    const registerRes = await request.post('/api/v1/auth/register').send(testUser);
    const { refreshToken } = registerRes.body.data;

    const res = await request.post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('blacklists the refresh token', async () => {
    const registerRes = await request.post('/api/v1/auth/register').send(testUser);
    const { refreshToken } = registerRes.body.data;

    const logoutRes = await request.post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    // Refresh should fail after logout
    const refreshRes = await request.post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});
```

- [ ] **Step 8: Run tests**

Run: `npm test -w packages/server -- --testPathPattern=modules/auth`
Expected: All 7 tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/validation/ packages/shared/src/index.ts packages/server/src/modules/auth/ packages/server/src/app.ts
git commit -m "feat: add auth module with register, login, refresh, logout endpoints and tests"
```

---

## Task 8: Socket.io Real-Time Infrastructure

**Files:**
- Create: `packages/server/src/lib/socket.ts`
- Modify: `packages/server/src/index.ts` (attach Socket.io to HTTP server)

- [ ] **Step 1: Create `packages/server/src/lib/socket.ts`**

```ts
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtAccessPayload } from '@car-rental/shared';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
      socket.data.user = payload;

      // Join user to their own room for targeted events
      socket.join(`user:${payload.userId}`);

      // If service provider, join provider room
      if (payload.providerId) {
        socket.join(`provider:${payload.providerId}`);
      }

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.data.user.userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.data.user.userId}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
}

// Helper: emit to a specific user
export function emitToUser(userId: string, event: string, data: unknown) {
  getIO().to(`user:${userId}`).emit(event, data);
}

// Helper: emit to all provider dashboard users
export function emitToProvider(providerId: string, event: string, data: unknown) {
  getIO().to(`provider:${providerId}`).emit(event, data);
}
```

- [ ] **Step 2: Update `packages/server/src/index.ts` to attach Socket.io**

Replace the file content:
```ts
import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initSocket } from './lib/socket';

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
```

- [ ] **Step 3: Start server and verify Socket.io is listening**

Run: `npm run dev:server`
Expected: "Server running on port 3000 [development]" -- no Socket.io errors.

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/lib/socket.ts packages/server/src/index.ts
git commit -m "feat: add Socket.io real-time infrastructure with auth and room management"
```

---

## Task 9: i18n Setup (Shared + Web + Mobile Scaffolds)

**Files:**
- Create: `packages/shared/src/i18n/en.json`
- Create: `packages/shared/src/i18n/ar.json`
- Create: `packages/shared/src/i18n/index.ts`
- Create: `packages/web/src/i18n/setup.ts`
- Create: `packages/web/src/main.tsx`
- Create: `packages/web/src/App.tsx`
- Create: `packages/web/index.html`

- [ ] **Step 1: Create `packages/shared/src/i18n/en.json`**

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "noResults": "No results found",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next"
  },
  "auth": {
    "login": "Log In",
    "register": "Sign Up",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password",
    "fullName": "Full Name",
    "phone": "Phone Number",
    "forgotPassword": "Forgot Password?",
    "invalidCredentials": "Invalid email or password",
    "accountLocked": "Account locked. Try again later.",
    "emailExists": "Email already registered",
    "phoneExists": "Phone number already registered"
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "passwordMin": "Password must be at least 8 characters",
    "passwordUppercase": "Password must contain an uppercase letter",
    "passwordLowercase": "Password must contain a lowercase letter",
    "passwordNumber": "Password must contain a number"
  }
}
```

- [ ] **Step 2: Create `packages/shared/src/i18n/ar.json`**

```json
{
  "common": {
    "loading": "جاري التحميل...",
    "error": "حدث خطأ",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "search": "بحث",
    "noResults": "لم يتم العثور على نتائج",
    "confirm": "تأكيد",
    "back": "رجوع",
    "next": "التالي"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "fullName": "الاسم الكامل",
    "phone": "رقم الهاتف",
    "forgotPassword": "نسيت كلمة المرور؟",
    "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "accountLocked": "الحساب مقفل. حاول مرة أخرى لاحقاً.",
    "emailExists": "البريد الإلكتروني مسجل مسبقاً",
    "phoneExists": "رقم الهاتف مسجل مسبقاً"
  },
  "validation": {
    "required": "هذا الحقل مطلوب",
    "invalidEmail": "عنوان بريد إلكتروني غير صالح",
    "passwordMin": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
    "passwordUppercase": "يجب أن تحتوي كلمة المرور على حرف كبير",
    "passwordLowercase": "يجب أن تحتوي كلمة المرور على حرف صغير",
    "passwordNumber": "يجب أن تحتوي كلمة المرور على رقم"
  }
}
```

- [ ] **Step 3: Create `packages/shared/src/i18n/index.ts`**

```ts
import en from './en.json';
import ar from './ar.json';

export const translations = { en, ar } as const;

export type Language = keyof typeof translations;
export type TranslationKeys = typeof en;
```

Update `packages/shared/src/index.ts` to add:
```ts
// i18n
export { translations, type Language, type TranslationKeys } from './i18n';
```

- [ ] **Step 4: Create web dashboard scaffold**

`packages/web/index.html`:
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Car Rental Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`packages/web/src/i18n/setup.ts`:
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from '@car-rental/shared';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    ar: { translation: translations.ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

`packages/web/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/setup';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`packages/web/src/App.tsx`:
```tsx
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <div>
      <h1>Car Rental Dashboard</h1>
      <button onClick={toggleLanguage}>
        {i18n.language === 'en' ? 'العربية' : 'English'}
      </button>
      <p>{t('common.loading')}</p>
    </div>
  );
}

export default App;
```

- [ ] **Step 5: Create web API client**

`packages/web/src/lib/api-client.ts`:
```ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 6: Build shared package and start web dev server**

Run: `npm run build -w packages/shared && npm run dev:web`
Expected: Vite dev server starts at http://localhost:5173. Page shows "Car Rental Dashboard" with a language toggle button.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/i18n/ packages/shared/src/index.ts packages/web/
git commit -m "feat: add i18n translations (EN/AR) and scaffold web dashboard with API client"
```

---

## Task 10: Seed Script and Dev Verification

**Files:**
- Create: `packages/server/prisma/seed.ts`

- [ ] **Step 1: Create `packages/server/prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a service provider
  const provider = await prisma.serviceProvider.upsert({
    where: { email: 'admin@rentalco.com' },
    update: {},
    create: {
      name: 'RentalCo',
      nameAr: 'شركة التأجير',
      email: 'admin@rentalco.com',
      phone: '+966500000000',
      primaryColor: '#1a73e8',
      secondaryColor: '#ffffff',
    },
  });

  // Create a provider admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@rentalco.com' },
    update: {},
    create: {
      email: 'admin@rentalco.com',
      phone: '+966500000001',
      passwordHash,
      fullName: 'Admin User',
      role: 'provider_admin',
      language: 'en',
      providerId: provider.id,
    },
  });

  // Create a test customer
  const customerHash = await bcrypt.hash('Customer123!', 12);
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      phone: '+966500000002',
      passwordHash: customerHash,
      fullName: 'Test Customer',
      role: 'customer',
      language: 'en',
    },
  });

  // Create a branch
  await prisma.branch.upsert({
    where: { id: 'seed-branch-1' },
    update: {},
    create: {
      id: 'seed-branch-1',
      providerId: provider.id,
      name: 'Downtown Branch',
      nameAr: 'فرع وسط المدينة',
      address: '123 Main Street, Riyadh',
      addressAr: 'شارع الرئيسي 123، الرياض',
      latitude: 24.7136,
      longitude: 46.6753,
      phone: '+966500000003',
      email: 'downtown@rentalco.com',
      operatingHours: {
        mon: { open: '08:00', close: '20:00' },
        tue: { open: '08:00', close: '20:00' },
        wed: { open: '08:00', close: '20:00' },
        thu: { open: '08:00', close: '20:00' },
        fri: { open: '14:00', close: '20:00' },
        sat: { open: '08:00', close: '20:00' },
        sun: { open: '08:00', close: '20:00' },
      },
    },
  });

  console.log('Seed complete!');
  console.log('  Provider admin: admin@rentalco.com / Admin123!');
  console.log('  Customer: customer@test.com / Customer123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed -w packages/server`
Expected: "Seed complete!" with credentials printed.

- [ ] **Step 3: Verify full stack end-to-end**

1. Start Docker: `docker-compose up -d`
2. Push schema: `npm run db:push -w packages/server`
3. Seed: `npm run db:seed -w packages/server`
4. Start server: `npm run dev:server`
5. Test login: `curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"customer@test.com","password":"Customer123!"}'`

Expected: JSON response with `success: true` and tokens.

- [ ] **Step 4: Commit**

```bash
git add packages/server/prisma/seed.ts
git commit -m "feat: add database seed script with test provider, admin, customer, and branch"
```

---

## Summary

After completing all 10 tasks, the foundation provides:

| Component | What's Ready |
|-----------|-------------|
| **Monorepo** | npm workspaces with shared, server, web packages |
| **Database** | PostgreSQL via Prisma with User, ServiceProvider, Branch models |
| **Auth** | JWT access/refresh tokens, register, login, refresh, logout with tests |
| **Middleware** | CORS, rate limiting (Redis), validation (Zod), error handling, role guards |
| **Real-Time** | Socket.io with JWT auth, user/provider rooms, emit helpers |
| **i18n** | Arabic + English translation files, react-i18next setup on web |
| **API Client** | Axios with JWT interceptor and auto-refresh on web |
| **Dev Env** | Docker Compose (PostgreSQL + Redis), seed script, dev scripts |
| **Types** | Shared types for API responses, auth payloads, models, booking statuses |

**Next plan:** Plan 2 (Fleet & Branch Management Dashboard) builds on this foundation to implement SP-01 dashboard, SP-02 fleet CRUD, SP-03 categories, and SP-07 branch management.
