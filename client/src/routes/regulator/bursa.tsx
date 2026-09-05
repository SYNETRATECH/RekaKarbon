import { useLoaderData, useRevalidator } from 'react-router';
import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Link2, Plus, XCircle } from 'lucide-react';
import { bursaListingRepository } from '../../repositories';
import type { BursaListingCandidate, BursaWorkflowListing, BursaWorkflowStatus } from '../../types';
import { formatCarbon, formatCurrency } from '../../lib/formatters';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';

export async function clientLoader() {
  const [listings, candidates] = await Promise.all([
    bursaListingRepository.getRegulatorListings().catch(() => []),
    bursaListingRepository.getListingCandidates().catch(() => []),
  ]);
  return { listings, candidates };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Bursa Regulator" rows={3} />;
}

export function meta() {
  return [
    { title: 'Listing Bursa Karbon | RekaKarbon' },
    { name: 'description', content: 'Pengelolaan listing SPE-GRK Regulator KLHK' },
  ];
}

const STATUS_LABELS: Record<BursaWorkflowStatus, string> = {
  DRAFT: 'Draf',
  AWAITING_KTH_CONFIRMATION: 'Menunggu konfirmasi KTH',
  ACTIVATING: 'Mengaktifkan blockchain',
  ACTIVE: 'Aktif di Bursa',
  PARTIALLY_FILLED: 'Terjual sebagian',
  FILLED: 'Habis terjual',
  FROZEN: 'Dibekukan',
  CANCELLED: 'Dibatalkan',
  BLOCKCHAIN_FAILED: 'Gagal blockchain',
};

function statusClass(status: BursaWorkflowStatus): string {
  if (status === 'ACTIVE' || status === 'PARTIALLY_FILLED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'BLOCKCHAIN_FAILED' || status === 'CANCELLED') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function RegulatorBursaListings() {
  const { listings, candidates } = useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const createListing = async (candidate: BursaListingCandidate) => {
    setBusyId(candidate.carbonTokenId);
    try {
      await bursaListingRepository.createListing(candidate.carbonTokenId);
      toast({
        title: 'Escrow listing dibuat',
        description: 'Token sudah dikunci di blockchain dan menunggu konfirmasi KTH.',
        className: 'bg-emerald-600 text-white border-none',
      });
      await revalidate();
    } catch (error) {
      toast({
        title: 'Listing gagal dibuat',
        description:
          error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const cancelListing = async (listing: BursaWorkflowListing) => {
    setBusyId(listing.id);
    try {
      await bursaListingRepository.cancelListing(listing.id);
      toast({
        title: 'Listing dibatalkan',
        description: 'Escrow token dikembalikan kepada pemilik proyek.',
      });
      await revalidate();
    } catch (error) {
      toast({
        title: 'Pembatalan gagal',
        description:
          error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 animate-fade-in text-left">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
          REGULATOR · BURSA KARBON
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Listing SPE-GRK</h2>
        <p className="mt-1 max-w-3xl text-xs font-semibold text-slate-500">
          Regulator menerbitkan listing dari token terverifikasi. Token langsung masuk escrow
          blockchain, kemudian KTH mengonfirmasi snapshot proyek sebelum listing tampil di Bursa
          emitter.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-emerald-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">Token siap dibuat listing</h3>
            <p className="text-xs font-semibold text-slate-500">
              Hanya SPE-GRK yang sudah minted dan memiliki proyek serta KTH yang tampil.
            </p>
          </div>
        </div>
        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            Belum ada token blockchain yang memenuhi syarat listing. Pastikan sertifikat sudah
            diverifikasi, di-mint, memiliki saldo tersedia, dan proyek telah memiliki KTH.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {candidates.map((candidate) => {
              const floorPrice = Math.ceil(
                candidate.eligibleProjectCostIdr / candidate.availableVolumeTco2e
              );
              const isBusy = busyId === candidate.carbonTokenId;
              return (
                <div
                  key={candidate.carbonTokenId}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-slate-900">{candidate.projectName}</h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {candidate.province} · {candidate.kthGroupName}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                      SPE siap
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-400">Sertifikat</p>
                      <p className="mt-1 font-black text-slate-700">
                        {candidate.speCertificateNumber}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Volume</p>
                      <p className="mt-1 font-black text-slate-700">
                        {formatCarbon(candidate.availableVolumeTco2e)} tCO₂e
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Floor</p>
                      <p className="mt-1 font-black text-slate-700">
                        {formatCurrency(floorPrice)}/ton
                      </p>
                    </div>
                  </div>
                  <Button
                    disabled={isBusy}
                    onClick={() => void createListing(candidate)}
                    className="mt-4 w-full bg-primary-gradient text-xs font-black text-white"
                  >
                    {isBusy ? 'Membuat escrow...' : 'Buat listing & kunci token'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">Riwayat listing</h3>
            <p className="text-xs font-semibold text-slate-500">
              Status database dan transaksi blockchain ditampilkan bersamaan.
            </p>
          </div>
        </div>
        {listings.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            Belum ada listing regulator.
          </p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const cancellable =
                listing.volumeSoldTco2e === 0 &&
                (listing.status === 'AWAITING_KTH_CONFIRMATION' || listing.status === 'ACTIVE');
              return (
                <div key={listing.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-slate-900">{listing.projectName}</h4>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(listing.status)}`}
                        >
                          {STATUS_LABELS[listing.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {listing.speCertificateNumber} · KTH:{' '}
                        {listing.kthGroupName ?? 'Belum ditetapkan'}
                      </p>
                    </div>
                    {cancellable && (
                      <Button
                        variant="outline"
                        disabled={busyId === listing.id}
                        onClick={() => void cancelListing(listing)}
                        className="border-red-200 text-xs font-black text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Batalkan
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <p className="font-bold text-slate-400">Tersedia</p>
                      <p className="mt-1 font-black text-slate-800">
                        {formatCarbon(listing.volumeAvailableTco2e)} tCO₂e
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Terjual</p>
                      <p className="mt-1 font-black text-slate-800">
                        {formatCarbon(listing.volumeSoldTco2e)} tCO₂e
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Harga dasar</p>
                      <p className="mt-1 font-black text-slate-800">
                        {formatCurrency(listing.floorPricePerTonIdr)}/ton
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400">Blockchain listing</p>
                      <p className="mt-1 break-all font-mono font-black text-slate-800">
                        {listing.blockchainListingId ?? 'Belum tercatat'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                    {listing.kthConfirmationStatus === 'CONFIRMED' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-amber-600" />
                    )}
                    KTH:{' '}
                    {listing.kthConfirmationStatus === 'CONFIRMED'
                      ? 'snapshot dikonfirmasi'
                      : 'menunggu konfirmasi'}
                    {listing.draftTxHash && (
                      <span className="font-mono">· tx: {listing.draftTxHash.slice(0, 16)}...</span>
                    )}
                  </div>
                  {listing.status === 'BLOCKCHAIN_FAILED' && (
                    <p className="mt-3 flex items-center gap-2 text-xs font-bold text-red-700">
                      <AlertCircle className="h-4 w-4" /> Periksa konfigurasi wallet, kontrak, dan
                      saldo token sebelum mencoba ulang.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
