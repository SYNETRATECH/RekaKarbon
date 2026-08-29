const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.carbonToken.updateMany({
    data: { blockchainTokenId: 4 }
  });
  console.log('Fixed blockchainTokenId in CarbonToken');
}
main().finally(() => prisma.$disconnect());
