import { randomUUID } from 'crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Minio from 'minio';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  Role,
  UserStatus,
  KybCategory,
  KybStatus,
  PtbaeStatus,
  PtbaeApplicationStatus,
  ComplianceRating,
  SensorStatus,
  EmissionReportStatus,
  ReportMethod,
  EcosystemType,
  ProjectStatus,
  StageStatus,
  MissionStatus,
  ListingStatus,
  OrderStatus,
  MultiSigTxType,
  MultiSigStatus,
  TaxAssessmentStatus,
  PaymentStatus,
  FileCategory,
  NotificationType,
  PriorityLevel,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/rekakarbon?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_SEED_PASSWORD = 'password123';

async function uploadProposalToMinio(fileName: string): Promise<string> {
  const localFilePath = path.join(
    __dirname,
    '../src/storage/dummy/project-proposal',
    fileName,
  );
  const storageKey = `projects/budget-reports/${fileName}`;
  if (!fs.existsSync(localFilePath)) {
    console.warn(`⚠️ File proposal lokal tidak ditemukan: ${localFilePath}`);
    return storageKey;
  }

  const endPointRaw = process.env.STORAGE_ENDPOINT || 'http://127.0.0.1:9000';
  const isHttps = endPointRaw.startsWith('https://');
  let endPoint = endPointRaw.replace('https://', '').replace('http://', '');
  let port = isHttps ? 443 : 80;

  if (endPoint.includes(':')) {
    const parts = endPoint.split(':');
    endPoint = parts[0];
    port = parseInt(parts[1], 10);
  } else if (
    endPointRaw === 'http://127.0.0.1:9000' ||
    endPoint === '127.0.0.1'
  ) {
    port = 9000;
  }

  const minioClient = new Minio.Client({
    endPoint,
    port,
    useSSL: isHttps,
    accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
  });
  const bucketName = process.env.STORAGE_BUCKET || 'rekakarbon-documents';

  try {
    const exists = await minioClient
      .bucketExists(bucketName)
      .catch(() => false);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1').catch(() => {});
    }
    const stats = fs.statSync(localFilePath);
    const fileStream = fs.createReadStream(localFilePath);
    await minioClient.putObject(
      bucketName,
      storageKey,
      fileStream,
      stats.size,
      { 'Content-Type': 'application/pdf' },
    );
    console.log(`  📄 MinIO proposal synced: ${storageKey}`);
  } catch (err) {
    console.warn(`  ⚠️ Skip MinIO upload for ${fileName}:`, err);
  }
  return storageKey;
}

const ADDITIONAL_EMITTERS = [
  {
    email: 'esg.bukitasam@rekakarbon.test',
    fullName: 'Rina Lestari (ESG Manager PT Bukit Asam)',
    walletAddress: '0x4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F',
    companyName: 'PT Bukit Asam Tbk',
    sector: 'Pertambangan Batubara',
    region: 'Tanjung Enim, Sumatera Selatan',
    latitude: -3.717,
    longitude: 103.781,
    emissionCapTco2e: 1200000,
    actualEmissionTco2e: 1280000,
    carbonDeficitTco2e: 80000,
    offsetCostIdr: 2400000000,
    complianceRating: ComplianceRating.NON_COMPLIANT,
    stackSensorsDescription:
      '6 titik CEMS pada unit pembangkit dan fasilitas pengolahan',
    description: 'Akun uji emitter untuk sektor pertambangan dan energi.',
  },
  {
    email: 'esg.indocement@rekakarbon.test',
    fullName: 'Dimas Prakoso (Sustainability Lead PT Indocement)',
    walletAddress: '0x5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A',
    companyName: 'PT Indocement Tunggal Prakarsa Tbk',
    sector: 'Industri Semen',
    region: 'Citeureup, Jawa Barat',
    latitude: -6.485,
    longitude: 106.892,
    emissionCapTco2e: 950000,
    actualEmissionTco2e: 920000,
    carbonDeficitTco2e: 0,
    offsetCostIdr: 0,
    complianceRating: ComplianceRating.COMPLIANT,
    stackSensorsDescription: '8 titik CEMS kiln dan unit pembakaran klinker',
    description: 'Akun uji emitter untuk sektor semen dan manufaktur.',
  },
  {
    email: 'esg.chandraasri@rekakarbon.test',
    fullName: 'Nadia Permata (ESG Manager PT Chandra Asri)',
    walletAddress: '0x6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B',
    companyName: 'PT Chandra Asri Pacific Tbk',
    sector: 'Petrokimia dan Industri Kimia',
    region: 'Cilegon, Banten',
    latitude: -6.002,
    longitude: 105.995,
    emissionCapTco2e: 1500000,
    actualEmissionTco2e: 1680000,
    carbonDeficitTco2e: 180000,
    offsetCostIdr: 5400000000,
    complianceRating: ComplianceRating.WARNING,
    stackSensorsDescription: '10 titik CEMS pada unit cracker dan boiler',
    description: 'Akun uji emitter untuk sektor petrokimia.',
  },
  {
    email: 'environment.pupukkuj@rekakarbon.test',
    fullName: 'Fajar Nugroho (Environment Manager PT Pupuk Kujang)',
    walletAddress: '0x7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C',
    companyName: 'PT Pupuk Kujang',
    sector: 'Industri Pupuk dan Amonia',
    region: 'Cikampek, Jawa Barat',
    latitude: -6.419,
    longitude: 107.451,
    emissionCapTco2e: 1100000,
    actualEmissionTco2e: 1200000,
    carbonDeficitTco2e: 100000,
    offsetCostIdr: 3000000000,
    complianceRating: ComplianceRating.NON_COMPLIANT,
    stackSensorsDescription: '7 titik CEMS pada unit ammonia dan urea',
    description: 'Akun uji emitter untuk sektor pupuk.',
  },
  {
    email: 'sustainability.vale@rekakarbon.test',
    fullName: 'Maya Sari (Sustainability Officer PT Vale Indonesia)',
    walletAddress: '0x8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D',
    companyName: 'PT Vale Indonesia Tbk',
    sector: 'Pertambangan dan Pengolahan Nikel',
    region: 'Sorowako, Sulawesi Selatan',
    latitude: -2.529,
    longitude: 121.36,
    emissionCapTco2e: 1350000,
    actualEmissionTco2e: 1310000,
    carbonDeficitTco2e: 0,
    offsetCostIdr: 0,
    complianceRating: ComplianceRating.COMPLIANT,
    stackSensorsDescription: '9 titik CEMS pada smelter dan pembangkit captive',
    description: 'Akun uji emitter untuk sektor pertambangan mineral.',
  },
  {
    email: 'esg.indahkiat@rekakarbon.test',
    fullName: 'Arief Hidayat (ESG Manager PT Indah Kiat Pulp & Paper)',
    walletAddress: '0x9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E',
    companyName: 'PT Indah Kiat Pulp & Paper Tbk',
    sector: 'Industri Pulp dan Kertas',
    region: 'Perawang, Riau',
    latitude: 0.647,
    longitude: 101.577,
    emissionCapTco2e: 1750000,
    actualEmissionTco2e: 1900000,
    carbonDeficitTco2e: 150000,
    offsetCostIdr: 4500000000,
    complianceRating: ComplianceRating.WARNING,
    stackSensorsDescription:
      '11 titik CEMS pada recovery boiler dan power plant',
    description: 'Akun uji emitter untuk sektor pulp dan kertas.',
  },
  {
    email: 'environment.gajah.tunggal@rekakarbon.test',
    fullName: 'Salsa Maharani (Environment Lead PT Gajah Tunggal)',
    walletAddress: '0x0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F',
    companyName: 'PT Gajah Tunggal Tbk',
    sector: 'Industri Ban dan Karet',
    region: 'Tangerang, Banten',
    latitude: -6.178,
    longitude: 106.631,
    emissionCapTco2e: 550000,
    actualEmissionTco2e: 500000,
    carbonDeficitTco2e: 0,
    offsetCostIdr: 0,
    complianceRating: ComplianceRating.COMPLIANT,
    stackSensorsDescription: '4 titik CEMS pada boiler dan proses vulkanisasi',
    description: 'Akun uji emitter untuk industri manufaktur.',
  },
  {
    email: 'esg.semenindonesia@rekakarbon.test',
    fullName: 'Bagas Wicaksono (Sustainability Lead PT Semen Indonesia)',
    walletAddress: '0x1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A',
    companyName: 'PT Semen Indonesia (Persero) Tbk',
    sector: 'Industri Semen dan Bahan Bangunan',
    region: 'Gresik, Jawa Timur',
    latitude: -7.155,
    longitude: 112.655,
    emissionCapTco2e: 1250000,
    actualEmissionTco2e: 1420000,
    carbonDeficitTco2e: 170000,
    offsetCostIdr: 5100000000,
    complianceRating: ComplianceRating.NON_COMPLIANT,
    stackSensorsDescription: '9 titik CEMS pada kiln dan unit pembakaran',
    description: 'Akun uji emitter untuk sektor semen.',
  },
  {
    email: 'sustainability.amman@rekakarbon.test',
    fullName: 'Taufik Ramadhan (Sustainability Manager PT Amman Mineral)',
    walletAddress: '0x2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B',
    companyName: 'PT Amman Mineral Nusa Tenggara',
    sector: 'Pertambangan dan Pengolahan Mineral',
    region: 'Sumbawa Barat, Nusa Tenggara Barat',
    latitude: -8.966,
    longitude: 116.842,
    emissionCapTco2e: 1600000,
    actualEmissionTco2e: 1530000,
    carbonDeficitTco2e: 0,
    offsetCostIdr: 0,
    complianceRating: ComplianceRating.COMPLIANT,
    stackSensorsDescription:
      '8 titik CEMS pada fasilitas pengolahan dan pembangkit',
    description: 'Akun uji emitter untuk sektor pertambangan mineral.',
  },
  {
    email: 'esg.unilever@rekakarbon.test',
    fullName: 'Citra Anindita (ESG Manager PT Unilever Indonesia)',
    walletAddress: '0x3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C',
    companyName: 'PT Unilever Indonesia Tbk',
    sector: 'Industri Barang Konsumsi',
    region: 'Cikarang, Jawa Barat',
    latitude: -6.307,
    longitude: 107.172,
    emissionCapTco2e: 420000,
    actualEmissionTco2e: 450000,
    carbonDeficitTco2e: 30000,
    offsetCostIdr: 900000000,
    complianceRating: ComplianceRating.WARNING,
    stackSensorsDescription: '3 titik CEMS pada boiler dan fasilitas utilitas',
    description: 'Akun uji emitter untuk sektor barang konsumsi.',
  },
] as const;

