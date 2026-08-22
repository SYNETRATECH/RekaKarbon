import { useState } from 'react';
import { useLoaderData } from 'react-router';
import RegulationUploadModal from '../../components/modals/RegulationUploadModal';
import {
  FileUp,
  FileText,
  Upload,
  CheckCircle2,
  Download,
  Search,
  Building2,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatFileSize } from '../../lib/formatters';
import { formatDateTime } from '../../lib/dates';

import { regulatorRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';

export async function clientLoader() {
  const regulationUploads = await regulatorRepository.getRegulationUploads().catch(() => []);
  return { regulationUploads };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Unggah Regulasi" rows={3} />;
}

export function meta() {
  return [
    { title: 'Unggah Regulasi & Kebijakan | RekaKarbon' },
    { name: 'description', content: 'Unggah Regulasi & Kebijakan KLHK RekaKarbon' },
  ];
}

export default function RegulatorUploadManagement() {
  const { regulationUploads: initialDocs } = useLoaderData<typeof clientLoader>();
  const [docs, setDocs] = useState<any[]>(initialDocs);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    documentTitle: '',
    category: 'sk_ptbae',
    categoryLabel: 'SK Kuota PTBAE-PU',
    agencyIssuer: 'KLHK & DJP',
    targetEntityName: 'PT Semen Nusantara Tuban',
    signatoryPerson: 'Dr. Ir. Ahmad Fauzi (Direktur Pengawasan KLHK & DJP)',
    fileName: '',
    fileSize: '4.2 MB',
  });

  const openModal = (category = 'sk_ptbae') => {
    let catLabel = 'SK Kuota PTBAE-PU';
    let agency = 'KLHK & DJP';
    if (category === 'spe_grk') {
      catLabel = 'Sertifikat SPE-GRK';
      agency = 'KLHK';
    } else if (category === 'stp_djp') {
      catLabel = 'Surat Tagihan Pajak DJP';
      agency = 'DJP';
    }

    setFormData({
      documentTitle: '',
      category,
      categoryLabel: catLabel,
      agencyIssuer: agency,
      targetEntityName: '',
      signatoryPerson: 'Dr. Ir. Ahmad Fauzi (Direktur Pengawasan KLHK & DJP)',
      fileName: '',
      fileSize: '4.2 MB',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newDoc = {
      id: `REG-${Date.now().toString().slice(-4)}`,
      documentTitle: formData.documentTitle,
      category: formData.category as any,
      categoryLabel: formData.categoryLabel,
      agencyIssuer: formData.agencyIssuer as any,
      targetEntityName: formData.targetEntityName,
      uploadDate: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      signatoryPerson: formData.signatoryPerson || 'Pejabat Pengawasan KLHK',
      status: 'published' as any,
      fileName: formData.fileName || 'Dokumen_Regulasi.pdf',
      fileSize:
        typeof formData.fileSize === 'number'
          ? formData.fileSize
          : Number(formData.fileSize) || 4500000,
    };

    setDocs((prev) => [newDoc, ...prev]);
    setIsModalOpen(false);
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      doc.documentTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.targetEntityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* HEADER TITLE & ACTION BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Upload Regulasi & Penetapan Kuota Karbon
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Penerbitan SK Penetapan PTBAE-PU, Sertifikat SPE-GRK, & Surat Tagihan Pajak Karbon DJP
            untuk publikasi landing page.
          </p>
        </div>

        {/* Action Button: Upload Document */}
        <Button
          onClick={() => openModal('sk_ptbae')}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto active:scale-98"
        >
          <Upload className="w-4 h-4 text-[#00C48C]" />
          Upload Dokumen Regulasi Baru
        </Button>
      </div>

      {/* QUICK UPLOAD STREAM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              KLHK & DJP
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">SK Kuota PTBAE-PU</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Unggah SK Penetapan batas atas emisi karbon tahunan untuk perusahaan industri
              terdaftar.
            </p>
          </div>
          <Button
            onClick={() => openModal('sk_ptbae')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Upload SK Kuota
          </Button>
        </Card>

        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              KLHK
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">Sertifikat SPE-GRK</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Unggah Dokumen Sertifikat Spektrum Pengurangan Emisi Karbon hasil dMRV satelit proyek.
            </p>
          </div>
          <Button
            onClick={() => openModal('spe_grk')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Upload SPE-GRK
          </Button>
        </Card>

        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              DJP KEMENKEU
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">Tagihan Pajak Karbon (STP)</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Terbitkan Surat Tagihan Pajak Karbon untuk perusahaan yang mengalami defisit emisi.
            </p>
          </div>
          <Button
            onClick={() => openModal('stp_djp')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Upload Tagihan DJP
          </Button>
        </Card>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER */}
      <Card className="rounded-2xl p-4 border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul dokumen, nama perusahaan, atau file..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500">Filter Kategori:</span>
          {['all', 'sk_ptbae', 'spe_grk', 'stp_djp'].map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all'
                ? 'Semua'
                : cat === 'sk_ptbae'
                  ? 'SK PTBAE'
                  : cat === 'spe_grk'
                    ? 'SPE-GRK'
                    : 'Pajak DJP'}
            </Button>
          ))}
        </div>
      </Card>

      {/* REGULATION DOCUMENTS TABLE */}
      <Card className="rounded-2xl p-6 border-slate-200 shadow-2xs space-y-4">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="w-full text-left text-xs">
            <TableHeader>
              <TableRow className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-y border-slate-200">
                <TableHead className="py-3 px-3 text-center w-12">No.</TableHead>
                <TableHead className="py-3 px-4">Judul Dokumen Resmi</TableHead>
                <TableHead className="py-3 px-4">Kategori & Instansi</TableHead>
                <TableHead className="py-3 px-4">Entitas Sasaran</TableHead>
                <TableHead className="py-3 px-4">Tanggal Unggah</TableHead>
                <TableHead className="py-3 px-4">Penandatangan</TableHead>
                <TableHead className="py-3 px-4">Status Publikasi</TableHead>
                <TableHead className="py-3 px-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 font-medium">
              {filteredDocs.map((doc, index) => (
                <TableRow key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="py-3.5 px-3 text-center font-mono font-bold text-slate-500 text-xs">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 block truncate max-w-xs">
                          {doc.fileName} ({formatFileSize(doc.fileSize)})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ID: {doc.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold"
                    >
                      {doc.categoryLabel}
                    </Badge>
                    <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                      {doc.agencyIssuer}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 font-bold text-slate-800">
                    {doc.targetEntityName}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-slate-500 font-semibold">
                    {formatDateTime(doc.uploadDate)}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 font-bold text-slate-700">
                    {doc.signatoryPerson}
                  </TableCell>
                  <TableCell className="py-3.5 px-4">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Terpublikasi di Landing Page
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600 hover:text-emerald-800 font-extrabold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* REGULATION UPLOAD MODAL */}
      <RegulationUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
