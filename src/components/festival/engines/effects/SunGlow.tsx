'use client';

export default function SunGlow() {
  return (
    <>
      {/* Core Sun */}
      <div
  className="absolute left-1/2 -translate-x-1/2"
  style={{
    top: '130px',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle,#FFD36A 0%,#FFB347 60%,#FF8C00 100%)',
    boxShadow:
      '0 0 40px rgba(255,211,106,.8),0 0 80px rgba(255,179,71,.5)',
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
