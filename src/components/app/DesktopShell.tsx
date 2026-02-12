'use client';

import Sidebar from '@/components/Sidebar';

export default function DesktopShell({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
