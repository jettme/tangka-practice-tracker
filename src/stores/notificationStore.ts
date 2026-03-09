import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalNotifications } from '@capacitor/local-notifications';

interface NotificationState {
  dailyReminder: boolean;
  reminderTime: string;
  lastReminderDate: string | null;
  setReminder: (enabled: boolean, time?: string) => void;
  checkAndTriggerReminder: () => Promise<boolean>;
  testNotification: () => Promise<void>;
}

// 检查是否在原生 App 环境
const isNative = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

// 检查通知权限
export async function checkNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted';
  } else {
    // 浏览器环境
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }
}

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } else {
    // 浏览器环境
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

// 显示本地通知
export async function showLocalNotification(options: {
  title: string;
  body: string;
  id?: number;
  schedule?: { at: Date };
}) {
  const { title, body, id = 1, schedule } = options;
  
  if (isNative()) {
    // 使用 Capacitor 本地通知
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: schedule ? { at: schedule.at } : undefined,
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#C62828',
          },
        ],
      });
    } catch (error) {
      console.error('Local notification error:', error);
      // 降级到浏览器通知
      showBrowserNotification(title, body);
    }
  } else {
    // 浏览器环境
    showBrowserNotification(title, body);
  }
}

// 浏览器通知（降级方案）
function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    });
  }
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      dailyReminder: true,
      reminderTime: '20:00',
      lastReminderDate: null,

      setReminder: (enabled, time) => {
        const newTime = time || get().reminderTime;
        set({ dailyReminder: enabled, reminderTime: newTime });
        
        if (enabled) {
          requestNotificationPermission();
          scheduleDailyReminder(newTime);
        } else {
          cancelDailyReminder();
        }
      },

      // 检查并触发提醒
      checkAndTriggerReminder: async () => {
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
          await showLocalNotification({
            id: 100,
            title: '唐卡练习提醒',
            body: '今天练习唐卡了吗？坚持就是进步！',
          });
          set({ lastReminderDate: today });
          return true;
        }
        
        return false;
      },

      // 测试通知
      testNotification: async () => {
        const granted = await requestNotificationPermission();
        if (!granted) {
          throw new Error('通知权限未开启');
        }
        
        await showLocalNotification({
          id: 999,
          title: '唐卡练习打卡',
          body: '这是一条测试提醒！每天这个时候会提醒您练习唐卡。',
        });
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);

// 调度每日提醒
async function scheduleDailyReminder(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // 取消之前的提醒
  await cancelDailyReminder();
  
  // 创建新的每日提醒
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);
  
  // 如果今天的时间已过，设置为明天
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '唐卡练习提醒',
            body: '今天练习唐卡了吗？坚持就是进步！点击打开App开始练习。',
            schedule: { at: reminderTime, repeats: true },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#C62828',
          },
        ],
      });
      console.log('Daily reminder scheduled for:', reminderTime);
    } catch (error) {
      console.error('Schedule reminder error:', error);
    }
  }
}

// 取消每日提醒
async function cancelDailyReminder() {
  if (isNative()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    } catch (error) {
      console.error('Cancel reminder error:', error);
    }
  }
}

// 测试通知
export async function testNotification() {
  const store = useNotificationStore.getState();
  await store.testNotification();
}

// App 启动时初始化
export async function initNotifications() {
  const store = useNotificationStore.getState();
  
  // 请求权限
  await requestNotificationPermission();
  
  // 如果开启了提醒，重新调度
  if (store.dailyReminder) {
    scheduleDailyReminder(store.reminderTime);
  }
}
