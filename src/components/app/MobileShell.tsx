'use client';

import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';

export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <MobileHeader />
      <MobileDrawer />
      <main className="pt-14 h-full overflow-auto">
        {children}
      </main>
    </div>
  );
}
