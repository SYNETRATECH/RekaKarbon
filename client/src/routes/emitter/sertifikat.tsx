import { useLoaderData, useRevalidator } from 'react-router';
import { useState } from 'react';
import { certificateRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { formatCurrency, formatCompactCurrency } from '../../lib/formatters';
import { Award, ShieldCheck, TreePine, Coins } from 'lucide-react';
import { Card } from '@/components/ui/card';
import CertificateCard from '../../components/cards/CertificateCard';
import RetireTokenModal from '../../components/modals/RetireTokenModal';

export async function clientLoader() {
  const certs = await certificateRepository.getPurchasedCertificates().catch(() => []);
  return { certs };
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
  const { certs = [] } = (useLoaderData<typeof clientLoader>() || {}) as any;
  const revalidator = useRevalidator();
  const [selectedCertToRetire, setSelectedCertToRetire] = useState<any>(null);

  const totalVolume = certs.reduce((acc: number, c: any) => acc + c.purchasedVolumeTCO2e, 0);
  const totalValueIDR = certs.reduce(
    (acc: number, c: any) =>
      acc + (c.totalPaidIDR || c.purchasedVolumeTCO2e * c.pricePerTonIDR || 0),
    0
  );
  const avgPricePerTon = certs.length
    ? Math.round(
        certs.reduce((acc: number, c: any) => acc + (c.pricePerTonIDR || 0), 0) / certs.length
      )
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
              <span className="text-xs font-bold text-slate-500">tCO₂e</span>
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
            Menampilkan {certs.length} Sertifikat Terdaftar
          </span>
        </div>

        <div className="space-y-6">
          {certs.map((cert: any) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              onRetireClick={(c) => setSelectedCertToRetire(c)}
            />
          ))}
        </div>
      </div>

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
