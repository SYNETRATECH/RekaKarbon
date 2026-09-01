import type { RetirementCertificateVerification } from '@/types';

export function getRetirementVerificationUrl(txHash: string): string {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL;
  const origin = configuredOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/verifikasi-sertifikat?txHash=${encodeURIComponent(txHash)}`;
}

export function getRetirementQrUrl(verificationUrl: string): string {
  return `https://quickchart.io/qr?text=${encodeURIComponent(verificationUrl)}&size=240&margin=2&ecLevel=H`;
}
