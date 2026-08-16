import { useState } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import {
  FileUp,
  FileText,
  Upload,
  CheckCircle2,
  Download,
  Search,
  X,
  Building2,
  Trees,
  FileSpreadsheet,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { INITIAL_REGULATION_UPLOADS } from '../../../lib/mock/regulator';

export default function RegulatorUploadManagement() {
  const { regulationUploads, addRegulationUpload } = useCarbonStore();
  const docs = regulationUploads?.length > 0 ? regulationUploads : INITIAL_REGULATION_UPLOADS;

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newDoc = {
      id: `DOC-REG-2026-00${docs.length + 1}`,
      ...formData,
      fileName:
        formData.fileName || `DOC_KLHK_DJP_2026_${Math.floor(100 + Math.random() * 900)}.pdf`,
      uploadDate:
        new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ' · 10:00 WIB',
      status: 'published',
    };
    addRegulationUpload(newDoc);
    setIsModalOpen(false);
  };

  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      !searchTerm ||
      d.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.targetEntityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
            OFFICIAL KLHK & DJP REGULATION UPLOAD PORTAL
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Upload Regulasi & Penetapan Kuota Karbon
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Penerbitan SK Penetapan PTBAE-PU, Sertifikat SPE-GRK, & Surat Tagihan Pajak Karbon DJP
            untuk publikasi landing page.
          </p>
        </div>

        {/* Action Button: Upload Document */}
        <button
          onClick={() => openModal('sk_ptbae')}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto active:scale-98"
        >
          <Upload className="w-4 h-4 text-[#00C48C]" />
          Upload Dokumen Regulasi Baru
        </button>
      </div>

      {/* QUICK UPLOAD STREAM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
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
          <button
            onClick={() => openModal('sk_ptbae')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Upload SK Kuota
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
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
          <button
            onClick={() => openModal('spe_grk')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Upload SPE-GRK
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
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
          <button
            onClick={() => openModal('stp_djp')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            Upload Tagihan DJP
          </button>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul dokumen, nama perusahaan, atau file..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500">Filter Kategori:</span>
          {['all', 'sk_ptbae', 'spe_grk', 'stp_djp'].map((cat) => (
            <button
              key={cat}
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
            </button>
          ))}
        </div>
      </div>

      {/* REGULATION DOCUMENTS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-y border-slate-200">
                <th className="py-3 px-4">Judul Dokumen Resmi</th>
                <th className="py-3 px-4">Kategori & Instansi</th>
                <th className="py-3 px-4">Entitas Sasaran</th>
                <th className="py-3 px-4">Tanggal Unggah</th>
                <th className="py-3 px-4">Penandatangan</th>
                <th className="py-3 px-4">Status Publikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 block">
                          {doc.documentTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.fileName} ({doc.fileSize})
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px] border border-slate-200 block w-fit">
                      {doc.categoryLabel}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                      {doc.agencyIssuer}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{doc.targetEntityName}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-semibold">{doc.uploadDate}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-700">{doc.signatoryPerson}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Terpublikasi di Landing Page
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-emerald-600 hover:text-emerald-800 font-extrabold text-xs flex items-center gap-1 ml-auto cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      Unduh PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD REGULATION MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-slide-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Form Upload Dokumen Regulasi KLHK / DJP
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              {/* File Drag & Drop Box */}
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl p-6 text-center space-y-2">
                <FileUp className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-extrabold text-slate-800">
                  Tarik & Lepas Berkas PDF SK / Sertifikat di sini
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Format PDF resmi bertanda tangan digital (Maksimal 15 MB)
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Judul Dokumen Resmi</label>
                <input
                  type="text"
                  required
                  value={formData.documentTitle}
                  onChange={(e) => setFormData({ ...formData, documentTitle: e.target.value })}
                  placeholder="Contoh: SK Penetapan Alokasi Kuota Emisi PTBAE-PU 2026"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kategori Dokumen</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryLabel: e.target.options[e.target.selectedIndex].text,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="sk_ptbae">SK Kuota PTBAE-PU</option>
                    <option value="spe_grk">Sertifikat SPE-GRK</option>
                    <option value="stp_djp">Surat Tagihan Pajak DJP</option>
                    <option value="kth_sk">SK Pengesahan KTH</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Instansi Penerbit</label>
                  <select
                    value={formData.agencyIssuer}
                    onChange={(e) => setFormData({ ...formData, agencyIssuer: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="KLHK & DJP">KLHK & DJP Kemenkeu</option>
                    <option value="KLHK">Kementerian LHK RI</option>
                    <option value="DJP">Direktorat Jenderal Pajak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Entitas / Perusahaan Sasaran
                </label>
                <input
                  type="text"
                  required
                  value={formData.targetEntityName}
                  onChange={(e) => setFormData({ ...formData, targetEntityName: e.target.value })}
                  placeholder="Contoh: PT Semen Nusantara Tuban"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Nama Berkas (PDF)</label>
                <input
                  type="text"
                  required
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  placeholder="Contoh: SK_KLHK_PTBAE_2026_SEMEN_NUSANTARA.pdf"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-primary-gradient text-white font-extrabold shadow-md hover:opacity-95"
                >
                  Publikasikan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
