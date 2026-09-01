import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { AlertTriangle, CheckCircle2, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { certificateRepository } from '@/repositories';
import type { RetirementCertificateVerification } from '@/types';
import { formatDateTime } from '@/lib/dates';
import { formatCarbon, formatNumber } from '@/lib/formatters';
import { generateRetirementCertificatePDF } from '@/lib/generateRetirementCertificatePDF';
import { getRetirementQrUrl, getRetirementVerificationUrl } from '@/lib/certificate-verification';

interface CertificateVerificationLoaderData {
  verification: RetirementCertificateVerification | null;
  txHash: string | null;
  error: string | null;
}

export async function clientLoader({
  request,
}: LoaderFunctionArgs): Promise<CertificateVerificationLoaderData> {
  const txHash = new URL(request.url).searchParams.get('txHash');
  if (!txHash) {
    return {
      verification: null,
      txHash: null,
      error: 'Transaction hash belum disertakan pada tautan verifikasi.',
    };
  }

  try {
    const verification = await certificateRepository.verifyRetirementCertificate(txHash);
    return { verification, txHash, error: null };
  } catch {
    return {
      verification: null,
      txHash,
      error: 'Data retirement tidak ditemukan atau belum dapat dibaca dari blockchain.',
    };
  }
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-sm font-semibold text-slate-500">
      Memeriksa sertifikat pada blockchain...
    </main>
  );
}

export function meta() {
  return [
    { title: 'Verifikasi Sertifikat Retirement | RekaKarbon' },
    {
      name: 'description',
      content: 'Verifikasi publik sertifikat retirement karbon berbasis blockchain RekaKarbon.',
    },
  ];
}

export default function CertificateVerificationPage() {
  const { verification, txHash, error } = useLoaderData<typeof clientLoader>();
  const verificationUrl = txHash ? getRetirementVerificationUrl(txHash) : '';
  const qrUrl = verificationUrl ? getRetirementQrUrl(verificationUrl) : '';

  if (!verification) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-slate-900">
        <Card className="w-full max-w-xl rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <CardTitle className="text-xl font-black">Sertifikat belum terverifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>{error}</p>
            {txHash && <p className="break-all font-mono text-xs">TX: {txHash}</p>}
            <Button asChild className="bg-primary-gradient font-bold text-white">
              <a href="/">Kembali ke RekaKarbon</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 font-sans text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl bg-primary-gradient p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-100">
                RekaKarbon · Verifikasi Publik
              </p>
              <h1 className="mt-3 text-2xl font-black sm:text-3xl">
                Sertifikat Retirement Terverifikasi
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-50">
                Bukti pencatatan pembakaran token karbon yang dibaca langsung dari event smart
                contract, bukan dari data tampilan.
              </p>
            </div>
            <ShieldCheck className="h-10 w-10 shrink-0 text-emerald-200" />
          </div>
        </header>

        <Card className="rounded-3xl border-emerald-200 shadow-sm">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_190px] md:p-8">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-extrabold">
                  Event retirement ditemukan di blockchain
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Nomor Sertifikat
                </p>
                <p className="mt-1 break-all font-mono text-xl font-black text-slate-900">
                  {verification.certificateNumber}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Info
                  label="Volume yang di-retire"
                  value={formatCarbon(verification.amountRetired)}
                />
                <Info label="Asset ID" value={formatNumber(verification.assetId)} />
                <Info
                  label="Waktu pencatatan"
                  value={
                    verification.retiredAt
                      ? formatDateTime(verification.retiredAt)
                      : 'Tidak tersedia'
                  }
                />
                <Info
                  label="Block / Chain ID"
                  value={`${formatNumber(verification.blockNumber)} / ${verification.chainId}`}
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-50 p-4 text-center">
              <img
                src={qrUrl}
                alt="QR code halaman verifikasi sertifikat"
                className="h-40 w-40 rounded-xl bg-white p-2"
              />
              <p className="text-xs font-bold text-emerald-800">Scan untuk membagikan bukti ini</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black">Jejak transaksi dan sumber data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info label="Retiree wallet" value={verification.retiree} mono />
            <Info label="Transaction hash" value={verification.txHash} mono />
            <Info label="Contract address" value={verification.contractAddress} mono />
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                onClick={() => generateRetirementCertificatePDF({ verification, verificationUrl })}
                className="bg-primary-gradient font-bold text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Unduh Bukti PDF
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <a href={verificationUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buka tautan ini
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          Bukti ini memvalidasi pencatatan retirement pada smart contract RekaKarbon. Pengajuan
          klaim ke KLHK tetap tunduk pada verifikasi dan ketentuan resmi yang berlaku.
        </p>
      </div>
    </main>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`break-all font-semibold text-slate-800 ${mono ? 'font-mono text-xs' : 'text-sm'}`}
      >
        {value}
      </p>
    </div>
  );
}
