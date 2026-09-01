import { jsPDF } from 'jspdf';
import { formatCarbon, formatNumber } from '@/lib/formatters';
import { formatDateTime } from '@/lib/dates';
import type { RetirementCertificateVerification } from '@/types';

interface RetirementCertificatePdfParams {
  verification: RetirementCertificateVerification;
  verificationUrl: string;
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * 6;
}

export function generateRetirementCertificatePDF({
  verification,
  verificationUrl,
}: RetirementCertificatePdfParams): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFillColor(0, 108, 73);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('REKAKARBON', margin, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Bukti Pencatatan Retirement Karbon', margin, 23);

  let y = 45;
  doc.setTextColor(11, 28, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Sertifikat Retirement Terverifikasi', margin, y);
  y += 12;

  doc.setDrawColor(203, 219, 245);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 62, 4, 4, 'FD');
  y += 12;

  const addField = (label: string, value: string): void => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin + 8, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(11, 28, 48);
    y = addWrappedText(doc, value, margin + 52, y, pageWidth - margin * 2 - 60);
    y += 3;
  };

  addField('Nomor', verification.certificateNumber);
  addField('Volume', formatCarbon(verification.amountRetired));
  addField('Aset', `Asset ID ${formatNumber(verification.assetId)}`);
  addField('Pemilik', verification.retiree);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 108, 73);
  doc.text('Jejak Blockchain', margin, y);
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Transaction hash: ${verification.txHash}`, margin, y);
  y += 7;
  doc.text(
    `Block: ${formatNumber(verification.blockNumber)} · Chain ID: ${verification.chainId}`,
    margin,
    y
  );
  y += 7;
  doc.text(
    `Waktu: ${verification.retiredAt ? formatDateTime(verification.retiredAt) : 'Tidak tersedia'}`,
    margin,
    y
  );
  y += 7;
  doc.text(`Contract: ${verification.contractAddress}`, margin, y);
  y += 13;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 28, 48);
  doc.text('URL verifikasi publik:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 96, 255);
  y = addWrappedText(doc, verificationUrl, margin, y, pageWidth - margin * 2);

  doc.setDrawColor(203, 219, 245);
  doc.line(margin, 265, pageWidth - margin, 265);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  addWrappedText(
    doc,
    'Dokumen ini menunjukkan bahwa event RetirementCertificateIssued tercatat pada smart contract RekaKarbon. Pengakuan atau klaim kepada KLHK tetap mengikuti pemeriksaan dan ketentuan resmi yang berlaku.',
    margin,
    274,
    pageWidth - margin * 2
  );

  doc.save(`Bukti_Retirement_${verification.certificateNumber}.pdf`);
}
