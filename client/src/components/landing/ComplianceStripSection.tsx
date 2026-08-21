export default function ComplianceStripSection() {
  const items = [
    'UU No. 7/2021 HPP',
    'Perpres No. 98/2021',
    'SRN-PPI',
    'ISO 14064-2',
    'ISO 14064-3',
    'Hyperledger Besu Enterprise EVM',
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-[11px] text-slate-400 font-medium tracking-widest mb-7 uppercase">
          Teraudit dan patuh terhadap regulasi nasional &amp; standar internasional
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {items.map((item, i) => (
            <span key={i} className="text-slate-300 font-black text-sm tracking-tight select-none">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
