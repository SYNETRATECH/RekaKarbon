import {
  PrismaClient,
  Role,
  UserStatus,
  KybStatus,
  ComplianceRating,
  EcosystemType,
  ProjectStatus,
  AnomalyType,
  SeverityLevel,
  AuditStatus,
  ListingStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/rekakarbon?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding RekaKarbon PostgreSQL database on host machine...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.systemNotification.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.stpInvoice.deleteMany();
  await prisma.carbonTaxAssessment.deleteMany();
  await prisma.multiSigSignature.deleteMany();
  await prisma.multiSigRequest.deleteMany();
  await prisma.kthIncentiveDisbursement.deleteMany();
  await prisma.bursaOrder.deleteMany();
  await prisma.bursaListing.deleteMany();
  await prisma.carbonToken.deleteMany();
  await prisma.droneMission.deleteMany();
  await prisma.auditAnomaly.deleteMany();
  await prisma.forestSensorTelemetryLog.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.forestProject.deleteMany();
  await prisma.nationalForestRegion.deleteMany();
  await prisma.kthGroup.deleteMany();
  await prisma.cemsTelemetryLog.deleteMany();
  await prisma.smokestack.deleteMany();
  await prisma.company.deleteMany();
  await prisma.kybProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      id: 'a0b1c2d3-0000-4000-8000-000000000001',
      email: 'admin@rekakarbon.id',
      passwordHash:
        '$2b$10$epRkE1GZ8wE3bQ3q3oYh1u/4k8j8oYh1u/4k8j8oYh1u/4k8j8oYh', // password123
      fullName: 'Super Administrator KLHK',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    },
  });

  const emitterUser = await prisma.user.create({
    data: {
      id: 'a0b1c2d3-0000-4000-8000-000000000002',
      email: 'director@suralaya.co.id',
      passwordHash:
        '$2b$10$epRkE1GZ8wE3bQ3q3oYh1u/4k8j8oYh1u/4k8j8oYh1u/4k8j8oYh',
      fullName: 'Bambang Suralaya (Direktur Operasional)',
      role: Role.CORPORATE_EMITTER,
      status: UserStatus.ACTIVE,
      walletAddress: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    },
  });

  // kth user
  await prisma.user.create({
    data: {
      id: 'a0b1c2d3-0000-4000-8000-000000000003',
      email: 'kth.tuban@perhutanan.id',
      passwordHash:
        '$2b$10$epRkE1GZ8wE3bQ3q3oYh1u/4k8j8oYh1u/4k8j8oYh1u/4k8j8oYh',
      fullName: 'Haji Supardi (Ketua KTH)',
      role: Role.KTH_COMMUNITY,
      status: UserStatus.ACTIVE,
      walletAddress: '0x8a1c948571029485710294857102948571029485',
    },
  });

  // 3. Seed Companies & Smokestacks
  const suralaya = await prisma.company.create({
    data: {
      id: 'a1b2c3d4-0001-4000-8000-000000000001',
      userId: emitterUser.id,
      name: 'PLTU Suralaya (Unit 1-8)',
      sector: 'Pembangkit Listrik (PLTU Batubara)',
      region: 'Cilegon, Banten',
      latitude: -5.8921,
      longitude: 106.0312,
      emissionCapTco2e: 1500000,
      actualEmissionTco2e: 3900000,
      carbonDeficitTco2e: 2400000,
      offsetCostIdr: 72000000000,
      complianceRating: ComplianceRating.NON_COMPLIANT,
      stackSensorsDescription: '12 Cerobong CEMS Online',
      picAuditor: 'Dr. Ir. Ahmad Fauzi (KLHK)',
      description:
        'Pembakaran batubara melebihi kuota ambang batas Kementerian LHK.',
    },
  });

  await prisma.smokestack.create({
    data: {
      id: 'c1d2e3f4-0010-4000-8000-000000000001',
      companyId: suralaya.id,
      stackCode: 'STACK-BOILER-04',
      sensorFacilityName: 'CEMS Flue Gas Analyzer Unit 4',
      lastTelemetryAt: new Date(),
    },
  });

  const semenTuban = await prisma.company.create({
    data: {
      id: 'a1b2c3d4-0001-4000-8000-000000000002',
      name: 'PT Semen Nusantara Tuban',
      sector: 'Industri Semen & Manufaktur',
      region: 'Tuban, Jawa Timur',
      latitude: -6.8981,
      longitude: 112.0491,
      emissionCapTco2e: 1100000,
      actualEmissionTco2e: 2350000,
      carbonDeficitTco2e: 1250000,
      offsetCostIdr: 37500000000,
      complianceRating: ComplianceRating.NON_COMPLIANT,
      stackSensorsDescription: '8 Cerobong Tanur Kalsinasi',
      picAuditor: 'Rian Hermawan, M.T (Sucofindo)',
      description:
        'Proses pemanasan klinker batu kapur menghasilkan emisi CO2 tinggi.',
    },
  });

  // 4. Seed National Forest Regions & KTH Groups
  const jatimRegion = await prisma.nationalForestRegion.create({
    data: {
      id: 'e1f2a3b4-0040-4000-8000-000000000004',
      regionName: 'Jawa & Nusa Tenggara (Reforestri Agro)',
      areaHectares: 900000,
      carbonSequestrationTco2e: 9800000,
      fundingDisbursedIdr: 4000000000,
      forestHealthPercent: 94.2,
    },
  });

  const kthTuban = await prisma.kthGroup.create({
    data: {
      id: 'a1b2c3d4-0042-4000-8000-000000000001',
      groupName: 'KTH Mangrove Tuban Mandiri',
      leaderName: 'Haji Supardi',
      memberCount: 62,
      location: 'Tuban, Jawa Timur',
      registrationNumber: 'SK.LHK-8832/KTH/2023',
      walletAddress: '0x8a1c948571029485710294857102948571029485',
      totalIncentiveReceivedIdr: 1000000000,
      kybStatus: KybStatus.VERIFIED,
    },
  });

  // 5. Seed Forest Project
  const baluranProject = await prisma.forestProject.create({
    data: {
      id: 'b2c3d4e5-0002-4000-8000-000000000001',
      regionId: jatimRegion.id,
      kthGroupId: kthTuban.id,
      projectName: 'TN Baluran',
      ecosystemType: EcosystemType.TROPICAL_RAINFOREST,
      province: 'Jawa Timur',
      latitude: -7.8385,
      longitude: 114.3725,
      areaHectares: 25000,
      targetSequestrationTco2e: 1500000,
      actualSequestrationTco2e: 1240000,
      carbonStockTco2e: 1240000,
      carbonPricePerTonIdr: 260000,
      ndviScore: 0.78,
      eviScore: 0.61,
      survivalRatePercent: 87.5,
      canopyHeightMeters: 1.85,
      budgetTotalIdr: 4850000000,
      budgetDisbursedIdr: 3750000000,
      status: ProjectStatus.ACTIVE_DMRV,
      speCertificateId: 'SPE-GRK-00192-REKA-2026',
    },
  });

  // 6. Seed Project Stage
  await prisma.projectStage.create({
    data: {
      id: 'd1e2f3a4-0020-4000-8000-000000000001',
      projectId: baluranProject.id,
      yearNumber: 1,
      title: 'Tahun 1: Pembibitan & Persiapan Lahan Kritis',
      milestoneDescription: 'Pengadaan bibit & pembukaan alur drainase.',
      canopyDensityPercent: 32,
      farmerIncentiveIdr: 350000000,
      speCreditsMinted: 1200,
      plantedTrees: 40000,
      targetTrees: 40000,
    },
  });

  // 7. Seed Carbon Token & Bursa Listing
  const carbonToken = await prisma.carbonToken.create({
    data: {
      id: 'e1f2a3b4-0021-4000-8000-000000000001',
      speCertificateNumber: 'SPE-BALURAN-2026-001',
      projectId: baluranProject.id,
      totalMintedTco2e: 50000,
      availableBalanceTco2e: 48750,
      vintageYear: 2026,
      blockchainTokenId: BigInt(1),
      mintTxHash:
        '0x7f9a8b1c94857102948571029485710294857102948571029485710294857102',
      mintedAt: new Date(),
    },
  });

  await prisma.bursaListing.create({
    data: {
      id: 'a1b2c3d4-0022-4000-8000-000000000001',
      sellerUserId: adminUser.id,
      carbonTokenId: carbonToken.id,
      projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
      volumeAvailableTco2e: 48750,
      pricePerTonIdr: 650000,
      status: ListingStatus.ACTIVE,
    },
  });

  // 8. Seed Audit Anomaly
  await prisma.auditAnomaly.create({
    data: {
      id: 'b1c2d3e4-0023-4000-8000-000000000001',
      companyId: semenTuban.id,
      facilityName: 'Tanur Kalsinasi Utama Unit 3',
      anomalyType: AnomalyType.CEMS_ENERGY_CORRELATION,
      severity: SeverityLevel.HIGH,
      anomalyScore: 0.89,
      reportedEmissionTco2e: 2350,
      expectedEmissionTco2e: 3120,
      divergencePercent: 32.7,
      detectedDate: new Date('2026-02-14'),
      auditStatus: AuditStatus.PENDING_REVIEW,
      verifierNotes:
        'Divergensi konsumsi batubara vs sensor cerobong CEMS terdeteksi oleh AI dMRV.',
    },
  });

  // 9. Seed System Notifications
  await prisma.systemNotification.create({
    data: {
      id: 'f1a2b3c4-0080-4000-8000-000000000001',
      recipientUserId: adminUser.id,
      title: 'Defisit Kuota Emisi PTBAE-PU',
      message:
        'PT Semen Nusantara Tuban mencatat defisit 2.330 tCO2e (118.6% dari kuota).',
      type: 'CAP_BREACH',
      priority: 'CRITICAL',
      isRead: false,
      actionUrl: '/emitter/compliance',
    },
  });

  console.log('✅ PostgreSQL database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
