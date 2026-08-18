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
      .filter((f) => f.endsWith('.repository.ts'))
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
});
