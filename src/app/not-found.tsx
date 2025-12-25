'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const handleLoginClick = () => {
    window.location.href = '/login'
  }

  const handleSignupClick = () => {
    window.location.href = '/signup'
  }

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Page not found
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been removed, renamed, or is temporarily unavailable.
          </p>
          
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go back home
              </Button>
            </Link>
            
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full border-gray-300 dark:border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go back
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={handleSignupClick}
              >
                Sign Up
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                onClick={handleLoginClick}
              >
                Login
              </Button>
              <Link href="/ADMIN">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}