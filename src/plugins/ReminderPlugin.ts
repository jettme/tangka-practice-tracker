import { registerPlugin } from '@capacitor/core';

export interface ReminderPlugin {
  scheduleReminder(options: { hour: number; minute: number }): Promise<{ success: boolean }>;
  cancelReminder(): Promise<{ success: boolean }>;
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  canScheduleExactAlarms(): Promise<{ canSchedule: boolean; needPermission: boolean }>;
  requestExactAlarmPermission(): Promise<{ success: boolean }>;
}

const Reminder = registerPlugin<ReminderPlugin>('Reminder');

export default Reminder;
