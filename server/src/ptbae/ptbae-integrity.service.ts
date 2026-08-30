import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import type {
  CanonicalJsonValue,
  PtbaeApplicationIntegritySource,
  PtbaeApplicationSnapshot,
  PtbaeIntegrityLeaf,
  PtbaeIntegrityResult,
  PtbaeMerkleProofItem,
} from './types/ptbae-integrity.types';

const HASH_ALGORITHM = 'sha256';
const HASH_PREFIX = '0x';
const MERKLE_DOMAIN = 'rekakarbon:ptbae:merkle:v1';

interface LeafInput {
  key: string;
  type: string;
  value: CanonicalJsonValue;
}

interface MerkleNode {
  hash: string;
  leafIndexes: number[];
}

function canonicalize(value: unknown): CanonicalJsonValue {
  if (value === null) return null;

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Canonical snapshot cannot contain a non-finite number.');
    }
    return value;
  }

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const result: { [key: string]: CanonicalJsonValue } = {};
    for (const key of Object.keys(record).sort()) {
      result[key] = canonicalize(record[key]);
    }
    return result;
  }

  throw new Error(`Unsupported value in canonical snapshot: ${typeof value}`);
}

function stableStringify(value: CanonicalJsonValue): string {
  return JSON.stringify(value);
}

function hashText(value: string): string {
  return `${HASH_PREFIX}${createHash(HASH_ALGORITHM).update(value).digest('hex')}`;
}

function hashCanonical(value: unknown): string {
  return hashText(stableStringify(canonicalize(value)));
}

function hashPair(left: string, right: string): string {
  const ordered =
    left.localeCompare(right) <= 0 ? [left, right] : [right, left];
  return hashText(`${MERKLE_DOMAIN}:node:${ordered[0]}:${ordered[1]}`);
}

function toIsoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function toLowerEnum(value: string): string {
  return value.toLowerCase();
}

@Injectable()
export class PtbaeIntegrityService {
  hashFile(content: Uint8Array): string {
    return `${HASH_PREFIX}${createHash(HASH_ALGORITHM).update(content).digest('hex')}`;
  }

  buildIntegrity(
    source: PtbaeApplicationIntegritySource,
  ): PtbaeIntegrityResult {
    const snapshot: PtbaeApplicationSnapshot = {
      schemaVersion: 1,
      applicationId: source.id,
      companyId: source.companyId,
      emissionReportId: source.emissionReportId,
      complianceYear: source.complianceYear,
      status: toLowerEnum(source.status),
      facilityName: source.facilityName,
      technicalData: canonicalize(source.technicalData),
      productionData: canonicalize(source.productionData),
      baselineEmissionTCO2e: source.baselineEmissionTCO2e,
      mitigationPlan: source.mitigationPlan,
      emitterNotes: source.emitterNotes,
      submittedAt: toIsoDate(source.submittedAt),
      auditedAt: toIsoDate(source.auditedAt),
      auditorNotes: source.auditorNotes,
      ministryDecidedAt: toIsoDate(source.ministryDecidedAt),
      ministryNotes: source.ministryNotes,
      documents: [...source.documents]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((document) => ({
          id: document.id,
          documentType: toLowerEnum(document.documentType),
          fileName: document.fileName,
          mimeType: document.mimeType,
          fileSizeBytes: document.fileSizeBytes,
          contentHash: document.contentHash,
          createdAt: document.createdAt.toISOString(),
        })),
      allocation: source.allocation
        ? {
            id: source.allocation.id,
            quotaTCO2e: source.allocation.quotaTCO2e,
            status: toLowerEnum(source.allocation.status),
            sourceDocument: source.allocation.sourceDocument,
            documentNumber: source.allocation.documentNumber,
            effectiveFrom: toIsoDate(source.allocation.effectiveFrom),
            effectiveUntil: toIsoDate(source.allocation.effectiveUntil),
            issuanceTxHash: source.allocation.issuanceTxHash,
          }
        : null,
    };

    const leafInputs = this.createLeafInputs(snapshot);
    const leaves = this.buildLeaves(leafInputs);

    return {
      snapshot,
      snapshotJson: snapshot as unknown as Prisma.InputJsonValue,
      snapshotHash: hashCanonical(snapshot),
      merkleRoot: this.calculateMerkleRoot(leaves.map((leaf) => leaf.leafHash)),
      leaves,
    };
  }

