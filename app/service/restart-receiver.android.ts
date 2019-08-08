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
