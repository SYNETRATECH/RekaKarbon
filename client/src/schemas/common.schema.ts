import { z } from 'zod';

/**
 * Common Reusable Domain Primitives for RekaKarbon Client
 * Defines strict invariant types matching backend Prisma & NestJS specifications.
 */

// 1. Identifiers & Hashes
export const UuidSchema = z.uuid({ message: 'ID harus berupa format UUID yang valid' });

export const EntityIdSchema = z.string().min(1, { message: 'ID entitas tidak boleh kosong' });

export const WalletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Alamat dompet (wallet address) EVM/Besu tidak valid (harus 0x diikuti 40 karakter hex)',
});

export const TxHashSchema = z.string().regex(/^0x[a-fA-F0-9]{16,64}$/, {
  message: 'Hash transaksi blockchain tidak valid (harus 0x diikuti karakter hex)',
});

// 2. Identity & Taxation
export const EmailSchema = z.email({ message: 'Format alamat email tidak valid' });

export const NpwpSchema = z.string().regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, {
  message: 'Format NPWP tidak valid (harus XX.XXX.XXX.X-XXX.XXX)',
});

export const SpeCertificateIdSchema = z
  .string()
  .min(3, { message: 'Nomor sertifikat SPE-GRK tidak boleh kosong' });

// 3. Dates & Timestamps
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Format tanggal harus berupa YYYY-MM-DD',
});

export const DateTimeStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/, {
    message: 'Format timestamp harus ISO 8601',
  });

export const YearSchema = z
  .number()
  .int({ message: 'Tahun harus berupa bilangan bulat' })
  .min(2000, { message: 'Tahun minimal adalah 2000' })
  .max(2100, { message: 'Tahun maksimal adalah 2100' });

// 4. Financial & Physical Quantities
export const IdrAmountSchema = z
  .number()
  .nonnegative({ message: 'Nominal mata uang IDR tidak boleh bernilai negatif' });

export const CarbonVolumeSchema = z
  .number()
  .nonnegative({ message: 'Volume emisi / serapan karbon tCO2e tidak boleh negatif' });

export const HectaresSchema = z
  .number()
  .nonnegative({ message: 'Luas area hektar tidak boleh bernilai negatif' });

export const FileSizeBytesSchema = z
  .number()
  .int({ message: 'Ukuran file harus berupa bilangan bulat' })
  .nonnegative({ message: 'Ukuran file (bytes) tidak boleh bernilai negatif' });

// 5. Spatial & Environmental Metrics
export const LatitudeSchema = z
  .number()
  .min(-90, { message: 'Latitude harus berada dalam rentang -90 hingga +90 derajat' })
  .max(90, { message: 'Latitude harus berada dalam rentang -90 hingga +90 derajat' });

export const LongitudeSchema = z
  .number()
  .min(-180, { message: 'Longitude harus berada dalam rentang -180 hingga +180 derajat' })
  .max(180, { message: 'Longitude harus berada dalam rentang -180 hingga +180 derajat' });

export const VegetationIndexSchema = z
  .number()
  .min(-1.0, { message: 'Indeks vegetasi (NDVI / EVI) harus >= -1.0' })
  .max(1.0, { message: 'Indeks vegetasi (NDVI / EVI) harus <= 1.0' });

export const PercentageSchema = z
  .number()
  .min(0, { message: 'Persentase minimal 0%' })
  .max(100, { message: 'Persentase maksimal 100%' });

export const MetricPercentageSchema = z
  .number()
  .nonnegative({ message: 'Metrik persentase tidak boleh negatif' });
