import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { certificateRepository } from '../../repositories';
import { Activity, Flame, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RetireTokenModalProps {
  cert: any;
  onClose: (success?: boolean, retData?: any) => void;
}

export default function RetireTokenModal({ cert, onClose }: RetireTokenModalProps) {
  const [retireQuantity, setRetireQuantity] = useState<number>(cert.purchasedVolumeTCO2e);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const { toast } = useToast();

  const handleRetire = async () => {
    if (retireQuantity <= 0 || retireQuantity > cert.purchasedVolumeTCO2e) {
      toast({
        title: 'Validasi Gagal',
        description: 'Jumlah yang dibakar tidak valid.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass the UUID directly as expected by our updated DTO
      const result = await certificateRepository.retireCertificate(
        cert.id,
        retireQuantity
      );
      
      setSuccessData(result);
    } catch (error) {
      console.error('Retire error:', error);
      toast({
        title: 'Burn Gagal ❌',
        description: 'Gagal melakukan pembakaran token karbon. Coba lagi.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClose(true, successData);
  };

  if (successData) {
    return (
      <Dialog open={true} onOpenChange={() => handleFinish()}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-3xl p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 mb-2">
            Sertifikat Diterbitkan!
          </DialogTitle>
          <p className="text-slate-500 text-sm font-medium mb-6">
            Token karbon berhasil dibakar dan Sertifikat Offset (Retirement) telah tercatat secara permanen.
          </p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 mb-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Nomor Sertifikat</span>
              <span className="text-sm font-mono font-bold text-slate-900">{successData.certificateNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tx Hash</span>
              <span className="text-xs font-mono font-medium text-blue-600 break-all">{successData.txHash}</span>
            </div>
          </div>
          
          <Button
            onClick={handleFinish}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-emerald-200"
          >
            Tutup
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-3xl p-6">
        <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2 mb-4">
          <Flame className="w-6 h-6 text-orange-500" />
          Burn / Retire Token
        </DialogTitle>
        
        <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-xs font-medium mb-6 leading-relaxed">
          Membakar token karbon (Retirement) akan menghapus token ini dari sirkulasi dan menghasilkan sertifikat offset (SPE-GRK) yang dapat digunakan untuk pelaporan pajak karbon Anda. Aksi ini <b>tidak dapat dibatalkan</b>.
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
              Proyek Karbon
            </label>
            <div className="font-bold text-slate-900 text-sm bg-slate-50 p-3 rounded-xl border border-slate-200">
              {cert.projectName}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 flex justify-between uppercase tracking-wider">
              <span>Jumlah Burn (tCO₂e)</span>
              <span className="text-emerald-600">Max: {cert.purchasedVolumeTCO2e}</span>
            </label>
            <Input
              type="number"
              min="1"
              max={cert.purchasedVolumeTCO2e}
              value={retireQuantity}
              onChange={(e) => setRetireQuantity(Number(e.target.value))}
              className="font-mono text-sm rounded-xl py-6 bg-slate-50 border-slate-200 focus-visible:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => onClose()}
            className="flex-1 rounded-xl py-6 font-bold text-slate-600"
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleRetire}
            disabled={isSubmitting}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-orange-200"
          >
            {isSubmitting ? (
              <>
                <Activity className="w-4 h-4 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 mr-2" />
                Bakar Sekarang
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
