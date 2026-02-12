'use client';

import ClientOnly from '@/components/ClientOnly';
import { isMobile, isPWA } from '@/lib/device';
import MobileShell from './MobileShell';
import DesktopShell from './DesktopShell';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      {isMobile() || isPWA() ? (
        <MobileShell>{children}</MobileShell>
      ) : (
        <DesktopShell>{children}</DesktopShell>
      )}
    </ClientOnly>
  );
}
