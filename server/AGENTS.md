# AGENTS.md - RekaKarbon Backend Server (`server/`)

Backend-specific AI Agent Governance & Development Guide for the `server/` directory. For human-facing setup and architectural overviews, see [README.md](./README.md). See root [AGENTS.md](../AGENTS.md) for monorepo-wide rules.

---

## 🛠️ Tech Stack & Environment

| Category                     | Details                                                          |
| :--------------------------- | :--------------------------------------------------------------- |
| **Framework**                | NestJS 11+ (`@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`) |
| **Language**                 | TypeScript (strict, `ES2023`, Node.js 24)                        |
| **Database ORM**             | Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`)            |
| **Relational Database**      | PostgreSQL 16+                                                   |
| **Machine Learning Runtime** | `onnxruntime-node` (native in-process C++ inference)             |
| **Blockchain Client**        | Ethers.js v6 (JSON-RPC to Hyperledger Besu QBFT)                 |
| **Object Storage**           | MinIO / S3 SDK (`minio`)                                         |
| **Authentication & RBAC**    | Passport JWT, Bcrypt / Argon2, NestJS Guards                     |
| **Testing**                  | Jest (unit, e2e, and contract suites)                            |
| **Linting & Formatting**     | ESLint (`typescript-eslint`), Prettier                           |

---

## 💻 Key Development Commands

Always execute package commands using `pnpm` from the monorepo root or within `server/`:

```bash
# Development & Building
pnpm server:dev               # Start NestJS development server with watch mode
pnpm server:build             # Compile TypeScript to dist/ via nest build
pnpm server:prod              # Start production server from dist/main.js

# Code Quality & Verification
pnpm server:lint              # ESLint across src/, test/, and prisma/
pnpm server:typecheck         # Static typecheck (tsc --noEmit)
pnpm server:test              # Run unit tests (Jest)
pnpm test:contracts           # Validate client-server API contracts

