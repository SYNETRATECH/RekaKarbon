import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const MINISTRY_EMAIL = 'kementerian@rekakarbon.go.id';
const MINISTRY_NAME = 'Direktorat Penetapan PTBAE-PU';
const MINISTRY_WALLET = '0x4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a';
const DEFAULT_PASSWORD = 'password123';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/rekakarbon?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { email: MINISTRY_EMAIL },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        fullName: MINISTRY_NAME,
        role: Role.ministry,
        status: UserStatus.ACTIVE,
        walletAddress: MINISTRY_WALLET,
      },
    });
    console.log(`Akun Kementerian diperbarui: ${MINISTRY_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await prisma.user.create({
    data: {
      id: randomUUID(),
      email: MINISTRY_EMAIL,
      passwordHash,
      fullName: MINISTRY_NAME,
      role: Role.ministry,
      status: UserStatus.ACTIVE,
      walletAddress: MINISTRY_WALLET,
    },
  });

  console.log(`Akun Kementerian dibuat: ${MINISTRY_EMAIL}`);
  console.log(`Password demo: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('Gagal memastikan akun Kementerian:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
