'use client';

export default function SunriseRays() {
  return (
    <>
      <style jsx>{`
        @keyframes sunriseShift {
          0% {
            opacity: .4;
            transform: scale(1);
          }

          50% {
            opacity: .9;
            transform: scale(1.05);
          }

          100% {
            opacity: .4;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, rgba(255,220,120,.45), transparent 70%)',
          animation: 'sunriseShift 8s ease-in-out infinite',
        }}
      />
    </>
  );
}
