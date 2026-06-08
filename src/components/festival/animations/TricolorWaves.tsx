'use client';

export default function TricolorWaves() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="h-1/3 bg-orange-500/20" />
      <div className="h-1/3 bg-white/20" />
      <div className="h-1/3 bg-green-500/20" />
    </div>
  );
}
