'use client';

export default function SunGlow() {
  return (
    <div
      className="absolute left-1/2 top-12 -translate-x-1/2 rounded-full"
      style={{
        width: '220px',
        height: '220px',
        background:
          'radial-gradient(circle,#FFD36A 0%,#FFB347 50%,transparent 80%)',
        filter: 'blur(18px)',
      }}
    />
  );
}
