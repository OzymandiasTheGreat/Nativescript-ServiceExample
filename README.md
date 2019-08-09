# NativeScript Android continuous background service example

This is an example project demonstrating how to implement continuous
background service on Android.

For in-depth overview and tutorial see [article.md](./article.md).
The tutorial was also published on [dev.to](https://dev.to/ozymandiasthegreat/android-continuous-background-services-with-nativescript-42c9), so if you
have an account there show some love!

There have been a couple changes since the article was published.

### Custom icon in notification from iconfont

The notification now uses custom icon generated from iconfont.
This is achieved using brand new and excellent [nativescript-vector-icons](https://github.com/manojdcoder/nativescript-vector-icons) plugin, show it some love as well!
Basically the plugin generates PNGs from iconfont, so you can use the glyphs
literally anywhere in Android.

### Autostart on boot

The service now autostarts on boot.
This is done in the standard Android way of another BroadcastReceiver subscribing to
BOOT_COMPLETED signal.

This broadcast receiver is implemented in Java though, because I couldn't get
it to work from typescript. I consider this acceptable because it's just a few
lines of code and it's (the code) quite self-explanatory.

Another catch with this feature is that starting service directly doesn't work
either. Rather than spend another day or two trying to hunt down the root of that
I opted to start the main activity instead and attach quit message in the Intent.

The result is that on boot BroadcastReceiver receives the BOOT_COMPLETED message
and starts the main app which in turn starts the service. Then the app quits
before the splash screen is done loading resulting in a brief flash of the splash
screen.

Again, I consider this acceptable as it is a minor inconvenience.
Also this has the added benefit that all services defined in the app are
started with a single line of code.

## Contributing

If you have something to add or see something to fix, don't hesitate to send a
pull request!

Happy hacking!
