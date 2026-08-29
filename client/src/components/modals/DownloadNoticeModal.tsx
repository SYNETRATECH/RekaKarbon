import { useEffect } from 'react';
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

import jsPDF from 'jspdf';

export default function DownloadNoticeModal({
  fileName,
  onClose,
  title = 'Pengunduhan Berkas Resmi',
}: DownloadNoticeModalProps) {
  useEffect(() => {
    if (fileName) {
      if (fileName.toLowerCase().endsWith('.pdf')) {
        try {
          const doc = new jsPDF();
          doc.setFillColor(4, 120, 87); // Emerald 700
          doc.rect(0, 0, 210, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text('REKAKARBON — ARSIP DOKUMEN', 14, 13);
          
          doc.setTextColor(30, 41, 59); // Slate 800
          doc.setFontSize(12);
          doc.text('Keterangan Dokumen', 14, 35);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.text(`Nama Berkas: ${fileName}`, 14, 45);
          doc.text(`Diunduh pada: ${new Date().toLocaleString('id-ID')}`, 14, 52);
          doc.text('Status: Arsip Laporan Historis (File Asli tidak tersedia di Demo)', 14, 59);
          
          doc.save(fileName);
        } catch (err) {
          console.error('Error generating PDF placeholder', err);
        }
      } else {
        // For non-PDF generic documents
        const content = `REKAKARBON - Dokumen ${fileName}\nDiunduh pada: ${new Date().toLocaleString()}\n\nDokumen ini dihasilkan oleh sistem RekaKarbon.\nUntuk laporan emisi lengkap, gunakan fitur Kalkulator Hijau.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  }, [fileName]);

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
