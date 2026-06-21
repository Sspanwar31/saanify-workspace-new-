'use client';

export default function FloatingDiyas() {
  // 🚀 10 Diye pure screen par phailane ke liye
  const diyas = [
    { left: '5%', bottom: '15%', size: 60, delay: '0s' },
    { left: '85%', bottom: '10%', size: 55, delay: '1s' },
    { left: '20%', bottom: '5%', size: 45, delay: '2s' },
    { left: '75%', bottom: '25%', size: 50, delay: '0.5s' },
    { left: '40%', bottom: '12%', size: 40, delay: '3s' },
    { left: '60%', bottom: '8%', size: 48, delay: '1.5s' },
    { left: '15%', top: '20%', size: 35, delay: '4s' },
    { left: '80%', top: '15%', size: 42, delay: '2.5s' },
    { left: '10%', bottom: '30%', size: 50, delay: '3.5s' },
    { left: '90%', bottom: '35%', size: 38, delay: '1s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {diyas.map((diya, index) => (
        <div
          key={index}
          className="absolute diya-float opacity-0 animate-in fade-in duration-1000"
          style={{
            left: diya.left,
            top: diya.top,
            bottom: diya.bottom,
            fontSize: `${diya.size}px`,
            animationDelay: diya.delay,
          }}
        >
          🪔
        </div>
      ))}

      <style jsx>{`
        .diya-float {
          filter: drop-shadow(0 0 15px #ffcc00) drop-shadow(0 0 30px #ea580c);
          animation: floatDiya 5s ease-in-out infinite alternate, glowDiya 2s infinite;
          opacity: 0.9;
        }
        @keyframes floatDiya {
          from { transform: translateY(0px) rotate(-3deg); }
          to { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes glowDiya {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 15px #ffcc00); }
          50% { filter: brightness(1.3) drop-shadow(0 0 35px #ea580c); }
        }
      `}</style>
    </div>
  );
}
