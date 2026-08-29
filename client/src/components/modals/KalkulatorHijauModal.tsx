import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Leaf, ArrowRight, Save, Calculator } from 'lucide-react';
import { formatCarbon } from '@/lib/formatters';

interface KalkulatorHijauModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (totalEmissions: number) => void;
}

export default function KalkulatorHijauModal({
  isOpen,
  onClose,
  onApply,
}: KalkulatorHijauModalProps) {
  const [step, setStep] = useState(1); // 1: Scope 1, 2: Scope 2, 3: Scope 3
  
  // Scope 1 (Direct)
  const [gensetLiter, setGensetLiter] = useState('0');
  const [vehicleLiter, setVehicleLiter] = useState('0');
  
  // Scope 2 (Indirect - Electricity)
  const [plnKwh, setPlnKwh] = useState('0');
  
  // Scope 3 (Indirect - Other)
  const [flightKm, setFlightKm] = useState('0');

  // Basic dummy calculation (e.g. 1 liter fuel = 2.6kg CO2, 1 kwh = 0.8kg CO2)
  const scope1Emissions = (Number(gensetLiter) + Number(vehicleLiter)) * 0.0026;
  const scope2Emissions = Number(plnKwh) * 0.0008;
  const scope3Emissions = Number(flightKm) * 0.0002;
  const totalEmissions = scope1Emissions + scope2Emissions + scope3Emissions;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleApply = () => {
    onApply(totalEmissions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-sm border-slate-200 bg-white shadow-2xl rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">Kalkulator Hijau</DialogTitle>
        
        {/* Header - BI Style Green */}
        <div className="bg-emerald-600 p-5 text-white flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-black text-lg">Kalkulator Hijau</h3>
          <p className="text-xs text-emerald-100 opacity-90 px-4">
            Alat bantu hitung emisi standar GRK (Scope 1, 2, 3)
          </p>
        </div>

        {/* Stepper indicator */}
        <div className="flex bg-slate-50 border-b border-slate-100">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider border-r border-slate-100 last:border-0 ${
                step === s
                  ? 'bg-white text-emerald-600 border-b-2 border-b-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              Scope {s}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Form Content */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Pemakaian Genset/Boiler (Liter)</label>
                <Input
                  type="number"
                  value={gensetLiter}
                  onChange={(e) => setGensetLiter(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">BBM Kendaraan Operasional (Liter)</label>
                <Input
                  type="number"
                  value={vehicleLiter}
                  onChange={(e) => setVehicleLiter(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Konsumsi Listrik PLN (kWh)</label>
                <Input
                  type="number"
                  value={plnKwh}
                  onChange={(e) => setPlnKwh(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Perjalanan Dinas Pesawat (Km)</label>
                <Input
                  type="number"
                  value={flightKm}
                  onChange={(e) => setFlightKm(e.target.value)}
                  className="rounded-xl border-slate-200 h-11"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Results preview */}
          <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between border border-emerald-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 block uppercase">Estimasi Total</span>
              <span className="text-sm font-black text-emerald-950">
                {formatCarbon(totalEmissions)} tCO₂e
              </span>
            </div>
            <Leaf className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <Button variant="outline" className="rounded-xl h-11" onClick={onClose}>
            Batal
          </Button>
          {step < 3 ? (
            <Button className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNext}>
              Lanjut <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApply}>
              <Save className="w-4 h-4 mr-1" /> Terapkan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
