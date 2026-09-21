# Study AI automation Android build

This folder is ready for a GitHub Actions Android build after the web bundle is copied into `dist/client`.

```bash
bun install
bun run build
npx cap sync android
gradle --no-daemon assembleDebug -p android
```

The native layer includes the notification listener service and `AutoReply` Capacitor bridge. CI uses JDK 21, Android API 36, and Gradle 8.13.
