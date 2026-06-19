'use client';

export default function SpiritualEngine({
  preset,
}: {
  preset?: string;
}) {
  console.log('SpiritualEngine Mounted =>', preset);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,215,0,0.20) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute top-10 left-10 text-yellow-400 font-bold"
      >
        {preset}
      </div>
    </div>
  );
}
