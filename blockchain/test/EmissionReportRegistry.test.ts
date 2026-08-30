import { expect } from 'chai';
import hardhat from 'hardhat';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js';

const { ethers } = hardhat;

interface EmissionReportRegistryContract {
  waitForDeployment(): Promise<unknown>;
  AUDITOR_ROLE(): Promise<string>;
  grantRole(role: string, account: string): Promise<{ wait(): Promise<unknown> }>;
  connect(signer: HardhatEthersSigner): EmissionReportRegistryContract;
  submitReport(year: bigint, merkleRoot: string): Promise<{ wait(): Promise<unknown> }>;
  latestReportIdByYear(reporter: string, year: bigint): Promise<bigint>;
  reports(reportId: bigint): Promise<{
    reporter: string;
    year: bigint;
    merkleRoot: string;
    status: bigint;
    revisionCount: bigint;
    auditorNotes: string;
  }>;
  auditReport(
    reportId: bigint,
    status: number,
    notes: string
  ): Promise<{ wait(): Promise<unknown> }>;
  verifyMerkleRoot(reportId: bigint, merkleRoot: string): Promise<boolean>;
  anchorPtbaeApplication(
    applicationId: string,
    version: bigint,
    merkleRoot: string,
    anchorType: number
  ): Promise<{ wait(): Promise<unknown> }>;
  ptbaeAnchors(
    applicationId: string,
    version: bigint
  ): Promise<{
    applicationId: string;
    version: bigint;
    merkleRoot: string;
    anchorType: bigint;
    anchoredBy: string;
  }>;
  verifyPtbaeApplicationAnchor(
    applicationId: string,
    version: bigint,
    merkleRoot: string
  ): Promise<boolean>;
}

