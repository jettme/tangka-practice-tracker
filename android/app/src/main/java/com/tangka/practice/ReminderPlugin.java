package com.tangka.practice;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

@CapacitorPlugin(
    name = "Reminder",
    permissions = {
        @Permission(
            strings = {Manifest.permission.POST_NOTIFICATIONS},
            alias = "notifications"
        )
    }
)
public class ReminderPlugin extends Plugin {
    
    @PluginMethod
    public void scheduleReminder(PluginCall call) {
        int hour = call.getInt("hour", 20);
        int minute = call.getInt("minute", 0);
        
        Context context = getContext();
        AlarmScheduler.setDailyReminder(context, hour, minute);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void cancelReminder(PluginCall call) {
        Context context = getContext();
        AlarmScheduler.cancelReminder(context);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context context = getContext();
        NotificationManager notificationManager = 
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        boolean enabled = notificationManager.areNotificationsEnabled();
        
        JSObject ret = new JSObject();
        ret.put("granted", enabled);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), 
                    Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            } else {
                requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }
    
    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }
    
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        Context context = getContext();
        boolean needOptimization = AlarmScheduler.needIgnoreBatteryOptimization(context);
        
        JSObject ret = new JSObject();
        ret.put("canSchedule", !needOptimization);
        ret.put("needPermission", needOptimization);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        Context context = getContext();
        AlarmScheduler.requestIgnoreBatteryOptimization(context);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
