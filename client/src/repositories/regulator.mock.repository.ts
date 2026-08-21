import type { RegulatorRepository } from './regulator.repository';
import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHGroupItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
  Project,
} from '../types';
import {
  NATIONAL_FOREST_REGIONS,
  INITIAL_FOREST_PROJECTS,
  INITIAL_KTH_GROUPS,
  MOCK_KTH_TRANSACTIONS,
  INITIAL_REGULATION_UPLOADS,
} from '../lib/mock/regulator';

export class MockRegulatorRepository implements RegulatorRepository {
  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
    return NATIONAL_FOREST_REGIONS;
  }
  async getForestProjects(): Promise<ForestProjectItem[]> {
    return INITIAL_FOREST_PROJECTS;
  }
  async getKTHGroups(): Promise<KTHGroupItem[]> {
    return INITIAL_KTH_GROUPS;
  }
  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    return MOCK_KTH_TRANSACTIONS;
  }
  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    return INITIAL_REGULATION_UPLOADS as RegulationDocumentUploadItem[];
  }

  async searchVerichainLedger(
    query: string,
    projects: Project[],
    fallbackProject: Project
  ): Promise<any> {
    const q = query.trim().toLowerCase();
    let foundItem: any = null;
    let foundType: 'vendor' | 'tokenBuyer' = 'vendor';
    let foundProject: Project | null = null;

    for (const project of projects) {
      if (project.tokenBuyers) {
        const buyer = project.tokenBuyers.find(
          (tb) =>
            tb.txHash.toLowerCase().includes(q) ||
            tb.speCertificateId.toLowerCase().includes(q) ||
            tb.companyName.toLowerCase().includes(q) ||
            tb.id.toLowerCase().includes(q)
        );
        if (buyer) {
          foundItem = buyer;
          foundType = 'tokenBuyer';
          foundProject = project;
          break;
        }
      }

      if (project.disbursementHistory) {
        const tx = project.disbursementHistory.find(
          (d) =>
            d.txHash.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q) ||
            (d.vendor && d.vendor.toLowerCase().includes(q))
        );
        if (tx) {
          foundItem = tx;
          foundType = 'vendor';
          foundProject = project;
          break;
        }
      }
    }

    if (foundItem && foundProject) {
      return { item: foundItem, type: foundType, project: foundProject };
    }

    // Return dummy raw data for fallback, following mock data rule (no pre-formatting)
    const today = new Date().toISOString().split('T')[0];
    return {
      item: {
        txHash: q.startsWith('0x') ? q : `0x${q.slice(0, 30)}...`,
        blockNumber: `#184${Math.floor(Math.random() * 900 + 100)}`,
        companyName: `Verichain Verified Query (${q})`,
        sector: 'Audit Transparansi Karbon',
        tCO2e: 12500,
        amountIDR: 3250000000,
        date: today, // Ensure this matches raw domain ISO date
        purchaseDate: today,
        speCertificateId: `SPE-KLHK-${Math.floor(Math.random() * 8999 + 1000)}`,
        verificationStatus: 'Terverifikasi (KLHK On-Chain)',
        auditor: 'Sistem AI dMRV & Verichain Ledger',
        desc: 'Pencarian Hash Transaksi Publik Terverifikasi On-Chain',
      },
      type: 'tokenBuyer',
      project: fallbackProject,
    };
  }
}
