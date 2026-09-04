import { useLoaderData, useRevalidator } from 'react-router';
import { useState } from 'react';
import { CheckCircle2, Clock3, Link2 } from 'lucide-react';
import { bursaListingRepository } from '../../repositories';
import type { BursaWorkflowListing } from '../../types';
import { formatCarbon } from '../../lib/formatters';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';

export async function clientLoader() {
  const listings = await bursaListingRepository.getKthPendingListings().catch(() => []);
  return { listings };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Memuat Konfirmasi Bursa KTH" rows={2} />;
}

export function meta() {
  return [
    { title: 'Konfirmasi Listing Bursa | RekaKarbon' },
    {
      name: 'description',
      content: 'Konfirmasi KTH terhadap snapshot proyek sebelum listing karbon aktif',
    },
  ];
}

export default function KthBursaListings() {
  const { listings } = useLoaderData<typeof clientLoader>();
  const { revalidate } = useRevalidator();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const confirmListing = async (listing: BursaWorkflowListing) => {
    const note = notes[listing.id]?.trim();
    if (!note) {
      toast({
        title: 'Catatan diperlukan',
        description: 'Tuliskan hasil pengecekan data lapangan sebelum mengonfirmasi.',
        variant: 'destructive',
      });
      return;
    }
    setBusyId(listing.id);
    try {
      await bursaListingRepository.confirmKthListing(listing.id, note);
      toast({
        title: 'Listing dikonfirmasi',
        description: 'Snapshot KTH tercatat di blockchain dan listing telah diaktifkan.',
        className: 'bg-emerald-600 text-white border-none',
      });
      await revalidate();
    } catch (error) {
      toast({
        title: 'Konfirmasi gagal',
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
          KTH · ATTESTATION
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Konfirmasi Listing Bursa
        </h2>
        <p className="mt-1 max-w-3xl text-xs font-semibold text-slate-500">
          Periksa nama proyek, volume, dan data lapangan. Konfirmasi ini menjadi bukti bahwa
          snapshot proyek yang dikunci Regulator sesuai dengan kondisi yang diketahui KTH.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-2xs">
          <Clock3 className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-black text-slate-700">
            Tidak ada listing yang menunggu konfirmasi.
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Listing baru akan muncul setelah Regulator membuat escrow untuk proyek KTH Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <section
              key={listing.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{listing.projectName}</h3>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
                      Menunggu Anda
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {listing.province} · {listing.kthGroupName ?? 'KTH proyek'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                  <Link2 className="h-4 w-4 text-blue-600" /> Escrow #
                  {listing.blockchainListingId ?? '-'}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400">Sertifikat</p>
                  <p className="mt-1 text-xs font-black text-slate-800">
                    {listing.speCertificateNumber}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400">Vintage</p>
                  <p className="mt-1 text-xs font-black text-slate-800">FY {listing.vintageYear}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400">Volume dikunci</p>
                  <p className="mt-1 text-xs font-black text-slate-800">
                    {formatCarbon(listing.volumeLockedTco2e)} tCO₂e
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400">Snapshot</p>
                  <p className="mt-1 break-all font-mono text-[10px] font-black text-slate-800">
                    {listing.projectSnapshotMerkleRoot ?? 'Belum tersedia'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label
                  className="text-xs font-black text-slate-700"
                  htmlFor={`notes-${listing.id}`}
                >
                  Catatan pengecekan lapangan
                </label>
                <Textarea
                  id={`notes-${listing.id}`}
                  value={notes[listing.id] ?? ''}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [listing.id]: event.target.value }))
                  }
                  placeholder="Contoh: nama proyek, lokasi, volume, dan kondisi tutupan telah sesuai dengan data lapangan."
                  className="mt-2 min-h-24 rounded-2xl text-xs"
                />
              </div>
              <Button
                disabled={busyId === listing.id}
                onClick={() => void confirmListing(listing)}
                className="mt-4 bg-primary-gradient text-xs font-black text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {busyId === listing.id ? 'Mencatat konfirmasi...' : 'Konfirmasi & aktifkan listing'}
              </Button>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
