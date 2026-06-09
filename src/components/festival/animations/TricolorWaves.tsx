'use client';

export default function TricolorWaves() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
      {/* Floating Saffron Wave */}
      <div className="absolute top-0 left-[-10%] w-[120%] h-[40%] bg-[#FF9933] blur-[100px] animate-pulse rounded-full" 
           style={{ animationDuration: '6s' }} />
      
      {/* Floating Green Wave */}
      <div className="absolute bottom-0 left-[-10%] w-[120%] h-[40%] bg-[#138808] blur-[100px] animate-pulse rounded-full" 
           style={{ animationDuration: '8s' }} />

      {/* Tricolor Confetti Particles */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-bounce"
          style={{
            width: '8px', height: '8px',
            background: ['#FF9933', '#FFFFFF', '#138808'][i % 3],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${3 + Math.random() * 4}s`,
            opacity: 0.6
          }}
        />
      ))}
    </div>
  );
}
