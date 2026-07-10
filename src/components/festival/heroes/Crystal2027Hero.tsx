export default function Crystal2027Hero() {
  return (
    <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
      
      {/* Background Aura */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-yellow-400/10 blur-[120px] animate-pulse" />

      {/* Main Crystal 2027 */}
      <div
        className="
          relative
          text-[120px]
          md:text-[180px]
          font-black
          tracking-[-0.08em]
          select-none
          animate-[float_6s_ease-in-out_infinite]
        "
        style={{
          background:
            "linear-gradient(135deg,#ffffff 0%,#fff7cc 20%,#fbbf24 45%,#ffffff 60%,#fde68a 80%,#ffffff 100%)",
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter:
            "drop-shadow(0 0 10px rgba(255,255,255,.6)) drop-shadow(0 0 40px rgba(251,191,36,.45))",
          animation:
            "float 6s ease-in-out infinite, shimmer 8s linear infinite",
        }}
      >
        2027
      </div>

      {/* Reflection */}
      <div
        className="
          absolute
          top-[58%]
          text-[120px]
          md:text-[180px]
          font-black
          tracking-[-0.08em]
          opacity-20
          blur-sm
          scale-y-[-1]
          pointer-events-none
        "
        style={{
          background:
            "linear-gradient(180deg,#ffffff,#fbbf24,transparent)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          maskImage:
            "linear-gradient(to bottom, rgba(255,255,255,.6), transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(255,255,255,.6), transparent)",
        }}
      >
        2027
      </div>

      {/* Floating Sparkles */}
      <div className="absolute w-2 h-2 rounded-full bg-yellow-300 top-[30%] left-[35%] animate-ping" />
      <div className="absolute w-1 h-1 rounded-full bg-white top-[42%] right-[32%] animate-ping" />
      <div className="absolute w-2 h-2 rounded-full bg-yellow-200 bottom-[38%] left-[42%] animate-ping" />
      <div className="absolute w-1 h-1 rounded-full bg-white bottom-[32%] right-[40%] animate-ping" />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 300% 50%;
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
