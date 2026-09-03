import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { z } from 'zod';
import {
  createContractTestApp,
  expectContract,
  FIXTURE_PROJECT,
  FIXTURE_COMPANY,
} from './contract-test.helper';
import {
  HealthStatusResponseSchema,
  ProjectSchema,
  CompanySchema,
  BursaItemSchema,
  BursaPurchaseEligibilitySchema,
  ComplianceDataSchema,
} from '../../../client/src/schemas';

describe('API Contract Verification Suite (React Router Client <-> NestJS Server)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const context = await createContractTestApp();
    app = context.app;
    authToken = context.testJwtToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root & Health Endpoints', () => {
    it('GET / should return standard service metadata', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty(
        'service',
        'RekaKarbon Core Backend API',
      );
      expect(res.body.data).toHaveProperty('version');
      expect(res.body.data).toHaveProperty('documentation', '/api/docs');
      expect(res.body.data).toHaveProperty('health', '/health');
    });

    it('GET /health must strictly satisfy frontend HealthStatusResponseSchema', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      const validated = expectContract(res.body, HealthStatusResponseSchema);

      expect(['ok', 'degraded', 'error']).toContain(validated.status);
      expect(validated.services.database).toBeDefined();
      expect(validated.services.blockchain).toBeDefined();
      expect(validated.services.storage).toBeDefined();
    });
  });

  describe('Carbon Projects (/projects)', () => {
    it('GET /projects must return an array adhering to ProjectSchema', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects')
        .expect(200);
      const validatedList = expectContract(res.body, z.array(ProjectSchema));

      expect(validatedList.length).toBeGreaterThan(0);
      const firstProject = validatedList[0];
      expect(firstProject.id).toBe(FIXTURE_PROJECT.id);
      expect(firstProject.name).toBe(FIXTURE_PROJECT.name);
      expect(firstProject.center).toHaveLength(2);
      expect(firstProject.trendLabels).toBeInstanceOf(Array);
      expect(firstProject.stages).toBeInstanceOf(Array);
      expect(firstProject.disbursementHistory).toBeInstanceOf(Array);
    });

    it('GET /projects/:id must return single record adhering to ProjectSchema', async () => {
      const res = await request(app.getHttpServer())
        .get(`/projects/${FIXTURE_PROJECT.id}`)
        .expect(200);

      const validated = expectContract(res.body, ProjectSchema);
      expect(validated.id).toBe(FIXTURE_PROJECT.id);
      expect(validated.totalBudget).toBe(FIXTURE_PROJECT.totalBudget);
    });

    it('GET /projects/:id with invalid UUID must trigger ParseUUIDPipe 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects/not-a-valid-uuid')
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Emitter Companies (/companies)', () => {
    it('GET /companies must return an array adhering to CompanySchema', async () => {
      const res = await request(app.getHttpServer())
        .get('/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const validatedList = expectContract(res.body, z.array(CompanySchema));
      expect(validatedList.length).toBeGreaterThan(0);
      const company = validatedList[0];
      expect(company.id).toBe(FIXTURE_COMPANY.id);
      expect(company.name).toBe(FIXTURE_COMPANY.name);
      expect(['non_compliant', 'warning', 'compliant']).toContain(
        company.complianceRating,
      );
    });

    it('GET /companies/:id must return single record adhering to CompanySchema', async () => {
      const res = await request(app.getHttpServer())
        .get(`/companies/${FIXTURE_COMPANY.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const company = expectContract(res.body, CompanySchema);
      expect(company.id).toBe(FIXTURE_COMPANY.id);
    });
  });

  describe('Bursa DEX Marketplace (/emitter/bursa)', () => {
    it('GET /emitter/bursa must return items adhering to BursaItemSchema', async () => {
      const res = await request(app.getHttpServer())
        .get('/emitter/bursa')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bursaList = expectContract(res.body, z.array(BursaItemSchema));
      expect(bursaList.length).toBeGreaterThan(0);
      expect(['mangrove', 'hutan', 'gambut']).toContain(bursaList[0].category);
    });

    it('GET /emitter/bursa/eligibility must adhere to BursaPurchaseEligibilitySchema', async () => {
      const res = await request(app.getHttpServer())
        .get('/emitter/bursa/eligibility')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const eligibility = expectContract(
        res.body,
        BursaPurchaseEligibilitySchema,
      );
      expect(typeof eligibility.canPurchase).toBe('boolean');
      expect(eligibility.reason).toBe('eligible');
    });
  });

  describe('Compliance Ledger (/emitter/compliance)', () => {
    it('GET /emitter/compliance must return data adhering to ComplianceDataSchema', async () => {
      const res = await request(app.getHttpServer())
        .get('/emitter/compliance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const compliance = expectContract(res.body, ComplianceDataSchema);
      expect(compliance.carbonDeficit).toBe(2330);
      expect(compliance.quotaPTBAEStatus).toBe('VERIFIED');
      expect(compliance.annualHistory).toBeInstanceOf(Array);
    });
  });

  describe('Authentication & Session Contract (/auth)', () => {
    it('POST /auth/login with invalid payload triggers standard 400 Bad Request envelope', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('POST /auth/logout returns standard acknowledgment envelope', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toEqual({ loggedOut: true });
    });
  });
});
