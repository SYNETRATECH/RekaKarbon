---
name: create-database-migration
description: >
  PostgreSQL database schema migration standards for RekaKarbon server layer (server/).
  Covers rollback safety, column type rules, foreign key indexing, lock safety, and validation.
---

# PostgreSQL Database Migration Skill (RekaKarbon Server)

Use this skill when designing, adding, or modifying PostgreSQL database migration scripts in the RekaKarbon backend (`server/`).

---

## 1 — Universal Migration Principles

### 1.1 Mandatory Rollback Integrity

- Every `up` / `upgrade` migration step **MUST** have a corresponding, fully executable `down` / `downgrade` step.
- Drop dependent objects in exact reverse sequence during rollback (e.g. drop indexes/constraints before dropping tables).

### 1.2 PostgreSQL Data Type Standards

Follow these strict PostgreSQL data type rules in RekaKarbon migrations:

| Don't Use        | Use Instead                           | Reason                                                                                 |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| `TIMESTAMP`      | `TIMESTAMPTZ`                         | Plain `TIMESTAMP` discards timezone context.                                           |
| `VARCHAR(n)`     | `TEXT`                                | `TEXT` carries no performance penalty in Postgres; use `CHECK` constraints for limits. |
| `CHAR(n)`        | `TEXT`                                | `CHAR` causes unintended space padding.                                                |
| `MONEY`          | `NUMERIC(p,s)`                        | `MONEY` is locale-dependent and unsafe for financial/carbon credits calculations.      |
| `SERIAL`         | `BIGINT GENERATED ALWAYS AS IDENTITY` | `SERIAL` relies on legacy sequence behavior.                                           |
| `FLOAT` / `REAL` | `DOUBLE PRECISION`                    | `REAL` lacks necessary decimal precision for spatial coordinates and carbon metrics.   |

---

## 2 — Foreign Key & Indexing Guidelines

1. **Foreign Keys Are Not Auto-Indexed**: PostgreSQL does NOT create indexes on Foreign Key columns automatically.
2. **Mandatory Indexing**: Always add explicit indexes to foreign key fields (e.g. `user_id`, `project_id`, `organization_id`) to prevent sequential table scans during join operations or parent row deletion.

```sql
-- Example UP migration snippet
CREATE TABLE carbon_offsets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES carbon_projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carbon_offsets_project_id ON carbon_offsets(project_id);
```

---

## 3 — Production Lock Safety & Execution Check

1. Avoid non-concurrent index creation on massive production tables (`CREATE INDEX CONCURRENTLY`).
2. Run backend test suite (`pnpm server:test`) and typechecks (`pnpm server:typecheck`) after introducing schema changes.
