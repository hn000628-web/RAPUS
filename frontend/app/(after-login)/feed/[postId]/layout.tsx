'use client';

import { ReactNode } from 'react';
import TopBar from '@/components/topbar/TopBar';
import { RegionProvider } from '@/components/Region/RegionContext';

export default function PostDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RegionProvider>
      <div className="relative min-h-screen bg-white">
        <TopBar />
        <main className="pt-[50px]">
          {children}
        </main>
      </div>
    </RegionProvider>
  );
}