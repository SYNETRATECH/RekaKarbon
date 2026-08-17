import { useState } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import {
  Award,
  ShieldCheck,
  Download,
  ExternalLink,
  MapPin,
  TreePine,
  Coins,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../../../lib/formatters';
import { formatDate } from '../../../lib/dates';

export default function PurchasedCertificatesProjects() {
  const { purchasedCertificates: certs } = useCarbonStore();

  const [selectedCert] = useState(certs[0]);

  const totalVolume = certs.reduce((acc: number, c: any) => acc + c.purchasedVolumeTCO2e, 0);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <Badge
          variant="outline"
          className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 border-slate-200"
        >
          CARBON CERTIFICATES & ASSETS
        </Badge>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
          Sertifikat & Kondisi Proyek Karbon (Real-Time)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Daftar Sertifikat Karbon (SPE-GRK) terdaftar pada paspor Verichain beserta pemantauan
          kondisi ekosistem proyek secara spasial dan real-time.
        </p>
      </div>

      {/* HERO SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Sertifikat Aktif
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {certs.length} <span className="text-xs font-bold text-slate-500">Berkas</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
              100% Terverifikasi
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00C48C] flex items-center justify-center shrink-0">
            <TreePine className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Karbon Kredit
            </span>
            <h3 className="text-2xl font-black text-emerald-600">
              {totalVolume.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-bold text-slate-500">tCO2e</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
              Offseting Aktif
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Nilai Sertifikat
            </span>
            <h3 className="text-2xl font-black text-slate-800">Rp 8.12 M</h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
              Harga Acuan Rp 650rb/ton
            </span>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 border-slate-200 shadow-2xs flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Konsensus Blockchain
            </span>
            <h3 className="text-sm font-black text-slate-900 mt-1">Verichain Protocol</h3>
            <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
              SPE-GRK & SRN-PPI
            </span>
          </div>
        </Card>
      </div>

      {/* LIST OF PURCHASED CERTIFICATES WITH REAL-TIME CONDITION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">
            Daftar Sertifikat Karbon & Kondisi Proyek Spasial
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Menampilkan {certs.length} Sertifikat Terdaftar
          </span>
        </div>

        <div className="space-y-6">
          {certs.map((cert: any) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden hover:border-emerald-500/50 transition-all space-y-0"
            >
              {/* TOP CERTIFICATE BAR */}
              <div className="bg-slate-50/80 p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#003E29] font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                    <Award className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                        {cert.id}
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        {cert.certificateNumber}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">{cert.projectName}</h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cert.location}</span>
                      <span className="text-slate-300">•</span>
                      <span>{cert.registryStandard}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Unduh Sertifikat PDF
                  </button>
                </div>
              </div>

              {/* MIDDLE BODY: METRICS & REAL-TIME PROJECT CONDITION */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: CERTIFICATE TRANSACTION METRICS */}
                <div className="space-y-4 lg:border-r lg:border-slate-200 lg:pr-6">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Rincian Kepemilikan Token
                  </span>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400 font-bold">Volume Karbon</span>
                      <span className="text-lg font-black text-rose-500">
                        {cert.purchasedVolumeTCO2e.toLocaleString('id-ID')} tCO2e
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400 font-bold">Harga per Ton</span>
                      <span className="text-xs font-extrabold text-slate-800">
                        Rp {cert.pricePerTonIDR.toLocaleString('id-ID')}/ton
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-200 pt-2">
                      <span className="text-xs text-slate-400 font-bold">Total Pembayaran</span>
                      <span className="text-sm font-black text-emerald-700">
                        {formatCurrency(cert.totalPaidIDR)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-semibold space-y-1">
                    <span className="block text-slate-400 font-bold text-[10px] uppercase">
                      Verichain Passport Contract
                    </span>
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-600 truncate flex items-center justify-between">
                      <span className="truncate">{cert.blockchainTxHash}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                    </div>
                  </div>
                </div>

                {/* RIGHT: REAL-TIME SPATIAL PROJECT CONDITION (LIKE LANDING PAGE) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">
                        Kondisi Proyek Real-Time (CHM Spasial & dMRV Satelit)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      Audit Terakhir: {formatDate(cert.projectCondition.lastSpatialAuditDate)}
                    </span>
                  </div>

                  {/* 4 SPATIAL MONITORING PILLS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-extrabold text-emerald-700 uppercase block">
                        Kerapatan Kanopi
                      </span>
                      <span className="text-lg font-black text-emerald-900 block mt-0.5">
                        {cert.projectCondition.canopyDensityPercent}%
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 block mt-0.5">
                        Hutan Sehat CHM
                      </span>
                    </div>

                    <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-extrabold text-blue-700 uppercase block">
                        Laju Penyerapan
                      </span>
                      <span className="text-sm font-black text-blue-900 block mt-1">
                        +{cert.projectCondition.carbonSequestrationRate} tCO2e/ha/thn
                      </span>
                      <span className="text-[9px] font-semibold text-blue-600 block mt-0.5">
                        Biomassa Tinggi
                      </span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-extrabold text-amber-700 uppercase block">
                        Insentif KTH
                      </span>
                      <span className="text-sm font-black text-amber-900 block mt-1">
                        {formatCurrency(cert.projectCondition.kthIncentiveDisbursed)}
                      </span>
                      <span className="text-[9px] font-semibold text-amber-600 block mt-0.5">
                        Disalurkan 100%
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase block">
                        Audit AI Drone
                      </span>
                      <span className="text-xs font-black text-slate-800 block mt-1">
                        {cert.projectCondition.droneAuditStatus}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 block mt-0.5">
                        Verichain Validated
                      </span>
                    </div>
                  </div>

                  {/* SPATIAL MAP LOCATION CARD PREVIEW */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-[#00C48C] flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
                          Koordinat Spasial Satelit
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                          {cert.coordinates[0]}, {cert.coordinates[1]} ({cert.location})
                        </p>
                      </div>
                    </div>

                    <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                      Pantau di Peta Spasial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