# Database Management (Prisma)
pnpm --filter ./server prisma:generate      # Generate Prisma Client
pnpm --filter ./server prisma:migrate       # Apply pending dev migrations
pnpm --filter ./server prisma:migrate:create # Create a migration without applying
pnpm --filter ./server prisma:seed          # Seed initial database records
pnpm --filter ./server prisma:studio        # Open Prisma Studio web GUI
```

---

## 📁 Package Directory Structure

```
server/
├── src/
│   ├── admin/               # Superadmin management, system metrics, user verification
│   ├── audit/               # dMRV verification, GIS spatial checks, and embedded ONNX AI/ML Engine
│   │   ├── dto/             # Audit query and emission report DTOs
│   │   ├── types/           # Audit interfaces and ML result types
│   │   ├── ml-audit-engine.service.ts # Real-time ONNX runtime execution & multi-tier audit rules
│   │   ├── ml-feature-engineer.ts    # 20-dimensional GHG Protocol physical/fiscal feature extractor
│   │   └── audit.controller.ts       # REST endpoints (POST /audit/evaluate-emission)
│   ├── auth/                # JWT authentication, login/register, password hashing, RBAC guards
│   ├── blockchain/          # Ethers.js client, ERC-1155 listener, token minting/retirement
│   ├── bursa/               # Carbon DEX marketplace orderbook, order matching, settlement
│   ├── certificates/        # SPE-GRK and emission certificate generation & validation
│   ├── common/              # Cross-cutting filters, interceptors, guards, DTOs, utilities
│   │   ├── filters/         # HttpExceptionFilter (standardized error envelope)
│   │   ├── interceptors/    # LoggingInterceptor, TransformInterceptor (data envelope)
│   │   └── utils/           # Shared helper functions
│   ├── companies/           # Industrial emitter and enterprise profiles
│   ├── compliance/          # Regulatory compliance tracking and quota status
│   ├── notifications/       # Push notifications, email triggers, and system alerts
│   ├── prisma/              # PrismaService database client wrapper
│   ├── projects/            # KTH community forestry carbon projects & geodetic boundaries
│   ├── ptbae/               # PTBAE-PU carbon emission quota allocations
│   ├── reports/             # Industrial GHG emission report submissions (Scope 1, 2, 3)
│   ├── storage/             # MinIO / S3 object upload, download, and presigned URLs
│   ├── app.module.ts        # Root module importing all domain modules
│   └── main.ts              # Server bootstrap, CORS, global pipes, Swagger setup
├── prisma/
│   ├── schema.prisma        # Database schema definitions and relations
│   ├── migrations/          # Version-controlled SQL migration files
│   └── seed.ts              # Deterministic database seeder
├── test/
│   ├── contracts/           # API contract tests matching client Zod schemas
│   ├── factories/           # Test fixtures and factory generators
│   └── app.e2e-spec.ts      # End-to-end integration tests
├── README.md                # Human-facing overview and setup guide
└── AGENTS.md                # This governance document
```

---

## 🛡️ Core Agent Governance Rules

### 1. Strict Layer Isolation

All backend code MUST adhere strictly to the Controller-Service-Repository/Prisma layered architecture:

- **Controllers**:
  - Responsible ONLY for routing, consuming request DTOs, applying route guards (`@UseGuards`), and returning HTTP responses.
  - MUST NOT contain business logic, direct database calls, or raw SQL queries.
  - MUST declare explicit TypeScript return types and Swagger annotations (`@ApiOperation`, `@ApiResponse`).
- **Services**:
  - Encapsulate all business rules, orchestration, cross-module communication, and transactions.
  - MUST handle error conditions by throwing appropriate NestJS HTTP exceptions (e.g., `NotFoundException`, `BadRequestException`, `ForbiddenException`).
- **Prisma / Data Access**:
  - Database access MUST occur exclusively through `PrismaService` or dedicated repository wrappers.
  - Never execute unbounded queries (`findMany` without `take`/`skip` or `where` constraints).

### 2. Standardized API Response Envelope

All REST endpoints are intercepted by `TransformInterceptor` and `HttpExceptionFilter`. Agents MUST design endpoints that conform to the monorepo contract standard:

#### Success Response (`2xx`):

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-07T04:00:00.000Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Response (`4xx`, `5xx`):

```json
{
  "success": false,
  "error": {
    "code": "EMISSION_LIMIT_EXCEEDED",
    "message": "Scope 1 emission exceeds allowable annual quota.",
    "details": [ ... ]
  },
  "meta": {
    "timestamp": "2026-10-07T04:00:00.000Z"
  }
}
```

- Field names MUST use `camelCase`.
- Timestamps MUST be ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- IDs MUST use UUID or CUID strings.

### 3. Client Contract Parity & DTO Validation

- Every input payload MUST have a dedicated DTO decorated with `class-validator` and `class-transformer` annotations.
- Every modification to response DTOs or controller endpoints MUST be reflected in client-side Zod schemas (`client/src/schemas/`).
- Agents MUST run `pnpm test:contracts` before submitting changes to ensure no breaking contract drifts.

### 4. Database Migrations & Prisma Standards

When modifying `prisma/schema.prisma`:

- **Naming Conventions**: Models use `PascalCase` (e.g., `EmissionReport`), fields use `camelCase` (e.g., `companyId`), and database tables/columns map to `snake_case` using `@@map("emission_reports")` and `@map("company_id")`.
- **Indexing**: All foreign keys and query filter columns (such as `status`, `createdAt`, `companyId`) MUST have explicit `@@index` annotations.
- **Migration Safety**:
  - Never run `prisma db push` in production or shared environments.
  - Always generate reproducible migrations using `pnpm --filter ./server prisma:migrate:create` or `prisma:migrate`.
  - For non-nullable fields added to existing tables, provide default values or write a two-phase migration script.

### 5. In-Process ONNX ML Engine Integration

The anomaly detection pipeline runs in-process via `onnxruntime-node`:

- **Model Path**: `ml/models/anomaly_pipeline.onnx`.
- **Lifecycle**: `MlAuditEngineService` initializes the ONNX inference session during `onModuleInit()` and keeps it in memory.
- **Feature Vector Contract**: Features MUST be extracted using `ml-feature-engineer.ts` and strictly match the **20-dimensional Float32 vector** defined in `ml/data/feature_manifest.json`.
- **Zero Python Runtime Dependency**: The server MUST NOT invoke child Python processes, shell scripts, or external ML microservices for production inference.

### 6. Blockchain (Hyperledger Besu QBFT) Integration

- **Client Library**: Use `ethers` v6.
- **Network Safety**:
  - Read operations and transaction broadcasts MUST use the designated non-validator RPC endpoint (`RPC_URL`), never validator nodes directly.
  - Enforce explicit Chain ID check (`1338` for local QBFT) before broadcasting transactions.
- **Numeric Precision**:
  - All token quantities, carbon credits, and currency values MUST be handled using `bigint` or `ethers.BigNumberish`.
  - Never use JavaScript native `number` (float) for token balances.
- **ABI Artifacts**: When contracts in `blockchain/` are modified, copy the updated ABI from `blockchain/artifacts/contracts/` into the backend ABI directory.

---

## 🧪 PR Quality Gates & Pre-Submission Checklist

Before opening a pull request touching `server/`, verify all checks pass locally:

```bash
# 1. Linting & Formatting
pnpm server:lint

# 2. TypeScript compilation check
pnpm server:typecheck

# 3. Unit and integration tests
pnpm server:test

# 4. API Contract validation
pnpm test:contracts
```
