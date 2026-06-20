'use client';

export default function SunGlow() {
  return (
    <>
      {/* Core Sun */}
      <div
        className="absolute left-1/2 top-[6%] -translate-x-1/2 rounded-full"
        style={{
          width: '120px',
          height: '120px',
          background:
            'radial-gradient(circle, #FFE28A 0%, #FFC857 70%, #FFB347 100%)',
          zIndex: 2,
        }}
      />

      {/* Outer Glow */}
      <div
        className="absolute left-1/2 top-[2%] -translate-x-1/2 rounded-full"
        style={{
          width: '320px',
          height: '320px',
          background:
            'radial-gradient(circle, rgba(255,220,120,.8) 0%, rgba(255,180,60,.4) 45%, transparent 80%)',
          filter: 'blur(35px)',
          zIndex: 1,
        }}
      />
    </>
  );
}
