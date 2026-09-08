import 'dotenv/config';
import { createRequire } from 'node:module';
import path from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ethers } from 'ethers';

const loadJson = createRequire(
  path.resolve(process.cwd(), 'src/scripts/reconcile-bursa-settlement.ts'),
);
const rekaKarbonArtifact = loadJson('../blockchain/config/RekaKarbon.json') as {
  abi: ethers.InterfaceAbi;
};

const [txHash, buyerEmail] = process.argv.slice(2);
if (!txHash || !buyerEmail || !ethers.isHexString(txHash, 32)) {
  throw new Error(
    'Usage: node --experimental-strip-types src/scripts/reconcile-bursa-settlement.ts <txHash> <buyerEmail>',
  );
}

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/rekakarbon?schema=public';
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const provider = new ethers.JsonRpcProvider(
  process.env.BESU_RPC_URL || 'http://127.0.0.1:8545',
);
const contractAddress = ethers.getAddress(
  process.env.CARBON_TOKEN_CONTRACT_ADDRESS ||
    '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0',
);
const contractInterface = new ethers.Interface(rekaKarbonArtifact.abi);
const contract = new ethers.Contract(
  contractAddress,
  rekaKarbonArtifact.abi,
  provider,
);

const CATEGORY_CONFIG = [
  { name: 'PLATFORM_FEE', basisPoints: 300 },
  { name: 'RESTORATION', basisPoints: 6014 },
  { name: 'MAINTENANCE', basisPoints: 1455 },
  { name: 'MONITORING_MRV', basisPoints: 970 },
  { name: 'BUFFER_RISK', basisPoints: 776 },
  { name: 'ENVIRONMENTAL_INTELLIGENCE', basisPoints: 485 },
] as const;

const categoryByHash = new Map(
  CATEGORY_CONFIG.map(({ name }) => [
    ethers.keccak256(ethers.toUtf8Bytes(name)).toLowerCase(),
    name,
  ]),
);
const basisPointsByCategory = new Map(
  CATEGORY_CONFIG.map(({ name, basisPoints }) => [name, basisPoints]),
);

type ChainBursaListing = {
  totalAmount: bigint;
  soldAmount: bigint;
  status: bigint;
};

function parseChainBursaListing(value: unknown): ChainBursaListing {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Bursa listing response is not an object.');
  }

  const listing = value as Record<string, unknown>;
  if (
    typeof listing.totalAmount !== 'bigint' ||
    typeof listing.soldAmount !== 'bigint' ||
    typeof listing.status !== 'bigint'
  ) {
    throw new Error('Bursa listing response has an invalid shape.');
  }

  return {
    totalAmount: listing.totalAmount,
    soldAmount: listing.soldAmount,
    status: listing.status,
  };
}

function parseEvent(log: ethers.Log) {
  if (log.address.toLowerCase() !== contractAddress.toLowerCase()) return null;
  try {
    return contractInterface.parseLog({ topics: log.topics, data: log.data });
  } catch {
    return null;
  }
}

