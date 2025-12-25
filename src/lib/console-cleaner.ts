/**
 * Development Console Cleaner
 * Cleans up unwanted console logs from browser extensions and third-party scripts
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
  trace: console.trace
};

// Configuration for filtering
const config = {
  enabled: true,
  logFilteredMessages: false, // Set to true to see what's being filtered
  filters: [
    // MCP (Model Context Protocol) related logs
    {
      patterns: ['mcp data', 'metadata: {…}', '{metadata: {…}}'],
      sources: ['CbxGpD3N.js', 'extension', 'chrome-extension'],
      methods: ['log', 'info', 'debug']
    },
    // Browser extension logs
    {
      patterns: ['extension', 'chrome-extension', 'moz-extension'],
      sources: ['extension'],
      methods: ['log', 'info', 'debug']
    },
    // React DevTools (optional)
    {
      patterns: ['React DevTools', 'Warning:'],
      sources: ['react-devtools'],
      methods: ['warn']
    }
  ]
};

/**
 * Check if a console call should be filtered
 */
function shouldFilter(method: string, args: any[], source?: string): boolean {
  if (!config.enabled) return false;

  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  return config.filters.some(filter => {
    // Check if method matches
    if (filter.methods.length > 0 && !filter.methods.includes(method)) {
      return false;
    }

    // Check if message contains any filtered patterns
    const messageMatch = filter.patterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );

    // Check if source matches (if available)
    const sourceMatch = !filter.sources.length || 
      (source && filter.sources.some(s => source.toLowerCase().includes(s.toLowerCase())));

    return messageMatch && sourceMatch;
  });
}

/**
 * Get the source of a console call
 */
function getCallSource(): string {
  const stack = new Error().stack;
  if (!stack) return '';

  const lines = stack.split('\n');
  // Skip the current function and look for the actual caller
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.includes('console-filter.') && !line.includes('console-filter.')) {
      return line;
    }
  }
  return '';
}

/**
 * Enhanced console methods with filtering
 */
function createFilteredConsole() {
  return {
    log: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('log', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED:', ...args);
        }
        return;
      }
      return originalConsole.log.apply(console, args);
    },

    warn: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('warn', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED WARN:', ...args);
        }
        return;
      }
      return originalConsole.warn.apply(console, args);
    },

    error: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('error', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED ERROR:', ...args);
        }
        return;
      }
      return originalConsole.error.apply(console, args);
    },

    info: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('info', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED INFO:', ...args);
        }
        return;
      }
      return originalConsole.info.apply(console, args);
    },

    debug: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('debug', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED DEBUG:', ...args);
        }
        return;
      }
      return originalConsole.debug.apply(console, args);
    },

    table: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('table', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED TABLE:', ...args);
        }
        return;
      }
      return originalConsole.table.apply(console, args);
    },

    group: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('group', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED GROUP:', ...args);
        }
        return;
      }
      return originalConsole.group.apply(console, args);
    },

    groupEnd: function(...args: any[]) {
      return originalConsole.groupEnd.apply(console, args);
    },

    trace: function(...args: any[]) {
      const source = getCallSource();
      if (shouldFilter('trace', args, source)) {
        if (config.logFilteredMessages) {
          originalConsole.log('🔒 FILTERED TRACE:', ...args);
        }
        return;
      }
      return originalConsole.trace.apply(console, args);
    }
  };
}

/**
 * Initialize console filtering
 */
export function initConsoleFilter(options: Partial<typeof config> = {}) {
  // Update config with provided options
  Object.assign(config, options);

  // Apply filtered console methods
  Object.assign(console, createFilteredConsole());

  // Log initialization (only if not filtering out our own logs)
  if (!config.logFilteredMessages) {
    originalConsole.log('🔧 Console Filter initialized', config.enabled ? '✅' : '❌');
  }
}

/**
 * Add custom filter
 */
export function addFilter(filter: typeof config.filters[0]) {
  config.filters.push(filter);
}

/**
 * Remove filter by index
 */
export function removeFilter(index: number) {
  config.filters.splice(index, 1);
}

/**
 * Enable/disable filtering
 */
export function setEnabled(enabled: boolean) {
  config.enabled = enabled;
  if (enabled) {
    Object.assign(console, createFilteredConsole());
  } else {
    Object.assign(console, originalConsole);
  }
}

/**
 * Get current configuration
 */
export function getConfig() {
  return { ...config };
}

/**
 * Restore original console
 */
export function restoreOriginalConsole() {
  Object.assign(console, originalConsole);
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  initConsoleFilter({
    enabled: true,
    logFilteredMessages: false // Set to true to debug what's being filtered
  });
}