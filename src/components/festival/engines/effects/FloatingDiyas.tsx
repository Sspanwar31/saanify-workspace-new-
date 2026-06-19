'use client';
console.log('FloatingDiyas Loaded');
export default function FloatingDiyas() {
  return (
    <>
      <div
        className="absolute bottom-10 left-10 text-5xl animate-pulse"
      >
        🪔
      </div>

      <div
        className="absolute bottom-20 right-20 text-4xl animate-pulse"
      >
        🪔
      </div>

      <div
        className="absolute top-40 right-1/4 text-3xl animate-pulse"
      >
        🪔
      </div>
    </>
  );
}
