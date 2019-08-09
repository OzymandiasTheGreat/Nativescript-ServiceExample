import { CONTINUOUS_SERVICE_CLASSNAME } from "./continuous-service.android";


export const AUTOSTART_RECEIVER_CLASSNAME = "tk.ozymandias.ServiceExample.Autostart_Receiver";


// @JavaProxy("tk.ozymandias.ServiceExample.Autostart_Receiver")
class Autostart_Receiver extends android.content.BroadcastReceiver {
    onReceive(context: android.content.Context, intent: android.content.Intent): void {
        const pm: android.content.pm.PackageManager = context.getPackageManager();
        // const launchIntent = new android.content.Intent();
        const launchIntent = pm.getLaunchIntentForPackage(CONTINUOUS_SERVICE_CLASSNAME);
        // launchIntent.setClassName(context, CONTINUOUS_SERVICE_CLASSNAME);
        launchIntent.setPackage(null);
        context.startService(launchIntent);
    }
}
