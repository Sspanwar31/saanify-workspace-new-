'use client';

export default function LuxuryGlow() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }}
    />
  );
}
