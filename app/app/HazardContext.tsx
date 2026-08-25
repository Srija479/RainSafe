import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

export type HazardType =
  | 'Flooded Road'
  | 'Pothole'
  | 'Open Drain'
  | 'Fallen Wires';

export type HazardSeverity =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

export type HazardStatus =
  | 'Active'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved';

export type Hazard = {
  id: string;
  type: HazardType;
  locationName: string;
  description: string;
  severity: HazardSeverity;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  status: HazardStatus;
  photo?: string;
};

type HazardContextType = {
  hazards: Hazard[];

  addHazard: (
    hazard: Omit<Hazard, 'id' | 'timestamp' | 'status'>
  ) => void;

  updateHazardStatus: (
    id: string,
    status: HazardStatus
  ) => void;

  removeHazard: (id: string) => void;

  clearAllHazards: () => void;
};

const HazardContext = createContext<
  HazardContextType | undefined
>(undefined);

const STORAGE_KEY = '@rainsafe_hazards';

export function HazardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadHazards();
  }, []);

  const loadHazards = async () => {
    try {
      const savedHazards =
        await AsyncStorage.getItem(STORAGE_KEY);

      if (savedHazards) {
        const parsedHazards: Hazard[] =
          JSON.parse(savedHazards);

        setHazards(parsedHazards);
      }
    } catch (error) {
      console.log(
        'Error loading hazards:',
        error
      );
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    saveHazards();
  }, [hazards, isLoaded]);

  const saveHazards = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(hazards)
      );
    } catch (error) {
      console.log(
        'Error saving hazards:',
        error
      );
    }
  };

  const addHazard = (
    hazard: Omit<Hazard, 'id' | 'timestamp' | 'status'>
  ) => {
    const newHazard: Hazard = {
      ...hazard,

      id:
        Date.now().toString() +
        Math.random()
          .toString(36)
          .substring(2, 8),

      timestamp: Date.now(),

      status: 'Active',
    };

    setHazards((previousHazards) => [
      newHazard,
      ...previousHazards,
    ]);
  };

  const updateHazardStatus = (
    id: string,
    status: HazardStatus
  ) => {
    setHazards((previousHazards) =>
      previousHazards.map((hazard) =>
        hazard.id === id
          ? {
              ...hazard,
              status,
            }
          : hazard
      )
    );
  };

  const removeHazard = (id: string) => {
    setHazards((previousHazards) =>
      previousHazards.filter(
        (hazard) => hazard.id !== id
      )
    );
  };

  const clearAllHazards = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHazards([]);
    } catch (error) {
      console.log(
        'Error clearing hazards:',
        error
      );
    }
  };

  return (
    <HazardContext.Provider
      value={{
        hazards,
        addHazard,
        updateHazardStatus,
        removeHazard,
        clearAllHazards,
      }}
    >
      {children}
    </HazardContext.Provider>
  );
}

export function useHazards() {
  const context = useContext(HazardContext);

  if (!context) {
    throw new Error(
      'useHazards must be used within a HazardProvider'
    );
  }

  return context;
}

export function getTimeAgo(
  timestamp: number
): string {
  const diffMs =
    Date.now() - timestamp;

  const diffMin =
    Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return 'Just now';
  }

  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }

  const diffHr =
    Math.floor(diffMin / 60);

  if (diffHr < 24) {
    return `${diffHr} hour${
      diffHr > 1 ? 's' : ''
    } ago`;
  }

  const diffDay =
    Math.floor(diffHr / 24);

  return `${diffDay} day${
    diffDay > 1 ? 's' : ''
  } ago`;
}