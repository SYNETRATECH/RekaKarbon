import { expect } from 'chai';
import hardhat from 'hardhat';
import type { ContractTransactionResponse } from 'ethers';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers.js';

const { ethers } = hardhat;

interface CarbonAsset {
  assetType: string;
  creator: string;
  totalSupply: bigint;
  mintedAt: bigint;
  metadata: string;
  isFrozen: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RekaKarbonContract = any;

describe('RekaKarbon Smart Contract', function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let RekaKarbon: any;
  let rekaKarbon: RekaKarbonContract;
  let admin: HardhatEthersSigner,
    ministry: HardhatEthersSigner,
    oracle: HardhatEthersSigner,
    deposit: HardhatEthersSigner,
    corpA: HardhatEthersSigner,
    corpB: HardhatEthersSigner;
  let contractAddress: string;

  const GLOBAL_RESERVE = 0n;
  const PTBAE_PU = 1n;
  const RKB_CREDIT = 3n;

  before(async function () {
    [admin, ministry, oracle, deposit, corpA, corpB] = await ethers.getSigners();

    RekaKarbon = await ethers.getContractFactory('RekaKarbon');
    rekaKarbon = await RekaKarbon.deploy();
    await rekaKarbon.waitForDeployment();

    contractAddress = await rekaKarbon.getAddress();

    const MINISTRY_ROLE = await rekaKarbon.MINISTRY_ROLE();
    const ORACLE_ROLE = await rekaKarbon.ORACLE_ROLE();
    const DEPOSIT_ROLE = await rekaKarbon.DEPOSIT_ROLE();

    await rekaKarbon.grantRole(MINISTRY_ROLE, ministry.address);
    await rekaKarbon.grantRole(ORACLE_ROLE, oracle.address);
    await rekaKarbon.grantRole(DEPOSIT_ROLE, deposit.address);
  });

  describe('1. Issue Quota (KLHK)', function () {
    it('Harus mengizinkan Ministry mencetak Jatah Emisi (PTBAE-PU)', async function () {
      await rekaKarbon.connect(ministry).issueQuota(corpA.address, 5000n);

      const balance = await rekaKarbon.balanceOf(corpA.address, PTBAE_PU);
      expect(balance).to.equal(5000n);
    });

    it('Harus menolak jika akun tanpa izin mencoba mencetak Jatah Emisi', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon.connect(corpA).issueQuota(corpA.address, 1000n);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('AccessControlUnauthorizedAccount');
    });
  });

  describe('2. Mint Offset Credit (Verifikasi AI) & Automatic Tax', function () {
    it('Harus mengizinkan Oracle mencetak SPE-GRK dan mengalokasikan 5% ke Reserve', async function () {
      const tx: ContractTransactionResponse = await rekaKarbon
        .connect(oracle)
        .mintOffsetCredit(corpB.address, 2000n, 'Lat: -6.2, Long: 106.8');
      await tx.wait();

      const newAssetId = 4n;
      const balanceB = await rekaKarbon.balanceOf(corpB.address, newAssetId);
      expect(balanceB).to.equal(1900n);

      const reserveBalance = await rekaKarbon.balanceOf(contractAddress, GLOBAL_RESERVE);
      expect(reserveBalance).to.equal(100n);

      const assetData: CarbonAsset = await rekaKarbon.carbonAssets(newAssetId);
      expect(assetData.assetType).to.equal('SPE-GRK');
      expect(assetData.isFrozen).to.be.false;
    });
  });

