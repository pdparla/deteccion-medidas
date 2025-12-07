import { create } from 'zustand';
import {
  UserInfo,
  MeasurementSession,
  MeasurementSessionActions,
  VIEW_ORDER,
} from '@/types/session';

interface MeasurementStore extends MeasurementSession, MeasurementSessionActions {}

export const useMeasurementSession = create<MeasurementStore>((set, get) => ({
  // Initial state
  userInfo: null,
  captures: [],
  processedCaptures: [],
  measurements: null,
  currentView: 'front',
  isProcessing: false,
  error: null,

  // Actions
  setUserInfo: (info) => set({ userInfo: info }),

  addCapture: (capture) =>
    set((state) => ({
      captures: [...state.captures, capture],
    })),

  setProcessedCaptures: (captures) =>
    set({ processedCaptures: captures }),

  setMeasurements: (measurements) =>
    set({ measurements, isProcessing: false }),

  setCurrentView: (view) => set({ currentView: view }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setError: (error) => set({ error, isProcessing: false }),

  reset: () =>
    set({
      userInfo: null,
      captures: [],
      processedCaptures: [],
      measurements: null,
      currentView: 'front',
      isProcessing: false,
      error: null,
    }),

  nextView: () => {
    const { currentView } = get();
    const currentIndex = VIEW_ORDER.indexOf(currentView);
    if (currentIndex < VIEW_ORDER.length - 1) {
      set({ currentView: VIEW_ORDER[currentIndex + 1] });
    }
  },

  previousView: () => {
    const { currentView } = get();
    const currentIndex = VIEW_ORDER.indexOf(currentView);
    if (currentIndex > 0) {
      set({ currentView: VIEW_ORDER[currentIndex - 1] });
    }
  },
}));
