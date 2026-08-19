---
name: api-design-standards
description: Standardized API design, JSON representation, and specification guidelines for RekaKarbon monorepo. Use whenever designing, specifying, or implementing REST endpoints, DTOs, or client-server contracts.
---

# API Design & Specification Standards — RekaKarbon

This skill defines essential rules and workflows for AI agents designing, specifying, or implementing HTTP/REST APIs and JSON contracts across the RekaKarbon monorepo (`client/` and `server/`).

---

## 📌 Core Guiding Principles

1. **Separation of Raw Data vs. UI Presentation**:
   - Backend APIs MUST transmit **raw, unformatted semantic data** (pure numbers, ISO 8601 strings, stable enum keys).
   - Backend APIs MUST NEVER return UI-formatted display strings like `"Rp 200.000.000"`, `"25.0K Ha"`, `"4.8 MB"`, `"14 Feb 2026"`, or `"+43.2%"`.
   - UI formatting is strictly the frontend's responsibility using `@/lib/formatters` and `@/lib/dates`.

2. **Strict Native JSON Data Types**:
   - **Numbers**: Nominal currency (`amount: 200000000`), carbon volume (`volumeTCO2e: 5000`), land area (`areaHectares: 25000`), file sizes (`fileSizeBytes: 5033165`).
   - **Dates & Timestamps**: ISO 8601 calendar date (`"2026-02-14"`) or RFC 3339 UTC timestamp (`"2026-08-19T00:30:00Z"`).
   - **Booleans**: Native JSON booleans (`true` / `false`), prefixed with `is...`, `has...`, or `can...` (e.g. `isVerified: true`).
   - **Enums**: Lowercase `snake_case` string literals (e.g. `"non_compliant"`, `"awaiting_farmer"`). Avoid title-cased or legacy localized strings.

3. **Explicit Unit Metadata & Field Naming**:
   - Field names should make units clear when applicable (`areaHectares`, `fundingBudgetIDR`, `durationSeconds`, `fileSizeBytes`, `carbonSequestrationTCO2e`).
   - For line items with variable physical units, include an explicit `unit?: string` property (e.g. `{ qty: 400, unit: "Karung" }`).

4. **Primary Key UUID Standard vs Business Reference Numbers**:
   - **Primary Technical Entity Key (`id`)**: MUST use standard **UUIDv4 / UUIDv7** strings (e.g. `"550e8400-e29b-41d4-a716-446655440000"`). NEVER use human-readable slugs or sequential integers as primary database keys.
   - **Business Reference Numbers**: Human-readable domain codes (e.g. `speCertificateId: "SPE-BALURAN-2025-001"`, `npwp: "01.234.567.8-012.000"`, `stpDocId: "STP-DJP-2026-001"`) MUST be preserved as secondary business attributes rather than entity primary keys.

---

## 🏗️ Standard API Response & Error Schemas

### 1. Success Response Envelope

All REST API endpoints MUST wrap successful response payloads in a standard envelope:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "projectName": "TN Baluran Restorasi",
    "areaHectares": 25000,
    "actualSequestrationTCO2e": 1240000,
    "fundingBudgetIDR": 18500000000,
    "createdAt": "2026-08-19T00:30:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 2. Error Response Envelope

All error responses MUST return a standard error object with an HTTP error status code:

```json
{
  "success": false,
  "error": {
    "code": "EMISSION_CAP_EXCEEDED",
    "message": "The requested purchase volume exceeds the active carbon deficit cap.",
    "details": {
      "requestedVolumeTCO2e": ["Maximum allowed volume is 2330 tCO2e."]
    }
  }
}
```

---

## 🚦 HTTP Status Code Standards

| HTTP Status         | Usage Criteria in RekaKarbon                                             |
| :------------------ | :----------------------------------------------------------------------- |
| `200 OK`            | Request succeeded; returns data payload.                                 |
| `201 Created`       | Resource created successfully (e.g. new emission report or transaction). |
| `204 No Content`    | Action succeeded with no body returned.                                  |
| `400 Bad Request`   | Syntactically invalid payload or missing mandatory parameters.           |
| `401 Unauthorized`  | Missing or invalid authentication token / signature.                     |
| `403 Forbidden`     | Authenticated user/role lacks permission for target resource.            |
| `404 Not Found`     | Target resource identifier does not exist.                               |
| `422 Unprocessable` | Syntactically valid JSON but violates business validation rules.         |
| `500 Server Error`  | Unhandled server exception.                                              |

---

## 🔄 4-Step API Specification & Implementation Workflow

Whenever designing or implementing a new feature across `client/` and `server/`, follow this 4-step workflow:

### Step 1: Define TypeScript Data Interface (`client/src/types/<feature>.ts` & `server/src/types/<feature>.ts`)

Define clean, machine-readable interfaces using strict native types without union fallbacks (`number | string`).

```typescript
export interface EmissionReport {
  id: string;
  year: number;
  uploadDate: string; // ISO 8601 "YYYY-MM-DD"
  fileSizeBytes: number; // Bytes
  totalEmissionsTCO2e: number;
  auditStatus: 'pending' | 'verified' | 'rejected';
}
```

### Step 2: Implement Backend DTO & Controller (`server/src/`)

Implement NestJS/Express DTO validation and controller returning the standard `{ success: true, data: T }` envelope.

### Step 3: Implement Client Repository Service (`client/src/repositories/`)

Implement Repository pattern with dual support (`Mock...Repository` and `Api...Repository`), controlled by `VITE_USE_MOCK_DATA`.

### Step 4: UI Dynamic Rendering (`client/src/`)

Format raw numbers in UI views using centralized formatters from `@/lib/formatters` (`formatCurrency`, `formatCarbon`, `formatArea`, `formatQuantity`) and `@/lib/dates` (`formatDate`).

---

## 📖 Complete API Guideline Reference

For detailed guidelines on currency codes (ISO 4217), country codes (ISO 3166-1), language tags (BCP 47), timestamps (RFC 3339), UUIDs, and pagination, refer to the full team standard:

- [references/api-design-guideline.md](references/api-design-guideline.md)
