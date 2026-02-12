'use client';

export default function DesktopShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full">
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
