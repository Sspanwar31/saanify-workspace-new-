'use client';

export default function ColorSplash() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-yellow-500/10 to-blue-500/10 animate-pulse" />
    </div>
  );
}
