import { useState } from 'react';
import { useCarbonStore } from '../../store/useCarbonStore';
import {
  TreePine,
  Edit2,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  ShieldCheck,
  Search,
  Activity,
  FileText,
  Download,
  Users,
  Eye,
  Wallet,
  Building2,
} from 'lucide-react';
import { formatCurrency, formatFileSize, parseNumeric } from '../../lib/formatters';
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

export function meta() {
  return [
    { title: 'Manajemen Proyek Kehutanan | RekaKarbon' },
    { name: 'description', content: 'Manajemen Proyek Kehutanan Regulasi KLHK' },
  ];
}

export default function ForestProjectsManagement() {
  const {
    forestProjects: projects,
    projects: landingProjects,
    setEditingProjectData,
    setAdminActiveTab,
    setSelectedStage,
    setSelectedTx,
  } = useCarbonStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [selectedProgressProject, setSelectedProgressProject] = useState<any>(null);
  const [blockchainSubTab, setBlockchainSubTab] = useState<'buyers' | 'vendors'>('buyers');

  const openCreatePage = () => {
    setEditingProjectData(null);
    setAdminActiveTab('project-editor');
  };

  const openEditPage = (prj: any) => {
    setEditingProjectData(prj);
    setAdminActiveTab('project-editor');
  };

  const filteredProjects = projects.filter(
    (p: any) =>
      !searchTerm ||
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.assignedKTH.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectProgressData = (prj: any) => {
    const pct = Math.min(
      100,
      Math.round((prj.actualSequestrationTCO2e / prj.targetSequestrationTCO2e) * 100)
    );
    const plantedTrees = Math.floor(pct * 1500);
    const targetTrees = 150000;

    const stages = [
      {
        year: 1,
        title: 'Tahun 1: Pembibitan & Persiapan Lahan Kritis',
        milestone: 'Pengadaan 40.000 bibit & pembukaan alur drainase pasang surut.',
        status: 'completed',
        canopyDensity: 32,
        gsd: 2.5,
        kthName: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        farmerIncentive: 350000000,
        incentiveStatus: 'Telah Disalurkan (dMRV Verified)',
        speCreditMinted: 1200,
        speStatus: 'Terbit (Minted)',
        plantedTrees: 40000,
        targetTrees: 40000,
        remainingTrees: 0,
      },
      {
        year: 2,
        title: 'Tahun 2: Penanaman Fisik & Pemasangan Sensor IoT',
        milestone: 'Penanaman bibit tahap utama & pemasangan 12 pasang node sensor kelembaban.',
        status: 'completed',
        canopyDensity: 58,
        gsd: 2.5,
        kthName: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        farmerIncentive: 650000000,
        incentiveStatus: 'Telah Disalurkan (dMRV Verified)',
        speCreditMinted: 3500,
        speStatus: 'Terbit (Minted)',
        plantedTrees: 84000,
        targetTrees: 84000,
        remainingTrees: 0,
      },
      {
        year: 3,
        title: 'Tahun 3: Monitoring Drone LiDAR & Verifikasi dMRV AI',
        milestone: 'Pemindaian drone berkala, verifikasi AI canopy height >1.5m, & audit serapan.',
        status: 'ongoing',
        canopyDensity: 84,
        gsd: 2.5,
        kthName: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        farmerIncentive: 500000000,
        incentiveStatus: 'Proses Inspek (Ongoing)',
        speCreditMinted: 4200,
        speStatus: 'Proses Verifikasi AI',
        plantedTrees: plantedTrees,
        targetTrees: targetTrees,
        remainingTrees: 26000,
      },
      {
        year: 4,
        title: 'Tahun 4: Penerbitan Sertifikat SPE-GRK & Monetisasi Karbon',
        milestone: 'Penerbitan sertifikat SPE-GRK nasional & integrasi bursa karbon.',
        status: 'upcoming',
        canopyDensity: 0,
        gsd: 2.5,
        kthName: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        farmerIncentive: 400000000,
        incentiveStatus: 'Alokasi Mendatang',
        speCreditMinted: 6100,
        speStatus: 'Mendatang',
        plantedTrees: 0,
        targetTrees: targetTrees,
        remainingTrees: targetTrees,
      },
    ];

    const tokenBuyers = [
      {
        id: 'tb-01',
        companyName: 'PT Semen Nusantara Tuban',
        tCO2e: 4500,
        sector: 'Semen & Manufaktur',
        speCertificateId: 'SPE-GRK-2026-0891',
        txHash: '0x9b1a8f2c0091e4a5d8b7...',
        date: '12 Jul 2025',
      },
      {
        id: 'tb-02',
        companyName: 'PT Pertamina Power Indonesia',
        tCO2e: 3200,
        sector: 'Energi & Petrokimia',
        speCertificateId: 'SPE-GRK-2026-0892',
        txHash: '0x3f7a1c8901b2c3d4e5f6...',
        date: '04 Jun 2025',
      },
      {
        id: 'tb-03',
        companyName: 'PT PLN Nusantara Power',
        tCO2e: 2800,
        sector: 'Ketenagalistrikan PLTU',
        speCertificateId: 'SPE-GRK-2026-0893',
        txHash: '0x7e2d1c0b9a8f7e6d5c4...',
        date: '18 Mei 2025',
      },
      {
        id: 'tb-04',
        companyName: 'PT Vale Indonesia Tbk',
        tCO2e: 1900,
        sector: 'Pertambangan Nikel',
        speCertificateId: 'SPE-GRK-2026-0894',
        txHash: '0x1a2b3c4d5e6f7a8b9c0...',
        date: '02 Apr 2025',
      },
    ];

    const disbursementHistory = [
      {
        id: 'tx-01',
        date: '14 Jul 2025',
        amount: 650000000,
        category: 'Pemeliharaan & Insentif Tanam',
        desc: 'Insentif Tanam & Pemeliharaan KTH Mangrove Tuban (24 Anggota)',
        txHash: '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c',
        blockNumber: '#184920',
        vendor: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        status: 'Tercairkan via Smart Contract',
        items: [
          {
            name: 'Insentif Tanam & Pemeliharaan KTH (24 Anggota)',
            qty: '24 Orang',
            price: 20000000,
            total: 480000000,
          },
          {
            name: 'Pengadaan Pupuk Bio-Fertilizer Organik',
            qty: '400 Karung',
            price: 250000,
            total: 100000000,
          },
          {
            name: 'Operasional Alat Penyiangan & Parang Gulma',
            qty: '24 Paket',
            price: 2916666,
            total: 70000000,
          },
        ],
        proofImages: [
          'https://images.unsplash.com/photo-1592417817098-8f3d6eb147fc?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop',
        ],
      },
      {
        id: 'tx-02',
        date: '28 Jun 2025',
        amount: 850000000,
        category: 'Monitoring Drone & Sensor',
        desc: 'Sewa UAV LiDAR & pemindaian orthophoto udara dMRV',
        txHash: '0x3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
        blockNumber: '#183712',
        vendor: 'PT Aero Mapping Indonesia',
        status: 'Tercairkan via Smart Contract',
        items: [
          {
            name: 'Sewa Drone VTOL LiDAR Multiterrain (5 Hari)',
            qty: '5 Hari',
            price: 100000000,
            total: 500000000,
          },
          {
            name: 'Jasa Pengolahan Citra dMRV & Model Canopy Height (CHM)',
            qty: '1 Paket',
            price: 200000000,
            total: 200000000,
          },
          {
            name: 'Honor Pilot Drone Sertifikasi FASI & Surveyor GIS',
            qty: '5 Orang',
            price: 30000000,
            total: 150000000,
          },
        ],
        proofImages: [
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop',
        ],
      },
      {
        id: 'tx-03',
        date: '15 Mei 2025',
        amount: 450000000,
        category: 'Pembibitan & Pupuk Organik',
        desc: 'Pengadaan 40.000 bibit mangrove unggul & bio-fertilizer',
        txHash: '0x5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0',
        blockNumber: '#181204',
        vendor: 'CV Tani Makmur Agro Tuban',
        status: 'Tercairkan via Smart Contract',
        items: [
          {
            name: 'Bibit Mangrove Rhizophora Mucronata >40cm',
            qty: '40.000 Batang',
            price: 10000,
            total: 400000000,
          },
          {
            name: 'Polybag & Bambu Ajir Penyangga',
            qty: '40.000 Set',
            price: 1250,
            total: 50000000,
          },
        ],
        proofImages: [
          'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1592417817098-8f3d6eb147fc?w=600&auto=format&fit=crop',
        ],
      },
      {
        id: 'tx-04',
        date: '10 Apr 2025',
        amount: 850000000,
        category: 'Restorasi Fisik Lahan',
        desc: 'Pembersihan alur pasang surut & pemasangan pemecah gelombang bambu',
        txHash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4',
        blockNumber: '#179450',
        vendor: prj.assignedKTH || 'KTH Mangrove Tuban Mandiri',
        status: 'Tercairkan via Smart Contract',
        items: [
          {
            name: 'Konstruksi Pemecah Gelombang Bambu (Alat Pemecah Ombak)',
            qty: '1.200 Meter',
            price: 500000,
            total: 600000000,
          },
          {
            name: 'Pembersihan Alur Sedimen Pasang Surut & Trash Trap',
            qty: '1 Paket',
            price: 250000000,
            total: 250000000,
          },
        ],
        proofImages: [
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop',
        ],
      },
    ];

    const totalBudgetVal = parseNumeric(prj.fundingBudgetIDR) || 4500000000;
    const raisedBudgetVal = Math.round(
      totalBudgetVal * (pct > 0 ? Math.min(0.95, (pct / 100) * 0.75 + 0.15) : 0.62)
    );
    const fundingPct = Math.min(100, Math.round((raisedBudgetVal / totalBudgetVal) * 100));

    const raisedBudgetFormatted = formatCurrency(raisedBudgetVal);
    const totalBudgetFormatted = formatCurrency(totalBudgetVal);

    return {
      pct,
      plantedTrees,
      targetTrees,
      survivalRate: '87.5%',
      canopyHeight: '1.85 m',
      ndviScore: '0.84',
      stages,
      tokenBuyers,
      disbursementHistory,
      raisedBudgetVal,
      totalBudgetVal,
      fundingPct,
      raisedBudgetFormatted,
      totalBudgetFormatted,
    };
  };

  // Trigger Drone Video Audit Modal (Landing Page)
  const handleOpenLandingDroneModal = (prj: any, stageObj: any = null) => {
    const matchedLandingProj = landingProjects?.find(
      (p: any) =>
        p.name.toLowerCase().includes(prj.projectName.toLowerCase()) ||
        prj.projectName.toLowerCase().includes(p.name.toLowerCase())
    ) || {
      id: prj.id,
      name: prj.projectName,
      region: prj.location,
      area: '15.0K Ha',
      carbon: `${(prj.targetSequestrationTCO2e / 1000).toFixed(1)}K tCO2e`,
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
          <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
            FORESTRY PROJECTS MANAGEMENT & MONITORING
          </span>
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
            {filteredProjects.map((prj: any) => {
              const progressData = getProjectProgressData(prj);
              return (
                <TableRow key={prj.id}>
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
                          {prj.targetSequestrationTCO2e.toLocaleString('id-ID')} tCO2e
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700">
                          {progressData.pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-primary-gradient h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progressData.pct}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-black text-slate-900">
                    {formatCurrency(prj.fundingBudgetIDR)}
                  </TableCell>
                  <TableCell>
                    {prj.verificationStatus === 'verified' ? (
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
                  <TableCell className="text-right space-x-2">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* MODAL PROGRESS PROYEK & TRANSPARANSI DANA ON-CHAIN */}
      {selectedProgressProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in text-left">
            {/* Modal Header (Fixed Sticky at Top) */}
            <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 shrink-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {selectedProgressProject.categoryLabel}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#00C48C]" />
                    dMRV Verified
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1.5">
                  {selectedProgressProject.projectName}
                </h3>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedProgressProject.location} • Penanggung Jawab:{' '}
                  <span className="text-slate-800 font-extrabold">
                    {selectedProgressProject.assignedKTH}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProgressProject(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body (Scrolls below header) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* Top Metrics Cards */}
              {(() => {
                const progData = getProjectProgressData(selectedProgressProject);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">
                        Realisasi Serapan
                      </span>
                      <p className="text-lg font-black text-slate-900 mt-1">
                        {selectedProgressProject.actualSequestrationTCO2e.toLocaleString('id-ID')}{' '}
                        <span className="text-xs text-slate-500 font-bold">tCO2e</span>
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                        Target:{' '}
                        {selectedProgressProject.targetSequestrationTCO2e.toLocaleString('id-ID')}{' '}
                        tCO2e ({progData.pct}%)
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Bibit Hutan Tertanam
                      </span>
                      <p className="text-lg font-black text-slate-900 mt-1">
                        {progData.plantedTrees.toLocaleString('id-ID')}{' '}
                        <span className="text-xs text-slate-500 font-bold">Pohon</span>
                      </p>
                      <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                        Tingkat Kelangsungan: {progData.survivalRate}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Kesehatan Kanopi (NDVI)
                      </span>
                      <p className="text-lg font-black text-emerald-600 mt-1">
                        {progData.ndviScore}{' '}
                        <span className="text-xs text-slate-500 font-bold">NDVI</span>
                      </p>
                      <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                        Tinggi Pohon: {progData.canopyHeight}
                      </span>
                    </div>

                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                        Total Anggaran Proyek
                      </span>
                      <p className="text-base font-black text-emerald-400 mt-1">
                        {formatCurrency(selectedProgressProject.fundingBudgetIDR)}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-200 block mt-0.5">
                        Tercairkan: Rp 2.800.000.000
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* FILE LAPORAN ANGGARAN ATTACHMENT CARD */}
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                    <FileText className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {selectedProgressProject.budgetReportFileName ||
                        'LAPORAN_ANGGARAN_TUBAN_2026.pdf'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Dokumen Laporan Alokasi & Pengawasan Anggaran Proyek (
                      {formatFileSize(selectedProgressProject.budgetReportFileSize || 4718592)})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setDownloadNotice(
                      selectedProgressProject.budgetReportFileName ||
                        'LAPORAN_ANGGARAN_TUBAN_2026.pdf'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  Unduh Berkas PDF
                </button>
              </div>

              {/* TIMELINE REBOISASI TAHUNAN (STAGE PROGRESS) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    PROGRESS REBOISASI TAHUNAN & MILESTONE dMRV
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400">
                    Klik stage untuk membuka pemutar video drone live
                  </span>
                </div>

                <div className="relative pl-6 space-y-3 border-l-2 border-slate-200 ml-3">
                  {getProjectProgressData(selectedProgressProject).stages.map((stage: any) => {
                    const isCompleted = stage.status === 'completed';
                    const isOngoing = stage.status === 'ongoing';
                    return (
                      <div
                        key={stage.year}
                        onClick={() => handleOpenLandingDroneModal(selectedProgressProject, stage)}
                        className="relative group cursor-pointer bg-slate-50 hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs"
                      >
                        {/* Milestone Badge Icon */}
                        <span
                          className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : isOngoing
                                ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                                : 'bg-slate-100 border-slate-300'
                          }`}
                        >
                          {isOngoing && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                          )}
                        </span>

                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                className={`font-black text-xs ${isCompleted ? 'text-slate-800' : isOngoing ? 'text-emerald-900 font-black' : 'text-slate-400'}`}
                              >
                                {stage.title}
                              </h4>
                              {isCompleted && (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                                  Selesai
                                </span>
                              )}
                              {isOngoing && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase animate-pulse">
                                  Ongoing dMRV Scan
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                              {stage.milestone}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-2.5 mt-2.5 text-[10px]">
                          <div>
                            <span className="text-slate-400 font-bold block">Bibit Tertanam:</span>
                            <span className="font-extrabold text-slate-800">
                              {stage.plantedTrees.toLocaleString('id-ID')} Pohon
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Insentif KTH:</span>
                            <span className="font-extrabold text-emerald-600">
                              Rp {(stage.farmerIncentive / 1000000).toFixed(0)} Juta
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Sertifikat SPE:</span>
                            <span className="font-extrabold text-slate-800">
                              +{stage.speCreditMinted} tCO2e
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TRANSPARANSI BLOCKCHAIN ON-CHAIN & USAGE OF FUNDS */}
              {(() => {
                const progData = getProjectProgressData(selectedProgressProject);
                return (
                  <div className="border-t border-slate-200/60 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        TRANSPARANSI BLOCKCHAIN ON-CHAIN & PENGGUNAAN DANA
                      </span>
                      <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00C48C]" />
                        Hyperledger Besu Ledger
                      </span>
                    </div>

                    {/* Overview Budget Card with Multi-Color Progress Bar Chart */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase">
                            Total Anggaran Restorasi
                          </span>
                          <h4 className="text-base font-black text-emerald-400">
                            {formatCurrency(selectedProgressProject.fundingBudgetIDR)}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 block">
                            Status Pencairan
                          </span>
                          <span className="text-xs font-black text-emerald-300">
                            62% Tercairkan
                          </span>
                        </div>
                      </div>

                      {/* Multi-Color Budget Chart Bar (Terpakai vs Belum) */}
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex border border-slate-700">
                          <div
                            className="bg-emerald-500 h-3"
                            style={{ width: '62%' }}
                            title="Restorasi & Penanaman (62%)"
                          ></div>
                          <div
                            className="bg-emerald-700 h-3"
                            style={{ width: '15%' }}
                            title="Pemeliharaan (15%)"
                          ></div>
                          <div
                            className="bg-sky-500 h-3"
                            style={{ width: '10%' }}
                            title="Monitoring Drone (10%)"
                          ></div>
                          <div
                            className="bg-amber-500 h-3"
                            style={{ width: '8%' }}
                            title="Buffer Risiko (8%)"
                          ></div>
                          <div
                            className="bg-purple-500 h-3"
                            style={{ width: '5%' }}
                            title="API Integrasi (5%)"
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-300 font-mono font-bold">
                          <span>Tercairkan: Rp 2.800.000.000</span>
                          <span className="text-amber-300">
                            Sisa Belum Pencairan: Rp 1.700.000.000
                          </span>
                        </div>
                      </div>

                      {/* Chart Legend */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-800 text-[9px] font-semibold text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          Restorasi (62%)
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-700 shrink-0"></span>
                          Pemeliharaan (15%)
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                          Monitoring (10%)
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>Buffer
                          Risiko (8%)
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                          Sistem API (5%)
                        </div>
                      </div>
                    </div>

                    {/* Sub-Tab Navigation Switch */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                      <button
                        onClick={() => setBlockchainSubTab('buyers')}
                        className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          blockchainSubTab === 'buyers'
                            ? 'bg-white text-[var(--color-primary)] shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-[#00C48C]" />
                        Pembeli Token Karbon ({progData.tokenBuyers.length})
                      </button>
                      <button
                        onClick={() => setBlockchainSubTab('vendors')}
                        className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          blockchainSubTab === 'vendors'
                            ? 'bg-white text-[var(--color-primary)] shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                        Bukti Penggunaan Dana Vendor & KTH ({progData.disbursementHistory.length})
                      </button>
                    </div>

                    {/* TAB 1: PEMBELI TOKEN KARBON (TOKEN BUYERS) */}
                    {blockchainSubTab === 'buyers' && (
                      <div className="space-y-2.5">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nama Perusahaan / Entitas</TableHead>
                              <TableHead>Sektor Industri</TableHead>
                              <TableHead>Volume Pembelian</TableHead>
                              <TableHead>No. Sertifikat SPE-GRK</TableHead>
                              <TableHead>Tanggal Tx</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {progData.tokenBuyers.map((tb: any) => (
                              <TableRow key={tb.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="font-extrabold text-slate-900 block">
                                      {tb.companyName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-slate-600 font-semibold">
                                  {tb.sector}
                                </TableCell>
                                <TableCell className="font-black text-emerald-600 font-mono">
                                  +{tb.tCO2e.toLocaleString('id-ID')} tCO2e
                                </TableCell>
                                <TableCell className="font-mono text-[10px] font-bold text-slate-700">
                                  {tb.speCertificateId}
                                </TableCell>
                                <TableCell className="text-slate-400 text-[10px]">
                                  {tb.date}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* TAB 2: BUKTI PENGGUNAAN DANA (ALIRAN DANA & VENDOR DISBURSEMENT PROOFS) */}
                    {blockchainSubTab === 'vendors' && (
                      <div className="space-y-2.5">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Penerima Dana (Vendor / KTH)</TableHead>
                              <TableHead>Kategori & Deskripsi Penggunaan</TableHead>
                              <TableHead>Jumlah IDR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {progData.disbursementHistory.map((tx: any) => {
                              const displayAmount =
                                typeof tx.amount === 'number'
                                  ? `Rp ${tx.amount.toLocaleString('id-ID')}`
                                  : typeof tx.amount === 'string' && tx.amount.startsWith('Rp')
                                    ? tx.amount
                                    : `Rp ${Number(tx.amount || 0).toLocaleString('id-ID')}`;
                              return (
                                <TableRow key={tx.id}>
                                  <TableCell className="font-mono text-slate-500 text-[10px]">
                                    {tx.date}
                                  </TableCell>
                                  <TableCell className="font-extrabold text-slate-900">
                                    {tx.vendor}
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-bold text-slate-800 block">
                                      {tx.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      {tx.desc}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-mono font-black text-emerald-700">
                                    {displayAmount}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>

                        {/* GALERI BUKTI FISIK LAPANGAN & NOTA */}
                        <div className="pt-3 border-t border-slate-200/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              GALERI BUKTI FISIK LAPANGAN & NOTA DISBURSEMENT
                            </span>
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Terverifikasi On-Chain
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {progData.disbursementHistory
                              .flatMap((tx: any) =>
                                (tx.proofImages || []).map((imgUrl: string, i: number) => ({
                                  imgUrl,
                                  tx,
                                  key: `${tx.id}-${i}`,
                                }))
                              )
                              .map((item: any) => (
                                <div
                                  key={item.key}
                                  onClick={() =>
                                    setSelectedTx({
                                      project: {
                                        name: selectedProgressProject.projectName,
                                        region: selectedProgressProject.location,
                                        totalBudget: 4500000000,
                                        reforestationPartner: selectedProgressProject.assignedKTH,
                                      },
                                      tx: item.tx,
                                    })
                                  }
                                  className="relative h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group cursor-pointer"
                                >
                                  <img
                                    src={item.imgUrl}
                                    alt="Bukti Fisik"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                    <Eye className="w-3.5 h-3.5 text-[#00C48C]" /> Perbesar
                                  </div>
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono truncate max-w-[90%]">
                                    {item.tx.vendor}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

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
