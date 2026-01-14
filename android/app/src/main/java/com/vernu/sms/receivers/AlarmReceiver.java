package com.vernu.sms.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.vernu.sms.services.StickyNotificationService;

/**
 * Receives AlarmManager callbacks to trigger SMS polling even in Doze mode.
 * This is critical for background operation on Android 6+.
 */
public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";
    public static final String ACTION_POLL_SMS = "com.vernu.sms.ACTION_POLL_SMS";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_POLL_SMS.equals(intent.getAction())) {
            Log.d(TAG, "Alarm received, triggering SMS poll");

            // Send intent to service to poll now
            Intent serviceIntent = new Intent(context, StickyNotificationService.class);
            serviceIntent.setAction(ACTION_POLL_SMS);

            // Use startForegroundService on Android O+ since we're starting from a broadcast
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
