# ⚙️ RekaKarbon Backend Server (`server/`)

Robust, production-grade NestJS REST API and enterprise backend powering the **RekaKarbon** digital Measurement, Reporting, and Verification (dMRV) and Carbon Exchange (Bursa Karbon) platform.

---

## 🏛️ Architecture Overview

The backend server is structured with modular NestJS architecture, integrating relational storage (PostgreSQL via Prisma), EVM blockchain interaction (Hyperledger Besu / Ethers.js), and **native in-process AI/ML anomaly detection (`onnxruntime-node`)**.

```
server/src/
├── auth/            # JWT authentication, Argon2/Bcrypt password hashing, RBAC guards
├── emitter/         # Industrial emitter registration, facility management, and emission logging
├── audit/           # dMRV verification, auditor workflow, spatial GIS, and embedded ONNX AI/ML Engine
│   ├── dto/         # Audit query and emission report validation DTOs
│   ├── types/       # Audit and ML result interfaces
│   ├── ml-audit-engine.service.ts # Real-time ONNX runtime execution & multi-tier audit rules
│   ├── ml-feature-engineer.ts    # 20-dimensional GHG Protocol physical & fiscal feature extractor
│   └── audit.controller.ts       # REST endpoints including POST /audit/evaluate-emission
├── blockchain/      # Ethers.js client, ERC-20 Carbon Token minting, retirement & burn listeners
├── marketplace/     # Bursa Karbon orderbook, trade settlement, and bid/ask matching
├── notifications/   # System-wide alert and audit trigger notifications
└── prisma/          # Database client service and schema mapping
```

---

## 🌿 Embedded AI/ML dMRV Engine (`onnxruntime-node`)

The server directly executes the trained machine learning pipeline without requiring an external Python service in production.

### How it Works:

1. **Model Graph Loading**: On application startup (`onModuleInit`), `MlAuditEngineService` loads `ml/models/anomaly_pipeline.onnx` into memory using Microsoft's `onnxruntime-node` C++ runtime.
2. **Feature Transformation**: When an emitter submits emission data, `EmissionFeatureEngineer` computes the **20 derived physical & fiscal parameters** defined in [`ml/README.md`](../ml/README.md):
   - GHG Protocol Scope 1 stoichiometric combustion balance & Scope 2 PLN grid divergence.
   - Mathematical summation discrepancy detection ($\text{Scope 1} + \text{Scope 2} + \text{Scope 3} \neq \text{Total}$).
   - DJP e-Faktur fuel unit price validation (Rp 16,000 – 25,000 / L index).
   - Sector carbon intensity Z-scores across 6 Indonesian industrial sectors configured in `ml/data/sectors.json`.
3. **ONNX Graph Inference**: The 20-dimensional Float32 tensor is executed asynchronously in the ONNX graph (`IsolationForest + RobustScaler`).
4. **Verificator Decision Support Payload**: The service combines the raw ML outlier score with fiscal & physical checks to return a comprehensive diagnostic payload (`priority`, `verdict`, `trustScore`, `scopeDiagnostics`, `flags`, `xai`).

---

## 🔌 Key API Endpoints

| Method | Path                        | Description                                                     | Access Role             |
| :----- | :-------------------------- | :-------------------------------------------------------------- | :---------------------- |
| `POST` | `/audit/evaluate-emission`  | Run real-time AI/ML & stoichiometric audit on emission filing   | `auditor`, `superadmin` |
| `GET`  | `/audit/anomaly-logs`       | Retrieve AI anomaly detection history across emitters           | `auditor`, `superadmin` |
| `GET`  | `/audit/anomaly-summary`    | Retrieve aggregate anomaly statistics and DJP mismatch counts   | `auditor`, `superadmin` |
| `GET`  | `/audit/energy-correlation` | Retrieve physical energy spend vs. emission correlation data    | `auditor`, `superadmin` |
| `POST` | `/audit/verify/:id`         | Auditor verification action on flagged anomaly                  | `auditor`, `superadmin` |
| `POST` | `/audit/authorize-minting`  | Authorize carbon token minting for verified emission reductions | `superadmin`            |

---

## 🛠️ Getting Started & Development

### 1. Installation

```bash
# From workspace root
pnpm install
```

### 2. Environment Configuration

Create `.env` in `server/` with the following variables:

```env
PORT=3000
DATABASE_URL="postgresql://rekakarbon:rekakarbon123@localhost:5432/rekakarbon_db?schema=public"
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="7d"
RPC_URL="http://localhost:8545"
CARBON_TOKEN_ADDRESS="0x..."
PRIVATE_KEY="0x..."
```

### 3. Database Migration & Seed

```bash
pnpm --filter ./server prisma:migrate
pnpm --filter ./server prisma:seed
```

### 4. Running the Server

```bash
# Development mode with hot-reload
pnpm server:dev

# Production build & run
pnpm server:build
pnpm server:prod
```

### 5. Running Tests & Quality Checks

```bash
# Run unit & integration tests (Jest)
pnpm server:test

# TypeScript Typecheck
pnpm server:typecheck

# ESLint check & auto-fix
pnpm server:lint
```

---

## 🤖 AI Agent Governance

For AI agents modifying backend code, refer to [AGENTS.md](./AGENTS.md) for strict architectural rules, API envelope contracts, database migration guidelines, and PR quality gates.
