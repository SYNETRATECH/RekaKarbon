import type {
  PtbaeApplication,
  PtbaeApplicationInput,
  PtbaeAuditDecisionInput,
  PtbaeDocumentType,
  PtbaeMinistryDecisionInput,
} from '../types';
import { MOCK_PTBAE_APPLICATIONS } from '../lib/mock/ptbae-applications';
import type { PtbaeApplicationRepository } from './ptbae-application.repository';

function cloneApplication(application: PtbaeApplication): PtbaeApplication {
  return structuredClone(application);
}

export class MockPtbaeApplicationRepository implements PtbaeApplicationRepository {
  private applications: PtbaeApplication[] = MOCK_PTBAE_APPLICATIONS.map(cloneApplication);

  async getMine(): Promise<PtbaeApplication[]> {
    return this.applications.map(cloneApplication);
  }

  async createDraft(input: PtbaeApplicationInput): Promise<PtbaeApplication> {
    const existing = this.applications.find(
      (application) => application.complianceYear === input.complianceYear
    );
    if (existing && !['draft', 'revision_required'].includes(existing.status)) {
      throw new Error('Pengajuan tahun tersebut sedang diproses.');
    }

    const application: PtbaeApplication = {
      id: existing?.id ?? crypto.randomUUID(),
      companyId: 'mock-company-emitter',
      companyName: 'Perusahaan Emitter Demo',
      emissionReportId: input.emissionReportId ?? null,
      complianceYear: input.complianceYear,
      status: 'draft',
      facilityName: input.facilityName,
      technicalData: input.technicalData,
      productionData: input.productionData,
      baselineEmissionTCO2e: input.baselineEmissionTCO2e,
      mitigationPlan: input.mitigationPlan,
      emitterNotes: input.emitterNotes ?? null,
      submittedAt: null,
      auditedAt: null,
      auditorNotes: null,
      ministryDecidedAt: null,
      ministryNotes: null,
      allocation: null,
      documents: existing?.documents ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.applications = [
      application,
      ...this.applications.filter((item) => item.id !== application.id),
    ];
    return cloneApplication(application);
  }

  async updateDraft(id: string, input: Partial<PtbaeApplicationInput>): Promise<PtbaeApplication> {
    const existing = this.requireApplication(id);
    return this.createDraft({
      complianceYear: input.complianceYear ?? existing.complianceYear,
      emissionReportId: input.emissionReportId ?? existing.emissionReportId ?? undefined,
      facilityName: input.facilityName ?? existing.facilityName,
      technicalData: input.technicalData ?? existing.technicalData,
      productionData: input.productionData ?? existing.productionData,
      baselineEmissionTCO2e: input.baselineEmissionTCO2e ?? existing.baselineEmissionTCO2e,
      mitigationPlan: input.mitigationPlan ?? existing.mitigationPlan,
      emitterNotes: input.emitterNotes ?? existing.emitterNotes ?? undefined,
    });
  }

  async uploadDocument(
    id: string,
    documentType: PtbaeDocumentType,
    file: File
  ): Promise<PtbaeApplication> {
    const existing = this.requireApplication(id);
    const updated: PtbaeApplication = {
      ...existing,
      documents: [
        ...existing.documents,
        {
          id: crypto.randomUUID(),
          documentType,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          fileHash: null,
          accessUrl: '#',
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return cloneApplication(updated);
  }

  async submit(id: string): Promise<PtbaeApplication> {
    const existing = this.requireApplication(id);
    const updated: PtbaeApplication = {
      ...existing,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return cloneApplication(updated);
  }

  async getAuditQueue(): Promise<PtbaeApplication[]> {
    return this.applications
      .filter(
        (application) => application.status === 'submitted' || application.status === 'under_audit'
      )
      .map(cloneApplication);
  }

  async decideAudit(id: string, input: PtbaeAuditDecisionInput): Promise<PtbaeApplication> {
    const existing = this.requireApplication(id);
    const status =
      input.decision === 'approve'
        ? 'ministry_review'
        : input.decision === 'request_revision'
          ? 'revision_required'
          : 'rejected';
    const updated: PtbaeApplication = {
      ...existing,
      status,
      auditedAt: new Date().toISOString(),
      auditorNotes: input.notes ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return cloneApplication(updated);
  }

  async getMinistryQueue(): Promise<PtbaeApplication[]> {
    return this.applications
      .filter((application) =>
        ['ministry_review', 'approval_processing', 'approved', 'rejected'].includes(
          application.status
        )
      )
      .map(cloneApplication);
  }

  async requestMinistryRevision(id: string, notes?: string): Promise<PtbaeApplication> {
    return this.updateMinistryStatus(id, 'revision_required', notes);
  }

  async rejectMinistry(id: string, notes?: string): Promise<PtbaeApplication> {
    return this.updateMinistryStatus(id, 'rejected', notes);
  }

  async approveMinistry(id: string, input: PtbaeMinistryDecisionInput): Promise<PtbaeApplication> {
    const existing = this.requireApplication(id);
    const updated: PtbaeApplication = {
      ...existing,
      status: 'approved',
      ministryDecidedAt: new Date().toISOString(),
      ministryNotes: input.notes ?? null,
      allocation: {
        id: crypto.randomUUID(),
        quotaTCO2e: input.quotaTCO2e,
        status: 'VERIFIED',
        sourceDocument: input.sourceDocument,
        documentNumber: input.documentNumber,
        blockchainTxHash: '0xmock-ptbae-issuance',
        effectiveFrom: input.effectiveFrom ?? null,
        effectiveUntil: input.effectiveUntil ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return cloneApplication(updated);
  }

  private updateMinistryStatus(
    id: string,
    status: PtbaeApplication['status'],
    notes?: string
  ): Promise<PtbaeApplication> {
    const existing = this.requireApplication(id);
    const updated: PtbaeApplication = {
      ...existing,
      status,
      ministryDecidedAt: new Date().toISOString(),
      ministryNotes: notes ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return Promise.resolve(cloneApplication(updated));
  }

  private requireApplication(id: string): PtbaeApplication {
    const application = this.applications.find((item) => item.id === id);
    if (!application) throw new Error('Pengajuan PTBAE-PU tidak ditemukan.');
    return application;
  }

  private replace(application: PtbaeApplication) {
    this.applications = this.applications.map((item) =>
      item.id === application.id ? application : item
    );
  }
}
