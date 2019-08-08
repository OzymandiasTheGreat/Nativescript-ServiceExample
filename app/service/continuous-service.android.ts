import { RESTART_RECEIVER_CLASSNAME } from "./restart-receiver.android";
import * as app from "tns-core-modules/application";
declare const com: any;


export const CONTINUOUS_SERVICE_CLASSNAME = "tk.ozymandias.ServiceExample.Continuous_Service";


@JavaProxy("tk.ozymandias.ServiceExample.Continuous_Service")
class Continuous_Service extends android.app.Service {
    private timerId: number;

    onBind(): android.os.IBinder {
        return null;
    }

    onCreate(): void {
        super.onCreate();
        console.log("SERVICE CREATED");

        if (!this.timerId) {
            this.timerId = setInterval(() => {
                console.log("PING");
            }, 1000)
        }

        const appIntent: android.content.Intent = new android.content.Intent(app.android.context, com.tns.NativeScriptActivity.class);
        const pendingIntent: android.app.PendingIntent = android.app.PendingIntent.getActivity(app.android.context, 0, appIntent, 0);
        const builder: android.app.Notification.Builder = new android.app.Notification.Builder(app.android.context);
        builder
            .setContentText("Custom notification, F'Yeah!")
            .setSmallIcon(android.R.drawable.btn_star_big_on)
            .setContentIntent(pendingIntent);
        // Need to check api level, NotificationChannel is required but only available on Oreo and above
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            const channel: android.app.NotificationChannel = new android.app.NotificationChannel(
                "persistence", "Service running indicator", android.app.NotificationManager.IMPORTANCE_LOW
            );
            const manager: android.app.NotificationManager = (<android.app.Activity>app.android.context).getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            channel.enableLights(false);
            channel.enableVibration(false);
            manager.createNotificationChannel(channel);
            builder.setChannelId("persistence");
        }
        const notification: android.app.Notification = builder.build();
        this.startForeground(13, notification);
    }

    onStartCommand(intent: android.content.Intent, flags: number, startId: number): number {
        console.log("SERVICE STARTED");
        // return android.app.Service.START_STICKY;
        return android.app.Service.START_REDELIVER_INTENT;
    }

    onDestroy(): void {
        console.log("SERVICE DESTROYED");
        super.onDestroy();
        clearInterval(this.timerId);

        const restartIntent = new android.content.Intent();
        restartIntent.setClassName(this, RESTART_RECEIVER_CLASSNAME);
        this.sendBroadcast(restartIntent);
    }

    onTaskRemoved(intent: android.content.Intent): void {
        console.log("TASK REMOVED");
        this.stopSelf();
    }
}
