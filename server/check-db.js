const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.emissionReport
  .findMany()
  .then((r) => {
    console.log(
      JSON.stringify(
        r,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2,
      ),
    );
  })
  .finally(() => prisma.$disconnect());
