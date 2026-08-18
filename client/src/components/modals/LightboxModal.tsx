import { useCarbonStore } from '../../store/useCarbonStore';

export default function LightboxModal() {
  const { lightboxImage, setLightboxImage } = useCarbonStore();

  if (!lightboxImage) return null;

  return (
    <div
      onClick={() => setLightboxImage(null)}
      className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-6 cursor-pointer animate-fade-in"
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <img
          src={lightboxImage}
          alt="Bukti High-Res"
          className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/20"
        />
        <button
          onClick={() => setLightboxImage(null)}
          className="mt-4 bg-white/20 hover:bg-white/30 text-white px-5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
        >
          ✕ Tutup Pratinjau
        </button>
      </div>
    </div>
  );
}
