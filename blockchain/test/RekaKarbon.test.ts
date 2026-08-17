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
    corpA: HardhatEthersSigner,
    corpB: HardhatEthersSigner;
  let contractAddress: string;

  const GLOBAL_RESERVE = 0n;
  const PTBAE_PU = 1n;

  before(async function () {
    [admin, ministry, oracle, corpA, corpB] = await ethers.getSigners();

    RekaKarbon = await ethers.getContractFactory('RekaKarbon');
    rekaKarbon = await RekaKarbon.deploy();
    await rekaKarbon.waitForDeployment();

    contractAddress = await rekaKarbon.getAddress();

    const MINISTRY_ROLE = await rekaKarbon.MINISTRY_ROLE();
    const ORACLE_ROLE = await rekaKarbon.ORACLE_ROLE();

    await rekaKarbon.grantRole(MINISTRY_ROLE, ministry.address);
    await rekaKarbon.grantRole(ORACLE_ROLE, oracle.address);
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

      const newAssetId = 2n;
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
      const newAssetId = 2n;

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
      const newAssetId = 2n;

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
});
