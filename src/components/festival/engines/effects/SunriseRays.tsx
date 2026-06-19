'use client';

export default function SunriseRays() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(
            circle at 50% 20%,
            rgba(255,210,120,.35),
            transparent 70%
          )
        `,
      }}
    />
  );
}
