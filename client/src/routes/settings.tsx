export function meta() {
  return [
    { title: 'Pengaturan Sistem | RekaKarbon' },
    { name: 'description', content: 'Pengaturan Sistem RekaKarbon' },
  ];
}

export default function SettingsRoute() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
      <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h2>
      <p className="text-xs text-slate-500 font-semibold">
        Konfigurasi kunci API, verichain node, dan preferensi akun pengguna.
      </p>
    </div>
  );
}
