'use client';

import { useEffect, useState } from 'react';

export default function PassbookTestPage() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    // Test if page loads
    setMessage('✅ Passbook page loaded successfully!');
    
    // Test API connection
    fetch('/api/client/passbook')
      .then(res => res.json())
      .then(data => {
        console.log('Passbook API Response:', data);
        setMessage('✅ API working! Check console for details.');
      })
      .catch(err => {
        console.error('API Error:', err);
        setMessage('❌ API Error: ' + err.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Passbook Test Page
          </h1>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Page Status
              </h2>
              <p className="text-green-700">
                {message}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Navigation Test
              </h2>
              <p className="text-blue-700 mb-4">
                If you can see this page, then routing is working.
              </p>
              <div className="space-x-4">
                <button 
                  onClick={() => window.location.href = '/client/dashboard'}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => window.location.href = '/client/members'}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Go to Members
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Debug Info
              </h2>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
                <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}