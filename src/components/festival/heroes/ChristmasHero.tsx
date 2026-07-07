'use client';

export default function ChristmasHero() {
  return (
    <div className="relative flex flex-col items-center justify-center w-[320px] h-[420px]">
      
      <style>{`
        @keyframes float-star {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.8)); }
          50% { transform: translateY(-6px) scale(1.1); filter: drop-shadow(0 0 25px rgba(251, 191, 36, 1)); }
        }
        @keyframes glow-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      {/* ── The Glowing Star ── */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 z-20 text-amber-400" style={{ animation: 'float-star 3s ease-in-out infinite' }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* ── The Premium Layered SVG Tree ── */}
      <div className="relative z-10 scale-110 -mb-2">
        <svg width="220" height="260" viewBox="0 0 220 280">
          <defs>
            {/* Deep Green Foliage Gradient */}
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            
            {/* ✅ Golden Highlight for Broaders/Edges */}
            <linearGradient id="goldEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0.8)" />
            </linearGradient>

            {/* Trunk Gradient */}
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Subtle Drop Shadow for Tree */}
            <filter id="treeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.25"/>
            </filter>
          </defs>

          {/* Tree Group */}
          <g filter="url(#treeShadow)">
            {/* Layer 1 (Bottom - Widest) */}
            <path d="M 110 160 Q 30 160 10 240 L 210 240 Q 190 160 110 160 Z" fill="url(#treeGrad)" />
            <path d="M 110 160 Q 30 160 10 240 L 210 240 Q 190 160 110 160 Z" fill="none" stroke="url(#goldEdgeGrad)" strokeWidth="3" />

            {/* Layer 2 (Middle) */}
            <path d="M 110 100 Q 50 100 35 190 L 185 190 Q 170 100 110 100 Z" fill="url(#treeGrad)" />
            <path d="M 110 100 Q 50 100 35 190 L 185 190 Q 170 100 110 100 Z" fill="none" stroke="url(#goldEdgeGrad)" strokeWidth="2.5" />

            {/* Layer 3 (Upper Middle) */}
            <path d="M 110 55 Q 70 55 60 130 L 160 130 Q 150 55 110 55 Z" fill="url(#treeGrad)" />
            <path d="M 110 55 Q 70 55 60 130 L 160 130 Q 150 55 110 55 Z" fill="none" stroke="url(#goldEdgeGrad)" strokeWidth="2" />

            {/* Layer 4 (Top Tip) */}
            <path d="M 110 20 Q 90 20 85 80 L 135 80 Q 130 20 110 20 Z" fill="url(#treeGrad)" />
            <path d="M 110 20 Q 90 20 85 80 L 135 80 Q 130 20 110 20 Z" fill="none" stroke="url(#goldEdgeGrad)" strokeWidth="1.5" />
          </g>

          {/* Trunk */}
          <rect x="90" y="235" width="40" height="35" rx="4" fill="url(#trunkGrad)" />
        </svg>
      </div>

      {/* ── Hanging Ornaments (Positioned for the new broad tree) ── */}
      {/* Red Ball */}
      <div className="absolute top-[52%] left-[32%] w-6 h-6 rounded-full z-20 border border-white/20"
           style={{ background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #7f1d1d)', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.7)' }} />
      
      {/* Gold Ball */}
      <div className="absolute top-[45%] right-[30%] w-5 h-5 rounded-full z-20 border border-white/20"
           style={{ background: 'radial-gradient(circle at 30% 30%, #fde68a, #f59e0b, #92400e)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.7)' }} />

      {/* Blue Ball */}
      <div className="absolute top-[65%] left-[55%] w-5 h-5 rounded-full z-20 border border-white/20"
           style={{ background: 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6, #1e3a8a)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.7)' }} />

      {/* ── String Lights (Glowing Dots mapped to broad tree) ── */}
      <div className="absolute top-[40%] left-[55%] z-20 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-200 shadow-[0_0_10px_4px_rgba(253,224,71,0.8)]" />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-yellow-200" style={{ animation: 'glow-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>
      <div className="absolute top-[58%] left-[38%] z-20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-green-200 shadow-[0_0_10px_4px_rgba(134,239,172,0.8)]" />
        <div className="absolute w-2 h-2 rounded-full bg-green-200" style={{ animation: 'glow-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>
      <div className="absolute top-[72%] right-[40%] z-20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-red-200 shadow-[0_0_10px_4px_rgba(254,202,202,0.8)]" />
        <div className="absolute w-2 h-2 rounded-full bg-red-200" style={{ animation: 'glow-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>
      <div className="absolute top-[48%] left-[42%] z-20 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 shadow-[0_0_8px_3px_rgba(191,219,254,0.8)]" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-200" style={{ animation: 'glow-ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      </div>

      {/* ── The Text ── */}
      <div className="relative z-20 mt-4 text-center">
        <h1 
          className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 tracking-wide"
          style={{ 
            fontFamily: 'Georgia, serif', 
            textShadow: '0px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(251, 191, 36, 0.4)' 
          }}
        >
          Merry Christmas
        </h1>
        <div className="w-24 h-[1px] mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-600/60 to-transparent" />
        <p 
          className="text-[11px] text-slate-700 mt-2 tracking-[0.25em] uppercase font-bold"
          style={{ textShadow: '0px 1px 2px rgba(255,255,255,0.8)' }}
        >
          Warm Wishes from Saanify
        </p>
      </div>

    </div>
  );
}
