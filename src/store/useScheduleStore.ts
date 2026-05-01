import { create } from 'zustand';
import { Schedule } from '../services/schedule';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Real-time Sync
  initSync: () => () => void;
  
  // Optimistic UI Actions
  addSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  loading: true,
  error: null,
  initialized: false,

  setSchedules: (schedules) => set({ schedules, loading: false, initialized: true }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initSync: () => {
    if (get().initialized) return () => {};
    
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const schedules: Schedule[] = [];
        snapshot.forEach((doc) => {
          schedules.push({ id: doc.id, ...doc.data() } as Schedule);
        });
        set({ schedules, loading: false, initialized: true });
      },
      (err) => {
        console.error('[Schedule Store] Sync Error:', err);
        set({ error: err.message, loading: false });
      }
    );

    return unsubscribe;
  },

  addSchedule: async (newSchedule) => {
    const tempId = `temp-${Date.now()}`;
    const scheduleWithId = { ...newSchedule, id: tempId } as Schedule;
    
    // Optimistic Update
    const previousSchedules = get().schedules;
    set({ schedules: [...previousSchedules, scheduleWithId].sort((a, b) => a.date.localeCompare(b.date)) });

    try {
      const docRef = doc(collection(db, 'schedules'));
      await setDoc(docRef, {
        ...newSchedule,
        createdAt: serverTimestamp(),
      });
      // The real-time listener will replace the temp item with the real one
    } catch (err) {
      console.error('[Schedule Store] Add Error:', err);
      // Rollback
      set({ schedules: previousSchedules });
      throw err;
    }
  },

  updateSchedule: async (id, updates) => {
    const previousSchedules = get().schedules;
    
    // Optimistic Update
    set({
      schedules: previousSchedules.map(s => s.id === id ? { ...s, ...updates } : s)
    });

    try {
      const docRef = doc(db, 'schedules', id);
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      console.error('[Schedule Store] Update Error:', err);
      set({ schedules: previousSchedules });
      throw err;
    }
  },

  deleteSchedule: async (id) => {
    const previousSchedules = get().schedules;
    
    // Optimistic Update
    set({
      schedules: previousSchedules.filter(s => s.id !== id)
    });

    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      console.error('[Schedule Store] Delete Error:', err);
      set({ schedules: previousSchedules });
      throw err;
    }
  },
}));
