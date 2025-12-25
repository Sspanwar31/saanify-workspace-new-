/**
 * Console Filter Utility
 * Filters out unwanted console logs from browser extensions and third-party scripts
 */

interface ConsoleFilter {
  url: string;
  message: string;
}

// List of patterns to filter out
const FILTER_PATTERNS: ConsoleFilter[] = [
  {
    url: 'CbxGpD3N.js',
    message: 'mcp data'
  },
  {
    url: '',
    message: 'mcp data'
  },
  {
    url: '',
    message: 'metadata: {…}'
  }
];

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

/**
 * Check if a log entry should be filtered out
 */
function shouldFilter(message: string, url?: string): boolean {
  return FILTER_PATTERNS.some(pattern => {
    const urlMatch = !pattern.url || (url && url.includes(pattern.url));
    const messageMatch = !pattern.message || message.includes(pattern.message);
    return urlMatch && messageMatch;
  });
}

/**
 * Enhanced console.log with filtering
 */
console.log = function(...args: any[]) {
  const message = args.join(' ');
  const stackTrace = new Error().stack;
  const url = stackTrace?.split('\n')[3]?.trim() || '';
  
  if (shouldFilter(message, url)) {
    return; // Filter out this log
  }
  
  return originalConsole.log.apply(console, args);
};

/**
 * Enhanced console.warn with filtering
 */
console.warn = function(...args: any[]) {
  const message = args.join(' ');
  const stackTrace = new Error().stack;
  const url = stackTrace?.split('\n')[3]?.trim() || '';
  
  if (shouldFilter(message, url)) {
    return; // Filter out this log
  }
  
  return originalConsole.warn.apply(console, args);
};

/**
 * Enhanced console.error with filtering
 */
console.error = function(...args: any[]) {
  const message = args.join(' ');
  const stackTrace = new Error().stack;
  const url = stackTrace?.split('\n')[3]?.trim() || '';
  
  if (shouldFilter(message, url)) {
    return; // Filter out this log
  }
  
  return originalConsole.error.apply(console, args);
};

/**
 * Enhanced console.info with filtering
 */
console.info = function(...args: any[]) {
  const message = args.join(' ');
  const stackTrace = new Error().stack;
  const url = stackTrace?.split('\n')[3]?.trim() || '';
  
  if (shouldFilter(message, url)) {
    return; // Filter out this log
  }
  
  return originalConsole.info.apply(console, args);
};

/**
 * Enhanced console.debug with filtering
 */
console.debug = function(...args: any[]) {
  const message = args.join(' ');
  const stackTrace = new Error().stack;
  const url = stackTrace?.split('\n')[3]?.trim() || '';
  
  if (shouldFilter(message, url)) {
    return; // Filter out this log
  }
  
  return originalConsole.debug.apply(console, args);
};

/**
 * Add custom filter patterns
 */
export function addFilterPattern(pattern: ConsoleFilter): void {
  FILTER_PATTERNS.push(pattern);
}

/**
 * Remove filter patterns
 */
export function removeFilterPattern(index: number): void {
  FILTER_PATTERNS.splice(index, 1);
}

/**
 * Get all filter patterns
 */
export function getFilterPatterns(): ConsoleFilter[] {
  return [...FILTER_PATTERNS];
}

/**
 * Restore original console methods
 */
export function restoreOriginalConsole(): void {
  Object.assign(console, originalConsole);
}

/**
 * Enable/disable filtering
 */
let filteringEnabled = true;

export function setFilteringEnabled(enabled: boolean): void {
  filteringEnabled = enabled;
  if (!enabled) {
    restoreOriginalConsole();
  }
}

export function isFilteringEnabled(): boolean {
  return filteringEnabled;
}