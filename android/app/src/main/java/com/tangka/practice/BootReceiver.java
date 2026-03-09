package com.tangka.practice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class BootReceiver extends BroadcastReceiver {
    private static final String PREFS_NAME = "TangkaReminderPrefs";
    private static final String KEY_HOUR = "reminder_hour";
    private static final String KEY_MINUTE = "reminder_minute";
    private static final String KEY_ENABLED = "reminder_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            // 读取保存的设置
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean enabled = prefs.getBoolean(KEY_ENABLED, false);
            
            if (enabled) {
                int hour = prefs.getInt(KEY_HOUR, 20);
                int minute = prefs.getInt(KEY_MINUTE, 0);
                
                // 重新设置闹钟
                AlarmScheduler.setDailyReminder(context, hour, minute);
            }
        }
    }
    
    // 保存提醒设置
    public static void saveReminderSettings(Context context, int hour, int minute, boolean enabled) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putInt(KEY_HOUR, hour);
        editor.putInt(KEY_MINUTE, minute);
        editor.putBoolean(KEY_ENABLED, enabled);
        editor.apply();
    }
}
