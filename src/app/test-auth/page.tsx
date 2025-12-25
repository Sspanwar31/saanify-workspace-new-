'use client'

import { useState, useEffect } from 'react'

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('')
  const [sessionResult, setSessionResult] = useState<string>('')

  const testLogin = async () => {
    setResult('Testing login...')
    
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
        setResult(`✅ LOGIN SUCCESS: ${JSON.stringify(data, null, 2)}`)
        
        // Test session after successful login
        setTimeout(() => testSession(), 1000)
      } else {
        setResult(`❌ LOGIN FAILED: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error: any) {
      setResult(`❌ LOGIN ERROR: ${error.message}`)
    }
  }

  const testSession = async () => {
    setSessionResult('Testing session...')
    
    try {
      const response = await fetch('/api/auth/check-session', {
        credentials: 'include'
      })

      const data = await response.json()
      
      if (response.ok) {
        setSessionResult(`✅ SESSION SUCCESS: ${JSON.stringify(data, null, 2)}`)
      } else {
        setSessionResult(`❌ SESSION FAILED: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error: any) {
      setSessionResult(`❌ SESSION ERROR: ${error.message}`)
    }
  }

  const testDashboard = async () => {
    setResult('Testing dashboard access...')
    
    try {
      const response = await fetch('/client/dashboard', {
        credentials: 'include'
      })

      if (response.ok) {
        setResult(`✅ DASHBOARD ACCESS SUCCESS`)
      } else {
        setResult(`❌ DASHBOARD ACCESS FAILED: ${response.status}`)
      }
    } catch (error: any) {
      setResult(`❌ DASHBOARD ERROR: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Login
          </button>
          
          <button
            onClick={testSession}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-4"
          >
            Test Session
          </button>
          
          <button
            onClick={testDashboard}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 ml-4"
          >
            Test Dashboard
          </button>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Login Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}
        
        {sessionResult && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Session Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {sessionResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}