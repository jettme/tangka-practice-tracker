import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalNotifications } from '@capacitor/local-notifications';
import Reminder from '../plugins/ReminderPlugin';

interface NotificationState {
  dailyReminder: boolean;
  reminderTime: string;
  lastReminderDate: string | null;
  setReminder: (enabled: boolean, time?: string) => Promise<void>;
  checkAndTriggerReminder: () => Promise<boolean>;
  testNotification: () => Promise<void>;
  checkExactAlarmPermission: () => Promise<boolean>;
  requestExactAlarmPermission: () => Promise<void>;
}

// 检查是否在原生 App 环境
const isNative = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

// 检查通知权限
export async function checkNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      // 使用原生插件检查
      const result = await Reminder.checkPermission();
      return result.granted;
    } catch {
      // 降级到 LocalNotifications
      const { display } = await LocalNotifications.checkPermissions();
      return display === 'granted';
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
      const result = await Reminder.requestPermission();
      return result.granted;
    } catch {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    }
  } else {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

// 检查是否需要精确闹钟权限（Android 12+）
async function checkExactAlarmPermission(): Promise<boolean> {
  if (!isNative()) return true;
  
  try {
    const result = await Reminder.canScheduleExactAlarms();
    return result.canSchedule;
  } catch {
    return true;
  }
}

// 请求精确闹钟权限
async function requestExactAlarmPermission() {
  if (!isNative()) return;
  
  try {
    await Reminder.requestExactAlarmPermission();
  } catch (error) {
    console.error('Failed to request exact alarm permission:', error);
  }
}

// 调度每日提醒 - 使用原生 AlarmManager
async function scheduleDailyReminder(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  
  if (isNative()) {
    try {
      // 检查是否需要请求精确闹钟权限
      const canSchedule = await checkExactAlarmPermission();
      if (!canSchedule) {
        console.log('Need exact alarm permission, requesting...');
        await requestExactAlarmPermission();
      }
      
      // 使用原生插件调度闹钟
      const result = await Reminder.scheduleReminder({ hour: hours, minute: minutes });
      console.log('Native reminder scheduled:', result);
      
      // 同时调度一个本地通知作为备份
      await scheduleLocalNotificationBackup(hours, minutes);
      
    } catch (error) {
      console.error('Failed to schedule native reminder:', error);
      // 降级到 LocalNotifications
      await scheduleLocalNotificationBackup(hours, minutes);
    }
  } else {
    // 浏览器环境
    console.log('Browser environment: using background check');
  }
}

// 使用 LocalNotifications 作为备份
async function scheduleLocalNotificationBackup(hours: number, minutes: number) {
  try {
    // 取消之前的备份通知
    await LocalNotifications.cancel({ notifications: [{ id: 3001 }] });
    
    // 计算下一次提醒时间
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    // 调度本地通知
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 3001,
          title: '唐卡练习提醒',
          body: '今天练习唐卡了吗？坚持就是进步！',
          schedule: { at: reminderTime },
          sound: 'default',
          ongoing: false,
          autoCancel: true,
        },
      ],
    });
    
    console.log('Local notification backup scheduled for:', reminderTime);
  } catch (error) {
    console.error('Failed to schedule local backup:', error);
  }
}

// 取消所有提醒
async function cancelAllReminders() {
  if (isNative()) {
    try {
      // 取消原生闹钟
      await Reminder.cancelReminder();
    } catch (error) {
      console.error('Failed to cancel native reminder:', error);
    }
    
    try {
      // 取消本地通知
      await LocalNotifications.cancel({ notifications: [{ id: 3001 }] });
    } catch (error) {
      console.error('Failed to cancel local notification:', error);
    }
  }
}

// 显示测试通知
async function showTestNotification() {
  if (isNative()) {
    try {
      // 使用原生方式显示通知
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: '唐卡练习打卡',
            body: '这是一条测试提醒！如果看到这条消息，说明通知功能正常工作。',
            sound: 'default',
            ongoing: false,
            autoCancel: true,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show test notification:', error);
      throw error;
    }
  } else {
    // 浏览器环境
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('唐卡练习打卡', {
        body: '这是一条测试提醒！',
        icon: '/icons/icon-192x192.png',
      });
    } else {
      throw new Error('通知权限未开启');
    }
  }
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
          } else {
            console.log('Notification permission not granted');
          }
        } else {
          await cancelAllReminders();
          console.log('Reminders cancelled');
        }
      },

      // 检查并触发提醒（浏览器环境备用）
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
          await showTestNotification();
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
        
        await showTestNotification();
        console.log('Test notification sent');
      },

      // 检查精确闹钟权限
      checkExactAlarmPermission: async () => {
        return await checkExactAlarmPermission();
      },

      // 请求精确闹钟权限
      requestExactAlarmPermission: async () => {
        await requestExactAlarmPermission();
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
    console.log('Scheduling daily reminder...');
    await scheduleDailyReminder(store.reminderTime);
  }
}
