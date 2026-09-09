import type { ProjectRepository } from './project.repository';
import type { Project } from '../types';
import { PROJECTS_DATA } from '../lib/mock/projects';

export class MockProjectRepository implements ProjectRepository {
  async getProjects(): Promise<Project[]> {
    return PROJECTS_DATA;
  }
  async getProjectById(id: string): Promise<Project | null> {
    return PROJECTS_DATA.find((p) => p.id === id) ?? null;
  }
  async downloadBudgetReport(id: string, fileName = 'Laporan_Anggaran_Proyek.pdf'): Promise<void> {
    const project = PROJECTS_DATA.find((p) => p.id === id) || PROJECTS_DATA[0];
    const textContent = `REKAKARBON - LAPORAN ANGGARAN PROYEK (MOCK PDF)\n=====================================\nID Proyek: ${project.id}\nNama: ${project.name}\nAnggaran Total: Rp ${(project.totalBudget || 0).toLocaleString('id-ID')}\n`;
    const blob = new Blob([textContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}
