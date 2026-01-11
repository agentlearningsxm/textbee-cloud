package com.vernu.sms.services;

import android.app.*;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Telephony;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import com.vernu.sms.ApiManager;
import com.vernu.sms.R;
import com.vernu.sms.activities.MainActivity;
import com.vernu.sms.dtos.PendingSMSResponseDTO;
import com.vernu.sms.helpers.SMSHelper;
import com.vernu.sms.models.SMSPayload;
import com.vernu.sms.receivers.SMSBroadcastReceiver;
import com.vernu.sms.AppConstants;
import com.vernu.sms.helpers.SharedPreferenceHelper;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StickyNotificationService extends Service {

    private static final String TAG = "StickyNotificationService";
    private static final long POLLING_INTERVAL_MS = 15000; // Poll every 15 seconds

    private Handler pollingHandler;
    private Runnable pollingRunnable;
    private boolean isPolling = false;

    @Override
    public IBinder onBind(Intent intent) {
        Log.i(TAG, "Service onBind " + intent.getAction());
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "Service Started");

        // Only show notification if enabled in preferences
        boolean stickyNotificationEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                getApplicationContext(),
                AppConstants.SHARED_PREFS_STICKY_NOTIFICATION_ENABLED_KEY,
                false
        );

        if (stickyNotificationEnabled) {
            Notification notification = createNotification();
            startForeground(1, notification);
            Log.i(TAG, "Started foreground service with sticky notification");

            // Start polling for pending SMS
            startPolling();
        } else {
            Log.i(TAG, "Sticky notification disabled by user preference");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Received start id " + startId + ": " + intent);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopPolling();
        Log.i(TAG, "StickyNotificationService destroyed");
    }

    /**
     * Start polling for pending SMS messages
     */
    private void startPolling() {
        if (isPolling) {
            Log.d(TAG, "Polling already started");
            return;
        }

        pollingHandler = new Handler(Looper.getMainLooper());
        pollingRunnable = new Runnable() {
            @Override
            public void run() {
                pollForPendingSMS();
                if (isPolling) {
                    pollingHandler.postDelayed(this, POLLING_INTERVAL_MS);
                }
            }
        };

        isPolling = true;
        pollingHandler.post(pollingRunnable);
        Log.i(TAG, "Started polling for pending SMS every " + (POLLING_INTERVAL_MS / 1000) + " seconds");
    }

    /**
     * Stop polling for pending SMS
     */
    private void stopPolling() {
        isPolling = false;
        if (pollingHandler != null && pollingRunnable != null) {
            pollingHandler.removeCallbacks(pollingRunnable);
        }
        Log.i(TAG, "Stopped polling for pending SMS");
    }

    /**
     * Poll the server for pending SMS and send them
     */
    private void pollForPendingSMS() {
        String deviceId = SharedPreferenceHelper.getSharedPreferenceString(
                getApplicationContext(), AppConstants.SHARED_PREFS_DEVICE_ID_KEY, "");
        String apiKey = SharedPreferenceHelper.getSharedPreferenceString(
                getApplicationContext(), AppConstants.SHARED_PREFS_API_KEY_KEY, "");
        boolean gatewayEnabled = SharedPreferenceHelper.getSharedPreferenceBoolean(
                getApplicationContext(), AppConstants.SHARED_PREFS_GATEWAY_ENABLED_KEY, false);

        if (deviceId.isEmpty() || apiKey.isEmpty() || !gatewayEnabled) {
            Log.d(TAG, "Skipping poll - device not configured or gateway disabled");
            return;
        }

        Log.d(TAG, "Polling for pending SMS...");

        ApiManager.getApiService().getPendingSMS(deviceId, apiKey, 10)
                .enqueue(new Callback<PendingSMSResponseDTO>() {
                    @Override
                    public void onResponse(Call<PendingSMSResponseDTO> call, Response<PendingSMSResponseDTO> response) {
                        if (!response.isSuccessful() || response.body() == null || response.body().data == null) {
                            Log.e(TAG, "Failed to fetch pending SMS: " + response.code());
                            return;
                        }

                        int count = response.body().data.count;
                        if (count == 0) {
                            Log.d(TAG, "No pending SMS");
                            return;
                        }

                        Log.i(TAG, "Found " + count + " pending SMS to send");

                        // Process each pending SMS
                        for (SMSPayload smsPayload : response.body().data.messages) {
                            sendSMS(smsPayload);
                        }
                    }

                    @Override
                    public void onFailure(Call<PendingSMSResponseDTO> call, Throwable t) {
                        Log.e(TAG, "Error polling for pending SMS: " + t.getMessage());
                    }
                });
    }

    /**
     * Send SMS using the SMS payload
     */
    private void sendSMS(SMSPayload smsPayload) {
        if (smsPayload == null) {
            Log.e(TAG, "SMS payload is null");
            return;
        }

        // Get preferred SIM
        int preferredSim = SharedPreferenceHelper.getSharedPreferenceInt(
                getApplicationContext(), AppConstants.SHARED_PREFS_PREFERRED_SIM_KEY, -1);

        String[] recipients = smsPayload.getRecipients();
        if (recipients == null || recipients.length == 0) {
            Log.e(TAG, "No recipients in SMS payload");
            return;
        }

        for (String recipient : recipients) {
            boolean smsSent;
            if (preferredSim == -1) {
                smsSent = SMSHelper.sendSMS(
                        recipient,
                        smsPayload.getMessage(),
                        smsPayload.getSmsId(),
                        smsPayload.getSmsBatchId(),
                        getApplicationContext()
                );
            } else {
                try {
                    smsSent = SMSHelper.sendSMSFromSpecificSim(
                            recipient,
                            smsPayload.getMessage(),
                            preferredSim,
                            smsPayload.getSmsId(),
                            smsPayload.getSmsBatchId(),
                            getApplicationContext()
                    );
                } catch (Exception e) {
                    Log.e(TAG, "Error sending SMS from specific SIM: " + e.getMessage());
                    smsSent = false;
                }
            }

            Log.d(TAG, "SMS to " + recipient + ": " + (smsSent ? "sent" : "failed"));
        }
    }

    private Notification createNotification() {
        String notificationChannelId = "stickyNotificationChannel";

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = null;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            channel = new NotificationChannel(notificationChannelId, notificationChannelId, NotificationManager.IMPORTANCE_HIGH);
            channel.enableVibration(false);
            channel.setShowBadge(false);
            notificationManager.createNotificationChannel(channel);

            Intent notificationIntent = new Intent(this, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

            Notification.Builder builder = new Notification.Builder(this, notificationChannelId);
            return builder.setContentTitle("TextBee Active")
                    .setContentText("SMS gateway service is active")
                    .setContentIntent(pendingIntent)
                    .setOngoing(true)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .build();
        } else {
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, notificationChannelId);
            return builder.setContentTitle("TextBee Active")
                    .setContentText("SMS gateway service is active")
                    .setOngoing(true)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .build();
        }

    }
}