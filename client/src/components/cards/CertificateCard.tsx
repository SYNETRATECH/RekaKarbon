import {
  Award,
  Download,
  ExternalLink,
  MapPin,
  Sparkles,
  Layers,
  Flame,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatCompactCurrency } from '@/lib/formatters';
import { formatDate } from '@/lib/dates';
import { useState } from 'react';

interface CertificateCardProps {
  cert: {
    id: string;
    certificateNumber: string;
    projectName: string;
    location: string;
    registryStandard: string;
    purchasedVolumeTCO2e: number;
    pricePerTonIDR: number;
    totalPaidIDR: number;
    blockchainTxHash: string;
    coordinates: [number, number];
    projectCondition: {
      lastSpatialAuditDate: string;
      canopyDensityPercent: number;
      carbonSequestrationRate: number;
      kthIncentiveDisbursed: number;
      droneAuditStatus: string;
    };
  };
  onRetireClick?: (cert: any) => void;
}

export default function CertificateCard({ cert, onRetireClick }: CertificateCardProps) {
  const [hasRetired, setHasRetired] = useState(false); // Can be driven by props later if needed

  const handleRetire = async () => {
    if (onRetireClick) {
      onRetireClick(cert);
    }
  };

  return (
    <Card className="overflow-hidden hover:border-emerald-500/50 transition-all relative">
      {hasRetired && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-status-danger-bg flex items-center justify-center mx-auto border border-status-danger-border">
              <Flame className="w-8 h-8 text-status-danger-fg" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Sertifikat Telah Di-Retire</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Sertifikat ini telah dibakar dan dilaporkan.
              </p>
            </div>
          </div>
        </div>
      )}
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
          {!hasRetired && (
            <button
              onClick={handleRetire}
              className="bg-status-danger-bg hover:bg-status-danger-border text-status-danger-fg border border-status-danger-border px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Flame className="w-4 h-4" />
              Bakar (Retire) Token
            </button>
          )}
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
            <Download className="w-4 h-4 text-emerald-600" />
            Unduh PDF
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
              <span className="text-lg font-black text-status-danger-fg">
                {cert.purchasedVolumeTCO2e.toLocaleString('id-ID')} tCO₂e
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

        {/* RIGHT: REAL-TIME SPATIAL PROJECT CONDITION */}
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
                +{cert.projectCondition.carbonSequestrationRate} tCO₂e/ha/tahun
              </span>
              <span className="text-[9px] font-semibold text-blue-600 block mt-0.5">
                Biomassa Tinggi
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-center">
              <span className="text-[9px] font-extrabold text-amber-700 uppercase block">
                Insentif KTH
              </span>
              <span
                className="text-sm font-black text-amber-900 block mt-1 cursor-default"
                title={formatCurrency(cert.projectCondition.kthIncentiveDisbursed)}
              >
                {formatCompactCurrency(cert.projectCondition.kthIncentiveDisbursed)}
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
    </Card>
  );
}
