import { AlertTriangle, CheckCircle2, Clock3, Link2, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/dates';
import type { PtbaeApplicationIntegrity } from '@/types';

interface PtbaeIntegrityStatusProps {
  integrity: PtbaeApplicationIntegrity | null;
}

const STATUS_LABELS: Record<NonNullable<PtbaeApplicationIntegrity['anchorStatus']>, string> = {
  pending: 'Menunggu pencatatan',
  processing: 'Sedang dicatat',
  confirmed: 'Terkonfirmasi blockchain',
  failed: 'Pencatatan gagal, menunggu percobaan ulang',
};

function shortenHash(value: string): string {
  if (value.length <= 22) return value;
  return `${value.slice(0, 12)}...${value.slice(-10)}`;
}

export function PtbaeIntegrityStatus({ integrity }: PtbaeIntegrityStatusProps) {
  if (!integrity) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-xs font-black text-slate-700">Jejak integritas blockchain</p>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
              Belum ada snapshot. Jejak dibuat saat pengajuan atau keputusan workflow dicatat.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const status = integrity.anchorStatus;
  const isConfirmed = status === 'confirmed';
  const isFailed = status === 'failed';
  const StatusIcon = isConfirmed ? CheckCircle2 : isFailed ? AlertTriangle : Clock3;
  const statusClass = isConfirmed
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : isFailed
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Link2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">Jejak integritas blockchain</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Snapshot versi {integrity.version} · Merkle Root tersimpan di PostgreSQL.
            </p>
          </div>
        </div>
        {status && (
          <span
            className={`flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-3 text-[10px] sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="font-black uppercase tracking-wider text-slate-400">Merkle Root</p>
          <code className="mt-1 block break-all font-semibold text-slate-700">
            {shortenHash(integrity.merkleRoot)}
          </code>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="font-black uppercase tracking-wider text-slate-400">Snapshot Hash</p>
          <code className="mt-1 block break-all font-semibold text-slate-700">
            {shortenHash(integrity.snapshotHash)}
          </code>
        </div>
      </div>
      {integrity.transactionHash && (
        <p className="mt-3 text-[10px] font-semibold text-slate-500">
          Transaction Hash:{' '}
          <code className="font-bold text-slate-700">{shortenHash(integrity.transactionHash)}</code>
        </p>
      )}
      {integrity.confirmedAt && (
        <p className="mt-1 text-[10px] font-semibold text-slate-500">
          Dikonfirmasi pada {formatDateTime(integrity.confirmedAt)}.
        </p>
      )}
    </div>
  );
}