async function main() {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      throw new Error('Settlement receipt is missing or failed on-chain.');
    }

    const settlement = receipt.logs
      .map(parseEvent)
      .find((event) => event?.name === 'BursaPurchaseSettled');
    if (!settlement) {
      throw new Error(
        'BursaPurchaseSettled event was not found in the receipt.',
      );
    }

    const listingId = Number(settlement.args[0]);
    const buyerAddress = ethers.getAddress(String(settlement.args[1]));
    const sellerAddress = ethers.getAddress(String(settlement.args[2]));
    const assetId = Number(settlement.args[3]);
    const amount = Number(settlement.args[4]);
    const unitPrice = Number(settlement.args[5]);
    const totalCost = Number(settlement.args[6]);
    const chainListing = parseChainBursaListing(
      (await contract.bursaListings(listingId)) as unknown,
    );
    const chainAvailable = Number(
      chainListing.totalAmount - chainListing.soldAmount,
    );
    const chainStatus = Number(chainListing.status);
    const listingStatus =
      chainStatus === 3
        ? 'FILLED'
        : chainStatus === 2
          ? 'PARTIALLY_FILLED'
          : 'ACTIVE';

    const allocationEvents = receipt.logs
      .map(parseEvent)
      .filter((event) => event?.name === 'BursaRevenueAllocated')
      .map((event) => {
        const categoryHash = String(event?.args[1]).toLowerCase();
        const category = categoryByHash.get(categoryHash);
        if (!category)
          throw new Error(`Unknown Bursa allocation category ${categoryHash}`);
        return {
          category,
          recipientWalletAddress: ethers.getAddress(String(event?.args[2])),
          basisPoints: basisPointsByCategory.get(category) ?? 0,
          amountIdr: Number(event?.args[3]),
        };
      });
    if (allocationEvents.length !== CATEGORY_CONFIG.length) {
      throw new Error(
        `Expected ${CATEGORY_CONFIG.length} allocation events, got ${allocationEvents.length}.`,
      );
    }
    if (
      allocationEvents.reduce(
        (sum, allocation) => sum + allocation.amountIdr,
        0,
      ) !== totalCost
    ) {
      throw new Error(
        'Bursa allocation events do not sum to the settlement total.',
      );
    }

    const buyer = await prisma.user.findUnique({
      where: { email: buyerEmail },
      include: { companies: true },
    });
    if (!buyer || !buyer.walletAddress)
      throw new Error('Buyer wallet was not found in the database.');
    if (ethers.getAddress(buyer.walletAddress) !== buyerAddress) {
      throw new Error(
        'Receipt buyer does not match the requested database buyer.',
      );
    }

    const listing = await prisma.bursaListing.findUnique({
      where: { blockchainListingId: BigInt(listingId) },
      include: { carbonToken: true, seller: true },
    });
    if (!listing)
      throw new Error(
        `Database listing for blockchain listing ${listingId} was not found.`,
      );
    if (
      !listing.seller.walletAddress ||
      ethers.getAddress(listing.seller.walletAddress) !== sellerAddress
    ) {
      throw new Error('Receipt seller does not match the database listing.');
    }
    if (Number(listing.carbonToken.blockchainTokenId) !== assetId) {
      throw new Error(
        'Receipt asset does not match the database carbon token.',
      );
    }
    const existingOrder = await prisma.bursaOrder.findFirst({
      where: { txHash },
    });
    if (existingOrder) {
      console.log(
        JSON.stringify({
          status: 'already_reconciled',
          orderId: existingOrder.id,
          txHash,
        }),
      );
      return;
    }

    const block = await provider.getBlock(receipt.blockNumber);
    const completedAt = block
      ? new Date(Number(block.timestamp) * 1000)
      : new Date();
    const company = buyer.companies[0];
    const currentDeficit = company
      ? new Prisma.Decimal(company.carbonDeficitTco2e)
      : new Prisma.Decimal(0);
    const remainingDeficit = currentDeficit.gt(amount)
      ? currentDeficit.minus(amount)
      : new Prisma.Decimal(0);
    const offsetCost = remainingDeficit.mul(unitPrice);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.bursaOrder.create({
        data: {
          listingId: listing.id,
          buyerUserId: buyer.id,
          volumeTco2e: amount,
          blockNumber: String(receipt.blockNumber),
          pricePerTonIdr: unitPrice,
          totalAmountIdr: totalCost,
          txHash,
          status: 'COMPLETED',
          completedAt,
          allocations: { create: allocationEvents },
        },
        include: { allocations: true },
      });

      await tx.bursaListing.update({
        where: { id: listing.id },
        data: {
          volumeAvailableTco2e: chainAvailable,
          volumeSoldTco2e: Number(chainListing.soldAmount),
          status: listingStatus,
        },
      });
      await tx.carbonToken.update({
        where: { id: listing.carbonTokenId },
        data: { availableBalanceTco2e: chainAvailable },
      });
      if (company) {
        await tx.company.update({
          where: { id: company.id },
          data: {
            carbonDeficitTco2e: remainingDeficit,
            offsetCostIdr: offsetCost,
            complianceRating: remainingDeficit.gt(0) ? 'WARNING' : 'COMPLIANT',
          },
        });
      }
      return createdOrder;
    });

    console.log(
      JSON.stringify(
        {
          status: 'reconciled',
          txHash,
          blockNumber: receipt.blockNumber,
          listingId,
          orderId: order.id,
          amount,
          totalCost,
          chainAvailable,
          listingStatus,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