describe('EmissionReportRegistry Smart Contract', function () {
  let registry: EmissionReportRegistryContract;
  let admin: HardhatEthersSigner, auditor: HardhatEthersSigner, corpA: HardhatEthersSigner;

  const YEAR = 2026n;
  const MERKLE_ROOT = ethers.keccak256(ethers.toUtf8Bytes('dummy_merkle_root_2026'));
  const MERKLE_ROOT_2 = ethers.keccak256(ethers.toUtf8Bytes('dummy_merkle_root_2026_v2'));
  const MERKLE_ROOT_3 = ethers.keccak256(ethers.toUtf8Bytes('dummy_merkle_root_2026_v3'));
  const MERKLE_ROOT_4 = ethers.keccak256(ethers.toUtf8Bytes('dummy_merkle_root_2026_v4'));
  const PTBAE_APPLICATION_ID = ethers.keccak256(ethers.toUtf8Bytes('ptbae-application-2026-001'));
  const PTBAE_MERKLE_ROOT = ethers.keccak256(ethers.toUtf8Bytes('ptbae-merkle-root-2026-001'));

  before(async function () {
    [admin, auditor, corpA] = await ethers.getSigners();

    const emissionReportRegistryFactory = await ethers.getContractFactory('EmissionReportRegistry');
    registry =
      (await emissionReportRegistryFactory.deploy()) as unknown as EmissionReportRegistryContract;
    await registry.waitForDeployment();

    const AUDITOR_ROLE = await registry.AUDITOR_ROLE();
    await registry.grantRole(AUDITOR_ROLE, auditor.address);
  });

  describe('1. Submit Report', function () {
    it('Harus bisa submit laporan emisi pertama kali', async function () {
      const tx = await registry.connect(corpA).submitReport(YEAR, MERKLE_ROOT);
      await tx.wait();

      const reportId = await registry.latestReportIdByYear(corpA.address, YEAR);
      expect(reportId).to.equal(1n);

      const report = await registry.reports(reportId);
      expect(report.reporter).to.equal(corpA.address);
      expect(report.year).to.equal(YEAR);
      expect(report.merkleRoot).to.equal(MERKLE_ROOT);
      expect(report.status).to.equal(1n); // 1 = SUBMITTED
      expect(report.revisionCount).to.equal(0n);
    });

    it('Harus menolak submit revisi jika laporan masih berstatus SUBMITTED (pending audit)', async function () {
      let error: Error | undefined;
      try {
        await registry.connect(corpA).submitReport(YEAR, MERKLE_ROOT_2);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('Report already approved or pending');
    });
  });

  describe('2. Audit & Revision', function () {
    it('Harus mengizinkan AUDITOR_ROLE menolak laporan', async function () {
      const reportId = await registry.latestReportIdByYear(corpA.address, YEAR);
      await registry.connect(auditor).auditReport(reportId, 3, 'Missing some files'); // 3 = REJECTED

      const report = await registry.reports(reportId);
      expect(report.status).to.equal(3n);
      expect(report.auditorNotes).to.equal('Missing some files');
    });

    it('Harus bisa submit revisi ke-2 (revision = 1)', async function () {
      const tx = await registry.connect(corpA).submitReport(YEAR, MERKLE_ROOT_2);
      await tx.wait();

      const reportId = await registry.latestReportIdByYear(corpA.address, YEAR);
      expect(reportId).to.equal(2n);

      const report = await registry.reports(reportId);
      expect(report.revisionCount).to.equal(1n);
    });

    it('Harus bisa menyetujui revisi ke-2', async function () {
      const reportId = await registry.latestReportIdByYear(corpA.address, YEAR);
      await registry.connect(auditor).auditReport(reportId, 2, 'Looks good now'); // 2 = APPROVED

      const report = await registry.reports(reportId);
      expect(report.status).to.equal(2n);
    });

    it('Harus menolak submit lagi setelah APPROVED', async function () {
      let error: Error | undefined;
      try {
        await registry.connect(corpA).submitReport(YEAR, MERKLE_ROOT_3);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('Report already approved or pending');
    });
  });

  describe('3. Max Revisions Limit', function () {
    const YEAR_2 = 2027n;
    it('Harus menolak laporan setelah melewati batas maksimal (3 revisi)', async function () {
      // Sub 0
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT);
      let rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, 'Reject');

      // Rev 1
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_2);
      rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, 'Reject');

      // Rev 2
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_3);
      rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, 'Reject');

      // Rev 3 (Max)
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_4);
      rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, 'Reject');

      // Rev 4 (Harus gagal)
      let error: Error | undefined;
      try {
        await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_4);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('Max revisions reached');
    });
  });

  describe('4. Verify Merkle Root', function () {
    it('Harus berhasil memverifikasi merkle root', async function () {
      const reportId = await registry.latestReportIdByYear(corpA.address, YEAR);
      const isMatch = await registry.verifyMerkleRoot(reportId, MERKLE_ROOT_2); // because rev 2 was approved
      expect(isMatch).to.be.true;

      const isMismatch = await registry.verifyMerkleRoot(reportId, MERKLE_ROOT);
      expect(isMismatch).to.be.false;
    });
  });

  describe('5. PTBAE Application Anchoring', function () {
    it('Harus mencatat Merkle Root versi pengajuan PTBAE-PU', async function () {
      await registry
        .connect(auditor)
        .anchorPtbaeApplication(PTBAE_APPLICATION_ID, 1n, PTBAE_MERKLE_ROOT, 0);

      const anchor = await registry.ptbaeAnchors(PTBAE_APPLICATION_ID, 1n);
      expect(anchor.applicationId).to.equal(PTBAE_APPLICATION_ID);
      expect(anchor.version).to.equal(1n);
      expect(anchor.merkleRoot).to.equal(PTBAE_MERKLE_ROOT);
      expect(anchor.anchorType).to.equal(0n);
      expect(anchor.anchoredBy).to.equal(auditor.address);
      expect(
        await registry.verifyPtbaeApplicationAnchor(PTBAE_APPLICATION_ID, 1n, PTBAE_MERKLE_ROOT)
      ).to.be.true;
    });

    it('Harus menolak anchor versi yang sama dua kali', async function () {
      let error: Error | undefined;
      try {
        await registry
          .connect(auditor)
          .anchorPtbaeApplication(PTBAE_APPLICATION_ID, 1n, PTBAE_MERKLE_ROOT, 0);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('PTBAE version already anchored');
    });

    it('Harus menolak anchor dari akun tanpa AUDITOR_ROLE', async function () {
      let error: Error | undefined;
      try {
        await registry
          .connect(corpA)
          .anchorPtbaeApplication(PTBAE_APPLICATION_ID, 2n, PTBAE_MERKLE_ROOT, 0);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('AccessControlUnauthorizedAccount');
    });
  });
});
