/**
 * generateEmissionReportPDF — Menghasilkan dokumen PDF laporan emisi karbon
 * yang profesional dan lengkap menggunakan jsPDF, tanpa perlu html2canvas.
 *
 * Format mengikuti struktur Buku Panduan Hijau BI 2026.
 */
import { jsPDF } from 'jspdf';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/formatters';
import { formatDate, formatDateTime } from '@/lib/dates';
import type { CalculationData, SectorBreakdown } from '@/types';
import pdfBrandIcon from '@/assets/icon-pdf.png?inline';

// Inline field definitions to avoid circular dependency with kalkulator.tsx
interface PdfFormField {
  id: string;
  label: string;
  unit: string;
  emissionFactorKey: string;
}
interface PdfCategory {
  title: string;
  scope: 1 | 2 | 3;
  fields: PdfFormField[];
}

const PDF_CATEGORIES: PdfCategory[] = [
  {
    title: 'Scope 1: Pembakaran Stasioner',
    scope: 1,
    fields: [
      {
        id: 'genset_diesel',
        label: 'Solar Genset/Boiler',
        unit: 'Liter',
        emissionFactorKey: 'diesel_liter',
      },
      { id: 'natural_gas', label: 'Gas Alam', unit: 'm3', emissionFactorKey: 'natural_gas_m3' },
      { id: 'coal', label: 'Batu Bara', unit: 'kg', emissionFactorKey: 'coal_kg' },
      { id: 'lpg', label: 'LPG', unit: 'kg', emissionFactorKey: 'lpg_kg' },
    ],
  },
  {
    title: 'Scope 1: Pembakaran Bergerak',
    scope: 1,
    fields: [
      {
        id: 'vehicle_diesel',
        label: 'Solar Kendaraan',
        unit: 'Liter',
        emissionFactorKey: 'diesel_liter',
      },
      {
        id: 'vehicle_gasoline',
        label: 'Bensin/Petrol',
        unit: 'Liter',
        emissionFactorKey: 'gasoline_liter',
      },
    ],
  },
  {
    title: 'Scope 1: Emisi Fugitif',
    scope: 1,
    fields: [
      {
        id: 'refrigerant_kg',
        label: 'Refrigeran R-410A',
        unit: 'kg',
        emissionFactorKey: 'refrigerant_kg',
      },
      {
        id: 'co2_fire_ext_kg',
        label: 'CO2 Pemadam Api',
        unit: 'kg',
        emissionFactorKey: 'co2_fire_ext_kg',
      },
    ],
  },
  {
    title: 'Scope 1: Proses Industri',
    scope: 1,
    fields: [
      {
        id: 'cement_clinker_ton',
        label: 'Produksi Clinker Semen',
        unit: 'ton',
        emissionFactorKey: 'cement_clinker_ton',
      },
      { id: 'lime_ton', label: 'Produksi Kapur', unit: 'ton', emissionFactorKey: 'lime_ton' },
    ],
  },
  {
    title: 'Scope 1: Aktivitas Pertanian',
    scope: 1,
    fields: [
      {
        id: 'fertilizer_urea_kg',
        label: 'Pupuk Urea',
        unit: 'kg',
        emissionFactorKey: 'fertilizer_urea_kg',
      },
      { id: 'rice_paddy_ha', label: 'Lahan Sawah', unit: 'ha', emissionFactorKey: 'rice_paddy_ha' },
      {
        id: 'livestock_cattle_head',
        label: 'Ternak Sapi',
        unit: 'ekor',
        emissionFactorKey: 'livestock_cattle_head',
      },
    ],
  },
  {
    title: 'Scope 2: Konsumsi Listrik',
    scope: 2,
    fields: [
      {
        id: 'electricity',
        label: 'Listrik PLN',
        unit: 'kWh',
        emissionFactorKey: 'electricity_kwh',
      },
    ],
  },
  {
    title: 'Scope 3: Perjalanan Dinas',
    scope: 3,
    fields: [
      {
        id: 'flight',
        label: 'Penerbangan Domestik',
        unit: 'passenger-km',
        emissionFactorKey: 'flight_km',
      },
      {
        id: 'car_travel',
        label: 'Perjalanan Darat (Mobil)',
        unit: 'km',
        emissionFactorKey: 'car_km',
      },
    ],
  },
  {
    title: 'Scope 3: Barang dan Utilitas',
    scope: 3,
    fields: [
      { id: 'paper_kg', label: 'Kertas dan Kardus', unit: 'kg', emissionFactorKey: 'paper_kg' },
      { id: 'water_m3', label: 'Air Suplai', unit: 'm3', emissionFactorKey: 'water_m3' },
      {
        id: 'waste_landfill_ton',
        label: 'Limbah ke TPA',
        unit: 'ton',
        emissionFactorKey: 'waste_landfill_ton',
      },
      {
        id: 'waste_incineration_ton',
        label: 'Limbah Insinerasi',
        unit: 'ton',
        emissionFactorKey: 'waste_incineration_ton',
      },
      {
        id: 'freight_tkm',
        label: 'Logistik Barang',
        unit: 'ton-km',
        emissionFactorKey: 'freight_tkm',
      },
    ],
  },
  {
    title: 'Scope 3: Emisi yang Dibiayai',
    scope: 3,
    fields: [
      {
        id: 'financed_emissions',
        label: 'Estimasi Emisi Portofolio',
        unit: 'tCO2e',
        emissionFactorKey: 'direct_tco2e',
      },
    ],
  },
];

