import { PtbaeApplicationStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { PtbaeIntegrityService } from './ptbae-integrity.service';
import type {
  PtbaeApplicationIntegritySource,
  PtbaeMerkleProofItem,
} from './types';

function hashPair(left: string, right: string): string {
  const ordered =
    left.localeCompare(right) <= 0 ? [left, right] : [right, left];
  return `0x${createHash('sha256')
    .update(`rekakarbon:ptbae:merkle:v1:node:${ordered[0]}:${ordered[1]}`)
    .digest('hex')}`;
}

function verifyProof(
  leafHash: string,
  proof: readonly PtbaeMerkleProofItem[],
): string {
  return proof.reduce(
    (current, item) => hashPair(current, item.siblingHash),
    leafHash,
  );
}

function createSource(): PtbaeApplicationIntegritySource {
  return {
    id: '1d7f6a4d-7b9f-4dc0-91d7-7bb6636fbb3e',
    companyId: 'a7a7f3dc-dbb4-4c0e-8e4c-5b9d70f0c4f6',
    emissionReportId: null,
    complianceYear: 2026,
    status: PtbaeApplicationStatus.SUBMITTED,
    facilityName: 'PT Indo Raya',
    technicalData: {
      fuelTypes: ['batu bara', 'listrik PLN'],
      installedCapacityMW: 120,
      energyEfficiencyPercent: 78.5,
      machineryDescription: 'Kiln produksi dan boiler utilitas',
      mitigationTechnology: 'Waste heat recovery',
    },
    productionData: {
      actualVolumeTons: 95000,
      plannedVolumeTons: 100000,
      productUnit: 'ton produk per tahun',
    },
    baselineEmissionTCO2e: 145733.26,
    mitigationPlan: 'Meningkatkan efisiensi energi.',
    emitterNotes: null,
    submittedAt: new Date('2026-08-31T00:00:00.000Z'),
    auditedAt: null,
    auditorNotes: null,
    ministryDecidedAt: null,
    ministryNotes: null,
    documents: [
      {
        id: 'fdbf6c34-f8cf-4f17-ae6f-8d113bffca6a',
        documentType: 'BASELINE_EMISSION',
        fileName: 'baseline.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        contentHash:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        createdAt: new Date('2026-08-30T00:00:00.000Z'),
      },
    ],
    allocation: null,
  };
}

describe('PtbaeIntegrityService', () => {
  const service = new PtbaeIntegrityService();

  it('hashes file bytes with SHA-256', () => {
    expect(service.hashFile(Buffer.from('RekaKarbon'))).toBe(
      '0xe56ad2c08b894f6322060ef2d885ba30fb3bcdf2ca3d3354cb6382d634be5a46',
    );
  });

  it('creates deterministic snapshots and Merkle roots', () => {
    const first = service.buildIntegrity(createSource());
    const second = service.buildIntegrity({
      ...createSource(),
      technicalData: {
        mitigationTechnology: 'Waste heat recovery',
        machineryDescription: 'Kiln produksi dan boiler utilitas',
        energyEfficiencyPercent: 78.5,
        installedCapacityMW: 120,
        fuelTypes: ['batu bara', 'listrik PLN'],
      },
    });

    expect(first.snapshotHash).toBe(second.snapshotHash);
    expect(first.merkleRoot).toBe(second.merkleRoot);
    expect(first.leaves.length).toBeGreaterThan(15);
    expect(first.leaves.map((leaf) => leaf.leafOrder)).toEqual(
      first.leaves.map((_, index) => index),
    );
  });

  it('builds proofs that resolve to the Merkle root', () => {
    const result = service.buildIntegrity(createSource());

    for (const leaf of result.leaves) {
      const proof = leaf.proofJson as unknown as PtbaeMerkleProofItem[];
      expect(verifyProof(leaf.leafHash, proof)).toBe(result.merkleRoot);
    }
  });

  it('changes the root when a submitted value changes', () => {
    const original = service.buildIntegrity(createSource());
    const changed = service.buildIntegrity({
      ...createSource(),
      baselineEmissionTCO2e: 145734.26,
    });

    expect(changed.snapshotHash).not.toBe(original.snapshotHash);
    expect(changed.merkleRoot).not.toBe(original.merkleRoot);
  });
});
