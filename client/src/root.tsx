import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';
import { Toaster } from '@/components/ui/toaster';
import brandIcon from './assets/icon.png';
import './styles/index.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href={brandIcon} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body
        className="bg-slate-50 text-slate-800 antialiased min-h-screen"
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md space-y-4 border border-slate-200">
          <h1 className="text-4xl font-black text-slate-900">{error.status}</h1>
          <p className="text-xs text-slate-500 font-medium">
            {error.status === 404
              ? 'Halaman atau sumber daya yang Anda cari tidak ditemukan.'
              : error.statusText || 'Terjadi kesalahan pada sistem.'}
          </p>
          <a
            href="/"
            className="inline-block bg-primary-gradient text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-6 text-center font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md space-y-4 border border-slate-200">
        <h1 className="text-lg font-black text-slate-900">Terjadi Kesalahan Sistem</h1>
        <p className="text-xs text-slate-500">
          {(error as Error)?.message || 'Aplikasi mengalami kendala teknis saat memuat komponen.'}
        </p>
        <a
          href="/"
          className="inline-block bg-primary-gradient text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
        >
          Muat Ulang Beranda
        </a>
      </div>
    </div>
  );
}
