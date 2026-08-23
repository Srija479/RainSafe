import { createContext, useContext, useState, ReactNode } from 'react';

type Hazard = {
  id: string;
  location: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: number;
  latitude?: number;
  longitude?: number;
  status: 'Active' | 'Resolved';
  photo?: string;
};

type HazardContextType = {
  hazards: Hazard[];
  addHazard: (hazard: Omit<Hazard, 'id' | 'timestamp' | 'status'>) => void;
};

const HazardContext = createContext<HazardContextType | undefined>(undefined);

export function HazardProvider({ children }: { children: ReactNode }) {
  const [hazards, setHazards] = useState<Hazard[]>([
    { id: '1', location: 'MG Road Junction', description: 'Deep water, avoid crossing', severity: 'High', timestamp: Date.now() - 10 * 60 * 1000, latitude: 17.4147, longitude: 78.4550, status: 'Active' },
    { id: '2', location: 'Lake View Bridge', description: 'Waterlogged, slow traffic', severity: 'Medium', timestamp: Date.now() - 25 * 60 * 1000, latitude: 17.4200, longitude: 78.4600, status: 'Active' },
  ]);

  const addHazard = (hazard: Omit<Hazard, 'id' | 'timestamp' | 'status'>) => {
    const newHazard: Hazard = {
      ...hazard,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'Active',
    };
    setHazards((prev) => [newHazard, ...prev]);
  };

  return (
    <HazardContext.Provider value={{ hazards, addHazard }}>
      {children}
    </HazardContext.Provider>
  );
}

export function useHazards() {
  const context = useContext(HazardContext);
  if (!context) {
    throw new Error('useHazards must be used within a HazardProvider');
  }
  return context;
}

export function getTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
