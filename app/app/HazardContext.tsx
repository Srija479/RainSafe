import { createContext, useContext, useState, ReactNode } from 'react';

type Hazard = {
  id: string;
  location: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  time: string;
  latitude?: number;
  longitude?: number;
};

type HazardContextType = {
  hazards: Hazard[];
  addHazard: (hazard: Omit<Hazard, 'id' | 'time'>) => void;
};

const HazardContext = createContext<HazardContextType | undefined>(undefined);

export function HazardProvider({ children }: { children: ReactNode }) {
  const [hazards, setHazards] = useState<Hazard[]>([
    { id: '1', location: 'MG Road Junction', description: 'Deep water, avoid crossing', severity: 'High', time: '10 min ago', latitude: 17.4147, longitude: 78.4550 },
    { id: '2', location: 'Lake View Bridge', description: 'Waterlogged, slow traffic', severity: 'Medium', time: '25 min ago', latitude: 17.4200, longitude: 78.4600 },
  ]);

  const addHazard = (hazard: Omit<Hazard, 'id' | 'time'>) => {
    const newHazard: Hazard = {
      ...hazard,
      id: Date.now().toString(),
      time: 'Just now',
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