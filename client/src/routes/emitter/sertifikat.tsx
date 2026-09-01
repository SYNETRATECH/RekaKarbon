import { useLoaderData, useRevalidator } from 'react-router';
import { useState } from 'react';
import { certificateRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import {
  formatCarbon,
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
} from '../../lib/formatters';
import { Award, ShieldCheck, TreePine, Coins } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CertificateCard from '../../components/cards/CertificateCard';
import RetireTokenModal from '../../components/modals/RetireTokenModal';
import type { PurchasedCertificate, RetirementCertificateHistoryItem } from '@/types';
import { ExternalLink, History } from 'lucide-react';
import { getRetirementVerificationUrl } from '@/lib/certificate-verification';

export async function clientLoader() {
  const [certs, retiredCertificates] = await Promise.all([
    certificateRepository.getPurchasedCertificates().catch(() => []),
    certificateRepository.getRetirementHistory().catch(() => []),
  ]);
  return { certs, retiredCertificates };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Sertifikat SPE-GRK" rows={3} />;
}

export function meta() {
  return [
    { title: 'Sertifikat & Proyek | RekaKarbon' },
    { name: 'description', content: 'Sertifikat SPE-GRK dan Proyek Karbon Industri' },
  ];
}

export default function PurchasedCertificatesProjects() {
  const { certs, retiredCertificates } = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const [selectedCertToRetire, setSelectedCertToRetire] = useState<PurchasedCertificate | null>(
    null
  );

  const totalVolume = certs.reduce((acc, c) => acc + c.purchasedVolumeTCO2e, 0);
  const totalValueIDR = certs.reduce(
    (acc, c) => acc + (c.totalPaidIDR || c.purchasedVolumeTCO2e * c.pricePerTonIDR || 0),
    0
  );
  const avgPricePerTon = certs.length
    ? Math.round(certs.reduce((acc, c) => acc + (c.pricePerTonIDR || 0), 0) / certs.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
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
              {retiredCertificates.length} Retirement Tercatat
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
            <h3 className="text-2xl font-black text-emerald-600">{formatCarbon(totalVolume)}</h3>
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
            <h3
              className="text-2xl font-black text-slate-800 cursor-default"
              title={formatCurrency(totalValueIDR)}
            >
              {formatCompactCurrency(totalValueIDR)}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
              Harga Rata-rata {formatCurrency(avgPricePerTon)}/ton
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
            Menampilkan {certs.length} Sertifikat Aktif
          </span>
        </div>

        <div className="space-y-6">
          {certs.map((cert) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              onRetireClick={(c) => setSelectedCertToRetire(c)}
            />
          ))}
        </div>
      </div>

      {retiredCertificates.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Riwayat Sertifikat Retirement</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Token yang sudah dibakar tidak lagi muncul sebagai saldo aktif, tetapi bukti
                retirement tetap tersimpan dan dapat diverifikasi kapan saja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {retiredCertificates.map((certificate) => (
              <RetiredCertificateCard key={certificate.txHash} certificate={certificate} />
            ))}
          </div>
        </div>
      )}

      {selectedCertToRetire && (
        <RetireTokenModal
          cert={selectedCertToRetire}
          onClose={(success) => {
            setSelectedCertToRetire(null);
            if (success) {
              revalidator.revalidate();
            }
          }}
        />
      )}
    </div>
  );
}

function RetiredCertificateCard({
  certificate,
}: {
  certificate: RetirementCertificateHistoryItem;
}) {
  const verificationUrl = getRetirementVerificationUrl(certificate.txHash);

  return (
    <Card className="rounded-2xl border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
            Retirement tercatat
          </span>
          <h4 className="mt-1 break-all font-mono text-sm font-black text-slate-900">
            {certificate.certificateNumber}
          </h4>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">
          RETIRED
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="block font-bold text-slate-400">Volume</span>
          <span className="font-black text-slate-800">
            {formatCarbon(certificate.amountRetired)}
          </span>
        </div>
        <div>
          <span className="block font-bold text-slate-400">Block</span>
          <span className="font-black text-slate-800">{formatNumber(certificate.blockNumber)}</span>
        </div>
      </div>

      <p className="mt-4 break-all font-mono text-[10px] font-semibold text-slate-500">
        {certificate.txHash}
      </p>

      <Button asChild variant="outline" className="mt-4 w-full font-bold text-emerald-800">
        <a href={verificationUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Buka bukti & unduh PDF
        </a>
      </Button>
    </Card>
  );
}
