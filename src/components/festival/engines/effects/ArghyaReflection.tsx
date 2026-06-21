'use client';

export default function ArghyaReflection() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* 🌊 1. WATER BASE (Deep Blue Gradient) */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '35%',
          background: `
            linear-gradient(
              to top,
              rgba(0,40,80,0.95),
              rgba(0,80,140,0.55),
              transparent
            )
          `,
        }}
      />

      {/* ✨ 2. SUN REFLECTION ON WATER (Chamakta hua rasta) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0"
        style={{
          width: '220px',
          height: '35%',
          background: `
            linear-gradient(
              to top,
              rgba(255,220,120,0.6),
              rgba(255,220,120,0.2),
              transparent
            )
          `,
          filter: 'blur(20px)',
          opacity: 0.8,
        }}
      />

      {/* 🌊 3. WATER RIPPLES (Lehariyan) */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '35%',
          background:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.02) 3px, transparent 6px)',
          opacity: 0.3,
        }}
      />

      {/* ❌ DEVOTEE SILHOUETTE AUR REFLECTION HATA DIYA GAYA HAI ❌ */}

    </div>
  );
}
