/**
 * Architecture Tests
 *
 * These tests enforce the layered architecture of the RekaKarbon client:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                         View Layer                              │
 *   │            src/components/**  │  src/portal/**                  │
 *   │   ✅ May import from: store, utils, lib (non-mock)              │
 *   │   ❌ Must NOT import from: lib/mock (must go through store)     │
 *   └────────────────────────────┬────────────────────────────────────┘
 *                                │ uses
 *   ┌────────────────────────────▼────────────────────────────────────┐
 *   │                         Store Layer                             │
 *   │                      src/store/** (zustand)                     │
 *   │   ✅ May import from: repositories, lib                         │
 *   │   ❌ Must NOT import from: components, portal                   │
 *   └────────────────────────────┬────────────────────────────────────┘
 *                                │ calls
 *   ┌────────────────────────────▼────────────────────────────────────┐
 *   │                     Repository Layer                            │
 *   │                    src/repositories/**                          │
 *   │   ✅ May import from: lib/mock (mock adapters), lib/api, types  │
 *   │   ❌ Must NOT import from: components, portal, store            │
 *   └────────────────────────────┬────────────────────────────────────┘
 *                                │ reads from
 *   ┌────────────────────────────▼────────────────────────────────────┐
 *   │                      Mock Data Layer                            │
 *   │                      src/lib/mock/**                            │
 *   │   ✅ Pure data - no imports from other app layers               │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * These tests use dependency-cruiser (async API) to validate the actual
 * import graph and fs assertions to validate structural conventions.
 */

import { describe, it, expect } from 'vitest';
import { cruise } from 'dependency-cruiser';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = 'error' | 'warn' | 'info';

interface Violation {
  rule: { name: string; severity: Severity };
  from: string;
  to: string;
}

interface ForbiddenRule {
  name: string;
  from: Record<string, unknown>;
  to: Record<string, unknown>;
  severity?: Severity;
}

interface CruiseResult {
  output: {
    summary: {
      violations: Violation[];
      error: number;
      warn: number;
    };
  };
  exitCode: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SRC = path.resolve(import.meta.dirname, '../');
const REPO_DIR = path.join(SRC, 'repositories');
const MOCK_DIR = path.join(SRC, 'lib', 'mock');

// View-layer directories (React UI). Anything rendering UI lives here.
const VIEW_PATTERN = '^src/(components|routes)';
// Layers the view is forbidden from reaching into directly.
const APP_LAYER_PATTERN = '^src/(components|routes|store|repositories)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run dependency-cruiser with custom forbidden rules and return violations.
 * NOTE: cruise() in dependency-cruiser v18+ is async.
 */
async function runCruise(forbidden: ForbiddenRule[], ruleName: string): Promise<Violation[]> {
  const result = (await cruise([SRC], {
    ruleSet: {
      forbidden: forbidden.map((r) => ({
        ...r,
        severity: r.severity ?? 'error',
      })),
    },
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: path.resolve(SRC, '../tsconfig.json'),
    },
    tsPreCompilationDeps: true,
  })) as CruiseResult;

  return result.output.summary.violations.filter((v) => v.rule.name === ruleName);
}

/** Format violations into a readable multi-line error message. */
function formatViolations(violations: Violation[]): string {
  return violations.map((v) => `  ❌  ${v.from}  →  ${v.to}`).join('\n');
}

// ---------------------------------------------------------------------------
// Test Suite 1: Layer Isolation (dependency-cruiser)
// ---------------------------------------------------------------------------