  private createLeafInputs(snapshot: PtbaeApplicationSnapshot): LeafInput[] {
    const scalarFields: Array<[string, string, CanonicalJsonValue]> = [
      ['application.id', 'uuid', snapshot.applicationId],
      ['application.company_id', 'uuid', snapshot.companyId],
      [
        'application.emission_report_id',
        'uuid|null',
        snapshot.emissionReportId,
      ],
      ['application.compliance_year', 'integer', snapshot.complianceYear],
      ['application.status', 'enum', snapshot.status],
      ['application.facility_name', 'text', snapshot.facilityName],
      ['application.technical_data', 'json', snapshot.technicalData],
      ['application.production_data', 'json', snapshot.productionData],
      [
        'application.baseline_emission_tco2e',
        'decimal_tco2e',
        snapshot.baselineEmissionTCO2e,
      ],
      ['application.mitigation_plan', 'text', snapshot.mitigationPlan],
      ['application.emitter_notes', 'text|null', snapshot.emitterNotes],
      ['application.submitted_at', 'timestamp|null', snapshot.submittedAt],
      ['application.audited_at', 'timestamp|null', snapshot.auditedAt],
      ['application.auditor_notes', 'text|null', snapshot.auditorNotes],
      [
        'application.ministry_decided_at',
        'timestamp|null',
        snapshot.ministryDecidedAt,
      ],
      ['application.ministry_notes', 'text|null', snapshot.ministryNotes],
    ];

    const inputs: LeafInput[] = scalarFields.map(([key, type, value]) => ({
      key,
      type,
      value,
    }));

    for (const document of snapshot.documents) {
      const prefix = `document.${document.id}`;
      inputs.push(
        { key: `${prefix}.type`, type: 'enum', value: document.documentType },
        { key: `${prefix}.file_name`, type: 'text', value: document.fileName },
        {
          key: `${prefix}.mime_type`,
          type: 'mime_type',
          value: document.mimeType,
        },
        {
          key: `${prefix}.file_size_bytes`,
          type: 'integer_bytes',
          value: document.fileSizeBytes,
        },
        {
          key: `${prefix}.content_hash`,
          type: 'sha256|null',
          value: document.contentHash,
        },
        {
          key: `${prefix}.created_at`,
          type: 'timestamp',
          value: document.createdAt,
        },
      );
    }

    if (snapshot.allocation) {
      const allocation = snapshot.allocation;
      const prefix = 'allocation';
      inputs.push(
        { key: `${prefix}.id`, type: 'uuid', value: allocation.id },
        {
          key: `${prefix}.quota_tco2e`,
          type: 'decimal_tco2e',
          value: allocation.quotaTCO2e,
        },
        { key: `${prefix}.status`, type: 'enum', value: allocation.status },
        {
          key: `${prefix}.source_document`,
          type: 'text|null',
          value: allocation.sourceDocument,
        },
        {
          key: `${prefix}.document_number`,
          type: 'text|null',
          value: allocation.documentNumber,
        },
        {
          key: `${prefix}.effective_from`,
          type: 'date|null',
          value: allocation.effectiveFrom,
        },
        {
          key: `${prefix}.effective_until`,
          type: 'date|null',
          value: allocation.effectiveUntil,
        },
        {
          key: `${prefix}.issuance_tx_hash`,
          type: 'tx_hash|null',
          value: allocation.issuanceTxHash,
        },
      );
    }

    return inputs.sort((left, right) => left.key.localeCompare(right.key));
  }

  private buildLeaves(inputs: readonly LeafInput[]): PtbaeIntegrityLeaf[] {
    const leafHashes = inputs.map((input) =>
      hashText(
        `${MERKLE_DOMAIN}:leaf:${input.key}:${input.type}:${hashCanonical(input.value)}`,
      ),
    );
    const proofs = this.buildProofs(leafHashes);

    return inputs.map((input, index) => ({
      leafKey: input.key,
      leafType: input.type,
      contentHash: hashCanonical(input.value),
      leafHash: leafHashes[index],
      leafOrder: index,
      proofJson: proofs[index] as unknown as Prisma.InputJsonValue,
    }));
  }

  private calculateMerkleRoot(leafHashes: readonly string[]): string {
    if (leafHashes.length === 0) return hashText(`${MERKLE_DOMAIN}:empty`);

    let level = [...leafHashes];
    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let index = 0; index < level.length; index += 2) {
        const left = level[index];
        const right = level[index + 1] ?? left;
        nextLevel.push(hashPair(left, right));
      }
      level = nextLevel;
    }
    return level[0];
  }

  private buildProofs(leafHashes: readonly string[]): PtbaeMerkleProofItem[][] {
    const proofs = leafHashes.map(() => [] as PtbaeMerkleProofItem[]);
    let level: MerkleNode[] = leafHashes.map((hash, index) => ({
      hash,
      leafIndexes: [index],
    }));

    while (level.length > 1) {
      const nextLevel: MerkleNode[] = [];
      for (let index = 0; index < level.length; index += 2) {
        const left = level[index];
        const right = level[index + 1] ?? left;

        for (const leafIndex of left.leafIndexes) {
          proofs[leafIndex].push({ siblingHash: right.hash, side: 'right' });
        }
        if (level[index + 1]) {
          for (const leafIndex of right.leafIndexes) {
            proofs[leafIndex].push({ siblingHash: left.hash, side: 'left' });
          }
        }

        nextLevel.push({
          hash: hashPair(left.hash, right.hash),
          leafIndexes: level[index + 1]
            ? [...left.leafIndexes, ...right.leafIndexes]
            : left.leafIndexes,
        });
      }
      level = nextLevel;
    }

    return proofs;
  }
}
