import { expect } from 'chai';
import hardhat from 'hardhat';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js';

const { ethers } = hardhat;

describe('EmissionReportRegistry Smart Contract', function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let EmissionReportRegistry: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registry: any;
  let admin: HardhatEthersSigner,
    auditor: HardhatEthersSigner,
    corpA: HardhatEthersSigner;
  
  const YEAR = 2026n;
  const MERKLE_ROOT = ethers.keccak256(ethers.toUtf8Bytes("dummy_merkle_root_2026"));
  const MERKLE_ROOT_2 = ethers.keccak256(ethers.toUtf8Bytes("dummy_merkle_root_2026_v2"));
  const MERKLE_ROOT_3 = ethers.keccak256(ethers.toUtf8Bytes("dummy_merkle_root_2026_v3"));
  const MERKLE_ROOT_4 = ethers.keccak256(ethers.toUtf8Bytes("dummy_merkle_root_2026_v4"));

  before(async function () {
    [admin, auditor, corpA] = await ethers.getSigners();

    EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
    registry = await EmissionReportRegistry.deploy();
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
      await registry.connect(auditor).auditReport(reportId, 3, "Missing some files"); // 3 = REJECTED

      const report = await registry.reports(reportId);
      expect(report.status).to.equal(3n);
      expect(report.auditorNotes).to.equal("Missing some files");
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
      await registry.connect(auditor).auditReport(reportId, 2, "Looks good now"); // 2 = APPROVED

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
      await registry.connect(auditor).auditReport(rId, 3, "Reject");

      // Rev 1
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_2);
      rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, "Reject");

      // Rev 2
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_3);
      rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, "Reject");
      
      // Rev 3 (Max)
      await registry.connect(corpA).submitReport(YEAR_2, MERKLE_ROOT_4);
      rId = await registry.latestReportIdByYear(corpA.address, YEAR_2);
      await registry.connect(auditor).auditReport(rId, 3, "Reject");

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
});
