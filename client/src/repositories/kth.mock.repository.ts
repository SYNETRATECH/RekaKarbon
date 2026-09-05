import type { KthDmrvSubmissionResult, KthForestProject, SubmitKthDmrvInput } from '../types';
import type { KthRepository } from './kth.repository';
import { MOCK_KTH_FOREST_PROJECTS } from '../lib/mock/kth';

export class MockKthRepository implements KthRepository {
  private readonly projects = MOCK_KTH_FOREST_PROJECTS.map((project) => ({ ...project }));

  async getForestProjects(): Promise<KthForestProject[]> {
    return this.projects.map((project) => ({ ...project }));
  }

  async submitDmrv(projectId: string, input: SubmitKthDmrvInput): Promise<KthDmrvSubmissionResult> {
    const project = this.projects.find((item) => item.id === projectId);
    if (!project) {
      throw new Error('Proyek kehutanan tidak ditemukan untuk akun KTH ini.');
    }
    if (input.areaHectares > project.areaHectares) {
      throw new Error('Luas petak melebihi luas proyek.');
    }

    const estimatedCarbon = Math.min(input.areaHectares * 37.5, project.targetSequestrationTCO2e);
    project.actualSequestrationTCO2e = estimatedCarbon;
    project.carbonStockTCO2e = estimatedCarbon;
    project.status = 'active_dmrv';

    return {
      projectId: project.id,
      projectName: project.projectName,
      landName: input.landName.trim(),
      areaHectares: input.areaHectares,
      estimatedCarbonTCO2e: estimatedCarbon,
      actualSequestrationTCO2e: estimatedCarbon,
      carbonStockTCO2e: estimatedCarbon,
      status: project.status,
      submittedAt: new Date().toISOString(),
    };
  }
}
