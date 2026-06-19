'use client';

export default function FloatingDiyas() {
  const diyas = [
    {
      left: '8%',
      bottom: '10%',
      size: 60,
      duration: 10,
    },
    {
      left: '85%',
      bottom: '15%',
      size: 55,
      duration: 12,
    },
    {
      left: '70%',
      top: '20%',
      size: 45,
      duration: 8,
    },
    {
      left: '20%',
      top: '25%',
      size: 50,
      duration: 11,
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">

      {diyas.map((diya, index) => (
        <div
          key={index}
          className="absolute diya-float"
          style={{
            left: diya.left,
            top: diya.top,
            bottom: diya.bottom,
            fontSize: `${diya.size}px`,
            animationDuration: `${diya.duration}s`,
          }}
        >
          🪔
        </div>
      ))}

      <style jsx>{`
        .diya-float {
          filter:
            drop-shadow(0 0 10px #ffcc00)
            drop-shadow(0 0 20px #ff9900)
            drop-shadow(0 0 40px rgba(255,180,0,.8));

          animation:
            floatDiya ease-in-out infinite,
            glowDiya 2s ease-in-out infinite;
        }

        @keyframes floatDiya {
          0%,100%{
            transform: translateY(0px) rotate(-2deg);
          }

          50%{
            transform: translateY(-15px) rotate(2deg);
          }
        }

        @keyframes glowDiya {
          0%,100%{
            opacity:.8;
          }

          50%{
            opacity:1;
          }
        }
      `}</style>
    </div>
  );
}
