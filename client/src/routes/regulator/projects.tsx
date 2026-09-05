import { useState } from 'react';
import { useNavigate, useLoaderData, useRevalidator } from 'react-router';
import ProjectProgressModal from '../../components/modals/ProjectProgressModal';
import DroneAuditModal from '../../components/modals/DroneAuditModal';
import TransactionReceiptModal from '../../components/modals/TransactionReceiptModal';
import type { ForestProjectItem } from '../../types';
import {
  TreePine,
  Edit2,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Activity,
  FileText,
  Eye,
  Coins,
} from 'lucide-react';
import { formatCurrency, parseNumeric } from '../../lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

import { regulatorRepository, projectRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { useToast } from '../../hooks/use-toast';

export async function clientLoader() {
  const [forestProjects, projects] = await Promise.all([
    regulatorRepository.getForestProjects().catch(() => []),
    projectRepository.getProjects().catch(() => []),
  ]);
  return { forestProjects, projects };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Manajemen Proyek Kehutanan" rows={3} />;
}

export function meta() {
  return [
    { title: 'Manajemen Proyek Kehutanan | RekaKarbon' },
    { name: 'description', content: 'Manajemen Proyek Kehutanan Regulasi KLHK' },
  ];
}

export default function ForestProjectsManagement() {
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const { toast } = useToast();
  const { forestProjects: projects, projects: landingProjects } =
    useLoaderData<typeof clientLoader>();

  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [selectedProgressProject, setSelectedProgressProject] = useState<any>(null);
  const [mintingProjectId, setMintingProjectId] = useState<string | null>(null);

  const openCreatePage = () => {
    navigate('/project-editor');
  };

  const openEditPage = (prj: any) => {
    navigate('/project-editor', { state: { project: prj } });
  };

  const mintForestProjectSpe = async (project: ForestProjectItem) => {
    if (project.speMinted || project.actualSequestrationTCO2e <= 0) return;
    if (
      !window.confirm(
        `Terbitkan SPE-GRK untuk proyek "${project.projectName}" berdasarkan ${project.actualSequestrationTCO2e.toLocaleString('id-ID')} tCO₂e terverifikasi?`
      )
    ) {
      return;
    }

    setMintingProjectId(project.id);
    try {
      const result = await regulatorRepository.mintForestProjectSpe(project.id);
      toast({
        title: 'SPE-GRK berhasil diterbitkan',
        description: `${result.speCertificateId} tercatat pada blockchain dengan transaksi ${result.mintTxHash.slice(0, 12)}…`,
        className: 'border-none bg-emerald-600 text-white',
      });
      await revalidate();
    } catch (error) {
      toast({
        title: 'Penerbitan SPE-GRK gagal',
        description:
          error instanceof Error ? error.message : 'Terjadi kesalahan pada penerbitan token.',
        variant: 'destructive',
      });
    } finally {
      setMintingProjectId(null);
    }
  };

  const filteredProjects = projects.filter(
    (p: any) =>
      !searchTerm ||
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.assignedKTH.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectProgressData = (prj: ForestProjectItem) => {
    const pct = Math.min(
      100,
      Math.round((prj.actualSequestrationTCO2e / (prj.targetSequestrationTCO2e || 1)) * 100)
    );

    const detail = prj.progressDetail;
    const stages = detail?.stages || [
      {
        year: 1,
        title: 'Tahun 1: Pembibitan & Persiapan Lahan Kritis',
        milestone: 'Pengadaan 40.000 bibit & pembukaan alur drainase pasang surut.',
        status: 'completed' as const,
        canopyDensity: 32,
        gsd: 2.5,
        kthName: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        farmerIncentiveIDR: 350000000,
        incentiveStatus: 'Telah Disalurkan (dMRV Verified)',
        speCreditMinted: 1200,
        speStatus: 'Terbit (Minted)',
        plantedTrees: 40000,
        targetTrees: 40000,
        remainingTrees: 0,
      },
    ];

    const tokenBuyers = detail?.tokenBuyers || [];
    const disbursementHistory = detail?.disbursementHistory || [];

    const totalBudgetVal = parseNumeric(prj.fundingBudgetIDR) || 4500000000;
    const raisedBudgetVal =
      detail?.disbursedBudgetIDR ||
      Math.round(totalBudgetVal * (pct > 0 ? Math.min(0.95, (pct / 100) * 0.75 + 0.15) : 0.62));
    const fundingPct = Math.min(100, Math.round((raisedBudgetVal / totalBudgetVal) * 100));

    return {
      pct,
      plantedTrees: Math.floor(pct * 1500),
      targetTrees: 150000,
      survivalRate: detail?.survivalRatePercent ? `${detail.survivalRatePercent}%` : '87.5%',
      canopyHeight: detail?.canopyHeightMeters ? `${detail.canopyHeightMeters} m` : '1.85 m',
      ndviScore: detail?.ndviScore ? String(detail.ndviScore) : '0.84',
      stages,
      tokenBuyers,
      disbursementHistory,
      raisedBudgetVal,
      totalBudgetVal,
      fundingPct,
      raisedBudgetFormatted: formatCurrency(raisedBudgetVal),
      totalBudgetFormatted: formatCurrency(totalBudgetVal),
    };
  };

  // Trigger Drone Video Audit Modal (Landing Page)
  const _handleOpenLandingDroneModal = (prj: any, stageObj: any = null) => {
    const matchedLandingProj = landingProjects?.find(
      (p: any) =>
        p.name.toLowerCase().includes(prj.projectName.toLowerCase()) ||
        prj.projectName.toLowerCase().includes(p.name.toLowerCase())
    ) || {
      id: prj.id,
      name: prj.projectName,
      region: prj.location,
      area: '15.000 ha',
      carbon: `${(prj.targetSequestrationTCO2e / 1000).toFixed(1)}K tCO₂e`,
      plantedTrees: 124000,
      targetTrees: 150000,
      canopyHeight: 1.85,
      evi: 0.61,
      ndvi: 0.84,
      currentYear: 3,
      bufferAllocated: 0.08,
      bufferUsed: 0.0,
      reforestationStatus: 'Sangat Baik',
      totalBudget: 4500000000,
      disbursedBudget: 2800000000,
      remainingBudget: 1700000000,
      tokenBuyers: getProjectProgressData(prj).tokenBuyers,
      disbursementHistory: getProjectProgressData(prj).disbursementHistory,
      stages: getProjectProgressData(prj).stages,
    };

    const targetStage = stageObj || matchedLandingProj.stages[2] || matchedLandingProj.stages[0];

    setSelectedStage({
      project: matchedLandingProj,
      stage: targetStage,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Manajemen & Monitoring Proyek Kehutanan
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola pendaftaran proyek kehutanan nasional, pemantauan progress serapan real-time
            (dMRV), serta transparansi dana & pembeli token.
          </p>
        </div>

        {/* Action Button: Add New Project */}
        <button
          onClick={openCreatePage}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto active:scale-98"
        >
          <Plus className="w-4 h-4 text-[#00C48C]" />
          Tambah Proyek Kehutanan Baru
        </button>
      </div>

      {/* SEARCH BAR & FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama proyek, lokasi, atau KTH..."
            className="pl-10 pr-4 h-9 text-xs rounded-xl"
          />
        </div>
        <span className="text-xs font-extrabold text-slate-400">
          Total Proyek: {filteredProjects.length}
        </span>
      </div>

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Kode ID</TableHead>
              <TableHead>Nama Proyek Kehutanan</TableHead>
              <TableHead>Kategori Hutan</TableHead>
              <TableHead>KTH Penanggung Jawab</TableHead>
              <TableHead>Target vs Realisasi Serapan</TableHead>
              <TableHead>Anggaran Pendanaan</TableHead>
              <TableHead>Status dMRV</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((prj: any, index: number) => {
              const progressData = getProjectProgressData(prj);
              return (
                <TableRow key={prj.id}>
                  <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-mono font-black text-slate-900">{prj.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TreePine className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 block">
                          {prj.projectName}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          {prj.location}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px] border border-slate-200">
                      {prj.categoryLabel}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">{prj.assignedKTH}</TableCell>
                  <TableCell>
                    <div>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-black text-emerald-600 block">
                          {prj.actualSequestrationTCO2e.toLocaleString('id-ID')} /{' '}
                          {prj.targetSequestrationTCO2e.toLocaleString('id-ID')} tCO₂e
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700">
                          {progressData.pct}%
                        </span>
                      </div>
                      <Progress value={progressData.pct} className="mt-1" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-black text-slate-900">
                    {formatCurrency(prj.fundingBudgetIDR)}
                  </TableCell>
                  <TableCell>
                    {prj.dMRVStatus === 'verified' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terverifikasi dMRV
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Dalam Audit AI
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {prj.dMRVStatus === 'verified' && prj.speMinted ? (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
                          SPE-GRK Terbit
                        </span>
                      ) : prj.dMRVStatus === 'verified' ? (
                        <button
                          onClick={() => mintForestProjectSpe(prj as ForestProjectItem)}
                          disabled={
                            mintingProjectId === prj.id || prj.actualSequestrationTCO2e <= 0
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2 py-1.5 text-[10px] font-extrabold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          title={
                            prj.actualSequestrationTCO2e > 0
                              ? 'Terbitkan SPE-GRK ke wallet Regulator'
                              : 'Belum ada volume serapan terverifikasi'
                          }
                        >
                          <Coins className="h-3.5 w-3.5" />
                          {mintingProjectId === prj.id ? 'Memproses…' : 'Terbitkan SPE-GRK'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => openEditPage(prj)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        title="Lihat Detail Transaksi Blockchain & Pembeli"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedProgressProject(prj)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        title="Lihat Progress & Pembeli"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => openEditPage(prj)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="Edit Proyek Kehutanan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* MODAL PROGRESS PROYEK & TRANSPARANSI DANA ON-CHAIN */}
      <ProjectProgressModal
        project={selectedProgressProject}
        onClose={() => setSelectedProgressProject(null)}
        getProjectProgressData={getProjectProgressData}
      />

      <DroneAuditModal selectedStage={selectedStage} onClose={() => setSelectedStage(null)} />
      <TransactionReceiptModal selectedTx={selectedTx} onClose={() => setSelectedTx(null)} />

      <Dialog open={!!downloadNotice} onOpenChange={(open) => !open && setDownloadNotice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Pengunduhan Berkas Resmi</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Berkas <span className="font-mono font-bold text-slate-900">{downloadNotice}</span>{' '}
              sedang diunduh dan diproses dari repository publik RekaKarbon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDownloadNotice(null)}
              className="w-full bg-primary-gradient text-white font-extrabold"
            >
              Tutup & Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
