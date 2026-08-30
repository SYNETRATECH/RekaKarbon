import 'dotenv/config';
import { ethers } from 'ethers';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import * as RekaKarbonABI from '../src/blockchain/config/RekaKarbon.json';

const PROJECT_NAME = 'Taman Nasional Baluran Canopy Restoration';
const SPE_GRK_ASSET_START = 4n;
const RESERVE_TAX_PERCENT = 5n;
const GAS_PRICE = 0n;

interface OffsetCreditContract {
  mintOffsetCredit: {
    staticCall(
      toAddress: string,
      amount: bigint,
      coordinates: string,
    ): Promise<bigint>;
    (
      toAddress: string,
      amount: bigint,
      coordinates: string,
      overrides: { gasPrice: bigint },
    ): Promise<ethers.ContractTransactionResponse>;
  };
  balanceOf(address: string, assetId: bigint): Promise<bigint>;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

function getGrossMintAmount(targetAmount: bigint): bigint {
  let grossAmount = targetAmount;
  while (
    grossAmount - (grossAmount * RESERVE_TAX_PERCENT) / 100n <
    targetAmount
  ) {
    grossAmount += 1n;
  }
  return grossAmount;
}

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const provider = new ethers.JsonRpcProvider(getRequiredEnv('BESU_RPC_URL'));
  const wallet = new ethers.Wallet(getRequiredEnv('PRIVATE_KEY'), provider);
  const contract = new ethers.Contract(
    getRequiredEnv('CARBON_TOKEN_CONTRACT_ADDRESS'),
    RekaKarbonABI.abi,
    wallet,
  ) as unknown as OffsetCreditContract;

  try {
    const listing = await prisma.bursaListing.findFirst({
      where: {
        projectName: PROJECT_NAME,
        status: {
          in: [ListingStatus.ACTIVE, ListingStatus.PARTIALLY_FILLED],
        },
      },
      include: {
        seller: true,
        carbonToken: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!listing) {
      throw new Error(`Active listing not found for project: ${PROJECT_NAME}`);
    }
    if (!listing.seller.walletAddress) {
      throw new Error('The listing seller does not have a wallet address');
    }

    const targetAmount = Number(listing.volumeAvailableTco2e);
    if (!Number.isSafeInteger(targetAmount) || targetAmount <= 0) {
      throw new Error(
        'The listing volume must be a positive whole tCO2e amount for ERC-1155 testing',
      );
    }

    const sellerAddress = ethers.getAddress(
      listing.seller.walletAddress.toLowerCase(),
    );
    const currentAssetId = listing.carbonToken.blockchainTokenId;
    if (currentAssetId !== null && currentAssetId >= SPE_GRK_ASSET_START) {
      const currentBalance = await contract.balanceOf(
        sellerAddress,
        currentAssetId,
      );
      if (currentBalance >= BigInt(targetAmount)) {
        console.log('Listing is already synchronized with the blockchain.');
        console.log(`Asset ID: ${currentAssetId.toString()}`);
        console.log(`Seller balance: ${currentBalance.toString()}`);
        return;
      }
    }

    const targetAmountBigInt = BigInt(targetAmount);
    const grossMintAmount = getGrossMintAmount(targetAmountBigInt);
    const expectedSellerAmount =
      grossMintAmount - (grossMintAmount * RESERVE_TAX_PERCENT) / 100n;
    const coordinates = '113.9213,-0.7893';
    const predictedAssetId = await contract.mintOffsetCredit.staticCall(
      sellerAddress,
      grossMintAmount,
      coordinates,
    );

    if (predictedAssetId < SPE_GRK_ASSET_START) {
      throw new Error(
        `Unexpected asset ID ${predictedAssetId.toString()}; expected a SPE-GRK asset ID`,
      );
    }

    console.log(`Minting ${grossMintAmount.toString()} SPE-GRK units...`);
    console.log(`Recipient seller: ${sellerAddress}`);
    console.log(`Predicted asset ID: ${predictedAssetId.toString()}`);

    const transaction = await contract.mintOffsetCredit(
      sellerAddress,
      grossMintAmount,
      coordinates,
      { gasPrice: GAS_PRICE },
    );
    const receipt = await transaction.wait();
    if (!receipt) {
      throw new Error('Blockchain transaction receipt was not returned');
    }

    const sellerBalance = await contract.balanceOf(
      sellerAddress,
      predictedAssetId,
    );
    if (sellerBalance < targetAmountBigInt) {
      throw new Error(
        `Seller balance ${sellerBalance.toString()} is below listing volume ${targetAmountBigInt.toString()}`,
      );
    }
    if (sellerBalance !== expectedSellerAmount) {
      throw new Error(
        `Unexpected seller balance ${sellerBalance.toString()}; expected ${expectedSellerAmount.toString()}`,
      );
    }

    await prisma.carbonToken.update({
      where: { id: listing.carbonToken.id },
      data: {
        blockchainTokenId: predictedAssetId,
        mintTxHash: receipt.hash,
        mintedAt: new Date(),
        totalMintedTco2e: Number(grossMintAmount),
        availableBalanceTco2e: Number(sellerBalance),
      },
    });

    console.log('Bursa listing synchronized successfully.');
    console.log(`Asset ID: ${predictedAssetId.toString()}`);
    console.log(`Seller balance: ${sellerBalance.toString()}`);
    console.log(`Mint transaction: ${receipt.hash}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bursa synchronization failed: ${message}`);
  process.exitCode = 1;
});
