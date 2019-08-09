/*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

import * as application from "tns-core-modules/application";
import { CONTINUOUS_SERVICE_CLASSNAME } from "./service/continuous-service.android";


let ACTION: string;


application.on(application.launchEvent, (args: application.LaunchEventData) => {
    const context = application.android.context;
    const intent = new android.content.Intent();
    intent.setClassName(context, CONTINUOUS_SERVICE_CLASSNAME);
    context.startService(intent);

    ACTION = args.android.getStringExtra("ACTION");
    console.log(`1ST ACTION: ${ACTION}`);
});


application.android.on(application.AndroidApplication.activityStartedEvent, (args: application.AndroidActivityEventData) => {
    console.log(`ACTION: ${ACTION}`);
    if (ACTION === "QUIT") {
        args.activity.finish();
    }
});


application.run({ moduleName: "app-root" });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
