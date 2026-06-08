'use client';

export default function MoonGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute top-20 right-20 w-40 h-40 rounded-full bg-yellow-200 blur-3xl opacity-40" />
    </div>
  );
}