async function seedAdditionalEmitterAccounts(
  passwordHash: string,
): Promise<void> {
  for (const emitter of ADDITIONAL_EMITTERS) {
    const user = await prisma.user.upsert({
      where: { email: emitter.email },
      update: {
        passwordHash,
        fullName: emitter.fullName,
        role: Role.emitter,
        status: UserStatus.ACTIVE,
        walletAddress: emitter.walletAddress,
      },
      create: {
        id: randomUUID(),
        email: emitter.email,
        passwordHash,
        fullName: emitter.fullName,
        role: Role.emitter,
        status: UserStatus.ACTIVE,
        walletAddress: emitter.walletAddress,
      },
    });

    const companyData = {
      name: emitter.companyName,
      sector: emitter.sector,
      region: emitter.region,
      latitude: emitter.latitude,
      longitude: emitter.longitude,
      emissionCapTco2e: emitter.emissionCapTco2e,
      actualEmissionTco2e: emitter.actualEmissionTco2e,
      carbonDeficitTco2e: emitter.carbonDeficitTco2e,
      offsetCostIdr: emitter.offsetCostIdr,
      complianceRating: emitter.complianceRating,
      auditDate: new Date('2026-06-01'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: emitter.stackSensorsDescription,
      picAuditor: 'Dr. Ir. Rian Hermawan (PT Sucofindo Verifier)',
      description: emitter.description,
    };

    const existingCompany = await prisma.company.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const company = existingCompany
      ? await prisma.company.update({
          where: { id: existingCompany.id },
          data: companyData,
        })
      : await prisma.company.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            ...companyData,
          },
        });

    const existingAllocation = await prisma.ptbaeAllocation.findUnique({
      where: {
        companyId_complianceYear: {
          companyId: company.id,
          complianceYear: 2026,
        },
      },
      select: { id: true },
    });

    if (!existingAllocation) {
      await prisma.ptbaeAllocation.create({
        data: {
          companyId: company.id,
          complianceYear: 2026,
          quotaTco2e: emitter.emissionCapTco2e,
          sourceDocument:
            'SK Menteri LHK No. SK.720/MENLHK/SETJEN/KUM.1/12/2025 tentang Penetapan PTBAE-PU Sektor Industri',
          status: PtbaeStatus.VERIFIED,
          assignedAt: new Date('2026-01-01T00:00:00.000Z'),
          verifiedAt: new Date('2026-01-05T00:00:00.000Z'),
          notes:
            'Dokumen resmi alokasi kuota emisi PTBAE-PU terverifikasi KLHK untuk tahun ketaatan 2026.',
        },
      });
    }
  }
}

