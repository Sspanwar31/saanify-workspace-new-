'use client';

import { useEffect } from 'react';

/**
 * Console Filter Hook
 * Filters out unwanted console logs from browser extensions and third-party scripts
 */
export function useConsoleFilter() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Store original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };

    // Patterns to filter out
    const FILTER_PATTERNS = [
      'mcp data',
      'metadata: {…}',
      '{metadata: {…}}',
      'CbxGpD3N.js',
      'chrome-extension',
      'moz-extension'
    ];

    // Enhanced console.log with filtering
    console.log = function(...args: any[]) {
      const message = args.join(' ');
      
      // Check if message contains filtered patterns
      const shouldFilter = FILTER_PATTERNS.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldFilter) {
        return; // Filter out this log
      }

      return originalConsole.log.apply(console, args);
    };

    // Enhanced console.warn with filtering
    console.warn = function(...args: any[]) {
      const message = args.join(' ');
      
      const shouldFilter = FILTER_PATTERNS.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldFilter) {
        return;
      }

      return originalConsole.warn.apply(console, args);
    };

    // Enhanced console.error with filtering
    console.error = function(...args: any[]) {
      const message = args.join(' ');
      
      const shouldFilter = FILTER_PATTERNS.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldFilter) {
        return;
      }

      return originalConsole.error.apply(console, args);
    };

    // Enhanced console.info with filtering
    console.info = function(...args: any[]) {
      const message = args.join(' ');
      
      const shouldFilter = FILTER_PATTERNS.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldFilter) {
        return;
      }

      return originalConsole.info.apply(console, args);
    };

    // Enhanced console.debug with filtering
    console.debug = function(...args: any[]) {
      const message = args.join(' ');
      
      const shouldFilter = FILTER_PATTERNS.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldFilter) {
        return;
      }

      return originalConsole.debug.apply(console, args);
    };

    // Log that console filter is active
    originalConsole.log('🔧 Console Filter Active - Filtering MCP data and extension logs');

    // Cleanup function to restore original console
    return () => {
      Object.assign(console, originalConsole);
    };
  }, []);
}