import { create } from 'zustand';

interface BookingLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface BookingState {
  categoryId: string | null;
  serviceId: string | null;
  description: string;
  location: BookingLocation | null;
  scheduledAt: Date | null;
  selectedFundiId: string | null;
  images: string[];
  urgency: 'normal' | 'urgent';

  setCategory: (categoryId: string) => void;
  setService: (serviceId: string) => void;
  setDescription: (description: string) => void;
  setLocation: (location: BookingLocation) => void;
  setScheduledAt: (date: Date | null) => void;
  setSelectedFundi: (fundiId: string | null) => void;
  addImage: (uri: string) => void;
  removeImage: (uri: string) => void;
  setUrgency: (urgency: 'normal' | 'urgent') => void;
  reset: () => void;
}

const initialState = {
  categoryId: null,
  serviceId: null,
  description: '',
  location: null,
  scheduledAt: null,
  selectedFundiId: null,
  images: [] as string[],
  urgency: 'normal' as const,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setCategory: (categoryId) => set({ categoryId }),
  setService: (serviceId) => set({ serviceId }),
  setDescription: (description) => set({ description }),
  setLocation: (location) => set({ location }),
  setScheduledAt: (scheduledAt) => set({ scheduledAt }),
  setSelectedFundi: (selectedFundiId) => set({ selectedFundiId }),
  addImage: (uri) => set((s) => ({ images: [...s.images, uri] })),
  removeImage: (uri) => set((s) => ({ images: s.images.filter((i) => i !== uri) })),
  setUrgency: (urgency) => set({ urgency }),
  reset: () => set(initialState),
}));
