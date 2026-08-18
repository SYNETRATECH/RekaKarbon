import { Link } from 'react-router';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import brandIcon from '../assets/icon.png';
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

export function meta() {
  return [
    { title: '404 - Halaman Tidak Ditemukan | RekaKarbon' },
    { name: 'description', content: 'Halaman yang Anda cari tidak ditemukan.' },
  ];
}

export default function NotFoundRoute() {
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
            variant="destructive"
            className="flex w-fit items-center gap-1.5 px-3 py-1 text-xs"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ERROR 404 — NOT FOUND</span>
          </Badge>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Halaman Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 leading-relaxed font-normal">
              Maaf, halaman atau rute URL yang Anda tuju tidak terdaftar di sistem RekaKarbon.
              Silakan kembali ke Beranda atau Portal.
            </CardDescription>
          </div>
        </CardContent>

        <CardFooter className="pt-2 flex flex-col gap-2.5 w-full">
          <Button asChild variant="default" size="default" className="w-full h-10">
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4 text-[#00C48C]" />
              Kembali ke Beranda
            </Link>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => window.history.back()}
            className="w-full h-10 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </CardFooter>
      </Card>

      <p className="text-[10px] text-slate-400 mt-8 z-10 font-medium">
        RekaKarbon Verichain Architecture by What Time is it ?
      </p>
    </div>
  );
}
