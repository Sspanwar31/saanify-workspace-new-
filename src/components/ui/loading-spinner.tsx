'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative w-16 h-16">
        {/* Simple CSS Animation (No libraries required) */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Loading Saanify Portal
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we prepare your dashboard...
        </p>
      </div>
    </div>
  )
}
