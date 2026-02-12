'use client';

import DesktopShell from './DesktopShell';
import MobileShell from './MobileShell';

function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const mobile = isMobile();

  return mobile ? (
    <MobileShell>{children}</MobileShell>
  ) : (
    <DesktopShell>{children}</DesktopShell>
  );
}
