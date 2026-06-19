'use client';

export default function LuxuryGlow() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,215,0,0.45) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 80%, rgba(255,140,0,0.35) 0%, transparent 60%)',
          filter: 'blur(160px)',
        }}
      />
    </>
  );
}
