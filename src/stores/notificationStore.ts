import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalNotifications } from '@capacitor/local-notifications';

interface NotificationState {
  dailyReminder: boolean;
  reminderTime: string;
  lastReminderDate: string | null;
  setReminder: (enabled: boolean, time?: string) => Promise<void>;
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
    try {
      const { display } = await LocalNotifications.checkPermissions();
      return display === 'granted';
    } catch {
      return false;
    }
  } else {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }
}

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch {
      return false;
    }
  } else {
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
}) {
  const { title, body, id = 1 } = options;
  
  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#C62828',
            ongoing: false,
            autoCancel: true,
          },
        ],
      });
    } catch (error) {
      console.error('Local notification error:', error);
      showBrowserNotification(title, body);
    }
  } else {
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

// 调度每日提醒 - 使用每天重复
async function scheduleDailyReminder(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // 先取消之前的提醒
  await cancelAllReminders();
  
  if (isNative()) {
    try {
      // 计算今天的提醒时间
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // 如果今天的时间已过，设置为明天
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      // 使用每天重复的通知
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001, // 固定的ID，方便管理
            title: '唐卡练习提醒',
            body: '今天练习唐卡了吗？坚持就是进步！点击打开App开始练习。',
            schedule: { 
              on: {
                hour: hours,
                minute: minutes
              }
            },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#C62828',
            ongoing: false,
            autoCancel: true,
          },
        ],
      });
      
      console.log('Daily reminder scheduled for:', reminderTime);
      
      // 保存调度信息到本地存储
      localStorage.setItem('tangka-reminder-scheduled', JSON.stringify({
        time: time,
        scheduledAt: reminderTime.toISOString(),
        enabled: true
      }));
      
    } catch (error) {
      console.error('Schedule reminder error:', error);
      
      // 降级方案：使用多个单次通知
      await scheduleMultipleNotifications(hours, minutes);
    }
  } else {
    // 浏览器环境：使用后台检查
    console.log('Browser environment: using background check');
  }
}

// 降级方案：预约未来7天的单次通知
async function scheduleMultipleNotifications(hours: number, minutes: number) {
  const notifications = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(hours, minutes, 0, 0);
    
    // 如果今天的时间已过，从明天开始
    if (i === 0 && date <= new Date()) {
      date.setDate(date.getDate() + 1);
    }
    
    notifications.push({
      id: 2000 + i, // 不同的ID
      title: '唐卡练习提醒',
      body: '今天练习唐卡了吗？坚持就是进步！',
      schedule: { at: date },
      sound: 'default',
      smallIcon: 'ic_stat_icon',
      iconColor: '#C62828',
    });
  }
  
  try {
    await LocalNotifications.schedule({ notifications });
    console.log('Scheduled 7 days of reminders');
  } catch (error) {
    console.error('Failed to schedule multiple notifications:', error);
  }
}

// 取消所有提醒
async function cancelAllReminders() {
  if (isNative()) {
    try {
      // 取消所有已调度的通知
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        console.log('Cancelled', pending.notifications.length, 'pending notifications');
      }
    } catch (error) {
      console.error('Cancel reminders error:', error);
    }
  }
  
  localStorage.removeItem('tangka-reminder-scheduled');
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      dailyReminder: true,
      reminderTime: '20:00',
      lastReminderDate: null,

      setReminder: async (enabled, time) => {
        const newTime = time || get().reminderTime;
        set({ dailyReminder: enabled, reminderTime: newTime });
        
        if (enabled) {
          const granted = await requestNotificationPermission();
          if (granted) {
            await scheduleDailyReminder(newTime);
            console.log('Reminder scheduled for:', newTime);
          }
        } else {
          await cancelAllReminders();
          console.log('Reminders cancelled');
        }
      },

      // 检查并触发提醒（用于浏览器环境或检查状态）
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
          throw new Error('通知权限未开启，请在系统设置中允许通知');
        }
        
        await showLocalNotification({
          id: 999,
          title: '唐卡练习打卡',
          body: '这是一条测试提醒！如果看到这条消息，说明通知功能正常工作。每天这个时间会提醒您练习唐卡。',
        });
        
        console.log('Test notification sent');
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);

// 测试通知
export async function testNotification() {
  const store = useNotificationStore.getState();
  await store.testNotification();
}

// App 启动时初始化
export async function initNotifications() {
  console.log('Initializing notifications...');
  
  const store = useNotificationStore.getState();
  
  // 请求权限
  const granted = await requestNotificationPermission();
  console.log('Notification permission:', granted);
  
  // 如果开启了提醒且有权限，确保提醒已调度
  if (store.dailyReminder && granted) {
    // 检查是否已经有调度的通知
    if (isNative()) {
      try {
        const pending = await LocalNotifications.getPending();
        console.log('Pending notifications:', pending.notifications.length);
        
        // 如果没有调度的通知，重新调度
        if (pending.notifications.length === 0) {
          console.log('No pending notifications, rescheduling...');
          await scheduleDailyReminder(store.reminderTime);
        }
      } catch (error) {
        console.error('Error checking pending notifications:', error);
        // 出错时重新调度
        await scheduleDailyReminder(store.reminderTime);
      }
    }
  }
  
  // 每分钟检查一次（浏览器环境备用）
  setInterval(() => {
    store.checkAndTriggerReminder();
  }, 60000);
}
