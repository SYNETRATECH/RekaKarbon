import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

describe('RekaKarbon Smart Contract', function () {
  let RekaKarbon;
  let rekaKarbon;
  let admin, ministry, oracle, corpA, corpB;
  let contractAddress;

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
      let error;
      try {
        await rekaKarbon.connect(corpA).issueQuota(corpA.address, 1000n);
      } catch (err) {
        error = err;
      }
      expect(error).to.not.be.undefined;
      expect(error.message).to.include('AccessControlUnauthorizedAccount');
    });
  });

  describe('2. Mint Offset Credit (Verifikasi AI) & Automatic Tax', function () {
    it('Harus mengizinkan Oracle mencetak SPE-GRK dan mengalokasikan 5% ke Reserve', async function () {
      // Oracle mencetak 2000 ton CO2-e
      // 5% (100n) masuk ke Reserve Pool (Smart Contract)
      // 95% (1900n) masuk ke pembuat (Corp B)
      const tx = await rekaKarbon
        .connect(oracle)
        .mintOffsetCredit(corpB.address, 2000n, 'Lat: -6.2, Long: 106.8');
      await tx.wait();

      const newAssetId = 2n;
      const balanceB = await rekaKarbon.balanceOf(corpB.address, newAssetId);
      expect(balanceB).to.equal(1900n);

      const reserveBalance = await rekaKarbon.balanceOf(contractAddress, GLOBAL_RESERVE);
      expect(reserveBalance).to.equal(100n);

      const assetData = await rekaKarbon.carbonAssets(newAssetId);
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
      const assetData = await rekaKarbon.carbonAssets(PTBAE_PU);
      expect(assetData.isFrozen).to.be.true;
    });

    it('Harus gagal melakukan transfer jika aset sedang dibekukan', async function () {
      let error;
      try {
        await rekaKarbon
          .connect(corpA)
          .safeTransferFrom(corpA.address, corpB.address, PTBAE_PU, 10n, '0x');
      } catch (err) {
        error = err;
      }
      expect(error).to.not.be.undefined;
      expect(error.message).to.include('Aset sedang dibekukan');
    });

    it('Admin harus bisa membuka kembali (unfreeze) suatu aset', async function () {
      await rekaKarbon.connect(admin).unfreezeAsset(PTBAE_PU);
      const assetData = await rekaKarbon.carbonAssets(PTBAE_PU);
      expect(assetData.isFrozen).to.be.false;
    });
  });

  describe('5. Retire Carbon (Bukti Kepatuhan)', function () {
    it('Harus bisa me-retire token (burn) dan mengurangi saldo', async function () {
      const initialBalance = await rekaKarbon.balanceOf(corpA.address, PTBAE_PU);
      await rekaKarbon.connect(corpA).retireCarbon(PTBAE_PU, 50n);
      const finalBalance = await rekaKarbon.balanceOf(corpA.address, PTBAE_PU);
      expect(finalBalance).to.equal(initialBalance - 50n);
    });
  });

  describe('6. Insurance Swap Reserve', function () {
    it('Harus menolak klaim asuransi jika token tidak dibekukan', async function () {
      const newAssetId = 2n; // Milik Corp B

      let error;
      try {
        await rekaKarbon.connect(corpB).swapFrozenAsset(newAssetId, 50n);
      } catch (err) {
        error = err;
      }
      expect(error).to.not.be.undefined;
      expect(error.message).to.include('Aset tidak dibekukan');
    });

    it('Harus bisa menukar token beku dengan token cadangan (GLOBAL_RESERVE) jika dibekukan', async function () {
      const newAssetId = 2n;

      // 1. Admin bekukan SPE-GRK milik Corp B (misal: hutan Corp B terbakar)
      await rekaKarbon.connect(admin).freezeAsset(newAssetId);

      // 2. Corp B melakukan klaim asuransi 50 token
      await rekaKarbon.connect(corpB).swapFrozenAsset(newAssetId, 50n);

      // 3. Verifikasi saldo: Token bekunya berkurang 50
      const balanceFrozen = await rekaKarbon.balanceOf(corpB.address, newAssetId);
      expect(balanceFrozen).to.equal(1850n); // 1900 - 50

      // 4. Verifikasi saldo asuransi Corp B bertambah 50
      const balanceReserve = await rekaKarbon.balanceOf(corpB.address, GLOBAL_RESERVE);
      expect(balanceReserve).to.equal(50n);

      // 5. Saldo asuransi di Smart Contract berkurang 50
      const contractReserveBalance = await rekaKarbon.balanceOf(contractAddress, GLOBAL_RESERVE);
      expect(contractReserveBalance).to.equal(50n); // 100 - 50
    });
  });
});
