export function LoadingAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="relative">
        {/* Animated E Letter with Gradient */}
        <div
          className="transition-all duration-1000 opacity-100 scale-100"
        >
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 animate-ping-slow">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 opacity-20"></div>
          </div>

          {/* Main E Letter Container */}
          <div className="relative w-32 h-32 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-2xl overflow-hidden">
            {/* Animated Shimmer Effect */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Rotating Border */}
            <div className="absolute inset-0 animate-spin-slow">
              <div className="w-full h-full border-4 border-transparent border-t-white/30 border-r-white/30 rounded-2xl"></div>
            </div>

            {/* E Letter */}
            <span className="text-6xl font-bold text-white relative z-10 animate-pulse-subtle">
              E
            </span>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 text-center">
          <p className="text-lg font-semibold text-foreground animate-pulse">
            Loading
            <span className="inline-flex ml-1">
              <span className="animate-bounce-dot delay-0">.</span>
              <span className="animate-bounce-dot delay-100">.</span>
              <span className="animate-bounce-dot delay-200">.</span>
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we load your content
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full animate-progress"></div>
        </div>
      </div>

      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-float-1 opacity-40"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-green-500 rounded-full animate-float-2 opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-green-600 rounded-full animate-float-3 opacity-40"></div>
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-green-400 rounded-full animate-float-4 opacity-30"></div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 0.2;
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }

        @keyframes bounce-dot {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        @keyframes float-1 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(30px, -30px);
          }
          66% {
            transform: translate(-20px, 20px);
          }
        }

        @keyframes float-2 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(-25px, 25px);
          }
          66% {
            transform: translate(25px, -15px);
          }
        }

        @keyframes float-3 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(20px, 20px);
          }
          66% {
            transform: translate(-30px, -25px);
          }
        }

        @keyframes float-4 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(-20px, -20px);
          }
          66% {
            transform: translate(25px, 30px);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-bounce-dot {
          display: inline-block;
          animation: bounce-dot 1.4s infinite;
        }

        .delay-0 {
          animation-delay: 0s;
        }

        .delay-100 {
          animation-delay: 0.2s;
        }

        .delay-200 {
          animation-delay: 0.4s;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 7s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 8s ease-in-out infinite;
        }

        .animate-float-4 {
          animation: float-4 6.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Compact version for inline loading
export function LoadingSpinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
        <div className="absolute inset-0 animate-spin-slow">
          <div className="w-full h-full border-2 border-transparent border-t-white/30 border-r-white/30 rounded-lg"></div>
        </div>
        <span className="text-2xl font-bold text-white relative z-10">E</span>
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Minimal version for small spaces
export function LoadingDot() {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-200"></div>

      <style>{`
        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
