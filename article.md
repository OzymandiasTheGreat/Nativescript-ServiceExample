# Android continuous background services with NativeScript

So I set out to make specialized voice assistant on Android. As I have strenuous relationship with Java to say the least, and I haven't yet had time to play with Kotlin, NativeScript seemed like the obvious choice.

Now this is a work in progress, but I already learned a lot about Android and I want to share some of my findings with you.

First for this task I need to constantly listen for the wake word and react accordingly. Obvious choice to implement this on any platform would be some sort of background service or daemon.

When googling nativescript and background services an excellent tutorial and an example repo come up on the top ([I'm talking about this](https://www.nativescript.org/blog/using-android-background-services-in-nativescript)).

Alas, this is using IntentService which only runs on a schedule and exits once it's tasks are complete.
Creating a continuous background service though is pretty easy, there's just a lack of examples on this topic (which this article aims to fix).

## The setup

You can find comeplete working example repo [here](https://github.com/OzymandiasTheGreat/Nativescript-ServiceExample).

For this article I'll assume that we're working with
typescript hello_world template:
`tns create ServiceExample --ts --appid tk.ozymandias.ServiceExample`

It shouldn't be difficult to adapt to other templates/technologies.

## The service

First create a new subfolder under `app/`, lets call it `service`. This is purely to keep your project structure clean and tidy.
Now create a new file under `app/service/continuous_service.android.ts` with these contents

```typescript
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
    }

    onStartCommand(intent: android.content.Intent, flags: number, startId: number): number {
        console.log("SERVICE STARTED");
        return android.app.Service.START_REDELIVER_INTENT;
    }

    onDestroy(): void {
        console.log("SERVICE DESTROYED");
        super.onDestroy();
        clearInterval(this.timerId);
    }
}
```

Now this is a very basic service, it just runs in the background and prints "PING" to the console every second.

At the top we export service name as a constant, will be using this in a few places later.
Alas you need to specify the service name as a string literal in at least two more places.

First one is obvious here: the `@JavaProxy` annotation.
Using a variable here will throw errors abouts existing extends and rather than the variable value it will be undefined.

Second will be in the manifest. More on that later.

`onCreate` is called once when the service is instanciated, `onStartCommand` is called everytime the service is started and `onDestroy` is called when the service exits.

How the service is started and restarted depends on what
you return from `onStartCommand`. You may be tempted to return `START_STICKY` here, but that will cause crashes when your app is killed because the system will try to restart your service with `null` intent.

## Making it continuous

So far we have a functional service that starts with your app! But how do we keep it running when the app exits or is killed?

Let's start by making a broadcast receiver.

```typescript
import { CONTINUOUS_SERVICE_CLASSNAME } from "./continuous-service.android";


export const RESTART_RECEIVER_CLASSNAME = "tk.ozymandias.ServiceExample.Restart_Receiver";


@JavaProxy("tk.ozymandias.ServiceExample.Restart_Receiver")
class Restart_Receiver extends android.content.BroadcastReceiver {
    onReceive(context: android.content.Context, intent: android.content.Intent): void {
        console.log("RESTART INTENT RECEIVED");
        const serviceIntent = new android.content.Intent();
        serviceIntent.setClassName(context, CONTINUOUS_SERVICE_CLASSNAME);
        context.startService(serviceIntent);
    }
}
```

Then let's modify our service a bit to invoke the broadcast receiver on exit so it can restart our service.

```typescript
// At the top
import { RESTART_RECEIVER_CLASSNAME } from "./restart-receiver.android";

// In the onDestroy method in our service
    onDestroy(): void {
        // ...
        const restartIntent = new android.content.Intent();
        restartIntent.setClassName(this, RESTART_RECEIVER_CLASSNAME);
        this.sendBroadcast(restartIntent);
    }
```

You should also implement `onTaskRemoved` method in our service.
It is called when user swipes away your app from the recents view.
In this situation (and probably others) `onDestroy` isn't called by default.
So let's invoke `onDestroy` by calling `stopSelf`!

```typescript
// ...
    onTaskRemoved(intent: android.content.Intent): void {
        console.log("TASK REMOVED");
        this.stopSelf();
    }
```

Now we have a continuously running service! When the app exits or is killed, we invoke our broadcast receiver,
which in turn restarts our service.

Unfortunately in newer versions of Android when system
kills your app because of low memory or due to battery optimizations, `onDestroy` isn't guaranteed to be called.

## Foreground Service

Fortunately there's an official way to work around that.
What we need is to make our service a Foreground Service.
The downside is that we must present a persistent notification, however starting with Oreo this notification can be hidden from the system settings
without impacting our service.

We need to modify our service yet again, this time the
`onCreate` method:

```typescript

// In the onCreate method in our service
    onCreate(): void {
        // ...
        const builder: android.app.Notification.Builder = new android.app.Notification.Builder(app.android.context);
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
```

And this makes a continuous foreground service with a
persistent notification that will keep running pretty
much no matter what (it can still be forced stopped from the settings).

## Finishing touches

Now if you try the code so far it will crash.
That's because we haven't declared anything in the
`AndroidManifest.xml`!
What we need to declare is the permissions we need (only on latest versions of Android), the service and the receiver.

Without further ado, here's the manifest:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="__PACKAGE__"
    android:versionCode="1"
    android:versionName="1.0">

    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"/>

    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application
        android:name="com.tns.NativeScriptApplication"
        android:allowBackup="true"
        android:icon="@drawable/icon"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <activity
            android:name="com.tns.NativeScriptActivity"
            android:label="@string/title_activity_kimera"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|smallestScreenSize|screenLayout|locale|uiMode"
            android:theme="@style/LaunchScreenTheme">

            <meta-data android:name="SET_THEME_ON_LAUNCH" android:resource="@style/AppTheme" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name="com.tns.ErrorReportActivity"/>
        <service android:enabled="true" android:name="tk.ozymandias.ServiceExample.Continuous_Service" />
        <receiver
            android:name="tk.ozymandias.ServiceExample.Restart_Receiver"
            android:enabled="true"
            android:exported="true"
            android:label="ContinuousServiceRestarter" />
    </application>
</manifest>
```

## Extra Bonus

You may have noticed that the notification we get is
generic "app is running" notification that goes to settings when tapped.
We can do better!

```typescript
// In the onCreate method in our service
    onCreate(): void {
        // ...
        const appIntent: android.content.Intent = new android.content.Intent(app.android.context, com.tns.NativeScriptActivity.class);
        const pendingIntent: android.app.PendingIntent = android.app.PendingIntent.getActivity(app.android.context, 0, appIntent, 0);
        const builder: android.app.Notification.Builder = new android.app.Notification.Builder(app.android.context);
        builder
            .setContentText("Custom notification, F'Yeah!")
            .setSmallIcon(android.R.drawable.btn_star_big_on)
            .setContentIntent(pendingIntent);
        // ...
    }
```

You may need to `declare const com: any;` somewhere
near the top of the file or typescript might throw a fit.

So what have we done here?

We created a pending intent pointing to the main activity of our app, so now when notification is tapped
it will open your app.
As for notification options, the important bits are
`setContentText` and `setSmallIcon`. If both of these aren't present at the minimum, you'll still get a generic
notification.

## That's all folks

This has been my first article, please be gentle.
