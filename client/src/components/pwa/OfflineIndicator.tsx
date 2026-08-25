import { useSyncExternalStore } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  if (typeof navigator === 'undefined') return false;
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function OfflineIndicator() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Pemberitahuan Status Koneksi Offline"
      className="bg-amber-500/10 border-b border-amber-500/20 text-amber-950 px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between gap-3 shrink-0 animate-in fade-in duration-200 z-50 sticky top-0 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong className="font-bold text-amber-900">Mode Offline Aktif:</strong> Anda sedang
          melihat data lokal tersimpan. Sinkronisasi telemetry realtime dinonaktifkan sementara.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
        className="h-7 px-2.5 text-xs bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900 font-bold shrink-0 cursor-pointer shadow-2xs"
      >
        <RefreshCw className="w-3 h-3 mr-1 text-amber-700" /> Coba Sambungkan
      </Button>
    </aside>
  );
}

export default OfflineIndicator;
