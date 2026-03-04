import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  dailyReminder: boolean;
  reminderTime: string;
  theme: 'light' | 'dark';
  userName: string;
}

interface SettingsState extends Settings {
  setReminder: (enabled: boolean, time?: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setUserName: (name: string) => void;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<boolean>;
}

const defaultSettings: Settings = {
  dailyReminder: true,
  reminderTime: '20:00',
  theme: 'light',
  userName: '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setReminder: (enabled, time) => {
        set({ dailyReminder: enabled, reminderTime: time || get().reminderTime });
        if (enabled) {
          scheduleNotification(time || get().reminderTime);
        }
      },

      setTheme: (theme) => set({ theme }),
      
      setUserName: (name) => set({ userName: name }),

      exportData: async () => {
        const { db } = await import('../db/database');
        const checkIns = await db.checkIns.toArray();
        const goals = await db.goals.toArray();
        const badges = await db.badges.toArray();
        const referenceImages = await db.referenceImages.toArray();
        
        const data = {
          checkIns,
          goals,
          badges,
          referenceImages,
          settings: {
            dailyReminder: get().dailyReminder,
            reminderTime: get().reminderTime,
            userName: get().userName,
          },
          exportedAt: new Date().toISOString(),
        };
        
        return JSON.stringify(data, null, 2);
      },

      importData: async (json) => {
        try {
          const data = JSON.parse(json);
          const { db } = await import('../db/database');
          
          if (data.checkIns) await db.checkIns.bulkPut(data.checkIns);
          if (data.goals) await db.goals.bulkPut(data.goals);
          if (data.badges) await db.badges.bulkPut(data.badges);
          if (data.referenceImages) await db.referenceImages.bulkPut(data.referenceImages);
          
          if (data.settings) {
            set({
              dailyReminder: data.settings.dailyReminder ?? true,
              reminderTime: data.settings.reminderTime ?? '20:00',
              userName: data.settings.userName ?? '',
            });
          }
          
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);

function scheduleNotification(time: string) {
  if (!('Notification' in window)) return;
  
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduled = new Date();
      scheduled.setHours(hours, minutes, 0, 0);
      
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      
      const delay = scheduled.getTime() - now.getTime();
      
      setTimeout(() => {
        new Notification('唐卡练习提醒', {
          body: '今天练习唐卡了吗？坚持就是进步！',
          icon: '/icons/icon-192x192.png',
        });
      }, delay);
    }
  });
}
