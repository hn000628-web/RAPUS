'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type RegionContextType = {
  baseRegion: string;
  interestRegions: string[];
  setBaseRegion: (v: string) => void;
  setInterestRegions: (v: string[]) => void;
};

const RegionContext = createContext<RegionContextType | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [baseRegion, setBaseRegion] = useState(
    '한국 / 서울특별시 / 관악구 / 신림동'
  );

  const [interestRegions, setInterestRegions] = useState<string[]>([
    '한국 / 서울특별시 / 마포구 / 서교동',
  ]);

  return (
    <RegionContext.Provider
      value={{
        baseRegion,
        interestRegions,
        setBaseRegion,
        setInterestRegions,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error('useRegion must be used within RegionProvider');
  }
  return ctx;
}
