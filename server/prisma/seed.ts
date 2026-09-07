import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  Role,
  UserStatus,
  KybCategory,
  KybStatus,
  PtbaeStatus,
  ComplianceRating,
  SensorStatus,
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
            'Data seed kompatibilitas; ganti dengan dokumen PTBAE-PU resmi perusahaan',
          status: PtbaeStatus.LEGACY,
          assignedAt: new Date('2026-01-01T00:00:00.000Z'),
          notes:
            'Nilai ini hanya untuk pengujian. Nilai resmi harus ditetapkan per perusahaan dan tahun.',
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

  const userEmitter1 = await prisma.user.create({
    data: {
      id: userEmitter1Id,
      email: 'director@suralaya.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Ir. Bambang Suralaya (Direktur Operasional)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B',
    },
  });

  const userEmitter2 = await prisma.user.create({
    data: {
      id: userEmitter2Id,
      email: 'sustainability@sementuban.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Maya Kartika, S.T. (VP ESG PT Semen Tuban)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D',
    },
  });

  const userEmitter3 = await prisma.user.create({
    data: {
      id: userEmitter3Id,
      email: 'sustainability@pertamina-ru4.co.id',
      passwordHash: defaultPasswordHash,
      fullName: 'Budi Santoso (HSE Manager Pertamina RU IV)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C',
    },
  });

  const userEmitter4 = await prisma.user.create({
    data: {
      id: userEmitter4Id,
      email: 'environment@pupukkaltim.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Siti Aminah (VP Lingkungan Hidup Pupuk Kaltim)',
      role: Role.emitter,
      status: UserStatus.ACTIVE,
      walletAddress: '0x2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D',
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

  // 4. Seed Companies & Smokestacks
  console.log('🏭 Seeding Corporate Companies & CEMS Smokestacks...');
  const companySuralaya = await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter1.id,
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

  const companyTuban = await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter2.id,
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

  await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter3.id,
      name: 'PT Pertamina (Persero) RU IV Cilacap',
      sector: 'Minyak & Gas Bumi (Kilang Pengolahan)',
      region: 'Cilacap, Jawa Tengah',
      latitude: -7.7303,
      longitude: 109.0093,
      emissionCapTco2e: 4500000.0,
      actualEmissionTco2e: 4450000.0,
      carbonDeficitTco2e: 0.0,
      offsetCostIdr: 0.0,
      complianceRating: ComplianceRating.COMPLIANT,
      auditDate: new Date('2026-03-10'),
      paymentDeadline: new Date('2026-12-31'),
      stackSensorsDescription: '24 Flare & Stack CEMS Terintegrasi',
      picAuditor: 'Tim Auditor Internal KLHK',
      description:
        'Kilang pengolahan minyak dengan efisiensi tinggi, memenuhi ambang batas emisi.',
    },
  });

  await prisma.company.create({
    data: {
      id: randomUUID(),
      userId: userEmitter4.id,
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
  const regionJatim = await prisma.nationalForestRegion.create({
    data: {
      id: randomUUID(),
      regionName: 'Jawa & Nusa Tenggara (Restorasi Pesisir & Agro)',
      areaHectares: 900000.0,
      carbonSequestrationTco2e: 9800000.0,
      fundingDisbursedIdr: 4000000000.0,
      forestHealthPercent: 94.2,
    },
  });

  await prisma.nationalForestRegion.create({
    data: {
      id: randomUUID(),
      regionName: 'Kalimantan Peatland & Dipterocarp Biosphere',
      areaHectares: 2400000.0,
      carbonSequestrationTco2e: 24500000.0,
      fundingDisbursedIdr: 12500000000.0,
      forestHealthPercent: 91.8,
    },
  });

  const kthTuban = await prisma.kthGroup.create({
    data: {
      id: randomUUID(),
      groupName: 'KTH Mangrove Tuban Mandiri',
      leaderName: 'Haji Supardi',
      memberCount: 62,
      location: 'Kecamatan Jenu, Kabupaten Tuban, Jawa Timur',
      registrationNumber: 'SK.LHK-8832/KTH/2023',
      walletAddress: '0x8a1c948571029485710294857102948571029485',
      totalIncentiveReceivedIdr: 1000000000.0,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  const kthBaluran = await prisma.kthGroup.create({
    data: {
      id: randomUUID(),
      groupName: 'KTH Rimba Baluran Lestari',
      leaderName: 'Sutrisno, S.Hut',
      memberCount: 84,
      location: 'Situbondo / Banyuwangi, Jawa Timur',
      registrationNumber: 'SK.LHK-9410/KTH/2024',
      walletAddress: '0x6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C',
      totalIncentiveReceivedIdr: 1850000000.0,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  // 8. Seed Forest Projects & Stages
  console.log('🌲 Seeding Forest Conservation Projects & Stages...');
  const projectBaluran = await prisma.forestProject.create({
    data: {
      id: randomUUID(),
      regionId: regionJatim.id,
      kthGroupId: kthBaluran.id,
      projectName: 'Taman Nasional Baluran Canopy Restoration',
      ecosystemType: EcosystemType.TROPICAL_RAINFOREST,
      province: 'Jawa Timur',
      latitude: -7.8385,
      longitude: 114.3725,
      areaHectares: 25000.0,
      targetSequestrationTco2e: 1500000.0,
      actualSequestrationTco2e: 1240000.0,
      carbonStockTco2e: 1240000.0,
      carbonPricePerTonIdr: 260000.0,
      ndviScore: 0.78,
      eviScore: 0.61,
      survivalRatePercent: 87.5,
      canopyHeightMeters: 1.85,
      budgetTotalIdr: 4850000000.0,
      budgetDisbursedIdr: 3750000000.0,
      status: ProjectStatus.ACTIVE_DMRV,
      speCertificateId: 'SPE-GRK-00192-REKA-2026',
      bufferAllocatedPercent: 8.0,
      bufferUsedPercent: 0.0,
      trendDataJson: {
        labels: ['2021', '2022', '2023', '2024', '2025'],
        data: [1.15, 1.18, 1.2, 1.22, 1.24],
      },
      coordinatesJson: [
        { lat: -7.732, lng: 114.398 },
        { lat: -7.735, lng: 114.471 },
        { lat: -7.822, lng: 114.478 },
        { lat: -7.889, lng: 114.452 },
        { lat: -7.911, lng: 114.331 },
        { lat: -7.832, lng: 114.288 },
        { lat: -7.748, lng: 114.321 },
      ],
    },
  });

  const projectMangrove = await prisma.forestProject.create({
    data: {
      id: randomUUID(),
      regionId: regionJatim.id,
      kthGroupId: kthTuban.id,
      projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
      ecosystemType: EcosystemType.MANGROVE_BLUE_CARBON,
      province: 'Jawa Timur',
      latitude: -6.8854,
      longitude: 112.0123,
      areaHectares: 12000.0,
      targetSequestrationTco2e: 980000.0,
      actualSequestrationTco2e: 860000.0,
      carbonStockTco2e: 860000.0,
      carbonPricePerTonIdr: 650000.0,
      ndviScore: 0.82,
      eviScore: 0.68,
      survivalRatePercent: 91.2,
      canopyHeightMeters: 2.1,
      budgetTotalIdr: 3500000000.0,
      budgetDisbursedIdr: 2800000000.0,
      status: ProjectStatus.ACTIVE_DMRV,
      speCertificateId: 'SPE-GRK-00241-TUBAN-2026',
      bufferAllocatedPercent: 8.0,
      bufferUsedPercent: 0.0,
      trendDataJson: {
        labels: ['2021', '2022', '2023', '2024', '2025'],
        data: [1.1, 1.14, 1.19, 1.22, 1.26],
      },
      coordinatesJson: [
        { lat: -6.87, lng: 111.98 },
        { lat: -6.86, lng: 112.05 },
        { lat: -6.9, lng: 112.08 },
        { lat: -6.93, lng: 112.03 },
        { lat: -6.92, lng: 111.96 },
        { lat: -6.88, lng: 111.95 },
      ],
    },
  });

  const stageBaluran1 = await prisma.projectStage.create({
    data: {
      id: randomUUID(),
      projectId: projectBaluran.id,
      yearNumber: 1,
      title: 'Tahun 1: Pembibitan & Persiapan Lahan Kritis',
      milestoneDescription:
        'Pengadaan 40.000 bibit endemik dan pembuatan sekat bakar.',
      status: StageStatus.COMPLETED,
      canopyDensityPercent: 32.0,
      farmerIncentiveIdr: 350000000.0,
      incentiveStatus: 'DISBURSED',
      speCreditsMinted: 1200.0,
      plantedTrees: 40000,
      targetTrees: 40000,
    },
  });

  await prisma.projectStage.create({
    data: {
      id: randomUUID(),
      projectId: projectBaluran.id,
      yearNumber: 2,
      title: 'Tahun 2: Penanaman Intensif & Monitoring IoT',
      milestoneDescription:
        'Pemasangan 12 unit sensor kanopi dan verifikasi LiDAR drone.',
      status: StageStatus.IN_PROGRESS,
      canopyDensityPercent: 48.5,
      farmerIncentiveIdr: 450000000.0,
      incentiveStatus: 'PENDING_AUDIT',
      speCreditsMinted: 2400.0,
      plantedTrees: 38500,
      targetTrees: 40000,
    },
  });

  const stageMangrove1 = await prisma.projectStage.create({
    data: {
      id: randomUUID(),
      projectId: projectMangrove.id,
      yearNumber: 1,
      title: 'Tahun 1: Pembibitan Mangrove Rhizophora',
      milestoneDescription:
        'Penanaman 50.000 bibit mangrove dan pembangunan tanggul penahan ombak.',
      status: StageStatus.COMPLETED,
      canopyDensityPercent: 55.0,
      farmerIncentiveIdr: 300000000.0,
      incentiveStatus: 'DISBURSED',
      speCreditsMinted: 2400.0,
      plantedTrees: 50000,
      targetTrees: 50000,
    },
  });

  // 9. Seed Forest IoT Telemetry Logs
  console.log('🌱 Seeding Forest Environmental Sensor Telemetry Logs...');
  await prisma.forestSensorTelemetryLog.create({
    data: {
      projectId: projectBaluran.id,
      nodeId: 'SENSOR-NODE-BALURAN-01',
      canopyMoisturePercent: 84.5,
      soilMoisturePercent: 91.2,
      ambientTempC: 28.4,
      solarRadiationWM2: 680.5,
      recordedAt: new Date('2026-02-22T07:00:00.000Z'),
    },
  });

  await prisma.forestSensorTelemetryLog.create({
    data: {
      projectId: projectMangrove.id,
      nodeId: 'SENSOR-NODE-MANGROVE-04',
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
      projectId: projectBaluran.id,
      missionName: 'LiDAR & Multispectral Survey Baluran Q1-2026',
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
  const tokenBaluran = await prisma.carbonToken.create({
    data: {
      id: randomUUID(),
      speCertificateNumber: 'SPE-BALURAN-2026-001',
      projectId: projectBaluran.id,
      totalMintedTco2e: 50000.0,
      availableBalanceTco2e: 48750.0,
      vintageYear: 2026,
      blockchainTokenId: BigInt(1),
      mintTxHash:
        '0x7f9a8b1c94857102948571029485710294857102948571029485710294857102',
      mintedAt: new Date('2026-01-20T10:00:00.000Z'),
    },
  });

  const listingBaluran = await prisma.bursaListing.create({
    data: {
      id: randomUUID(),
      sellerUserId: userAdmin.id,
      carbonTokenId: tokenBaluran.id,
      projectName: 'Taman Nasional Baluran Canopy Restoration',
      volumeAvailableTco2e: 48750.0,
      pricePerTonIdr: 260000.0,
      status: ListingStatus.ACTIVE,
    },
  });

  await prisma.bursaOrder.create({
    data: {
      id: randomUUID(),
      listingId: listingBaluran.id,
      buyerUserId: userBuyer.id,
      volumeTco2e: 1250.0,
      pricePerTonIdr: 260000.0,
      totalAmountIdr: 325000000.0,
      txHash:
        '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      blockNumber: '#184410',
      verificationStatus: 'Terverifikasi (KLHK On-Chain)',
      auditorName: 'Rian Hermawan, M.T (Sucofindo)',
      status: OrderStatus.COMPLETED,
      completedAt: new Date('2026-02-18T11:20:00.000Z'),
    },
  });

  const tokenMangrove = await prisma.carbonToken.create({
    data: {
      id: randomUUID(),
      speCertificateNumber: 'SPE-TUBAN-2026-001',
      projectId: projectMangrove.id,
      totalMintedTco2e: 70000.0,
      availableBalanceTco2e: 0.0,
      vintageYear: 2026,
      blockchainTokenId: BigInt(2),
      mintTxHash:
        '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      mintedAt: new Date('2026-01-22T10:00:00.000Z'),
    },
  });

  const listingMangrove = await prisma.bursaListing.create({
    data: {
      id: randomUUID(),
      sellerUserId: userAdmin.id,
      carbonTokenId: tokenMangrove.id,
      projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
      volumeAvailableTco2e: 0.0,
      pricePerTonIdr: 260000.0,
      status: ListingStatus.FILLED,
    },
  });

  await prisma.bursaOrder.create({
    data: {
      id: randomUUID(),
      listingId: listingMangrove.id,
      buyerUserId: userEmitter2.id,
      volumeTco2e: 50000.0,
      pricePerTonIdr: 260000.0,
      totalAmountIdr: 13000000000.0,
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
      listingId: listingMangrove.id,
      buyerUserId: userBuyer.id,
      volumeTco2e: 20000.0,
      pricePerTonIdr: 260000.0,
      totalAmountIdr: 5200000000.0,
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
      projectId: projectBaluran.id,
      kthGroupId: kthBaluran.id,
      stageId: stageBaluran1.id,
      amountIdr: 350000000.0,
      volumeTco2e: 1200.0,
      category: 'Restorasi & Pembibitan',
      description: 'Pengadaan 40.000 bibit endemik dan pembuatan sekat bakar',
      vendorName: 'KTH Baluran Mandiri',
      txHash:
        '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
      blockNumber: '#183100',
      itemsJson: [
        {
          name: 'Pengadaan Bibit Pohon Endemik Baluran',
          qty: 40000,
          unit: 'Batang',
          price: 7500,
          total: 300000000,
        },
        {
          name: 'Pembuatan Sekat Bakar & Jalur Pemadam Firebreak',
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
      projectId: projectMangrove.id,
      kthGroupId: kthTuban.id,
      stageId: stageMangrove1.id,
      amountIdr: 45000000.0,
      volumeTco2e: 1000.0,
      category: 'Pemeliharaan',
      description:
        'Insentif bulanan KTH (Dinas Kehutanan Jawa Timur & KTH Tuban)',
      vendorName: 'Dinas Kehutanan Jawa Timur & KTH Tuban',
      txHash: '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c',
      blockNumber: '#184920',
      itemsJson: [
        {
          name: 'Insentif Tanam & Pemeliharaan KTH (15 Anggota)',
          qty: 15,
          unit: 'Anggota',
          price: 2000000,
          total: 30000000,
        },
        {
          name: 'Pengadaan Pupuk Kompos Organik Bio-Fertilizer',
          qty: 30,
          unit: 'Karung',
          price: 300000,
          total: 9000000,
        },
        {
          name: 'Operasional Alat Penyiangan & Pemangkasan',
          qty: 6,
          unit: 'Set',
          price: 1000000,
          total: 6000000,
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

  await prisma.kthIncentiveDisbursement.create({
    data: {
      id: randomUUID(),
      projectId: projectMangrove.id,
      kthGroupId: kthTuban.id,
      stageId: stageMangrove1.id,
      amountIdr: 85000000.0,
      volumeTco2e: 1500.0,
      category: 'Monitoring',
      description: 'Sewa UAV & pemindaian orthophoto udara dMRV',
      vendorName: 'PT Aero Mapping Indonesia',
      txHash: '0x3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
      blockNumber: '#183712',
      itemsJson: [
        {
          name: 'Sewa Drone VTOL LiDAR Multiterrain (3 Hari)',
          qty: 3,
          unit: 'Hari',
          price: 20000000,
          total: 60000000,
        },
        {
          name: 'Jasa Pengolahan Citra dMRV & Model CHM',
          qty: 1,
          unit: 'Paket',
          price: 15000000,
          total: 15000000,
        },
        {
          name: 'Honor Pilot Drone Sertifikasi FASI & Surveyor',
          qty: 2,
          unit: 'Orang',
          price: 5000000,
          total: 10000000,
        },
      ],
      proofImagesJson: [
        '/proofs/nota_pembelian.svg',
        '/proofs/bukti_transfer.svg',
        '/proofs/sertifikat_spe.svg',
      ],
      disbursedAt: new Date('2025-06-28T14:30:00.000Z'),
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
        'Minting 2.400 SPE-GRK Carbon Offset Credits untuk Restorasi Mangrove Tuban Tahap 2.',
      requiredSigners: 2,
      currentSignersCount: 2,
      status: MultiSigStatus.APPROVED,
      payloadJson: {
        projectId: projectMangrove.id,
        volumeTco2e: 2400,
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
  // These values mirror the legacy company cap until an official yearly allocation is uploaded.
  const seededCompanies = await prisma.company.findMany({
    select: { id: true, emissionCapTco2e: true },
  });
  await prisma.ptbaeAllocation.createMany({
    data: seededCompanies.map((company) => ({
      companyId: company.id,
      complianceYear: 2026,
      quotaTco2e: company.emissionCapTco2e,
      sourceDocument:
        'Data seed kompatibilitas; ganti dengan dokumen PTBAE-PU resmi perusahaan',
      status: PtbaeStatus.LEGACY,
      assignedAt: new Date('2026-01-01T00:00:00.000Z'),
      notes:
        'Nilai ini bukan ambang universal. Nilai resmi harus ditetapkan per perusahaan dan tahun.',
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
