'use client';

export default function FloatingDiyas() {
  // 🚀 10 Diye pure screen par phailane ke liye
  const diyas = [
    { left: '5%', bottom: '15%', size: 1.5, delay: '0s' },
    { left: '85%', bottom: '10%', size: 1.2, delay: '1s' },
    { left: '20%', bottom: '5%', size: 0.8, delay: '2s' },
    { left: '75%', bottom: '25%', size: 1.1, delay: '0.5s' },
    { left: '40%', bottom: '12%', size: 0.9, delay: '3s' },
    { left: '60%', bottom: '8%', size: 1.0, delay: '1.5s' },
    { left: '15%', top: '20%', size: 0.7, delay: '4s' },
    { left: '80%', top: '15%', size: 0.9, delay: '2.5s' },
    { left: '10%', bottom: '30%', size: 1.2, delay: '3.5s' },
    { left: '90%', bottom: '35%', size: 0.8, delay: '1s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {diyas.map((diya, index) => (
        <div
          key={index}
          className="absolute diya-float"
          style={{
            left: diya.left,
            top: diya.top,
            bottom: diya.bottom,
            animationDelay: diya.delay,
          }}
        >
          {/* Scale Wrapper */}
          <div style={{ transform: `scale(${diya.size})` }} className="diya-scale-wrapper">
            {/* Glow Halo */}
            <div className="diya-glow"></div>
            
            {/* Flame */}
            <div className="flame">
              <div className="flame-inner"></div>
            </div>
            
            {/* Diya Base (Clay Pot) */}
            <div className="diya-base">
              <div className="diya-base-top"></div>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .diya-float {
          filter: drop-shadow(0 0 10px rgba(255, 204, 0, 0.4));
          animation: floatDiya 6s ease-in-out infinite alternate;
        }
        
        .diya-scale-wrapper {
          position: relative;
          width: 50px;
          height: 50px;
        }

        /* === DIYA GLOW === */
        .diya-glow {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(255, 204, 0, 0.4) 0%, rgba(234, 88, 12, 0.1) 40%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
          animation: glowPulse 2s ease-in-out infinite;
        }

        /* === FLAME === */
        .flame {
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%) rotate(-45deg);
          width: 12px;
          height: 18px;
          background: linear-gradient(to top, #f97316 0%, #fbbf24 50%, #fef3c7 100%);
          border-radius: 0 50% 50% 50%;
          box-shadow: 0 0 15px rgba(251, 191, 36, 0.8);
          z-index: 2;
          animation: flicker 0.1s infinite alternate;
          transform-origin: bottom center;
        }

        .flame-inner {
          position: absolute;
          bottom: 2px;
          left: 2px;
          width: 5px;
          height: 8px;
          background: #fffbeb;
          border-radius: 0 50% 50% 50%;
          opacity: 0.8;
        }

        /* === DIYA BASE (CLAY) === */
        .diya-base {
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 14px;
          background: linear-gradient(to bottom, #7c2d12 0%, #431407 100%);
          border-radius: 0 0 50% 50%;
          z-index: 1;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
        }

        .diya-base-top {
          position: absolute;
          top: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 6px;
          background: #9a3412;
          border-radius: 50%;
        }

        /* === ANIMATIONS === */
        @keyframes floatDiya {
          from { transform: translateY(0px); }
          to { transform: translateY(-25px); }
        }

        @keyframes flicker {
          0% { transform: translateX(-50%) rotate(-45deg) scaleY(1); opacity: 0.9; }
          100% { transform: translateX(-50%) rotate(-45deg) scaleY(1.1); opacity: 1; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.9; transform: translateX(-50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
