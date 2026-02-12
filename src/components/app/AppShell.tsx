'use client';
import { useState, useEffect } from 'react';
import DesktopShell from './DesktopShell';
import MobileShell from './MobileShell';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Jab tak check nahi hota, kuch load na karein (taaki flicker na ho)
  if (isMobile === null) return null; 

  return isMobile ? (
    <MobileShell>{children}</MobileShell>
  ) : (
    <DesktopShell>{children}</DesktopShell>
  );
}
