'use client';

export default function ChristmasHero() {
  return (
    <div className="relative flex flex-col items-center justify-center w-[320px] h-[420px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(34,197,94,0.15)] border border-white/10">
      
      <style>{`
        @keyframes float-star {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.8)); }
          50% { transform: translateY(-6px) scale(1.1); filter: drop-shadow(0 0 25px rgba(251, 191, 36, 1)); }
        }
        @keyframes glow-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes subtle-snow {
          0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.6; }
          100% { transform: translateY(420px) translateX(20px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* ── Background Atmosphere ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl" />
      
      {/* ── Subtle Falling Snow (CSS Only) ── */}
      <div className="absolute w-1.5 h-1.5 bg-white/60 rounded-full top-0 left-[15%]" style={{ animation: 'subtle-snow 6s linear infinite' }} />
      <div className="absolute w-2 h-2 bg-white/40 rounded-full top-0 left-[45%]" style={{ animation: 'subtle-snow 8s linear infinite', animationDelay: '2s' }} />
      <div className="absolute w-1 h-1 bg-white/70 rounded-full top-0 right-[20%]" style={{ animation: 'subtle-snow 7s linear infinite', animationDelay: '4s' }} />
      <div className="absolute w-1.5 h-1.5 bg-white/50 rounded-full top-0 right-[40%]" style={{ animation: 'subtle-snow 9s linear infinite', animationDelay: '1s' }} />

      {/* ── The Glowing Star ── */}
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-20 text-amber-400" style={{ animation: 'float-star 3s ease-in-out infinite' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* ── The Realistic SVG Tree ── */}
      <div className="relative z-10 drop-shadow-2xl scale-110 -mb-2">
        <svg width="140" height="180" viewBox="0 0 100 120">
          <defs>
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          {/* Tree Layers */}
          <path d="M50 15 L75 45 L62 45 L85 75 L60 75 L75 105 L25 105 L40 75 L15 75 L38 45 L25 45 Z" fill="url(#treeGrad)" />
          {/* Trunk */}
          <rect x="40" y="100" width="20" height="20" rx="2" fill="url(#trunkGrad)" />
        </svg>
      </div>

      {/* ── Hanging Ornaments (Shiny 3D Balls) ── */}
      {/* Red Ball */}
      <div className="absolute top-[34%] left-[40%] w-5 h-5 rounded-full z-20 border border-white/20"
           style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #7f1d1d)', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.6)' }} />
      
      {/* Gold Ball */}
      <div className="absolute top-[46%] right-[39%] w-4 h-4 rounded-full z-20 border border-white/20"
           style={{ background: 'radial-gradient(circle at 30% 30%, #fde68a, #f59e0b, #92400e)', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.6)' }} />

      {/* Blue Ball */}
      <div className="absolute top-[62%] left-[44%] w-4.5 h-4.5 rounded-full z-20 border border-white/20"
           style={{ background: 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6, #1e3a8a)', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.6)' }} />

      {/* ── String Lights (Glowing Dots) ── */}
      <div className="absolute top-[30%] left-[52%] z-20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_8px_3px_rgba(253,224,71,0.8)]" />
        <div className="absolute w-2 h-2 rounded-full bg-yellow-200" style={{ animation: 'glow-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>
      <div className="absolute top-[55%] left-[36%] z-20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-green-200 shadow-[0_0_8px_3px_rgba(134,239,172,0.8)]" />
        <div className="absolute w-2 h-2 rounded-full bg-green-200" style={{ animation: 'glow-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>
      <div className="absolute top-[70%] right-[38%] z-20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-red-200 shadow-[0_0_8px_3px_rgba(254,202,202,0.8)]" />
        <div className="absolute w-2 h-2 rounded-full bg-red-200" style={{ animation: 'glow-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>

      {/* ── The Text ── */}
      <div className="relative z-20 mt-2 text-center">
        <h1 
          className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 tracking-wide"
          style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 30px rgba(251, 191, 36, 0.3)' }}
        >
          Merry Christmas
        </h1>
        <div className="w-24 h-[1px] mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <p className="text-[11px] text-slate-400 mt-2 tracking-[0.25em] uppercase font-medium">
          Warm Wishes from Saanify
        </p>
      </div>

    </div>
  );
}