  describe('3. Transfer & 4. Emergency Freeze', function () {
    it('Harus bisa transfer token antar korporasi jika tidak dibekukan', async function () {
      await rekaKarbon
        .connect(corpA)
        .safeTransferFrom(corpA.address, corpB.address, PTBAE_PU, 100n, '0x');
      const balanceB = await rekaKarbon.balanceOf(corpB.address, PTBAE_PU);
      expect(balanceB).to.equal(100n);
    });

    it('Admin harus bisa membekukan (freeze) suatu aset', async function () {
      await rekaKarbon.connect(admin).freezeAsset(PTBAE_PU);
      const assetData: CarbonAsset = await rekaKarbon.carbonAssets(PTBAE_PU);
      expect(assetData.isFrozen).to.be.true;
    });

    it('Harus gagal melakukan transfer jika aset sedang dibekukan', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon
          .connect(corpA)
          .safeTransferFrom(corpA.address, corpB.address, PTBAE_PU, 10n, '0x');
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('Aset sedang dibekukan');
    });

    it('Admin harus bisa membuka kembali (unfreeze) suatu aset', async function () {
      await rekaKarbon.connect(admin).unfreezeAsset(PTBAE_PU);
      const assetData: CarbonAsset = await rekaKarbon.carbonAssets(PTBAE_PU);
      expect(assetData.isFrozen).to.be.false;
    });
  });

  describe('5. Retire Carbon (Bukti Kepatuhan)', function () {
    it('Harus bisa me-retire token (burn) dan mengurangi saldo', async function () {
      const initialBalance: bigint = await rekaKarbon.balanceOf(corpA.address, PTBAE_PU);
      await rekaKarbon.connect(corpA).retireCarbon(PTBAE_PU, 50n);
      const finalBalance: bigint = await rekaKarbon.balanceOf(corpA.address, PTBAE_PU);
      expect(finalBalance).to.equal(initialBalance - 50n);
    });
  });

  describe('6. Insurance Swap Reserve', function () {
    it('Harus menolak klaim asuransi jika token tidak dibekukan', async function () {
      const newAssetId = 4n;

      let error: Error | undefined;
      try {
        await rekaKarbon.connect(corpB).swapFrozenAsset(newAssetId, 50n);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('Aset tidak dibekukan');
    });

    it('Harus bisa menukar token beku dengan token cadangan (GLOBAL_RESERVE) jika dibekukan', async function () {
      const newAssetId = 4n;

      await rekaKarbon.connect(admin).freezeAsset(newAssetId);
      await rekaKarbon.connect(corpB).swapFrozenAsset(newAssetId, 50n);

      const balanceFrozen = await rekaKarbon.balanceOf(corpB.address, newAssetId);
      expect(balanceFrozen).to.equal(1850n);

      const balanceReserve = await rekaKarbon.balanceOf(corpB.address, GLOBAL_RESERVE);
      expect(balanceReserve).to.equal(50n);

      const contractReserveBalance = await rekaKarbon.balanceOf(contractAddress, GLOBAL_RESERVE);
      expect(contractReserveBalance).to.equal(50n);
    });
  });

  describe('7. Wallet (RKB_CREDIT)', function () {
    it('Harus mengizinkan DEPOSIT_ROLE mint RKB_CREDIT', async function () {
      await rekaKarbon.connect(deposit).mintWalletCredit(corpA.address, 1000n);
      const balance = await rekaKarbon.balanceOf(corpA.address, RKB_CREDIT);
      expect(balance).to.equal(1000n);
    });

    it('Harus menolak jika akun tanpa izin mint RKB_CREDIT', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon.connect(corpA).mintWalletCredit(corpA.address, 100n);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
    });

    it('Harus bisa spendWalletCredit dan saldo berkurang', async function () {
      await rekaKarbon.connect(deposit).spendWalletCredit(corpA.address, 200n);
      const balance = await rekaKarbon.balanceOf(corpA.address, RKB_CREDIT);
      expect(balance).to.equal(800n);
    });

    it('Harus gagal spendWalletCredit jika saldo tidak cukup', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon.connect(deposit).spendWalletCredit(corpA.address, 2000n);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('RekaKarbon: Saldo RKB tidak cukup');
    });
  });

  describe('8. Bursa Karbon', function () {
    const assetId = 4n; // SPE-GRK dari test sebelumnya

    before(async function () {
      // Unfreeze jika masih frozen dari test asuransi
      const assetData = await rekaKarbon.carbonAssets(assetId);
      if (assetData.isFrozen) {
        await rekaKarbon.connect(admin).unfreezeAsset(assetId);
      }
      // Topup RKB_CREDIT ke corpA
      await rekaKarbon.connect(deposit).mintWalletCredit(corpA.address, 5000n);
    });

    it('Harus berhasil executeBursaPurchase (atomic buy)', async function () {
      const balanceRkbBefore = await rekaKarbon.balanceOf(corpA.address, RKB_CREDIT);
      const balanceSpeGrkBefore = await rekaKarbon.balanceOf(corpB.address, assetId);

      await rekaKarbon.connect(deposit).executeBursaPurchase(
        corpA.address, // buyer
        corpB.address, // seller
        assetId,
        100n, // amount SPE-GRK
        1500n // total Cost RKB
      );

      const balanceRkbAfter = await rekaKarbon.balanceOf(corpA.address, RKB_CREDIT);
      const balanceSpeGrkBuyerAfter = await rekaKarbon.balanceOf(corpA.address, assetId);
      const balanceSpeGrkSellerAfter = await rekaKarbon.balanceOf(corpB.address, assetId);

      expect(balanceRkbAfter).to.equal(balanceRkbBefore - 1500n);
      expect(balanceSpeGrkBuyerAfter).to.equal(100n);
      expect(balanceSpeGrkSellerAfter).to.equal(balanceSpeGrkBefore - 100n);
    });

    it('Harus gagal executeBursaPurchase jika saldo RKB tidak cukup', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon
          .connect(deposit)
          .executeBursaPurchase(corpA.address, corpB.address, assetId, 100n, 10000n);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('RekaKarbon: Saldo RKB tidak cukup');
    });

    it('Harus gagal executeBursaPurchase jika pasokan SPE-GRK tidak cukup', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon
          .connect(deposit)
          .executeBursaPurchase(corpA.address, corpB.address, assetId, 10000n, 10n);
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('RekaKarbon: Pasokan SPE-GRK tidak cukup');
    });
  });

  describe('9. Retire & Certificate', function () {
    const assetId = 4n;

    it('Harus berhasil retireCarbonWithCertificate dan mencatat sertifikat', async function () {
      const balanceBefore = await rekaKarbon.balanceOf(corpA.address, assetId);

      const tx = await rekaKarbon
        .connect(corpA)
        .retireCarbonWithCertificate(assetId, 50n, 'CERT-2026-001');
      await tx.wait();

      const balanceAfter = await rekaKarbon.balanceOf(corpA.address, assetId);
      expect(balanceAfter).to.equal(balanceBefore - 50n);

      const certs = await rekaKarbon.getCertsByRetiree(corpA.address);
      expect(certs.length).to.be.greaterThan(0);

      const certId = certs[certs.length - 1];
      const certData = await rekaKarbon.retirementCerts(certId);

      expect(certData.retiree).to.equal(corpA.address);
      expect(certData.amountRetired).to.equal(50n);
      expect(certData.certificateNumber).to.equal('CERT-2026-001');
      expect(certData.isActive).to.be.true;
    });

    it('Harus mengizinkan backend me-retire token milik user dan tetap mencatat user sebagai retiree', async function () {
      const balanceBefore = await rekaKarbon.balanceOf(corpB.address, assetId);

      const tx = await rekaKarbon
        .connect(deposit)
        .retireCarbonWithCertificateFor(corpB.address, assetId, 25n, 'CERT-2026-BACKEND-001');
      await tx.wait();

      const balanceAfter = await rekaKarbon.balanceOf(corpB.address, assetId);
      expect(balanceAfter).to.equal(balanceBefore - 25n);

      const certs = await rekaKarbon.getCertsByRetiree(corpB.address);
      const certId = certs[certs.length - 1];
      const certData = await rekaKarbon.retirementCerts(certId);

      expect(certData.retiree).to.equal(corpB.address);
      expect(certData.amountRetired).to.equal(25n);
      expect(certData.certificateNumber).to.equal('CERT-2026-BACKEND-001');
    });

    it('Harus gagal retireCarbonWithCertificate jika saldo SPE-GRK tidak cukup', async function () {
      let error: Error | undefined;
      try {
        await rekaKarbon
          .connect(corpA)
          .retireCarbonWithCertificate(assetId, 5000n, 'CERT-2026-002');
      } catch (err) {
        error = err as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error?.message).to.include('RekaKarbon: Saldo tidak cukup');
    });
  });
});
