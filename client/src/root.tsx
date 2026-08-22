import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from 'react-router';
import { Toaster } from '@/components/ui/toaster';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    const is403 = error.status === 403;
    const is404 = error.status === 404;

    const errorDescription =
      typeof error.data === 'string'
        ? error.data
        : is403
          ? 'Akun Anda tidak memiliki hak otorisasi untuk mengakses sumber daya atau instrumen ini.'
          : is404
            ? 'Maaf, rute URL yang Anda tuju tidak terdaftar di sistem RekaKarbon.'
            : error.statusText || 'Terjadi kendala pada sistem.';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900 relative overflow-hidden font-sans">
        {/* Soft Ambient Light Glows */}
        <div className="absolute w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
        <div className="absolute w-[400px] h-[400px] bg-[#00C48C]/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

        <Card className="max-w-md w-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xl z-10 text-left">
          <CardHeader className="space-y-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img src={brandIcon} alt="RekaKarbon Logo" className="w-8 h-8 object-contain" />
              <div>
                <h2 className="font-black text-sm text-slate-900 leading-none">REKAKARBON</h2>
                <span className="text-[9px] text-[#00C48C] font-extrabold block mt-0.5 uppercase tracking-wider">
                  Verification Platform
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <Badge
              variant={is403 ? 'outline' : 'destructive'}
              className={`flex w-fit items-center gap-1.5 px-3 py-1 text-xs ${
                is403
                  ? 'border-amber-300 text-amber-900 bg-amber-50 font-black'
                  : 'bg-rose-500 text-white font-bold'
              }`}
            >
              {is403 ? (
                <Lock className="w-4 h-4 text-amber-700" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              <span>
                {is403
                  ? 'ERROR 403 — FORBIDDEN (AKSES DIBATASI)'
                  : is404
                    ? 'ERROR 404 — NOT FOUND'
                    : `ERROR ${error.status}`}
              </span>
            </Badge>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {is403
                  ? 'Akses Sumber Daya Dibatasi'
                  : is404
                    ? 'Halaman Tidak Ditemukan'
                    : 'Kendala Akses'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 leading-relaxed font-normal">
                {errorDescription}
              </CardDescription>
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex flex-col gap-2.5 w-full">
            <Button
              asChild
              variant="default"
              size="default"
              className="w-full h-10 bg-[#183B32] hover:bg-[#122e27] text-[#00E599] font-black cursor-pointer"
            >
              <Link to="/dashboard" className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4 text-[#00E599]" />
                Kembali ke Dashboard
              </Link>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={() => window.history.back()}
              className="w-full h-10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Sebelumnya
            </Button>
          </CardFooter>
        </Card>

        <p className="text-[10px] text-slate-400 mt-8 z-10 font-medium">
          RekaKarbon Verichain Architecture by What Time is it ?
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-900 font-sans">
      <Card className="max-w-md w-full bg-white border border-slate-200 shadow-xl p-6 text-left space-y-4">
        <h1 className="text-lg font-black text-slate-900">Terjadi Kendala Sistem</h1>
        <p className="text-xs text-slate-500">
          {(error as Error)?.message || 'Aplikasi mengalami kendala teknis saat memuat komponen.'}
        </p>
        <Button asChild className="w-full bg-[#183B32] text-[#00E599] font-bold">
          <Link to="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </Card>
    </div>
  );
}