interface PdfReportParams {
  year: number;
  sectorName: string;
  reportTitle?: string;
  reportDate?: string;
  reportId?: string;
  reportMethod?: 'UPLOAD' | 'CALCULATOR';
  reportStatus?: string;
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
  merkleRoot: string;
  txHash?: string;
  blockchainReportId?: number | null;
  thresholdTCO2e?: number;
  sectorBreakdown?: SectorBreakdown[];
  /** key-value pairs of field values, e.g. { genset_diesel: '500', electricity: '50000' } */
  fieldValues?: Record<string, string | number>;
  calculationData?: CalculationData;
}

// ─── Color constants (RGB) ─────────────────────────────────
type RGB = [number, number, number];
const EMERALD: RGB = [4, 120, 87]; // emerald-700
const EMERALD_LIGHT: RGB = [16, 185, 129]; // emerald-500
const EMERALD_BG: RGB = [236, 253, 245]; // emerald-50
const SLATE_800: RGB = [30, 41, 59];
const SLATE_500: RGB = [100, 116, 139];
const SLATE_300: RGB = [203, 213, 225];
const SLATE_100: RGB = [241, 245, 249];
const WHITE: RGB = [255, 255, 255];
const RED_600: RGB = [220, 38, 38];
const AMBER_600: RGB = [217, 119, 6];
const BLUE_600: RGB = [37, 99, 235];

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: 'S' | 'F' | 'FD' = 'F'
) {
  doc.roundedRect(x, y, w, h, r, r, style);
}

function drawParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight = 4.5
) {
  const lines = doc.splitTextToSize(text, width);
  lines.forEach((line: string, index: number) => {
    doc.text(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function drawPageHeader(
  doc: jsPDF,
  pageW: number,
  marginX: number,
  title: string,
  subtitle: string
) {
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('REKAKARBON', marginX, 8);
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  doc.text(subtitle, pageW - marginX, 8, { align: 'right' });
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.setTextColor(...SLATE_800);
  doc.text(title, marginX, 29);
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFillColor(...EMERALD);
  doc.rect(x, y, 3, 7, 'F');
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(...SLATE_800);
  doc.text(title, x + 7, y + 5.5);
  return y + 12;
}

function getMethodLabel(method?: 'UPLOAD' | 'CALCULATOR') {
  return method === 'CALCULATOR' ? 'Kalkulator Hijau' : 'Unggah Dokumen';
}

function formatPdfCarbon(value: number) {
  // jsPDF's built-in Times font is widely supported by PDF viewers.
  // Keep the PDF text ASCII-safe so "tCO2e" is rendered correctly in viewers.
  return `${formatNumber(value, 0, 1)} tCO2e`;
}

function getStatusLabel(status?: string) {
  if (!status) return 'Status Belum Ditentukan';
  const normalized = status.toLowerCase();
  if (normalized === 'approved' || normalized === 'verified') return 'Terverifikasi';
  if (normalized === 'submitted' || normalized === 'audit_in_progress') return 'Menunggu Audit';
  if (normalized === 'rejected') return 'Ditolak';
  if (normalized === 'draft') return 'Draf';
  return status;
}

function getDocumentLabel(status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === 'approved' || normalized === 'verified') return 'DOKUMEN TERVERIFIKASI';
  if (normalized === 'submitted' || normalized === 'audit_in_progress') return 'DOKUMEN TERKIRIM';
  if (normalized === 'rejected') return 'DOKUMEN DITOLAK';
  if (normalized === 'draft') return 'DOKUMEN DRAF';
  return 'DOKUMEN LAPORAN';
}

function splitPdfLines(doc: jsPDF, text: string, width: number) {
  const initialLines = doc.splitTextToSize(text, width) as string[];

  return initialLines.flatMap((line) => {
    if (doc.getTextWidth(line) <= width) return [line];

    const chunks: string[] = [];
    let chunk = '';
    for (const character of line) {
      const nextChunk = chunk + character;
      if (chunk && doc.getTextWidth(nextChunk) > width) {
        chunks.push(chunk);
        chunk = character;
      } else {
        chunk = nextChunk;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  });
}

function drawBlockchainVerification(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  marginX: number,
  contentW: number,
  y: number,
  merkleRoot: string,
  txHash: string | undefined,
  subtitle: string
) {
  const verificationLineHeight = 3.8;
  doc.setFontSize(7.5);
  doc.setFont('times', 'bold');
  const rootLines = splitPdfLines(doc, merkleRoot || '-', contentW - 12);
  const txLines = txHash ? splitPdfLines(doc, txHash, contentW - 12) : [];
  const rootLabelHeight = 6 + verificationLineHeight;
  const transactionHeight = txHash
    ? 2 + verificationLineHeight + txLines.length * verificationLineHeight
    : 0;
  const verificationContentHeight =
    rootLabelHeight + rootLines.length * verificationLineHeight + transactionHeight;
  const verificationHeight = verificationContentHeight + 4;

  if (y + 2 + 10 + verificationHeight + 6 > pageH - 48) {
    doc.addPage();
    y = 20;
    drawPageHeader(doc, pageW, marginX, 'Analisis dan Metodologi Laporan', subtitle);
    y = 40;
  }

  y += 2;
  doc.setFillColor(...EMERALD);
  doc.rect(marginX, y, 3, 7, 'F');
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(...SLATE_800);
  doc.text('Verifikasi Blockchain (dMRV)', marginX + 7, y + 5.5);
  y += 10;

  doc.setFillColor(...SLATE_100);
  drawRoundedRect(doc, marginX, y, contentW, verificationHeight, 3, 'F');
  doc.setDrawColor(...SLATE_300);
  drawRoundedRect(doc, marginX, y, contentW, verificationHeight, 3, 'S');

  const rootLabelY = y + 7;
  const rootY = rootLabelY + verificationLineHeight;
  doc.setFontSize(7.5);
  doc.setFont('times', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('Merkle Root Hash:', marginX + 6, rootLabelY);
  doc.setFont('times', 'bold');
  doc.setTextColor(...SLATE_800);
  rootLines.forEach((line, index) => {
    doc.text(line, marginX + 6, rootY + index * verificationLineHeight);
  });

  if (txHash) {
    const txLabelY = rootY + rootLines.length * verificationLineHeight + 3;
    const txY = txLabelY + verificationLineHeight;
    doc.setFont('times', 'normal');
    doc.setTextColor(...SLATE_500);
    doc.text('Transaction Hash:', marginX + 6, txLabelY);
    doc.setFont('times', 'bold');
    doc.setTextColor(...SLATE_800);
    txLines.forEach((line, index) => {
      doc.text(line, marginX + 6, txY + index * verificationLineHeight);
    });
  }

  return y + verificationHeight + 6;
}

function drawCalculationDataDetails(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  marginX: number,
  contentW: number,
  year: number,
  sectorName: string,
  total: number,
  calculationData: CalculationData
) {
  doc.addPage();
  let y = 20;
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('REKAKARBON - Detail Perhitungan Emisi', marginX, 12);
  doc.setFontSize(8);
  doc.text(`Tahun ${year} | ${sectorName}`, pageW - marginX, 12, { align: 'right' });

  y = drawSectionTitle(doc, 'Rincian Aktivitas Kalkulator', marginX, y + 8);
  doc.setFontSize(7);
  doc.setFont('times', 'italic');
  doc.setTextColor(...SLATE_500);
  doc.text(
    `Versi data: ${calculationData.schemaVersion} | Versi faktor: ${calculationData.factorSetId}`,
    marginX,
    y
  );
  y += 8;

  for (const scope of [1, 2, 3] as const) {
    const scopeEntries = calculationData.entries.filter((entry) => entry.scope === scope);
    if (scopeEntries.length === 0) continue;

    if (y > pageH - 35) {
      doc.addPage();
      y = 20;
    }
    const scopeColor: RGB = scope === 1 ? RED_600 : scope === 2 ? AMBER_600 : BLUE_600;
    doc.setFillColor(...scopeColor);
    doc.rect(marginX, y, contentW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(`Scope ${scope}`, marginX + 4, y + 5.5);
    y += 8;

    for (const entry of scopeEntries) {
      const detail = getCalculationEntryDetail(entry);
      const labelLines = doc.splitTextToSize(entry.sourceLabel, 62) as string[];
      const detailLines = detail ? (doc.splitTextToSize(detail, 62) as string[]) : [];
      const textLines = [...labelLines, ...detailLines];
      const rowHeight = Math.max(9, textLines.length * 3.5 + 3);
      if (y + rowHeight > pageH - 35) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(...(scopeEntries.indexOf(entry) % 2 === 0 ? WHITE : SLATE_100));
      doc.rect(marginX, y, contentW, rowHeight, 'F');
      doc.setFontSize(7);
      doc.setFont('times', 'normal');
      doc.setTextColor(...SLATE_800);
      textLines.forEach((line, index) => doc.text(line, marginX + 3, y + 4 + index * 3.5));
      doc.setFont('times', 'bold');
      doc.text(`${formatNumber(entry.quantity, 0, 2)} ${entry.unit}`, marginX + 70, y + 4);
      doc.setFont('times', 'normal');
      doc.setTextColor(...SLATE_500);
      doc.text(formatNumber(entry.emissionFactor, 0, 3), marginX + 103, y + 4);
      doc.setFont('times', 'bold');
      doc.setTextColor(...EMERALD);
      doc.text(formatPdfCarbon(entry.emissionsTCO2e), pageW - marginX - 3, y + 4, {
        align: 'right',
      });
      y += rowHeight;
    }
    y += 4;
  }

  if (y > pageH - 45) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(...EMERALD_BG);
  doc.rect(marginX, y, contentW, 13, 'F');
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.setTextColor(...EMERALD);
  doc.text('TOTAL EMISI', marginX + 5, y + 8);
  doc.text(formatPdfCarbon(total), pageW - marginX - 5, y + 8, { align: 'right' });
}

function getCalculationEntryDetail(entry: CalculationData['entries'][number]): string | null {
  if (entry.activityType !== 'financed_security') return null;

  const metadata = entry.metadata;
  if (metadata.securityInstrument === 'government_bond') {
    return [
      `Negara: ${metadata.countryLabel ?? metadata.countryCode ?? '-'}`,
      `Nilai SBN: ${formatCurrency(metadata.investmentValueIDR ?? 0)}`,
    ].join(' | ');
  }

  return `Nilai pasar/buku: ${formatCurrency(metadata.investmentValueIDR ?? 0)} | EVIC/Utang+Modal: ${formatCurrency(metadata.issuerDenominatorIDR ?? 0)} | Emisi penerbit: ${formatPdfCarbon(metadata.issuerEmissionsTCO2e ?? 0)}`;
}

export function generateEmissionReportPDF(params: PdfReportParams) {
  const {
    year,
    sectorName,
    reportTitle,
    reportDate,
    reportId,
    reportMethod,
    reportStatus,
    total,
    scope1,
    scope2,
    scope3,
    merkleRoot,
    txHash,
    blockchainReportId,
    thresholdTCO2e,
    sectorBreakdown,
    fieldValues,
    calculationData,
  } = params;

  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setCharSpace(0);
  const pageW = doc.internal.pageSize.getWidth(); // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297
  const marginX = 20;
  const contentW = pageW - marginX * 2; // 170

  let y = 0;

  // ═══════════════════════════════════════════════════════════════════
  // 1. GREEN HEADER BAR
  // ═══════════════════════════════════════════════════════════════════
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, pageW, 36, 'F');

  // Website logo
  doc.setFillColor(...WHITE);
  doc.circle(marginX + 10, 18, 8, 'F');
  doc.addImage(pdfBrandIcon, 'PNG', marginX + 2, 10, 16, 16, 'rekakarbon-pdf-logo', 'FAST');

  // Brand name
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.setFont('times', 'bold');
  doc.text('REKAKARBON', marginX + 22, 16);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text('Platform dMRV Keuangan Hijau Indonesia', marginX + 22, 23);

  // Right side label
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text(getDocumentLabel(reportStatus), pageW - marginX - 2, 14, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.text('Laporan Emisi GRK', pageW - marginX - 2, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.text(
    reportId ? `ID: ${reportId}` : `Ref: RK-${year}-${Date.now().toString(36).toUpperCase()}`,
    pageW - marginX - 2,
    26,
    { align: 'right' }
  );

  y = 46;

  // ═══════════════════════════════════════════════════════════════════
  // 2. DOCUMENT TITLE
  // ═══════════════════════════════════════════════════════════════════
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.setTextColor(...SLATE_800);
  doc.text(`LAPORAN EMISI KARBON TAHUN ${year}`, pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text('Kerangka Scope 1-3 - Referensi Buku Panduan Hijau Bank Indonesia', pageW / 2, y, {
    align: 'center',
  });
  y += 4;
  doc.text(`Dibuat pada: ${formatDateTime(new Date())}`, pageW / 2, y, { align: 'center' });
  y += 10;

  // ═══════════════════════════════════════════════════════════════════
  // 3. METADATA TABLE
  // ═══════════════════════════════════════════════════════════════════
  const metaRows = [
    ['Tahun Kepatuhan', String(year)],
    ['Sektor Industri', sectorName],
    ['Metode Pelaporan', getMethodLabel(reportMethod)],
    ['Status Laporan', getStatusLabel(reportStatus)],
    ['Tanggal Laporan', reportDate ? formatDate(reportDate) : '-'],
    ['Judul Laporan', reportTitle || '-'],
    ...(blockchainReportId !== null && blockchainReportId !== undefined
      ? [['ID Laporan Blockchain', String(blockchainReportId)]]
      : []),
    ['Sidik Jari Blockchain (dMRV)', merkleRoot || '-'],
  ];
  doc.setFontSize(9);
  const maxValW = contentW - 70;
  const metadataRows = metaRows.map(([label, value]) => ({
    label,
    value,
    lines: doc.splitTextToSize(value, maxValW),
  }));
  const metadataHeight = metadataRows.reduce(
    (height, row) => height + Math.max(10, row.lines.length * 4.5 + 5),
    8
  );

  doc.setFillColor(...SLATE_100);
  drawRoundedRect(doc, marginX, y, contentW, metadataHeight, 3, 'F');
  doc.setDrawColor(...SLATE_300);
  drawRoundedRect(doc, marginX, y, contentW, metadataHeight, 3, 'S');

  let metaY = y + 8;
  for (const row of metadataRows) {
    doc.setFont('times', 'normal');
    doc.setTextColor(...SLATE_500);
    doc.text(row.label, marginX + 6, metaY);

    doc.setFont('times', 'bold');
    doc.setTextColor(...SLATE_800);
    row.lines.forEach((line: string, index: number) => {
      doc.text(line, marginX + 64, metaY + index * 4.5);
    });
    metaY += Math.max(10, row.lines.length * 4.5 + 5);
  }
  y += metadataHeight;
  y += 6;

  // ═══════════════════════════════════════════════════════════════════
  // 4. SCOPE TABLE (Main Emission Data)
  // ═══════════════════════════════════════════════════════════════════
  // Section heading
  doc.setFillColor(...EMERALD);
  doc.rect(marginX, y, 3, 7, 'F');
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(...SLATE_800);
  doc.text('Rincian Emisi Per Scope', marginX + 7, y + 5.5);
  y += 12;

  // Table header
  const colX = [marginX, marginX + 100, marginX + contentW];
  doc.setFillColor(...EMERALD);
  doc.rect(marginX, y, contentW, 9, 'F');
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Kategori Cakupan (Scope)', marginX + 4, y + 6);
  doc.text('Nilai Emisi (tCO2e)', colX[2] - 4, y + 6, { align: 'right' });
  y += 9;

  // Table rows
  const scopeRows: [string, number, RGB][] = [
    ['Scope 1: Emisi Langsung (Pembakaran Stasioner & Bergerak)', scope1, RED_600],
    ['Scope 2: Emisi Tidak Langsung (Konsumsi Listrik PLN)', scope2, AMBER_600],
    ['Scope 3: Emisi Rantai Pasok (Perjalanan Dinas, Financed)', scope3, BLUE_600],
  ];

  if (scopeRows.some(([, value]) => value > 0)) {
    for (let i = 0; i < scopeRows.length; i++) {
      const [label, value, dotColor] = scopeRows[i];
      const rowBg = i % 2 === 0 ? WHITE : SLATE_100;
      doc.setFillColor(...rowBg);
      doc.rect(marginX, y, contentW, 10, 'F');

      // Color dot indicator
      doc.setFillColor(...dotColor);
      doc.circle(marginX + 6, y + 5, 2, 'F');

      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(...SLATE_800);
      doc.text(label, marginX + 11, y + 6.5);

      doc.setFont('times', 'bold');
      doc.text(formatPdfCarbon(value), colX[2] - 4, y + 6.5, { align: 'right' });
      y += 10;
    }
  } else {
    // Uploaded documents may contain only an aggregate total. Showing zeroes
    // for all scopes would imply a breakdown that the source did not provide.
    const rowBg = WHITE;
    doc.setFillColor(...rowBg);
    doc.rect(marginX, y, contentW, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(...SLATE_800);
    doc.text('Total dari dokumen (Scope belum dirinci)', marginX + 4, y + 6.5);
    doc.setFont('times', 'bold');
    doc.text(formatPdfCarbon(total), colX[2] - 4, y + 6.5, { align: 'right' });
    y += 10;
  }

  // Total row
  doc.setFillColor(...EMERALD_BG);
  doc.rect(marginX, y, contentW, 12, 'F');
  doc.setDrawColor(...EMERALD_LIGHT);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, marginX + contentW, y);
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(...EMERALD);
  doc.text('TOTAL EMISI', marginX + 4, y + 8);
  doc.setFontSize(13);
  doc.text(formatPdfCarbon(total), colX[2] - 4, y + 8, { align: 'right' });
  y += 16;

  // ═══════════════════════════════════════════════════════════════════
  // 5. THRESHOLD BAR (if available)
  // ═══════════════════════════════════════════════════════════════════
  if (thresholdTCO2e) {
    const pct = Math.min(total / thresholdTCO2e, 1);
    const barW = contentW - 12;
    const barH = 5;
    const isOver = total > thresholdTCO2e;

    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.setTextColor(...SLATE_500);
    doc.text(`Ambang Referensi Sektor (Simulasi): ${formatPdfCarbon(thresholdTCO2e)}`, marginX, y);
    y += 4;

    // Background bar
    doc.setFillColor(...SLATE_100);
    drawRoundedRect(doc, marginX + 6, y, barW, barH, 2, 'F');

    // Fill bar
    doc.setFillColor(...(isOver ? RED_600 : EMERALD_LIGHT));
    if (pct > 0.02) {
      drawRoundedRect(doc, marginX + 6, y, barW * pct, barH, 2, 'F');
    }

    // Percentage label
    doc.setFontSize(7);
    doc.setTextColor(...(isOver ? RED_600 : EMERALD));
    doc.text(`${(pct * 100).toFixed(1)}%`, marginX + 6 + barW + 3, y + 4);
    y += 8;

    if (isOver) {
      doc.setFontSize(8);
      doc.setFont('times', 'bolditalic');
      doc.setTextColor(...RED_600);
      doc.text('[PERINGATAN] Emisi melebihi ambang referensi simulasi sektor ini.', marginX, y);
      y += 6;
    }
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. ANALYSIS & METHODOLOGY
  // ═══════════════════════════════════════════════════════════════════
  const analysisScopeRows: Array<{ label: string; value: number; color: RGB }> = [
    { label: 'Scope 1 - Emisi langsung', value: scope1, color: RED_600 },
    { label: 'Scope 2 - Energi yang dibeli', value: scope2, color: AMBER_600 },
    { label: 'Scope 3 - Emisi tidak langsung lainnya', value: scope3, color: BLUE_600 },
  ];
  const scopeDataTotal = analysisScopeRows.reduce((sum, row) => sum + row.value, 0);
  const hasScopeData = scopeDataTotal > 0;
  const dominantScope = analysisScopeRows.reduce((largest, row) =>
    row.value > largest.value ? row : largest
  );
  const breakdownRows = sectorBreakdown?.filter((sector) => sector.emissionsTCO2e > 0) ?? [];
  const dominantScopePercentage =
    hasScopeData && total > 0 ? (dominantScope.value / total) * 100 : 0;
  const dominantSector = breakdownRows.reduce<SectorBreakdown | null>(
    (largest, sector) =>
      !largest || sector.emissionsTCO2e > largest.emissionsTCO2e ? sector : largest,
    null
  );

  doc.addPage();
  y = 20;
  drawPageHeader(
    doc,
    pageW,
    marginX,
    'Analisis dan Metodologi Laporan',
    `Tahun ${year} | ${sectorName}`
  );
  y = 40;

  y = drawSectionTitle(doc, 'Ringkasan Eksekutif', marginX, y);
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.setTextColor(...SLATE_800);
  const executiveSummary = hasScopeData
    ? `Laporan ini menyajikan ringkasan data emisi gas rumah kaca yang dilaporkan untuk sektor ${sectorName} pada tahun ${year}. Total emisi yang tercatat adalah ${formatPdfCarbon(total)}. Berdasarkan rincian yang tersedia, ${dominantScope.label.toLowerCase()} menjadi kontributor terbesar dengan nilai ${formatPdfCarbon(dominantScope.value)} atau ${formatPercent(dominantScopePercentage)} dari total emisi.`
    : `Laporan ini menyajikan ringkasan data emisi gas rumah kaca yang dilaporkan untuk sektor ${sectorName} pada tahun ${year}. Total emisi yang tercatat adalah ${formatPdfCarbon(total)}. Rincian Scope belum tersedia secara lengkap pada data yang diterima, sehingga interpretasi sumber emisi perlu dilengkapi melalui pemeriksaan data aktivitas atau dokumen sumber.`;
  y = drawParagraph(doc, executiveSummary, marginX, y, contentW, 4);
  y += 3;

  // Key metrics
  const cardGap = 4;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardY = y;
  const metricCards = [
    ['TOTAL EMISI', formatPdfCarbon(total), EMERALD],
    [
      'KONTRIBUTOR TERBESAR',
      hasScopeData ? formatPercent(dominantScopePercentage) : '-',
      dominantScope.color,
    ],
    ['STATUS VERIFIKASI', getStatusLabel(reportStatus), EMERALD_LIGHT],
  ] as const;
  metricCards.forEach(([label, value, color], index) => {
    const cardX = marginX + index * (cardW + cardGap);
    doc.setFillColor(...SLATE_100);
    drawRoundedRect(doc, cardX, cardY, cardW, 25, 2, 'F');
    doc.setDrawColor(...SLATE_300);
    drawRoundedRect(doc, cardX, cardY, cardW, 25, 2, 'S');
    doc.setFillColor(...color);
    doc.rect(cardX, cardY, 2, 25, 'F');
    doc.setFontSize(6.5);
    doc.setFont('times', 'bold');
    doc.setTextColor(...SLATE_500);
    doc.text(label, cardX + 7, cardY + 8);
    doc.setFontSize(index === 2 ? 10 : 11);
    doc.setTextColor(...SLATE_800);
    doc.text(value, cardX + 7, cardY + 18);
  });
  y = cardY + 30;

  y = drawSectionTitle(doc, 'Distribusi Emisi Berdasarkan Data Laporan', marginX, y);
  if (breakdownRows.length > 0) {
    doc.setFillColor(...EMERALD);
    doc.rect(marginX, y, contentW, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('Kategori / Sumber Emisi', marginX + 4, y + 5);
    doc.text('Nilai', pageW - marginX - 34, y + 5, { align: 'right' });
    doc.text('Proporsi', pageW - marginX - 4, y + 5, { align: 'right' });
    y += 7;

    breakdownRows.slice(0, 6).forEach((sector, index) => {
      doc.setFillColor(...(index % 2 === 0 ? WHITE : SLATE_100));
      doc.rect(marginX, y, contentW, 7, 'F');
      doc.setFontSize(7.5);
      doc.setFont('times', 'normal');
      doc.setTextColor(...SLATE_800);
      const label = doc.splitTextToSize(sector.name, 100)[0];
      doc.text(label, marginX + 4, y + 5);
      doc.setFont('times', 'bold');
      doc.text(formatPdfCarbon(sector.emissionsTCO2e), pageW - marginX - 34, y + 5, {
        align: 'right',
      });
      doc.setTextColor(...EMERALD);
      const percentage =
        sector.percentage || (total > 0 ? (sector.emissionsTCO2e / total) * 100 : 0);
      doc.text(formatPercent(percentage, percentage < 1 ? 2 : 1), pageW - marginX - 4, y + 5, {
        align: 'right',
      });
      y += 7;
    });
  } else {
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.setTextColor(...SLATE_500);
    y = drawParagraph(
      doc,
      'Rincian kategori belum tersedia pada data laporan ini. Analisis tetap menampilkan total emisi dan klasifikasi Scope berdasarkan data agregat yang diterima sistem.',
      marginX,
      y + 3,
      contentW,
      4
    );
  }
  y += 2;

  y = drawSectionTitle(doc, 'Metodologi Pengukuran, Pelaporan, dan Verifikasi', marginX, y);
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.setTextColor(...SLATE_800);
  const methodDescription =
    reportMethod === 'CALCULATOR'
      ? `Metode pengumpulan laporan adalah Kalkulator Hijau. Untuk data aktivitas yang diisi, emisi dihitung dengan rumus: emisi (kg CO2e) = jumlah aktivitas x faktor emisi, kemudian dikonversi menjadi tCO2e dengan membagi 1.000.`
      : `Metode pengumpulan laporan adalah Unggah Dokumen. Total emisi diambil dari data submit dan dokumen sumber yang diterima sistem. Rincian formula per aktivitas tidak ditampilkan jika data mentah belum tersedia pada laporan ini.`;
  const methodology = [
    `Klasifikasi emisi menggunakan Scope 1 untuk emisi langsung dari aktivitas yang dikendalikan organisasi, Scope 2 untuk energi yang dibeli, dan Scope 3 untuk emisi tidak langsung seperti perjalanan, rantai pasok, serta emisi yang dibiayai.`,
    methodDescription,
    `Pada lapisan dMRV, data laporan diringkas menjadi Merkle Root dan dicatat pada EmissionReportRegistry di jaringan blockchain. Nilai hash dan transaction hash berfungsi sebagai jejak integritas data yang dikirim. Status laporan saat dokumen ini dibuat adalah ${getStatusLabel(reportStatus).toLowerCase()}; hash blockchain bukan pengganti pemeriksaan auditor.`,
  ];
  for (const paragraph of methodology) {
    doc.setFillColor(...EMERALD_LIGHT);
    doc.circle(marginX + 2, y - 1.5, 1, 'F');
    y = drawParagraph(doc, paragraph, marginX + 7, y, contentW - 7, 3.3);
    y += 1;
  }

  if (dominantSector) {
    doc.setFont('times', 'bold');
    doc.setTextColor(...EMERALD);
    y = drawParagraph(
      doc,
      `Temuan utama: ${dominantSector.name} merupakan kategori dengan kontribusi terbesar, yaitu ${formatPdfCarbon(dominantSector.emissionsTCO2e)}. Prioritas pengurangan emisi dapat diarahkan pada aktivitas di kategori ini setelah data sumber dikonfirmasi.`,
      marginX,
      y + 1,
      contentW,
      3.3
    );
  }

  const caveat =
    'Catatan: laporan ini merupakan keluaran sistem dMRV RekaKarbon. Interpretasi dan keputusan kepatuhan tetap memerlukan pemeriksaan auditor terhadap dokumen sumber, batas organisasi, periode pelaporan, dan faktor emisi yang digunakan.';
  doc.setFont('times', 'italic');
  doc.setTextColor(...SLATE_500);
  const caveatLines = doc.splitTextToSize(caveat, contentW);
  const caveatHeight = caveatLines.length * 3.3;
  if (y + 1 + caveatHeight > pageH - 48) {
    doc.addPage();
    y = 20;
    drawPageHeader(doc, pageW, marginX, 'Catatan Laporan', `Tahun ${year} | ${sectorName}`);
    y = 40;
  }
  y = drawParagraph(doc, caveat, marginX, y + 1, contentW, 3.3) + 1;

  y = drawBlockchainVerification(
    doc,
    pageW,
    pageH,
    marginX,
    contentW,
    y,
    merkleRoot,
    txHash,
    `Tahun ${year} | ${sectorName}`
  );

  // ═══════════════════════════════════════════════════════════════════
  // 8. DETAIL BREAKDOWN TABLE WITH FORMULAS
  // ═══════════════════════════════════════════════════════════════════
  const EMISSION_FACTOR_MAP: Record<string, { factor: number; factorLabel: string }> = {
    diesel_liter: { factor: 2.512, factorLabel: '2,512 kg CO2e/L' },
    gasoline_liter: { factor: 2.105, factorLabel: '2,105 kg CO2e/L' },
    lpg_kg: { factor: 2.939, factorLabel: '2,939 kg CO2e/kg' },
    natural_gas_m3: { factor: 2.023, factorLabel: '2,023 kg CO2e/m3' },
    coal_kg: { factor: 2.531, factorLabel: '2,531 kg CO2e/kg' },
    heavy_fuel_oil_liter: { factor: 3.168, factorLabel: '3,168 kg CO2e/L' },
    refrigerant_kg: { factor: 2088, factorLabel: '2.088 kg CO2e/kg' },
    co2_fire_ext_kg: { factor: 1, factorLabel: '1 kg CO2e/kg' },
    cement_clinker_ton: { factor: 525, factorLabel: '525 kg CO2e/ton' },
    lime_ton: { factor: 750, factorLabel: '750 kg CO2e/ton' },
    fertilizer_urea_kg: { factor: 0.733, factorLabel: '0,733 kg CO2e/kg' },
    rice_paddy_ha: { factor: 5110, factorLabel: '5.110 kg CO2e/ha' },
    livestock_cattle_head: { factor: 2070, factorLabel: '2.070 kg CO2e/ekor' },
    electricity_kwh: { factor: 0.207, factorLabel: '0,207 kg CO2e/kWh' },
    flight_km: { factor: 0.244, factorLabel: '0,244 kg CO2e/pkm' },
    car_km: { factor: 0.171, factorLabel: '0,171 kg CO2e/km' },
    paper_kg: { factor: 0.895, factorLabel: '0,895 kg CO2e/kg' },
    water_m3: { factor: 0.149, factorLabel: '0,149 kg CO2e/m3' },
    waste_landfill_ton: { factor: 588.9, factorLabel: '588,9 kg CO2e/ton' },
    waste_incineration_ton: { factor: 21.3, factorLabel: '21,3 kg CO2e/ton' },
    freight_tkm: { factor: 0.119, factorLabel: '0,119 kg CO2e/ton-km' },
    direct_tco2e: { factor: 1000, factorLabel: '1.000 kg CO2e/tCO2e' },
  };

  if (calculationData && calculationData.entries.length > 0) {
    drawCalculationDataDetails(
      doc,
      pageW,
      pageH,
      marginX,
      contentW,
      year,
      sectorName,
      total,
      calculationData
    );
  } else if (fieldValues && Object.keys(fieldValues).length > 0) {
    // Always start on a new page for detail
    doc.addPage();
    y = 20;

    // Page 2 header
    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('REKAKARBON - Detail Perhitungan Emisi', marginX, 12);
    doc.setFontSize(8);
    doc.text(`Tahun ${year} | ${sectorName}`, pageW - marginX, 12, { align: 'right' });
    y = 28;

    // Section title
    doc.setFillColor(...EMERALD);
    doc.rect(marginX, y, 3, 7, 'F');
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.setTextColor(...SLATE_800);
    doc.text('Rincian Kalkulasi Per Sumber Emisi', marginX + 7, y + 5.5);
    y += 10;

    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.setTextColor(...SLATE_500);
    doc.text(
      'Rumus: Emisi (kg CO2e) = Konsumsi (unit) x Faktor Emisi (kg CO2e/unit)   |   Faktor: konfigurasi Kalkulator Hijau RekaKarbon',
      marginX,
      y + 3
    );
    y += 8;

    for (const cat of PDF_CATEGORIES) {
      const filledFields = cat.fields.filter((f) => {
        const v = Number(fieldValues[f.id] || 0);
        return v > 0;
      });
      if (filledFields.length === 0) continue;

      // Check page break
      if (y > pageH - 50) {
        doc.addPage();
        y = 20;
      }

      // Category header row
      const scopeColor: RGB = cat.scope === 1 ? RED_600 : cat.scope === 2 ? AMBER_600 : BLUE_600;
      doc.setFillColor(...scopeColor);
      doc.rect(marginX, y, contentW, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('times', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(cat.title, marginX + 4, y + 5.5);
      y += 8;

      // Column headers
      doc.setFillColor(...SLATE_100);
      doc.rect(marginX, y, contentW, 7, 'F');
      doc.setFontSize(7);
      doc.setFont('times', 'bold');
      doc.setTextColor(...SLATE_500);
      doc.text('Sumber Emisi', marginX + 3, y + 5);
      doc.text('Konsumsi', marginX + 55, y + 5);
      doc.text('Faktor Emisi', marginX + 85, y + 5);
      doc.text('Rumus', marginX + 118, y + 5);
      doc.text('Hasil (kg CO2e)', contentW + marginX - 3, y + 5, { align: 'right' });
      y += 7;

      let catTotal = 0;

      for (let fi = 0; fi < filledFields.length; fi++) {
        const field = filledFields[fi];
        const val = Number(fieldValues[field.id] || 0);
        const efInfo = EMISSION_FACTOR_MAP[field.emissionFactorKey];
        const factor = efInfo?.factor ?? 0;
        const factorLabel = efInfo?.factorLabel ?? '-';
        const emissionKg = val * factor;
        catTotal += emissionKg;

        // Check page break mid-table
        if (y > pageH - 20) {
          doc.addPage();
          y = 20;
        }

        const rowBg: RGB = fi % 2 === 0 ? WHITE : SLATE_100;
        doc.setFillColor(...rowBg);
        doc.rect(marginX, y, contentW, 8, 'F');

        doc.setFontSize(7);
        doc.setFont('times', 'normal');
        doc.setTextColor(...SLATE_800);
        doc.text(field.label, marginX + 3, y + 5.5);

        // Konsumsi
        doc.setFont('times', 'bold');
        doc.text(`${formatNumber(val)} ${field.unit}`, marginX + 55, y + 5.5);

        // Faktor emisi
        doc.setFont('times', 'normal');
        doc.setTextColor(...SLATE_500);
        doc.text(factorLabel, marginX + 85, y + 5.5);

        // Formula
        doc.setFont('times', 'normal');
        doc.setTextColor(...SLATE_800);
        doc.text(`${formatNumber(val)} x ${formatNumber(factor, 0, 3)}`, marginX + 118, y + 5.5);

        // Result
        doc.setFont('times', 'bold');
        doc.setTextColor(...EMERALD);
        doc.text(formatNumber(emissionKg, 0, 1), contentW + marginX - 3, y + 5.5, {
          align: 'right',
        });

        y += 8;
      }

      // Category subtotal
      doc.setFillColor(...EMERALD_BG);
      doc.rect(marginX, y, contentW, 8, 'F');
      doc.setDrawColor(...EMERALD_LIGHT);
      doc.line(marginX, y, marginX + contentW, y);
      doc.setFontSize(8);
      doc.setFont('times', 'bold');
      doc.setTextColor(...EMERALD);
      doc.text(`Subtotal ${cat.title}`, marginX + 3, y + 5.5);
      doc.text(
        `${formatNumber(catTotal, 0, 1)} kg CO2e  (${formatPdfCarbon(catTotal / 1000)})`,
        contentW + marginX - 3,
        y + 5.5,
        { align: 'right' }
      );
      y += 12;
    }

    // Grand total box on detail page
    if (y > pageH - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(...EMERALD);
    doc.rect(marginX, y, contentW, 14, 'F');
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('GRAND TOTAL EMISI', marginX + 6, y + 9);
    doc.setFontSize(14);
    doc.text(formatPdfCarbon(total), contentW + marginX - 6, y + 9, { align: 'right' });
    y += 20;

    // Methodology note
    doc.setFontSize(7);
    doc.setFont('times', 'italic');
    doc.setTextColor(...SLATE_500);
    doc.text('Catatan Metodologi:', marginX, y);
    y += 4;
    doc.setFont('times', 'normal');
    const methNotes = [
      '- Faktor emisi menggunakan faktor yang dikonfigurasi pada Kalkulator Hijau RekaKarbon.',
      '- Scope 2 mencakup emisi tidak langsung dari konsumsi listrik yang dibeli.',
      '- Scope 3 mencakup perjalanan dinas, barang dan utilitas, logistik, serta emisi yang dibiayai.',
      '- Konversi: 1 tCO2e = 1.000 kg CO2e. Nilai ditampilkan dengan pembulatan seperlunya.',
      '- Struktur Scope 1-3 menggunakan referensi Buku Panduan Hijau Bank Indonesia; ini bukan pengesahan resmi.',
    ];
    for (const note of methNotes) {
      doc.text(note, marginX, y);
      y += 3.5;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 9. FOOTER / PENGESAHAN
  // ═══════════════════════════════════════════════════════════════════
  // Push to bottom of page
  const footerY = pageH - 40;

  doc.setDrawColor(...SLATE_300);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY, pageW - marginX, footerY);

  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  doc.setTextColor(...SLATE_500);
  doc.text(
    'Dokumen ini dihasilkan secara otomatis oleh sistem RekaKarbon. Data laporan diringkas',
    marginX,
    footerY + 5
  );
  doc.text(
    'menggunakan hashing dMRV (digital Measurement, Reporting, and Verification).',
    marginX,
    footerY + 9
  );
  doc.text(
    'Referensi struktur: Buku Panduan Hijau Bank Indonesia dan konfigurasi metodologi RekaKarbon.',
    marginX,
    footerY + 13
  );

  // Stamp
  doc.setDrawColor(...EMERALD_LIGHT);
  doc.setLineWidth(0.8);
  doc.setFillColor(...EMERALD_BG);
  drawRoundedRect(doc, pageW - marginX - 42, footerY + 3, 40, 18, 3, 'FD');
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.setTextColor(...EMERALD);
  doc.text(getStatusLabel(reportStatus).toUpperCase(), pageW - marginX - 22, footerY + 10, {
    align: 'center',
  });
  doc.setFontSize(7);
  doc.text('dMRV Blockchain', pageW - marginX - 22, footerY + 15, { align: 'center' });

  // Page number
  doc.setFontSize(7);
  doc.setTextColor(...SLATE_500);
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 9. SAVE
  // ═══════════════════════════════════════════════════════════════════
  doc.save(`Laporan_Emisi_RekaKarbon_${year}.pdf`);
}
