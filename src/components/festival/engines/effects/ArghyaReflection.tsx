'use client';

export default function ArghyaReflection() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Water Base */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '35%',
          background: `
            linear-gradient(
              to top,
              rgba(0,40,80,0.95),
              rgba(0,80,140,0.55),
              transparent
            )
          `,
        }}
      />

      {/* Sun Reflection */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0"
        style={{
          width: '180px',
          height: '35%',
          background: `
            linear-gradient(
              to top,
              rgba(255,220,120,0.7),
              rgba(255,220,120,0.25),
              transparent
            )
          `,
          filter: 'blur(18px)',
          opacity: 0.7,
        }}
      />

      {/* Water Ripples */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: '35%',
          background:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.02) 3px, transparent 6px)',
          opacity: 0.35,
        }}
      />

      {/* Devotee Silhouette */}
      <div
        className="absolute"
        style={{
          bottom: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90px',
          height: '120px',
        }}
      >
        {/* Body */}
        <div
          style={{
            width: '55px',
            height: '85px',
            background: '#111',
            borderRadius: '35px 35px 10px 10px',
            margin: '0 auto',
          }}
        />

        {/* Head */}
        <div
          style={{
            width: '30px',
            height: '30px',
            background: '#111',
            borderRadius: '50%',
            margin: '-100px auto 0',
          }}
        />

        {/* Offering Plate */}
        <div
          style={{
            width: '40px',
            height: '12px',
            background: '#222',
            borderRadius: '50%',
            position: 'absolute',
            top: '35px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Reflection of devotee */}
      <div
        className="absolute"
        style={{
          bottom: '0%',
          left: '50%',
          transform: 'translateX(-50%) scaleY(-1)',
          width: '90px',
          height: '90px',
          opacity: 0.15,
          filter: 'blur(4px)',
        }}
      >
        <div
          style={{
            width: '55px',
            height: '70px',
            background: '#000',
            borderRadius: '35px 35px 10px 10px',
            margin: '0 auto',
          }}
        />
      </div>

    </div>
  );
}
