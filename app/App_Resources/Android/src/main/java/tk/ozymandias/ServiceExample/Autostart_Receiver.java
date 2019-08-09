package tk.ozymandias.ServiceExample;


import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;


public class Autostart_Receiver extends BroadcastReceiver {
	@Override
	public void onReceive(Context context, Intent intent) {
		PackageManager pm = context.getPackageManager();
		Intent launchIntent = pm.getLaunchIntentForPackage(context.getPackageName());
		launchIntent.setPackage(null);
		launchIntent.putExtra("ACTION", "QUIT");
		context.startActivity(launchIntent);
	}
}
