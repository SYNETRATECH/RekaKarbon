import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface DownloadNoticeModalProps {
  fileName: string | null;
  onClose: () => void;
  title?: string;
}

export default function DownloadNoticeModal({
  fileName,
  onClose,
  title = 'Pengunduhan Berkas Resmi',
}: DownloadNoticeModalProps) {
  return (
    <Dialog open={!!fileName} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Berkas <span className="font-mono font-bold text-slate-900">{fileName}</span> sedang
            diunduh dan diproses dari repository publik RekaKarbon.
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
