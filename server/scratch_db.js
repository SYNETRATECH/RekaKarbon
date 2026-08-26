const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.emissionReport.findMany({
    include: { company: true, files: true },
  });
  console.log(reports);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
