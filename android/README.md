# Study AI automation Android build

This folder is ready for a GitHub Actions Android build. The packaged Capacitor web app is committed in `app/src/main/assets/public`, so CI can compile the APK deterministically without depending on a separate web-output directory.

```bash
bun install
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
gradle --no-daemon assembleDebug -p android
```

To refresh the packaged web app after frontend changes, generate the static client output and run `npx cap sync android` before committing. The native layer includes the notification listener service and `AutoReply` Capacitor bridge. CI uses JDK 21, Android API 36, Gradle 8.13, and installs each required Android SDK package explicitly.
