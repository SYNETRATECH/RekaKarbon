import { useCarbonStore } from '../../store/useCarbonStore';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function LightboxModal() {
  const { lightboxImage, setLightboxImage } = useCarbonStore();

  return (
    <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
      <DialogContent className="p-6 max-w-4xl bg-black/95 border-slate-800 text-white shadow-2xl flex flex-col items-center justify-center">
        <DialogTitle className="sr-only">Pratinjau Foto Bukti Lapangan</DialogTitle>
        {lightboxImage && (
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxImage}
              alt="Bukti High-Res"
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <Button
              variant="secondary"
              onClick={() => setLightboxImage(null)}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white px-5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border-none h-8"
            >
              ✕ Tutup Pratinjau
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
