import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type CheckIn, getTodayCheckIn, getStreak, getTotalStats } from '../db/database';

interface CheckInState {
  todayCheckIn: CheckIn | null;
  streak: number;
  totalDays: number;
  totalMinutes: number;
  completeWorks: number;
  isLoading: boolean;
  
  loadToday: () => Promise<void>;
  checkIn: (duration: number, note: string, images: string[], isCompleteWork: boolean) => Promise<void>;
  updateToday: (duration: number, note: string, images: string[], isCompleteWork: boolean) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set, get) => ({
      todayCheckIn: null,
      streak: 0,
      totalDays: 0,
      totalMinutes: 0,
      completeWorks: 0,
      isLoading: false,

      loadToday: async () => {
        set({ isLoading: true });
        const today = await getTodayCheckIn();
        const streak = await getStreak();
        const stats = await getTotalStats();
        set({
          todayCheckIn: today || null,
          streak,
          totalDays: stats.totalDays,
          totalMinutes: stats.totalMinutes,
          completeWorks: stats.completeWorks,
          isLoading: false,
        });
      },

      checkIn: async (duration, note, images, isCompleteWork) => {
        const today = new Date().toISOString().split('T')[0];
        const checkIn: CheckIn = {
          id: today,
          date: today,
          duration,
          note,
          imageData: images,
          isCompleteWork,
          createdAt: Date.now(),
        };
        await db.checkIns.put(checkIn);
        await get().refreshStats();
      },

      updateToday: async (duration, note, images, isCompleteWork) => {
        const today = get().todayCheckIn;
        if (!today) return;
        
        const updated: CheckIn = {
          ...today,
          duration,
          note,
          imageData: images,
          isCompleteWork,
        };
        await db.checkIns.put(updated);
        await get().refreshStats();
      },

      refreshStats: async () => {
        const today = await getTodayCheckIn();
        const streak = await getStreak();
        const stats = await getTotalStats();
        set({
          todayCheckIn: today || null,
          streak,
          totalDays: stats.totalDays,
          totalMinutes: stats.totalMinutes,
          completeWorks: stats.completeWorks,
        });
      },
    }),
    {
      name: 'check-in-storage',
    }
  )
);
