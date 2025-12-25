'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 JavaScript Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          Testing if JavaScript is working properly
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-sm text-gray-700">
            Current time: {new Date().toLocaleString()}
          </p>
          <div className="mt-4">
            <button 
              onClick={() => alert('JavaScript Working!')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Test JavaScript
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}