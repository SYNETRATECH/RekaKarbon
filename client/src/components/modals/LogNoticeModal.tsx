import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface LogNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogNoticeModal({ isOpen, onClose }: LogNoticeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Log Hibrida Tercatat</span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Unggahan foto geotag / scan drone berhasil dicatat ke Log Hibrida Reboisasi!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-primary-gradient text-white font-extrabold cursor-pointer"
          >
            Tutup & Lanjutkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