describe('Architecture — Layer Isolation', () => {
  it('View layer (components/ & portal/) must NOT import from lib/mock directly', async () => {
    const ruleName = 'no-mock-in-views';
    const violations = await runCruise(
      [
        {
          name: ruleName,
          severity: 'error',
          from: { path: VIEW_PATTERN },
          to: { path: 'src/lib/mock' },
        },
      ],
      ruleName
    );

    if (violations.length > 0) {
      throw new Error(
        `View layer is directly importing mock data.\n` +
          `Move data access through src/store + src/repositories instead.\n\n` +
          `Violations:\n${formatViolations(violations)}`
      );
    }

    expect(violations).toHaveLength(0);
  }, 15000);

  it('lib/mock must NOT import from components/, portal/, store/, or repositories/', async () => {
    const ruleName = 'mock-layer-isolation';
    const violations = await runCruise(
      [
        {
          name: ruleName,
          severity: 'error',
          from: { path: 'src/lib/mock' },
          to: { path: APP_LAYER_PATTERN },
        },
      ],
      ruleName
    );

    if (violations.length > 0) {
      throw new Error(
        `lib/mock is importing from upper layers, creating a circular dependency.\n\n` +
          `Violations:\n${formatViolations(violations)}`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('Repository layer must NOT import from components/, portal/, or store/', async () => {
    const ruleName = 'no-repo-to-view';
    const violations = await runCruise(
      [
        {
          name: ruleName,
          severity: 'error',
          from: { path: 'src/repositories' },
          to: { path: '^src/(components|portal|store)' },
        },
      ],
      ruleName
    );

    if (violations.length > 0) {
      throw new Error(
        `Repository layer is importing from the view/store layer, violating the dependency rule.\n\n` +
          `Violations:\n${formatViolations(violations)}`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('Store layer must NOT import from components/ or portal/', async () => {
    const ruleName = 'no-store-to-view';
    const violations = await runCruise(
      [
        {
          name: ruleName,
          severity: 'error',
          from: { path: 'src/store' },
          to: { path: VIEW_PATTERN },
        },
      ],
      ruleName
    );

    if (violations.length > 0) {
      throw new Error(
        `Store layer is importing from the view layer, causing circular dependencies.\n\n` +
          `Violations:\n${formatViolations(violations)}`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('lib/ utilities must NOT import from components/, portal/, store/, or repositories/', async () => {
    const ruleName = 'no-utils-to-app-layers';
    const violations = await runCruise(
      [
        {
          name: ruleName,
          severity: 'error',
          from: { path: 'src/lib/', pathNot: 'src/lib/mock' },
          to: { path: APP_LAYER_PATTERN },
        },
      ],
      ruleName
    );

    if (violations.length > 0) {
      throw new Error(
        `lib/ utilities are importing from application layers, creating an inverted dependency.\n\n` +
          `Violations:\n${formatViolations(violations)}`
      );
    }

    expect(violations).toHaveLength(0);
  }, 15000);

  it('utils/ must NOT import from components/, portal/, store/, or repositories/', async () => {
    const ruleName = 'no-utils-leaf';
    const violations = await runCruise(
      [
        {
          name: ruleName,
          severity: 'error',
          from: { path: 'src/utils' },
          to: { path: APP_LAYER_PATTERN },
        },
      ],
      ruleName
    );

    if (violations.length > 0) {
      throw new Error(
        `utils/ is importing from application layers; utils must remain a leaf module.\n\n` +
          `Violations:\n${formatViolations(violations)}`
      );
    }

    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 2: Repository Completeness (fs-based)
// ---------------------------------------------------------------------------

describe('Architecture — Repository Completeness', () => {
  /**
   * Normalizes file names for comparison.
   * Handles plural → singular matching, e.g.:
   *   mock "companies.ts" → repo "company.repository.ts"  (ies → y)
   *   mock "projects.ts"  → repo "project.repository.ts"  (s → '')
   */
  function normalize(name: string): string {
    const n = name.toLowerCase();
    if (n.endsWith('ies')) return n.replace(/ies$/, 'y');
    if (n.endsWith('s')) return n.replace(/s$/, '');
    return n;
  }

  it('every mock data file should have a corresponding repository file', () => {
    const mockFiles = fs
      .readdirSync(MOCK_DIR)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => path.basename(f, '.ts'));

    const repoFiles = fs
      .readdirSync(REPO_DIR)
      .filter((f) => f.endsWith('.repository.ts'))
      .map((f) => path.basename(f, '.repository.ts'));

    // Allow plural mock → singular repo (e.g., "projects" mock → "project" repo)
    const repoNormalized = repoFiles.map(normalize);
    const missingRepos = mockFiles.filter((name) => !repoNormalized.includes(normalize(name)));

    if (missingRepos.length > 0) {
      throw new Error(
        `The following mock data modules have no corresponding repository:\n` +
          missingRepos
            .map(
              (n) =>
                `  ❌  src/lib/mock/${n}.ts  →  missing: src/repositories/${n}.repository.ts (or ${n.replace(/s$/, '')}.repository.ts)`
            )
            .join('\n') +
          `\n\nCreate repository files to wrap mock access.`
      );
    }

    expect(missingRepos).toHaveLength(0);
  });

  it('src/repositories/index.ts must re-export all repository modules', () => {
    const indexFile = path.join(REPO_DIR, 'index.ts');
    expect(fs.existsSync(indexFile), 'src/repositories/index.ts must exist').toBe(true);

    const indexContent = fs.readFileSync(indexFile, 'utf-8');
    const repoFiles = fs
      .readdirSync(REPO_DIR)
      .filter((f) => f.endsWith('.repository.ts') && !f.endsWith('.mock.repository.ts'))
      .map((f) => path.basename(f, '.repository.ts'));

    const missingExports = repoFiles.filter((name) => !indexContent.includes(name));

    if (missingExports.length > 0) {
      throw new Error(
        `src/repositories/index.ts is missing re-exports for:\n` +
          missingExports.map((n) => `  ❌  ${n}`).join('\n')
      );
    }

    expect(missingExports).toHaveLength(0);
  });

  it('src/lib/mock/index.ts must re-export all mock data modules', () => {
    const indexFile = path.join(MOCK_DIR, 'index.ts');
    expect(fs.existsSync(indexFile), 'src/lib/mock/index.ts must exist').toBe(true);

    const indexContent = fs.readFileSync(indexFile, 'utf-8');
    const mockFiles = fs
      .readdirSync(MOCK_DIR)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map((f) => path.basename(f, '.ts'));

    const missingExports = mockFiles.filter((name) => !indexContent.includes(name));

    if (missingExports.length > 0) {
      throw new Error(
        `src/lib/mock/index.ts is missing re-exports for:\n` +
          missingExports.map((n) => `  ❌  ${n}`).join('\n')
      );
    }

    expect(missingExports).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 3: Directory Structure Conventions (fs-based)
// ---------------------------------------------------------------------------

describe('Architecture — Directory Structure', () => {
  const requiredDirs: Array<{ path: string; description: string }> = [
    {
      path: path.join(SRC, 'components'),
      description: 'src/components — Shared UI components (View Layer)',
    },
    {
      path: path.join(SRC, 'routes'),
      description: 'src/routes — Route entry components & portal views (View Layer)',
    },
    {
      path: path.join(SRC, 'repositories'),
      description: 'src/repositories — Data access abstraction (Repository Layer)',
    },
    {
      path: path.join(SRC, 'schemas'),
      description: 'src/schemas — Zod runtime schemas & contracts (Schema Layer)',
    },
    {
      path: path.join(SRC, 'store'),
      description: 'src/store — Zustand global state (Store Layer)',
    },
    {
      path: path.join(SRC, 'lib', 'mock'),
      description: 'src/lib/mock — Mock data fixtures (Mock Data Layer)',
    },
    { path: path.join(SRC, 'utils'), description: 'src/utils — Pure utility functions (Leaf)' },
  ];

  for (const dir of requiredDirs) {
    it(`required directory exists: ${dir.description}`, () => {
      expect(
        fs.existsSync(dir.path),
        `"${dir.description}" must exist — it is a required layer in the project architecture.`
      ).toBe(true);
    });
  }

  it('src/repositories/index.ts (barrel export) must exist', () => {
    const indexPath = path.join(SRC, 'repositories', 'index.ts');
    expect(
      fs.existsSync(indexPath),
      'src/repositories/index.ts is required as the single export point for the repository layer.'
    ).toBe(true);
  });

  it('src/lib/mock/index.ts (barrel export) must exist', () => {
    const indexPath = path.join(SRC, 'lib', 'mock', 'index.ts');
    expect(
      fs.existsSync(indexPath),
      'src/lib/mock/index.ts is required as the single export point for mock data.'
    ).toBe(true);
  });

  it('src/schemas/index.ts (barrel export) must exist', () => {
    const indexPath = path.join(SRC, 'schemas', 'index.ts');
    expect(
      fs.existsSync(indexPath),
      'src/schemas/index.ts is required as the single export point for Zod schemas.'
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 4: Schema Conformity for Mock Fixtures
// ---------------------------------------------------------------------------

import { z } from 'zod';
import {
  ProjectSchema,
  CompanySchema,
  BursaItemSchema,
  ComplianceDataSchema,
  EmissionReportSchema,
  PurchasedCertificateSchema,
  MultiSigRequestSchema,
  KybQueueItemSchema,
  DjpLogItemSchema,
  NationalForestRegionSchema,
  ForestProjectItemSchema,
  KTHGroupItemSchema,
  KTHTransactionItemSchema,
  RegulationDocumentUploadItemSchema,
  AiAnomalyLogSchema,
  AnomalySummarySchema,
  EnergyCorrelationItemSchema,
  SpatialSummarySchema,
  ConservationAreaSchema,
  DroneScanSchema,
  KthPolygonSchema,
  KthLogSchema,
  UserSchema,
} from '../schemas';
import {
  PROJECTS_DATA,
  COMPANIES_DATA,
  MOCK_BURSA_ITEMS,
  COMPLIANCE_DATA,
  MOCK_EMISSION_REPORTS,
  MOCK_PURCHASED_CERTIFICATES,
  mockMultiSigRequests,
  mockKybQueue,
  mockDjpLogs,
  NATIONAL_FOREST_REGIONS,
  INITIAL_FOREST_PROJECTS,
  INITIAL_KTH_GROUPS,
  MOCK_KTH_TRANSACTIONS,
  INITIAL_REGULATION_UPLOADS,
  mockAiAnomalyLogs,
  mockAnomalySummary,
  mockEnergyCorrelationData,
  mockSpatialSummary,
  mockConservationAreas,
  mockDroneScans,
  mockKthPolygons,
  mockKthLogs,
  mockUsers,
} from '../lib/mock';

describe('Architecture — Mock Fixture Schema Conformity', () => {
  it('PROJECTS_DATA adheres to ProjectSchema', () => {
    const res = z.array(ProjectSchema).safeParse(PROJECTS_DATA);
    expect(res.success, res.success ? undefined : JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('COMPANIES_DATA adheres to CompanySchema', () => {
    const res = z.array(CompanySchema).safeParse(COMPANIES_DATA);
    expect(res.success, res.success ? undefined : JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('MOCK_BURSA_ITEMS adheres to BursaItemSchema', () => {
    const res = z.array(BursaItemSchema).safeParse(MOCK_BURSA_ITEMS);
    expect(res.success, res.success ? undefined : JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('COMPLIANCE_DATA adheres to ComplianceDataSchema', () => {
    const res = ComplianceDataSchema.safeParse(COMPLIANCE_DATA);
    expect(res.success, res.success ? undefined : JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('MOCK_EMISSION_REPORTS adheres to EmissionReportSchema', () => {
    const res = z.array(EmissionReportSchema).safeParse(MOCK_EMISSION_REPORTS);
    expect(res.success, res.success ? undefined : JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('MOCK_PURCHASED_CERTIFICATES adheres to PurchasedCertificateSchema', () => {
    const res = z.array(PurchasedCertificateSchema).safeParse(MOCK_PURCHASED_CERTIFICATES);
    expect(res.success, res.success ? undefined : JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('Governance mocks adhere to respective schemas', () => {
    expect(z.array(MultiSigRequestSchema).safeParse(mockMultiSigRequests).success).toBe(true);
    expect(z.array(KybQueueItemSchema).safeParse(mockKybQueue).success).toBe(true);
    expect(z.array(DjpLogItemSchema).safeParse(mockDjpLogs).success).toBe(true);
  });

  it('Regulator mocks adhere to respective schemas', () => {
    expect(z.array(NationalForestRegionSchema).safeParse(NATIONAL_FOREST_REGIONS).success).toBe(
      true
    );
    expect(z.array(ForestProjectItemSchema).safeParse(INITIAL_FOREST_PROJECTS).success).toBe(true);
    expect(z.array(KTHGroupItemSchema).safeParse(INITIAL_KTH_GROUPS).success).toBe(true);
    expect(z.array(KTHTransactionItemSchema).safeParse(MOCK_KTH_TRANSACTIONS).success).toBe(true);
    expect(
      z.array(RegulationDocumentUploadItemSchema).safeParse(INITIAL_REGULATION_UPLOADS).success
    ).toBe(true);
  });

  it('Audit and Spatial mocks adhere to respective schemas', () => {
    expect(z.array(AiAnomalyLogSchema).safeParse(mockAiAnomalyLogs).success).toBe(true);
    expect(AnomalySummarySchema.safeParse(mockAnomalySummary).success).toBe(true);
    expect(z.array(EnergyCorrelationItemSchema).safeParse(mockEnergyCorrelationData).success).toBe(
      true
    );
    expect(SpatialSummarySchema.safeParse(mockSpatialSummary).success).toBe(true);
    expect(z.array(ConservationAreaSchema).safeParse(mockConservationAreas).success).toBe(true);
    expect(z.array(DroneScanSchema).safeParse(mockDroneScans).success).toBe(true);
    expect(z.array(KthPolygonSchema).safeParse(mockKthPolygons).success).toBe(true);
    expect(z.array(KthLogSchema).safeParse(mockKthLogs).success).toBe(true);
  });

  it('Auth mock users adhere to UserSchema', () => {
    expect(z.array(UserSchema).safeParse(Object.values(mockUsers)).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test Suite 5: Negative Semantic Invariant Enforcement Tests
// ---------------------------------------------------------------------------

import {
  UuidSchema,
  EmailSchema,
  WalletAddressSchema,
  TxHashSchema,
  NpwpSchema,
  IdrAmountSchema,
  CarbonVolumeSchema,
  VegetationIndexSchema,
  PercentageSchema,
  LatitudeSchema,
  LongitudeSchema,
} from '../schemas';

describe('Architecture — Semantic Invariant Validation Rules', () => {
  it('UuidSchema rejects non-UUID strings', () => {
    expect(UuidSchema.safeParse('12345').success).toBe(false);
    expect(UuidSchema.safeParse('invalid-uuid-string').success).toBe(false);
    expect(UuidSchema.safeParse('c0a80001-0001-4000-8000-000000000001').success).toBe(true);
  });

  it('EmailSchema rejects invalid email formats', () => {
    expect(EmailSchema.safeParse('plainaddress').success).toBe(false);
    expect(EmailSchema.safeParse('missing@domain').success).toBe(false);
    expect(EmailSchema.safeParse('admin@rekakarbon.id').success).toBe(true);
  });

  it('WalletAddressSchema requires standard 20-byte 0x-hex format', () => {
    expect(WalletAddressSchema.safeParse('0x123').success).toBe(false);
    expect(WalletAddressSchema.safeParse('8f2a948571029485710294857102948571029485').success).toBe(
      false
    );
    expect(
      WalletAddressSchema.safeParse('0x8f2a948571029485710294857102948571029485').success
    ).toBe(true);
  });

  it('TxHashSchema validates hex transaction hash strings', () => {
    expect(TxHashSchema.safeParse('not-a-hash').success).toBe(false);
    expect(
      TxHashSchema.safeParse('0x8a1c94857102948571029485710294857102948571029485').success
    ).toBe(true);
  });

  it('NpwpSchema enforces standard Indonesian 15-digit notation', () => {
    expect(NpwpSchema.safeParse('123456789012345').success).toBe(false);
    expect(NpwpSchema.safeParse('01.234.567.8-012.000').success).toBe(true);
  });

  it('Financial and Carbon schemas reject negative numbers', () => {
    expect(IdrAmountSchema.safeParse(-50000).success).toBe(false);
    expect(IdrAmountSchema.safeParse(0).success).toBe(true);
    expect(IdrAmountSchema.safeParse(1500000).success).toBe(true);

    expect(CarbonVolumeSchema.safeParse(-10.5).success).toBe(false);
    expect(CarbonVolumeSchema.safeParse(0).success).toBe(true);
    expect(CarbonVolumeSchema.safeParse(4500).success).toBe(true);
  });

  it('VegetationIndexSchema strictly constrains NDVI and EVI between -1.0 and 1.0', () => {
    expect(VegetationIndexSchema.safeParse(-1.5).success).toBe(false);
    expect(VegetationIndexSchema.safeParse(1.5).success).toBe(false);
    expect(VegetationIndexSchema.safeParse(0.84).success).toBe(true);
    expect(VegetationIndexSchema.safeParse(-0.2).success).toBe(true);
  });

  it('PercentageSchema constrains values between 0 and 100', () => {
    expect(PercentageSchema.safeParse(-5).success).toBe(false);
    expect(PercentageSchema.safeParse(105).success).toBe(false);
    expect(PercentageSchema.safeParse(87.5).success).toBe(true);
  });

  it('Coordinates strictly enforce latitude [-90, 90] and longitude [-180, 180]', () => {
    expect(LatitudeSchema.safeParse(-95).success).toBe(false);
    expect(LatitudeSchema.safeParse(95).success).toBe(false);
    expect(LatitudeSchema.safeParse(-6.8947).success).toBe(true);

    expect(LongitudeSchema.safeParse(-185).success).toBe(false);
    expect(LongitudeSchema.safeParse(185).success).toBe(false);
    expect(LongitudeSchema.safeParse(112.0454).success).toBe(true);
  });
});
