import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import brandIcon from '../../assets/icon.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const hasDismissed = sessionStorage.getItem('rekakarbon_pwa_prompt_dismissed');
    if (hasDismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('rekakarbon_pwa_prompt_dismissed', 'true');
  };

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Install Aplikasi RekaKarbon"
      className="fixed bottom-5 right-5 left-5 sm:left-auto sm:w-96 z-50 p-4 bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-800 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 p-1.5">
          <img src={brandIcon} alt="RekaKarbon" className="w-full h-full object-contain" />
        </div>
        <div>
          <h4 className="text-xs font-black leading-none text-slate-900">
            Install Aplikasi RekaKarbon
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
            Akses verifikasi MRV & bursa karbon lebih cepat dan native di perangkat Anda.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="h-8 px-3 bg-[#033C2E] hover:bg-[#022B21] text-[#00E599] font-bold text-xs rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

export default InstallPromptBanner;
