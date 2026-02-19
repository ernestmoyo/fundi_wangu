import { create } from 'zustand';

interface FundiState {
  isOnline: boolean;
  currentJobId: string | null;
  locationWatchId: number | null;

  setOnline: (online: boolean) => void;
  setCurrentJob: (jobId: string | null) => void;
  setLocationWatchId: (id: number | null) => void;
}

export const useFundiStore = create<FundiState>((set) => ({
  isOnline: false,
  currentJobId: null,
  locationWatchId: null,

  setOnline: (isOnline) => set({ isOnline }),
  setCurrentJob: (currentJobId) => set({ currentJobId }),
  setLocationWatchId: (locationWatchId) => set({ locationWatchId }),
}));