async function main() {
  console.log('🌱 Starting comprehensive RekaKarbon PostgreSQL seeding...');
  console.log(
    `🔐 Dynamically hashing default password ('${DEFAULT_SEED_PASSWORD}') using bcrypt...`,
  );

  // Generate genuine cryptographically secure bcrypt hash at runtime (10 rounds)
  const defaultPasswordHash = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 10);

  if (process.env.SEED_ONLY_ADDITIONAL_EMITTERS === 'true') {
    console.log(
      '🏭 Seeding 10 additional emitter accounts without deleting existing data...',
    );
    await seedAdditionalEmitterAccounts(defaultPasswordHash);
    console.log('✅ Additional emitter accounts are ready for testing.');
    return;
  }

  // 1. Clean existing records in strict reverse dependency order
  console.log('🧹 Purging existing database tables...');
  await prisma.systemNotification.deleteMany();
  await prisma.droneMission.deleteMany();
  await prisma.ptbaeApplicationDocument.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.stpInvoice.deleteMany();
  await prisma.carbonTaxAssessment.deleteMany();
  await prisma.multiSigSignature.deleteMany();
  await prisma.multiSigRequest.deleteMany();
  await prisma.kthIncentiveDisbursement.deleteMany();
  await prisma.bursaOrder.deleteMany();
  await prisma.bursaListing.deleteMany();
  await prisma.carbonToken.deleteMany();
  await prisma.emissionReportAuditEvent.deleteMany();
  await prisma.emissionReport.deleteMany();
  await prisma.forestSensorTelemetryLog.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.forestProject.deleteMany();
  await prisma.nationalForestRegion.deleteMany();
  await prisma.kthGroup.deleteMany();
  await prisma.cemsTelemetryLog.deleteMany();
  await prisma.smokestack.deleteMany();
  await prisma.ptbaeApplication.deleteMany();
  await prisma.ptbaeAllocation.deleteMany();
  await prisma.company.deleteMany();
  await prisma.kybProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Generate RFC 4122 v4 Standard UUIDs
  const userAdminId = randomUUID();
  const userRegulatorId = randomUUID();
  const userAuditorId = randomUUID();
  const userMinistryId = randomUUID();
  const userEmitter1Id = randomUUID();
  const userEmitter2Id = randomUUID();
  const userEmitter3Id = randomUUID();
  const userEmitter4Id = randomUUID();
  const userEmitter5Id = randomUUID();
  const userKth1Id = randomUUID();
  const userBuyerId = randomUUID();

  console.log('👤 Seeding Users with bcrypt password hashes...');
  const userAdmin = await prisma.user.create({
    data: {
      id: userAdminId,
      email: 'admin@rekakarbon.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Super Administrator RekaKarbon',
      role: Role.superadmin,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1a2B3c4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    },
  });

  const userRegulator = await prisma.user.create({
    data: {
      id: userRegulatorId,
      email: 'regulator@klhk.go.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Direktorat Jenderal PPI KLHK',
      role: Role.regulator,
      status: UserStatus.ACTIVE,
      walletAddress: '0x3c4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D',
    },
  });

  const userAuditor = await prisma.user.create({
    data: {
      id: userAuditorId,
      email: 'auditor@sucofindo.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Ir. Rian Hermawan (PT Sucofindo Verifier)',
      role: Role.auditor,
      status: UserStatus.ACTIVE,
      walletAddress: '0x5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F',
    },
  });

  await prisma.user.create({
    data: {
      id: userMinistryId,
      email: 'kementerian@rekakarbon.go.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Direktorat Penetapan PTBAE-PU',
      role: Role.ministry,
      status: UserStatus.ACTIVE,
      walletAddress: '0x4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A',
    },
  });

  // 4 Standard Emitter Presentation Demo State Accounts
  const userEmitter1 = await prisma.user.create({
    data: {
      id: userEmitter1Id,
      email: 'admin@semennusantara.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Ir. Budi Santoso (Full Flow - Selesai)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    },
  });

  const userEmitter2 = await prisma.user.create({
    data: {
      id: userEmitter2Id,
      email: 'director@suralaya.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Bambang Herdian (Terisi Semua, Belum Burn)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B',
    },
  });

  const userEmitter3 = await prisma.user.create({
    data: {
      id: userEmitter3Id,
      email: 'emitter.pupuk@pupukkaltim.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Rahmat Hidayat (Laporan Terisi, Belum PTBAE)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x8A7B6C5D4E3F2A1B0C9D8E7F6A5B4C3D2E1F0A9B',
    },
  });

  const userEmitter4 = await prisma.user.create({
    data: {
      id: userEmitter4Id,
      email: 'emitter.baru@indocement.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Agus Setiawan (Akun Baru - Belum Laporan)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C',
    },
  });

  const userEmitter5 = await prisma.user.create({
    data: {
      id: userEmitter5Id,
      email: 'esg@krakatausteel.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Agus Wijaya (Direktur ESG Krakatau Steel)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E',
    },
  });

  const userKth1 = await prisma.user.create({
    data: {
      id: userKth1Id,
      email: 'kth.tuban@perhutanan.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Haji Supardi (Ketua KTH Mangrove Tuban)',
      role: Role.kth,
      status: UserStatus.ACTIVE,
      walletAddress: '0x8a1c948571029485710294857102948571029485',
    },
  });

  const userBuyer = await prisma.user.create({
    data: {
      id: userBuyerId,
      email: 'investor@greenfund.sg',
      passwordHash: defaultPasswordHash,
      fullName: 'Singapore Regional Green Fund',
      role: Role.buyer,
      status: UserStatus.ACTIVE,
      walletAddress: '0x0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E',
    },
  });

  // 3. Seed KYB Profiles
  console.log('📑 Seeding KYB Profiles...');
  await prisma.kybProfile.create({
    data: {
      id: randomUUID(),
      userId: userEmitter1.id,
      entityName: 'PT Indonesia Power PLTU Suralaya',
      category: KybCategory.CORPORATE,
      npwp: '01.234.567.8-011.000',
      registrationNumber: 'AHU-0019284.AH.01.01.TAHUN 2019',
      signatoryName: 'Ir. Bambang Suralaya',
      verificationStatus: KybStatus.VERIFIED,
      verifiedAt: new Date('2026-01-10T10:00:00.000Z'),
      verifiedByUserId: userRegulator.id,
    },
  });

  await prisma.kybProfile.create({
    data: {
      id: randomUUID(),
      userId: userEmitter2.id,
      entityName: 'PT Semen Nusantara Tuban Tbk',
      category: KybCategory.CORPORATE,
      npwp: '01.234.567.8-012.000',
      registrationNumber: 'AHU-0028194.AH.01.01.TAHUN 2021',
      signatoryName: 'Maya Kartika, S.T.',
      verificationStatus: KybStatus.VERIFIED,
      verifiedAt: new Date('2026-01-12T14:30:00.000Z'),
      verifiedByUserId: userRegulator.id,
    },
  });

  await prisma.kybProfile.create({
    data: {
      id: randomUUID(),
      userId: userKth1.id,
      entityName: 'Koperasi KTH Mangrove Tuban Mandiri',
      category: KybCategory.KTH_COOPERATIVE,
      npwp: '31.849.201.4-604.000',
      registrationNumber: 'SK.LHK-8832/KTH/2023',
      signatoryName: 'Haji Supardi',
      verificationStatus: KybStatus.VERIFIED,
      verifiedAt: new Date('2026-01-15T09:00:00.000Z'),
      verifiedByUserId: userRegulator.id,
    },
  });

  // 4. Seed Corporate Companies & CEMS Smokestacks
  console.log('🏭 Seeding Corporate Companies & CEMS Smokestacks...');
  const companyTuban = await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter1.id,
      name: 'PT Semen Nusantara Tuban',
      sector: 'Industri Semen & Manufaktur Klinker',
      region: 'Tuban, Jawa Timur',
      latitude: -6.8981,
      longitude: 112.0491,
      emissionCapTco2e: 1100000.0,
      actualEmissionTco2e: 2350000.0,
      carbonDeficitTco2e: 1250000.0,
      offsetCostIdr: 37500000000.0,
      complianceRating: ComplianceRating.NON_COMPLIANT,
      auditDate: new Date('2026-02-15'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: '8 Cerobong Tanur Kalsinasi Rotari',
      picAuditor: 'Rian Hermawan, M.T (PT Sucofindo)',
      description:
        'Proses kalsinasi limestone menghasilkan emisi gas buang intensif.',
    },
  });

  const companySuralaya = await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter2.id,
      name: 'PLTU Suralaya (Unit 1-8)',
      sector: 'Pembangkit Listrik (PLTU Batubara)',
      region: 'Cilegon, Banten',
      latitude: -5.8921,
      longitude: 106.0312,
      emissionCapTco2e: 1500000.0,
      actualEmissionTco2e: 3900000.0,
      carbonDeficitTco2e: 2400000.0,
      offsetCostIdr: 72000000000.0,
      complianceRating: ComplianceRating.NON_COMPLIANT,
      auditDate: new Date('2026-02-14'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: '12 Cerobong CEMS Online (Ultra Supercritical)',
      picAuditor: 'Dr. Ir. Ahmad Fauzi (KLHK)',
      description:
        'Pembakaran batubara melebihi kuota ambang batas Kementerian LHK.',
    },
  });

  const stackSuralaya1 = await prisma.smokestack.create({
    data: {
      id: randomUUID(),
      companyId: companySuralaya.id,
      stackCode: 'STACK-SUR-BOILER-04',
      sensorFacilityName: 'CEMS Flue Gas Analyzer Unit 4',
      status: SensorStatus.ONLINE,
      lastTelemetryAt: new Date(),
    },
  });

  await prisma.smokestack.create({
    data: {
      id: randomUUID(),
      companyId: companySuralaya.id,
      stackCode: 'STACK-SUR-BOILER-07',
      sensorFacilityName: 'CEMS Flue Gas Analyzer Unit 7',
      status: SensorStatus.ONLINE,
      lastTelemetryAt: new Date(),
    },
  });

  const companyPupuk = await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter3.id,
      name: 'PT Pupuk Kaltim',
      sector: 'Industri Pupuk & Amonia',
      region: 'Bontang, Kalimantan Timur',
      latitude: 0.1654,
      longitude: 117.4819,
      emissionCapTco2e: 2800000.0,
      actualEmissionTco2e: 3100000.0,
      carbonDeficitTco2e: 300000.0,
      offsetCostIdr: 9000000000.0,
      complianceRating: ComplianceRating.NON_COMPLIANT,
      auditDate: new Date('2026-03-20'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: '15 Cerobong Pabrik Amonia & Urea',
      picAuditor: 'Rian Hermawan, M.T (PT Sucofindo)',
      description:
        'Pabrik pupuk dengan emisi CO2 dari proses reforming gas alam.',
    },
  });

  const _companyIndocement = await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter4.id,
      name: 'PT Indocement Tunggal Ambal',
      sector: 'Industri Semen & Bahan Bangunan',
      region: 'Citeureup, Jawa Barat',
      latitude: -6.485,
      longitude: 106.892,
      emissionCapTco2e: 950000.0,
      actualEmissionTco2e: 920000.0,
      carbonDeficitTco2e: 0,
      offsetCostIdr: 0,
      complianceRating: ComplianceRating.COMPLIANT,
      auditDate: new Date('2026-06-01'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: '8 titik CEMS kiln dan unit pembakaran klinker',
      description: 'Akun uji emitter baru untuk sektor semen dan manufaktur.',
    },
  });

  // Seed Emission Reports for FY 2026
  console.log('📋 Seeding Emission Reports (FY 2026)...');
  const reportSemen = await prisma.emissionReport.create({
    data: {
      id: randomUUID(),
      companyId: companyTuban.id,
      year: 2026,
      totalEmissionsTco2e: 14830,
      merkleRoot:
        '0x8f9a2b4c1d3e5f7a9b0c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a',
      blockchainTxHash: '0x11223344556677889900aabbccddeeff',
      status: EmissionReportStatus.APPROVED,
      reportMethod: ReportMethod.UPLOAD,
      sector: 'manufaktur',
    },
  });

  const reportSuralaya = await prisma.emissionReport.create({
    data: {
      id: randomUUID(),
      companyId: companySuralaya.id,
      year: 2026,
      totalEmissionsTco2e: 27500,
      merkleRoot:
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      blockchainTxHash: '0x223344556677889900aabbccddeeff11',
      status: EmissionReportStatus.SUBMITTED,
      reportMethod: ReportMethod.UPLOAD,
      sector: 'pembangkit',
    },
  });

  await prisma.emissionReport.create({
    data: {
      id: randomUUID(),
      companyId: companyPupuk.id,
      year: 2026,
      totalEmissionsTco2e: 18200,
      merkleRoot: '0x3344556677889900aabbccddeeff1122',
      blockchainTxHash: '0x3344556677889900aabbccddeeff1122',
      status: EmissionReportStatus.SUBMITTED,
      reportMethod: ReportMethod.UPLOAD,
      sector: 'pupuk',
    },
  });

  // Seed PTBAE Applications for 2026
  console.log('🏛️ Seeding PTBAE Applications (2026)...');
  await prisma.ptbaeApplication.create({
    data: {
      id: randomUUID(),
      companyId: companyTuban.id,
      emissionReportId: reportSemen.id,
      submittedByUserId: userEmitter1.id,
      complianceYear: 2026,
      status: PtbaeApplicationStatus.APPROVED,
      facilityName: 'Pabrik Semen Unit Tuban I-IV',
      technicalData: {
        machineryDescription: 'Dry Process Kiln dengan Precalciner & WHRPG',
        fuelTypes: ['Batu Bara', 'Biomassa Sekam Padi'],
        installedCapacityMW: 120,
        energyEfficiencyPercent: 88.5,
        mitigationTechnology: 'Waste Heat Recovery Power Generation',
      },
      productionData: {
        plannedVolumeTons: 4800000,
        actualVolumeTons: 4750000,
        productUnit: 'Ton Klinker',
      },
      baselineEmissionTco2e: 14830,
      mitigationPlan:
        'Pemasangan WHRPG dan substitusi bahan bakar biomassa sekam padi.',
      submittedAt: new Date('2026-01-12T10:00:00.000Z'),
    },
  });

  await prisma.ptbaeApplication.create({
    data: {
      id: randomUUID(),
      companyId: companySuralaya.id,
      emissionReportId: reportSuralaya.id,
      submittedByUserId: userEmitter2.id,
      complianceYear: 2026,
      status: PtbaeApplicationStatus.SUBMITTED,
      facilityName: 'PLTU Suralaya Unit 1-7',
      technicalData: {
        machineryDescription: 'Subcritical & Supercritical Coal Fired Boiler',
        fuelTypes: ['Batu Bara', 'Pelet Biomasa Kayu'],
        installedCapacityMW: 3400,
        energyEfficiencyPercent: 82.0,
        mitigationTechnology: 'Biomass Co-firing 5%',
      },
      productionData: {
        plannedVolumeTons: 22000000,
        actualVolumeTons: 21500000,
        productUnit: 'MWh',
      },
      baselineEmissionTco2e: 27500,
      mitigationPlan:
        'Co-firing biomasa pelet kayu sebesar 5% pada boiler unit 5-7.',
      submittedAt: new Date('2026-02-01T11:00:00.000Z'),
    },
  });

  await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter5.id,
      name: 'PT Krakatau Steel (Persero) Tbk',
      sector: 'Industri Baja & Logam',
      region: 'Cilegon, Banten',
      latitude: -6.0125,
      longitude: 105.9922,
      emissionCapTco2e: 3200000.0,
      actualEmissionTco2e: 3200000.0,
      carbonDeficitTco2e: 0.0,
      offsetCostIdr: 0.0,
      complianceRating: ComplianceRating.COMPLIANT,
      auditDate: new Date('2026-04-05'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: '10 Cerobong Blast Furnace',
      picAuditor: 'Dr. Ir. Rian Hermawan (PT Sucofindo Verifier)',
      description: 'Pabrik baja terpadu dengan emisi pas di batas kuota.',
    },
  });

  const stackTuban1 = await prisma.smokestack.create({
    data: {
      id: randomUUID(),
      companyId: companyTuban.id,
      stackCode: 'STACK-TUB-KILN-03',
      sensorFacilityName: 'CEMS Tanur Kalsinasi Utama Unit 3',
      status: SensorStatus.ONLINE,
      lastTelemetryAt: new Date(),
    },
  });

  // 5. Seed CEMS Telemetry Logs
  console.log('📡 Seeding CEMS Continuous Telemetry Logs...');
  await prisma.cemsTelemetryLog.create({
    data: {
      companyId: companySuralaya.id,
      smokestackId: stackSuralaya1.id,
      co2Ppm: 1420.5,
      so2MgM3: 210.3,
      noxMgM3: 310.8,
      flowRateM3Sec: 45.2,
      temperatureC: 185.4,
      isAnomaly: false,
      recordedAt: new Date('2026-02-22T06:00:00.000Z'),
    },
  });

  await prisma.cemsTelemetryLog.create({
    data: {
      companyId: companyTuban.id,
      smokestackId: stackTuban1.id,
      co2Ppm: 1980.2,
      so2MgM3: 420.5,
      noxMgM3: 540.1,
      flowRateM3Sec: 62.8,
      temperatureC: 220.0,
      isAnomaly: true,
      recordedAt: new Date('2026-02-22T06:15:00.000Z'),
    },
  });

  // 6. Seed Stored Files (Legal SK, Drone Orthophoto, Documents)
  console.log('📁 Seeding Stored Document Files...');
  await prisma.storedFile.create({
    data: {
      id: randomUUID(),
      uploadedByUserId: userRegulator.id,
      originalFileName: 'SK_Menteri_LHK_Penetapan_PTBAE_2026.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: BigInt(2457600),
      storageKey: 'uploads/legal_sk/SK_Menteri_LHK_Penetapan_PTBAE_2026.pdf',
      accessUrl:
        'https://storage.rekakarbon.id/uploads/legal_sk/SK_Menteri_LHK_Penetapan_PTBAE_2026.pdf',
      category: FileCategory.LEGAL_SK,
    },
  });

  const fileOrthoDrone = await prisma.storedFile.create({
    data: {
      id: randomUUID(),
      uploadedByUserId: userAuditor.id,
      originalFileName: 'Drone_Orthomosaic_Baluran_2026_Q1.tif',
      mimeType: 'image/tiff',
      fileSizeBytes: BigInt(184549376),
      storageKey: 'uploads/drone_ortho/Drone_Orthomosaic_Baluran_2026_Q1.tif',
      accessUrl:
        'https://storage.rekakarbon.id/uploads/drone_ortho/Drone_Orthomosaic_Baluran_2026_Q1.tif',
      category: FileCategory.DRONE_ORTHO,
    },
  });

  // 7. Seed National Forest Regions & KTH Groups
  console.log('🌳 Seeding National Forest Regions & Social Forestry Groups...');
  const regionKalbar = await prisma.nationalForestRegion.create({
    data: {
      id: randomUUID(),
      regionName: 'Kalimantan Barat (Restorasi Hutan Endemik)',
      areaHectares: 1800000.0,
      carbonSequestrationTco2e: 18500000.0,
      fundingDisbursedIdr: 5800000000.0,
      forestHealthPercent: 92.4,
    },
  });

  const regionBengkulu = await prisma.nationalForestRegion.create({
    data: {
      id: randomUUID(),
      regionName: 'Sumatera & Bengkulu (Restorasi Gambut & Komoditas)',
      areaHectares: 1200000.0,
      carbonSequestrationTco2e: 12400000.0,
      fundingDisbursedIdr: 3200000000.0,
      forestHealthPercent: 88.5,
    },
  });

  const regionSulut = await prisma.nationalForestRegion.create({
    data: {
      id: randomUUID(),
      regionName: 'Sulawesi Utara (Konservasi Pohon Cempaka)',
      areaHectares: 950000.0,
      carbonSequestrationTco2e: 9100000.0,
      fundingDisbursedIdr: 3900000000.0,
      forestHealthPercent: 94.1,
    },
  });

  const regionBali = await prisma.nationalForestRegion.create({
    data: {
      id: randomUUID(),
      regionName: 'Bali & Nusa Tenggara (Pembibitan Tanaman Endemik)',
      areaHectares: 850000.0,
      carbonSequestrationTco2e: 8800000.0,
      fundingDisbursedIdr: 4500000000.0,
      forestHealthPercent: 96.0,
    },
  });

  const kthKalbar = await prisma.kthGroup.create({
    data: {
      id: randomUUID(),
      groupName: 'KTH Dayak Kapuas Mandiri',
      leaderName: 'Herujono Hadisuparto',
      memberCount: 95,
      location: 'Sintang / Pontianak, Kalimantan Barat',
      registrationNumber: 'SK.LHK-7712/KTH/2023',
      walletAddress: '0x8a1c948571029485710294857102948571029485',
      totalIncentiveReceivedIdr: 2200000000.0,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  const kthBengkulu = await prisma.kthGroup.create({
    data: {
      id: randomUUID(),
      groupName: 'KTH Bukit Barisan Bengkulu',
      leaderName: 'H. Suhartadi, M.Si',
      memberCount: 72,
      location: 'Kabupaten Bengkulu Tengah, Bengkulu',
      registrationNumber: 'SK.LHK-8841/KTH/2024',
      walletAddress: '0x6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C',
      totalIncentiveReceivedIdr: 1200000000.0,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  const kthSulut = await prisma.kthGroup.create({
    data: {
      id: randomUUID(),
      groupName: 'KTH Minahasa Cempaka Lestari',
      leaderName: 'Ir. Suprianto, M.For',
      memberCount: 68,
      location: 'Manado / Minahasa, Sulawesi Utara',
      registrationNumber: 'SK.LHK-9102/KTH/2023',
      walletAddress: '0x7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D',
      totalIncentiveReceivedIdr: 1750000000.0,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  const kthBali = await prisma.kthGroup.create({
    data: {
      id: randomUUID(),
      groupName: 'KTH Wana Giri Bali',
      leaderName: 'I Wayan Siringo-ringo',
      memberCount: 110,
      location: 'Buleleng / Karangasem, Bali',
      registrationNumber: 'SK.LHK-6520/KTH/2022',
      walletAddress: '0x8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E',
      totalIncentiveReceivedIdr: 3100000000.0,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  // 8. Seed Forest Projects & Proposals
  console.log(
    '🌲 Uploading proposal files to MinIO and Seeding 4 Forestry Projects...',
  );

  const keyKalbar = await uploadProposalToMinio(
    'Proposal_Rehabilitasi_Hutan_Kalimantan_Barat.pdf',
  );
  const keyBengkulu = await uploadProposalToMinio(
    'Proposal_Peningkatan_Fungsi_Hutan_Bengkulu.pdf',
  );
  const keySulut = await uploadProposalToMinio(
    'Proposal_Konservasi_Pohon_Cempaka_Sulawesi_Utara.pdf',
  );
  const keyBali = await uploadProposalToMinio(
    'Proposal_Pengembangan_Bibit_Endemik_Bali.pdf',
  );

  // PROYEK 1: Kalbar (Active dMRV - 3 Checkpoints)
  const projectKalbar = await prisma.forestProject.create({
    data: {
      id: 'b2c3d4e5-0002-4000-8000-000000000001',
      regionId: regionKalbar.id,
      kthGroupId: kthKalbar.id,
      projectName: 'Rehabilitasi Hutan Terdegradasi Spesies Endemik Kalbar',
      ecosystemType: EcosystemType.TROPICAL_RAINFOREST,
      province: 'Kalimantan Barat',
      latitude: -1.2388,
      longitude: 110.2408,
      areaHectares: 35000.0,
      targetSequestrationTco2e: 2100000.0,
      actualSequestrationTco2e: 1450000.0,
      carbonStockTco2e: 1450000.0,
      carbonPricePerTonIdr: 280000.0,
      ndviScore: 0.81,
      eviScore: 0.65,
      survivalRatePercent: 88.5,
      canopyHeightMeters: 2.1,
      budgetTotalIdr: 5800000000.0,
      budgetDisbursedIdr: 4200000000.0,
      status: ProjectStatus.ACTIVE_DMRV,
      speCertificateId: 'SPE-GRK-00318-KALBAR-2026',
      budgetReportFileName: 'Proposal_Rehabilitasi_Hutan_Kalimantan_Barat.pdf',
      budgetReportFileSizeBytes: BigInt(2014863),
      budgetReportStorageKey: keyKalbar,
      bufferAllocatedPercent: 8.0,
      bufferUsedPercent: 0.0,
      trendDataJson: {
        labels: ['2021', '2022', '2023', '2024', '2025'],
        data: [1.12, 1.18, 1.25, 1.32, 1.45],
      },
      coordinatesJson: [
        { lat: -1.2325, lng: 110.224 },
        { lat: -1.221, lng: 110.2345 },
        { lat: -1.2245, lng: 110.2505 },
        { lat: -1.236, lng: 110.2605 },
        { lat: -1.2505, lng: 110.255 },
        { lat: -1.258, lng: 110.239 },
        { lat: -1.249, lng: 110.222 },
        { lat: -1.2325, lng: 110.224 },
      ],
      inspectionCheckpoints: {
        create: [
          {
            sequenceNo: 1,
            title: 'Tahun 1: Pembibitan Endemik & Pemetaan GIS',
            scheduledAt: new Date('2025-03-15'),
            submissionDeadline: new Date('2025-04-15'),
            method: 'FIELD',
            instructions:
              'Pemeriksaan 50.000 bibit kayu lokal & pembukaan jalur sekat bakar.',
          },
          {
            sequenceNo: 2,
            title: 'Tahun 2: Penanaman Blok & Pemberdayaan Masyarakat',
            scheduledAt: new Date('2025-09-20'),
            submissionDeadline: new Date('2025-10-20'),
            method: 'HYBRID',
            instructions:
              'Verifikasi penanaman blok utama & verifikasi insentif KTH Kapuas.',
          },
          {
            sequenceNo: 3,
            title: 'Tahun 3: Monitoring IoT Kanopi & Verifikasi LiDAR Drone',
            scheduledAt: new Date('2026-04-10'),
            submissionDeadline: new Date('2026-05-10'),
            method: 'DRONE',
            instructions:
              'Pemindaian orthophoto LiDAR multispektral dan kalibrasi sensor CHM.',
          },
        ],
      },
    },
  });

  // PROYEK 2: Bengkulu (Draft - 1 Checkpoint)
  const _projectBengkulu = await prisma.forestProject.create({
    data: {
      id: 'b2c3d4e5-0002-4000-8000-000000000002',
      regionId: regionBengkulu.id,
      kthGroupId: kthBengkulu.id,
      projectName: 'Peningkatan Fungsi Hutan & Komoditas Lokal Bengkulu',
      ecosystemType: EcosystemType.PEATLAND_RESTORATION,
      province: 'Bengkulu',
      latitude: -3.6958,
      longitude: 102.5369,
      areaHectares: 18500.0,
      targetSequestrationTco2e: 1250000.0,
      actualSequestrationTco2e: 0.0,
      carbonStockTco2e: 0.0,
      carbonPricePerTonIdr: 250000.0,
      ndviScore: 0.62,
      eviScore: 0.48,
      survivalRatePercent: 72.0,
      canopyHeightMeters: 1.1,
      budgetTotalIdr: 3200000000.0,
      budgetDisbursedIdr: 0.0,
      status: ProjectStatus.DRAFT,
      budgetReportFileName: 'Proposal_Peningkatan_Fungsi_Hutan_Bengkulu.pdf',
      budgetReportFileSizeBytes: BigInt(2719977),
      budgetReportStorageKey: keyBengkulu,
      bufferAllocatedPercent: 8.0,
      bufferUsedPercent: 0.0,
      trendDataJson: {
        labels: ['2023', '2024', '2025'],
        data: [0.55, 0.58, 0.62],
      },
      coordinatesJson: [
        { lat: -3.688, lng: 102.518 },
        { lat: -3.6765, lng: 102.531 },
        { lat: -3.6805, lng: 102.5485 },
        { lat: -3.694, lng: 102.559 },
        { lat: -3.7095, lng: 102.5515 },
        { lat: -3.716, lng: 102.534 },
        { lat: -3.706, lng: 102.516 },
        { lat: -3.688, lng: 102.518 },
      ],
      inspectionCheckpoints: {
        create: [
          {
            sequenceNo: 1,
            title: 'Tahun 1: Survei Topografi & Pembuatan Sekat Bakar Sempadan',
            scheduledAt: new Date('2026-06-01'),
            submissionDeadline: new Date('2026-07-01'),
            method: 'FIELD',
            instructions:
              'Survei batas lahan kritis gambut Bengkulu & sosialisasi komoditas lokal.',
          },
        ],
      },
    },
  });

  // PROYEK 3: Sulut (Active dMRV - 2 Checkpoints)
  const _projectSulut = await prisma.forestProject.create({
    data: {
      id: 'b2c3d4e5-0002-4000-8000-000000000003',
      regionId: regionSulut.id,
      kthGroupId: kthSulut.id,
      projectName: 'Konservasi & Perkebunan Partisipatif Pohon Cempaka Sulut',
      ecosystemType: EcosystemType.AGROFORESTRY,
      province: 'Sulawesi Utara',
      latitude: 0.8429,
      longitude: 124.3876,
      areaHectares: 14200.0,
      targetSequestrationTco2e: 950000.0,
      actualSequestrationTco2e: 680000.0,
      carbonStockTco2e: 680000.0,
      carbonPricePerTonIdr: 310000.0,
      ndviScore: 0.84,
      eviScore: 0.69,
      survivalRatePercent: 92.5,
      canopyHeightMeters: 2.4,
      budgetTotalIdr: 3900000000.0,
      budgetDisbursedIdr: 2500000000.0,
      status: ProjectStatus.ACTIVE_DMRV,
      speCertificateId: 'SPE-GRK-00412-SULUT-2026',
      budgetReportFileName:
        'Proposal_Konservasi_Pohon_Cempaka_Sulawesi_Utara.pdf',
      budgetReportFileSizeBytes: BigInt(1420331),
      budgetReportStorageKey: keySulut,
      bufferAllocatedPercent: 8.0,
      bufferUsedPercent: 0.0,
      trendDataJson: {
        labels: ['2022', '2023', '2024', '2025'],
        data: [0.42, 0.52, 0.61, 0.68],
      },
      coordinatesJson: [
        { lat: 0.8515, lng: 124.368 },
        { lat: 0.8615, lng: 124.382 },
        { lat: 0.857, lng: 124.3995 },
        { lat: 0.844, lng: 124.409 },
        { lat: 0.8295, lng: 124.401 },
        { lat: 0.824, lng: 124.384 },
        { lat: 0.833, lng: 124.3695 },
        { lat: 0.8515, lng: 124.368 },
      ],
      inspectionCheckpoints: {
        create: [
          {
            sequenceNo: 1,
            title: 'Tahun 1: Pembibitan Pohon Cempaka Elmerrillia Spp',
            scheduledAt: new Date('2025-05-10'),
            submissionDeadline: new Date('2025-06-10'),
            method: 'FIELD',
            instructions:
              'Penyiapan 30.000 bibit cempaka berkualitas tinggi di persemaian MFRI Manado.',
          },
          {
            sequenceNo: 2,
            title: 'Tahun 2: Penanaman Partisipatif & Pelatihan KTH',
            scheduledAt: new Date('2025-11-18'),
            submissionDeadline: new Date('2025-12-18'),
            method: 'HYBRID',
            instructions:
              'Penanaman tumpangsari cempaka dengan tanaman pangan KTH Minahasa.',
          },
        ],
      },
    },
  });

  // PROYEK 4: Bali (Minted - 4 Checkpoints)
  const projectBali = await prisma.forestProject.create({
    data: {
      id: 'b2c3d4e5-0002-4000-8000-000000000004',
      regionId: regionBali.id,
      kthGroupId: kthBali.id,
      projectName: 'Pengembangan Bibit Tanaman Endemik Kayu Asli Bali',
      ecosystemType: EcosystemType.TROPICAL_RAINFOREST,
      province: 'Bali',
      latitude: -8.3335,
      longitude: 115.0901,
      areaHectares: 22000.0,
      targetSequestrationTco2e: 1600000.0,
      actualSequestrationTco2e: 1600000.0,
      carbonStockTco2e: 1600000.0,
      carbonPricePerTonIdr: 350000.0,
      ndviScore: 0.89,
      eviScore: 0.74,
      survivalRatePercent: 95.0,
      canopyHeightMeters: 3.2,
      budgetTotalIdr: 4500000000.0,
      budgetDisbursedIdr: 4500000000.0,
      status: ProjectStatus.MINTED,
      speCertificateId: 'SPE-GRK-00590-BALI-2026',
      budgetReportFileName: 'Proposal_Pengembangan_Bibit_Endemik_Bali.pdf',
      budgetReportFileSizeBytes: BigInt(3945787),
      budgetReportStorageKey: keyBali,
      bufferAllocatedPercent: 8.0,
      bufferUsedPercent: 0.0,
      trendDataJson: {
        labels: ['2021', '2022', '2023', '2024', '2025'],
        data: [1.1, 1.25, 1.4, 1.52, 1.6],
      },
      coordinatesJson: [
        { lat: -8.3245, lng: 115.075 },
        { lat: -8.316, lng: 115.087 },
        { lat: -8.3215, lng: 115.1015 },
        { lat: -8.333, lng: 115.108 },
        { lat: -8.346, lng: 115.1 },
        { lat: -8.3515, lng: 115.086 },
        { lat: -8.342, lng: 115.073 },
        { lat: -8.3245, lng: 115.075 },
      ],
      inspectionCheckpoints: {
        create: [
          {
            sequenceNo: 1,
            title: 'Tahun 1: Pembibitan 1.1 Juta Stek Sawo Kecik & Majegau',
            scheduledAt: new Date('2023-04-10'),
            submissionDeadline: new Date('2023-05-10'),
            method: 'FIELD',
            instructions:
              'Produksi massal bibit kayu endemik Bali untuk pengrajin lokal.',
          },
          {
            sequenceNo: 2,
            title: 'Tahun 2: Inter-cropping Agroforestri KTH Wana Giri',
            scheduledAt: new Date('2024-02-15'),
            submissionDeadline: new Date('2024-03-15'),
            method: 'FIELD',
            instructions:
              'Integrasi tanaman sela pangan dengan tegakan kayu industri Bali.',
          },
          {
            sequenceNo: 3,
            title: 'Tahun 3: Monitoring Kanopi & Kelangsungan Hidup Pohon',
            scheduledAt: new Date('2024-10-20'),
            submissionDeadline: new Date('2024-11-20'),
            method: 'SATELLITE',
            instructions:
              'Analisis time-series citra Sentinel-2 & verifikasi kelangsungan hidup 95%.',
          },
          {
            sequenceNo: 4,
            title:
              'Tahun 4: Audit Verifikasi Sucofindo & Minting Token SPE-GRK',
            scheduledAt: new Date('2025-06-12'),
            submissionDeadline: new Date('2025-07-12'),
            method: 'HYBRID',
            instructions:
              'Audit fisik lapangan akhir dan pencetakan sertifikat offset karbon.',
          },
        ],
      },
    },
  });

  const stageKalbar1 = await prisma.projectStage.create({
    data: {
      id: randomUUID(),
      projectId: projectKalbar.id,
      yearNumber: 1,
      title: 'Tahun 1: Pembibitan Endemik & Pemetaan GIS',
      milestoneDescription:
        'Pengadaan 50.000 bibit kayu lokal & pembentukan KTH Kapuas.',
      status: StageStatus.COMPLETED,
      canopyDensityPercent: 42.0,
      farmerIncentiveIdr: 450000000.0,
      incentiveStatus: 'DISBURSED',
      speCreditsMinted: 2800.0,
      plantedTrees: 50000,
      targetTrees: 50000,
    },
  });

  const stageBali1 = await prisma.projectStage.create({
    data: {
      id: randomUUID(),
      projectId: projectBali.id,
      yearNumber: 1,
      title: 'Tahun 1: Pembibitan 1.1 Juta Stek Sawo Kecik',
      milestoneDescription:
        'Penyediaan bibit sawo kecik & majegau untuk pengrajin kayu Bali.',
      status: StageStatus.COMPLETED,
      canopyDensityPercent: 68.0,
      farmerIncentiveIdr: 650000000.0,
      incentiveStatus: 'DISBURSED',
      speCreditsMinted: 5000.0,
      plantedTrees: 100000,
      targetTrees: 100000,
    },
  });

  // 9. Seed Forest IoT Telemetry Logs
  console.log('🌱 Seeding Forest Environmental Sensor Telemetry Logs...');
  await prisma.forestSensorTelemetryLog.create({
    data: {
      projectId: projectKalbar.id,
      nodeId: 'SENSOR-NODE-KALBAR-01',
      canopyMoisturePercent: 84.5,
      soilMoisturePercent: 91.2,
      ambientTempC: 28.4,
      solarRadiationWM2: 680.5,
      recordedAt: new Date('2026-02-22T07:00:00.000Z'),
    },
  });

  await prisma.forestSensorTelemetryLog.create({
    data: {
      projectId: projectBali.id,
      nodeId: 'SENSOR-NODE-BALI-04',
      canopyMoisturePercent: 92.0,
      soilMoisturePercent: 98.4,
      ambientTempC: 27.2,
      solarRadiationWM2: 540.0,
      recordedAt: new Date('2026-02-22T07:05:00.000Z'),
    },
  });

  // 10. Seed Drone Missions
  console.log('🛸 Seeding Drone dMRV Missions...');
  await prisma.droneMission.create({
    data: {
      id: randomUUID(),
      projectId: projectKalbar.id,
      missionName: 'LiDAR & Multispectral Survey Kalbar Q1-2026',
      flightDate: new Date('2026-02-10'),
      droneModel: 'DJI Matrice 350 RTK + Zenmuse L2',
      gsdCmPx: 2.15,
      coverageHectares: 1250.0,
      status: MissionStatus.COMPLETED,
      orthophotoFileId: fileOrthoDrone.id,
    },
  });

  // 11. Seed Carbon Tokens & Bursa DEX Market
  console.log('🪙 Seeding Carbon Tokens & DEX Market Listings...');
  const tokenKalbar = await prisma.carbonToken.create({
    data: {
      id: randomUUID(),
      speCertificateNumber: 'SPE-KALBAR-2026-001',
      projectId: projectKalbar.id,
      totalMintedTco2e: 50000.0,
      availableBalanceTco2e: 48750.0,
      vintageYear: 2026,
      blockchainTokenId: BigInt(1),
      mintTxHash:
        '0x7f9a8b1c94857102948571029485710294857102948571029485710294857102',
      mintedAt: new Date('2026-01-20T10:00:00.000Z'),
    },
  });

  const listingKalbar = await prisma.bursaListing.create({
    data: {
      id: randomUUID(),
      sellerUserId: userAdmin.id,
      carbonTokenId: tokenKalbar.id,
      projectName: 'Rehabilitasi Hutan Terdegradasi Spesies Endemik Kalbar',
      volumeAvailableTco2e: 48750.0,
      pricePerTonIdr: 280000.0,
      status: ListingStatus.ACTIVE,
    },
  });

  await prisma.bursaOrder.create({
    data: {
      id: randomUUID(),
      listingId: listingKalbar.id,
      buyerUserId: userEmitter1.id,
      volumeTco2e: 2330.0,
      retiredVolumeTco2e: 2330.0,
      pricePerTonIdr: 280000.0,
      totalAmountIdr: 652400000.0,
      txHash:
        '0x8831a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      blockNumber: '#184890',
      verificationStatus: 'Terverifikasi (KLHK On-Chain - Burned)',
      auditorName: 'Rian Hermawan, M.T (Sucofindo)',
      status: OrderStatus.COMPLETED,
      completedAt: new Date('2026-02-15T10:00:00.000Z'),
    },
  });

  await prisma.bursaOrder.create({
    data: {
      id: randomUUID(),
      listingId: listingKalbar.id,
      buyerUserId: userBuyer.id,
      volumeTco2e: 1250.0,
      pricePerTonIdr: 280000.0,
      totalAmountIdr: 350000000.0,
      txHash:
        '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      blockNumber: '#184410',
      verificationStatus: 'Terverifikasi (KLHK On-Chain)',
      auditorName: 'Rian Hermawan, M.T (Sucofindo)',
      status: OrderStatus.COMPLETED,
      completedAt: new Date('2026-02-18T11:20:00.000Z'),
    },
  });

  const tokenBali = await prisma.carbonToken.create({
    data: {
      id: randomUUID(),
      speCertificateNumber: 'SPE-BALI-2026-001',
      projectId: projectBali.id,
      totalMintedTco2e: 70000.0,
      availableBalanceTco2e: 0.0,
      vintageYear: 2026,
      blockchainTokenId: BigInt(2),
      mintTxHash:
        '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      mintedAt: new Date('2026-01-22T10:00:00.000Z'),
    },
  });

  const listingBali = await prisma.bursaListing.create({
    data: {
      id: randomUUID(),
      sellerUserId: userAdmin.id,
      carbonTokenId: tokenBali.id,
      projectName: 'Pengembangan Bibit Tanaman Endemik Kayu Asli Bali',
      volumeAvailableTco2e: 0.0,
      pricePerTonIdr: 350000.0,
      status: ListingStatus.FILLED,
    },
  });

  await prisma.bursaOrder.create({
    data: {
      id: randomUUID(),
      listingId: listingBali.id,
      buyerUserId: userEmitter2.id,
      volumeTco2e: 50000.0,
      pricePerTonIdr: 350000.0,
      totalAmountIdr: 17500000000.0,
      txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      blockNumber: '#184410',
      verificationStatus: 'Terverifikasi (KLHK On-Chain)',
      auditorName: 'Rian Hermawan, M.T (Sucofindo)',
      status: OrderStatus.COMPLETED,
      completedAt: new Date('2025-07-10T09:30:00.000Z'),
    },
  });

  await prisma.bursaOrder.create({
    data: {
      id: randomUUID(),
      listingId: listingBali.id,
      buyerUserId: userBuyer.id,
      volumeTco2e: 20000.0,
      pricePerTonIdr: 350000.0,
      totalAmountIdr: 7000000000.0,
      txHash: '0x4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a',
      blockNumber: '#184102',
      verificationStatus: 'Terverifikasi (KLHK On-Chain)',
      auditorName: 'Hendry Setiawan, B.Eng (BSI Group)',
      status: OrderStatus.COMPLETED,
      completedAt: new Date('2025-07-05T14:15:00.000Z'),
    },
  });

  // 13. Seed KTH Incentive Disbursements
  console.log('💰 Seeding KTH Incentive Milestone Disbursements...');
  await prisma.kthIncentiveDisbursement.create({
    data: {
      id: randomUUID(),
      projectId: projectKalbar.id,
      kthGroupId: kthKalbar.id,
      stageId: stageKalbar1.id,
      amountIdr: 450000000.0,
      volumeTco2e: 2800.0,
      category: 'Restorasi & Pembibitan',
      description:
        'Pengadaan 50.000 bibit endemik dan pemetaan jalur GIS KTH Kapuas',
      vendorName: 'KTH Dayak Kapuas Mandiri',
      txHash:
        '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
      blockNumber: '#183100',
      itemsJson: [
        {
          name: 'Pengadaan Bibit Pohon Endemik Kalbar (Kayu Ulin & Meranti)',
          qty: 50000,
          unit: 'Batang',
          price: 8000,
          total: 400000000,
        },
        {
          name: 'Operasional Pemetaan Lahan GIS & Batas Sekat Bakar',
          qty: 5,
          unit: 'KM',
          price: 10000000,
          total: 50000000,
        },
      ],
      proofImagesJson: [
        '/proofs/nota_pembelian.svg',
        '/proofs/bukti_transfer.svg',
      ],
      disbursedAt: new Date('2026-01-25T15:00:00.000Z'),
    },
  });

  await prisma.kthIncentiveDisbursement.create({
    data: {
      id: randomUUID(),
      projectId: projectBali.id,
      kthGroupId: kthBali.id,
      stageId: stageBali1.id,
      amountIdr: 650000000.0,
      volumeTco2e: 5000.0,
      category: 'Pembibitan & Agroforestri',
      description:
        'Pengadaan 1.1 juta stek Sawo Kecik & Majegau untuk KTH Wana Giri Bali',
      vendorName: 'Dinas Kehutanan Bali & KTH Wana Giri',
      txHash: '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c',
      blockNumber: '#184920',
      itemsJson: [
        {
          name: 'Pengadaan Bibit Sawo Kecik & Majegau KTH (110 Anggota)',
          qty: 110,
          unit: 'Anggota',
          price: 5000000,
          total: 550000000,
        },
        {
          name: 'Operasional Persemaian Massal & Pupuk Organik',
          qty: 100,
          unit: 'Karung',
          price: 1000000,
          total: 100000000,
        },
      ],
      proofImagesJson: [
        '/proofs/nota_pembelian.svg',
        '/proofs/bukti_transfer.svg',
        '/proofs/sertifikat_spe.svg',
      ],
      disbursedAt: new Date('2025-07-14T10:00:00.000Z'),
    },
  });

  // 14. Seed Multi-Sig Governance Requests & Signatures
  console.log('✍️ Seeding Multi-Sig Governance Requests & Signatures...');
  const multiSigReq = await prisma.multiSigRequest.create({
    data: {
      id: randomUUID(),
      applicantUserId: userKth1.id,
      requestType: MultiSigTxType.MINT_CREDIT,
      description:
        'Minting 5.000 SPE-GRK Carbon Offset Credits untuk Pengembangan Bibit Endemik Bali.',
      requiredSigners: 2,
      currentSignersCount: 2,
      status: MultiSigStatus.APPROVED,
      payloadJson: {
        projectId: projectBali.id,
        volumeTco2e: 5000,
        vintage: 2026,
      },
    },
  });

  await prisma.multiSigSignature.create({
    data: {
      id: randomUUID(),
      requestId: multiSigReq.id,
      signerUserId: userRegulator.id,
      signatureHash:
        '0x99281a8b1c948571029485710294857102948571029485710294857102948571',
      signedAt: new Date('2026-02-19T09:15:00.000Z'),
    },
  });

  await prisma.multiSigSignature.create({
    data: {
      id: randomUUID(),
      requestId: multiSigReq.id,
      signerUserId: userAuditor.id,
      signatureHash:
        '0x77192a8b1c948571029485710294857102948571029485710294857102948571',
      signedAt: new Date('2026-02-19T14:30:00.000Z'),
    },
  });

  // --- 10 ADDITIONAL EMITTERS ---
  console.log('🏭 Seeding 10 additional emitter users for testing...');
  await seedAdditionalEmitterAccounts(defaultPasswordHash);

  // 14b. Seed compatibility PTBAE allocations for every company.
  console.log('🏛️ Seeding Official PTBAE-PU Quota Allocations (FY 2026)...');
  const seededCompanies = await prisma.company.findMany({
    select: { id: true, emissionCapTco2e: true },
  });
  await prisma.ptbaeAllocation.createMany({
    data: seededCompanies.map((company) => ({
      companyId: company.id,
      complianceYear: 2026,
      quotaTco2e: company.emissionCapTco2e || 1100000.0,
      sourceDocument:
        'SK Menteri LHK No. SK.720/MENLHK/SETJEN/KUM.1/12/2025 tentang Penetapan PTBAE-PU Sektor Industri',
      status: PtbaeStatus.VERIFIED,
      assignedAt: new Date('2026-01-01T00:00:00.000Z'),
      verifiedAt: new Date('2026-01-05T00:00:00.000Z'),
      notes:
        'Dokumen resmi alokasi kuota emisi PTBAE-PU terverifikasi KLHK untuk tahun ketaatan 2026.',
    })),
    skipDuplicates: true,
  });

  // 15. Seed DJP Carbon Tax Assessments & STP Invoices
  console.log('🏛️ Seeding DJP Carbon Tax Assessments & STP Invoices...');
  const taxAssessmentTuban = await prisma.carbonTaxAssessment.create({
    data: {
      id: randomUUID(),
      companyId: companyTuban.id,
      taxYear: 2026,
      actualEmissionTco2e: 2350000.0,
      quotaPtbaeTco2e: 1100000.0,
      deficitTco2e: 1250000.0,
      taxRatePerTonIdr: 650000.0,
      totalTaxPayableIdr: 812500000000.0,
      status: TaxAssessmentStatus.STP_ISSUED,
      assessedAt: new Date('2026-02-15T08:00:00.000Z'),
    },
  });

  await prisma.stpInvoice.create({
    data: {
      id: randomUUID(),
      assessmentId: taxAssessmentTuban.id,
      companyId: companyTuban.id,
      stpDocNumber: 'STP-DJP-2026-9921',
      taxYear: 2026,
      amountIdr: 812500000000.0,
      dueDate: new Date('2026-12-31'),
      paymentStatus: PaymentStatus.UNPAID,
      issuedAt: new Date('2026-02-15T09:00:00.000Z'),
    },
  });

  // 16. Seed System Notifications
  console.log('🔔 Seeding System Notifications...');
  await prisma.systemNotification.create({
    data: {
      id: randomUUID(),
      recipientUserId: userAdmin.id,
      title: 'Peringatan Defisit Kuota Emisi PTBAE-PU',
      message:
        'PT Semen Nusantara Tuban mencatat defisit 1.250.000 tCO2e (113.6% dari kuota). STP telah diterbitkan.',
      type: NotificationType.CAP_BREACH,
      priority: PriorityLevel.CRITICAL,
      isRead: false,
      actionUrl: '/emitter/compliance',
    },
  });

  await prisma.systemNotification.create({
    data: {
      id: randomUUID(),
      recipientUserId: userRegulator.id,
      title: 'Multi-Sig Approval Selesai',
      message:
        'Permintaan minting credit untuk Restorasi Mangrove Tuban telah memenuhi kuorum 2-dari-3 tanda tangan.',
      type: NotificationType.MULTISIG_ACTION,
      priority: PriorityLevel.HIGH,
      isRead: false,
      actionUrl: '/governance',
    },
  });

  console.log(
    '\n================================================================',
  );
  console.log('✅ PostgreSQL Database Seeding Completed (21 Models Seeded)');
  console.log(
    '================================================================',
  );
  console.log(
    '🔑 Available Test Accounts (Password: ' + DEFAULT_SEED_PASSWORD + '):',
  );
  console.log(
    '----------------------------------------------------------------',
  );
  console.log('• SUPER_ADMIN:        admin@rekakarbon.id');
  console.log('• REGULATOR_KLHK:     regulator@klhk.go.id');
  console.log('• AUDITOR_VERIFIER:   auditor@sucofindo.co.id');
  console.log('• KEMENTERIAN_PTBAE:  kementerian@rekakarbon.go.id');
  console.log('• CORPORATE_EMITTER:  director@suralaya.co.id');
  console.log('• CORPORATE_EMITTER:  sustainability@sementuban.co.id');
  for (const emitter of ADDITIONAL_EMITTERS) {
    console.log(
      `• TEST_EMITTER:        ${emitter.email} (${emitter.companyName})`,
    );
  }
  console.log('• KTH_COMMUNITY:      kth.tuban@perhutanan.id');
  console.log('• PUBLIC_BUYER:       investor@greenfund.sg');
  console.log(
    '================================================================\n',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
