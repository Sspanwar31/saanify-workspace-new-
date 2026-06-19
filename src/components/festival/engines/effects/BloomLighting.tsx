'use client';

export default function BloomLighting() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 60%)',
      }}
    />
  );
}
