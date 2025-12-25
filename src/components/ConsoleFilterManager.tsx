'use client';

import { useConsoleFilter } from '@/hooks/useConsoleFilter';

interface ConsoleFilterManagerProps {
  children?: React.ReactNode;
}

export function ConsoleFilterManager({ children }: ConsoleFilterManagerProps) {
  // Initialize console filtering
  useConsoleFilter();

  // This component doesn't render anything visible
  // It just manages the console filtering functionality
  return null;
}

export default ConsoleFilterManager;