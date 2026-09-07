import { BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import { generateMerkleRoot } from './report-crypto.util';

describe('report-crypto.util', () => {
  describe('generateMerkleRoot', () => {
    it('returns ethers.ZeroHash for an empty data object', () => {
      const root = generateMerkleRoot({});
      expect(root).toBe(ethers.ZeroHash);
    });

    it('generates a deterministic 32-byte hex root regardless of object key order', () => {
      const dataA = { year: 2026, totalEmissions: 150.5, companyId: 'comp-1' };
      const dataB = { companyId: 'comp-1', year: 2026, totalEmissions: 150.5 };

      const rootA = generateMerkleRoot(dataA);
      const rootB = generateMerkleRoot(dataB);

      expect(rootA).toBe(rootB);
      expect(rootA).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('produces different roots for different data payloads', () => {
      const root1 = generateMerkleRoot({ year: 2025, emissions: 100 });
      const root2 = generateMerkleRoot({ year: 2026, emissions: 100 });

      expect(root1).not.toBe(root2);
    });

    it('throws BadRequestException if object cannot be serialized (e.g. circular structure)', () => {
      const circularObj: Record<string, unknown> = { key: 'val' };
      circularObj.self = circularObj;

      expect(() => generateMerkleRoot(circularObj)).toThrow(
        BadRequestException,
      );
    });
  });
});
