import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  dailyReminder: boolean;
  reminderTime: string;
  theme: 'light' | 'dark';
  userName: string;
  lastReminderDate: string | null;
}

interface SettingsState extends Settings {
  setReminder: (enabled: boolean, time?: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setUserName: (name: string) => void;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<boolean>;
  checkAndTriggerReminder: () => boolean;
}

const defaultSettings: Settings = {
  dailyReminder: true,
  reminderTime: '20:00',
  theme: 'light',
  userName: '',
  lastReminderDate: null,
};

// 全局提醒检查
let reminderInterval: ReturnType<typeof setInterval> | null = null;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setReminder: (enabled, time) => {
        const newTime = time || get().reminderTime;
        set({ dailyReminder: enabled, reminderTime: newTime });
        
        if (enabled) {
          requestNotificationPermission();
          setupDailyReminderCheck(newTime);
        } else {
          clearReminderInterval();
        }
      },

      setTheme: (theme) => set({ theme }),
      
      setUserName: (name) => set({ userName: name }),

      // 检查并触发提醒
      checkAndTriggerReminder: () => {
        const { dailyReminder, reminderTime, lastReminderDate } = get();
        
        if (!dailyReminder) return false;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // 今天已经提醒过了
        if (lastReminderDate === today) return false;
        
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);
        
        // 当前时间已经过了提醒时间
        if (now >= reminderDate) {
          showReminderNotification();
          set({ lastReminderDate: today });
          return true;
        }
        
        return false;
      },

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

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// 显示提醒通知
export function showReminderNotification() {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    const notification = new Notification('唐卡练习提醒', {
      body: '今天练习唐卡了吗？坚持就是进步！点击打开App开始练习。',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'tangka-daily-reminder',
      requireInteraction: true,
      actions: [
        {
          action: 'practice',
          title: '开始练习'
        },
        {
          action: 'dismiss',
          title: '稍后再说'
        }
      ]
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      // 可以在这里导航到打卡页面
    };
  }
}

// 测试提醒
export function testReminder() {
  if (!('Notification' in window)) {
    alert('您的浏览器不支持通知功能');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    requestNotificationPermission().then(granted => {
      if (granted) {
        showTestNotification();
      } else {
        alert('请允许通知权限以接收提醒');
      }
    });
  } else {
    showTestNotification();
  }
}

function showTestNotification() {
  const notification = new Notification('唐卡练习打卡', {
    body: '这是一条测试提醒！每天这个时候会提醒您练习唐卡。',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'tangka-test',
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  // 3秒后自动关闭
  setTimeout(() => notification.close(), 5000);
}

// 设置每日提醒检查
function setupDailyReminderCheck(time: string) {
  clearReminderInterval();
  
  // 每分钟检查一次
  reminderInterval = setInterval(() => {
    const store = useSettingsStore.getState();
    store.checkAndTriggerReminder();
  }, 60000); // 每分钟检查
  
  // 立即检查一次
  const store = useSettingsStore.getState();
  store.checkAndTriggerReminder();
}

function clearReminderInterval() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

// App 启动时初始化提醒
export function initReminderOnStartup() {
  const store = useSettingsStore.getState();
  if (store.dailyReminder) {
    requestNotificationPermission();
    setupDailyReminderCheck(store.reminderTime);
  }
}
