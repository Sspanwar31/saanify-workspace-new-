'use client'

import { useState } from 'react'

export default function TestLoginPage() {
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testClientLogin = async () => {
    setIsLoading(true)
    setResult('Testing client login...')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'client@demo.com',
          password: 'client123',
          userType: 'client'
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ SUCCESS: ${JSON.stringify(data, null, 2)}`)
      } else {
        setResult(`❌ FAILED: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error: any) {
      setResult(`❌ ERROR: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testClientUser = async () => {
    setIsLoading(true)
    setResult('Checking client user...')
    
    try {
      const response = await fetch('/api/test-client-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult(`❌ ERROR: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login Debug Test</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testClientLogin}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Client Login'}
          </button>
          
          <button
            onClick={testClientUser}
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {isLoading ? 'Testing...' : 'Check Client User'}
          </button>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Demo Credentials:</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> client@demo.com</p>
            <p><strong>Password:</strong> client123</p>
            <p><strong>Expected Role:</strong> CLIENT</p>
          </div>
        </div>
      </div>
    </div>
  )
}