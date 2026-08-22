import { Leaf, TrendingUp } from 'lucide-react';

export default function CommitmentSection() {
  return (
    <section className="py-20 bg-white hidden">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-500 mb-5">
            📜 Komitmen Kami
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Terbangun di atas teknologi
            <br />
            yang tidak bisa dibohongi.
          </h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <p className="text-base text-slate-600 leading-relaxed mb-6 italic">
              "Kami membangun RekaKarbon karena pasar karbon Indonesia butuh lebih dari sekadar
              janji. Kami butuh bukti yang tidak bisa dimanipulasi — dan itulah mengapa setiap ton
              CO₂ yang diklaim harus melewati tiga lapisan verifikasi independen."
            </p>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=80&h=80&fit=crop&auto=format"
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">Ahmad Fauzi</div>
                <div className="text-xs text-slate-400">Founder &amp; CTO, RekaKarbon</div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl font-extrabold text-slate-900">48.200+</div>
                <div className="w-10 h-10 bg-primary-container/15 rounded-xl flex items-center justify-center">
                  <Leaf size={18} className="text-primary-container" />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                tCO2e Terverifikasi dMRV
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Total kredit karbon yang telah melewati triple-check audit
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl font-extrabold text-slate-900">Rp 3,85 M</div>
                <div className="w-10 h-10 bg-primary-container/15 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-primary-container" />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Dana Tersalurkan ke KTH
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Langsung ke dompet BUMDes tanpa perantara atau potongan broker
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
